const bcrypt = require("bcrypt");
const pool = require("../config/db");
const usuarioDao = require("../dao/usuarioDao");
const empleadoDao = require("../dao/empleadoDao");
const rolDao = require("../dao/rolDao");
const validarPassword = require("../utils/validarPassword");
const preguntaDao = require("../dao/preguntaSeguridadDao");

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const { registrarAccion } = require("../utils/auditoria");

/**
 * POST /api/usuarios
 * Jerarquía: Admin crea cualquier rol. Asesor SOLO crea Tecnico o Cliente.
 */
async function crear(req, res) {
  const {
    nombre,
    documento,
    correo,
    password,
    nombreRol,
    cargoActual,
    tarifaHora,
    preguntas,
  } = req.body;

  // Extraer roles del usuario autenticado en la sesión actual
  const rolesOperador = (req.usuario.roles || []).map((r) =>
    r.nombreRol.toLowerCase(),
  );
  const esAdmin = rolesOperador.includes("admin");

  if (!nombre || !documento || !correo || !password || !nombreRol) {
    return res
      .status(400)
      .json({
        error:
          "nombre, documento, correo, password y nombreRol son obligatorios",
      });
  }

  // VALIDACIÓN ESTRICTA: OBLIGATORIEDAD DE EXACTAMENTE 3 PREGUNTAS
  // =========================================================
  if (!preguntas || !Array.isArray(preguntas) || preguntas.length !== 3) {
    return res.status(400).json({
      error:
        "Para el registro en Ecobiva es obligatorio configurar exactamente 3 preguntas de seguridad.",
    });
  }

  // 🛡️ REGLA DE MATRIZ JERÁRQUICA: Bloquear si un Asesor intenta crear un Admin o un Asesor
  if (!esAdmin && ["admin", "asesor"].includes(nombreRol.toLowerCase())) {
    return res
      .status(403)
      .json({
        error:
          "Operación denegada: Un Asesor solo puede registrar Tecnicos o Clientes.",
      });
  }

  if (!REGEX_CORREO.test(correo)) {
    return res.status(400).json({ error: "Formato de correo inválido" });
  }

  const validacion = validarPassword(password);
  if (!validacion.valido) {
    return res.status(400).json({ error: validacion.error });
  }

  const rol = await rolDao.obtenerPorNombre(nombreRol);
  if (!rol) {
    return res.status(400).json({ error: `El rol "${nombreRol}" no existe` });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const empleadoExistente = await empleadoDao.obtenerPorDocumento(documento);
    if (empleadoExistente) {
      await conn.rollback();
      return res
        .status(409)
        .json({ error: "Ya existe un empleado con ese documento" });
    }

    const idEmpleado = await empleadoDao.crear(
      {
        nombre,
        documento,
        fechaIngreso: new Date(),
        cargoActual: cargoActual || nombreRol,
        tarifaHora: tarifaHora || 0,
      },
      conn,
    );

    const passwordHash = await bcrypt.hash(password, 10);
    const idUsuario = await usuarioDao.crear(
      { correo, passwordHash, idEmpleado },
      conn,
    );

    await usuarioDao.asignarRolInicial(
      idUsuario,
      rol.idRol,
      req.usuario.idUsuario,
      conn,
    );

    const preguntasConRespuestaHash = [];
    if (preguntas && Array.isArray(preguntas)) {
      for (const p of preguntas) {
        if (!p.idPregunta || !p.respuesta) {
          await conn.rollback();
          return res
            .status(400)
            .json({
              error: "Cada pregunta debe incluir idPregunta y respuesta",
            });
        }
        const respuestaHash = await bcrypt.hash(p.respuesta, 10);
        preguntasConRespuestaHash.push({
          idPregunta: p.idPregunta,
          respuestaHash,
        });
      }
      await preguntaDao.configurar(idUsuario, preguntasConRespuestaHash, conn);
    }

    await conn.commit();

    // HU-019 Log de Auditoría Integrado
    await registrarAccion(req, {
      accion: "CREAR_USUARIO",
      modulo: "USUARIOS",
      detalle: `Éxito: El usuario ${req.usuario.correo} creó al usuario con correo: ${correo} y rol: ${nombreRol}`,
    });

    return res.status(201).json({
      mensaje: "Usuario creado con éxito",
      idUsuario,
      correo,
      rol: rol.nombreRol,
    });
  } catch (error) {
    await conn.rollback();
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El correo ya está registrado" });
    }
    console.error("Error al crear usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  } finally {
    conn.release();
  }
}

/**
 * GET /api/usuarios
 */
async function listar(req, res) {
  try {
    const usuarios = await usuarioDao.listarTodos();
    return res.json(usuarios);
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * PUT /api/usuarios/:id
 */
async function actualizar(req, res) {
  const { id } = req.params;
  const { correo, estado, nombreRol } = req.body;

  const rolesOperador = (req.usuario.roles || []).map((r) =>
    r.nombreRol.toLowerCase(),
  );
  const esAdmin = rolesOperador.includes("admin");

  try {
    const usuarioDestino = await usuarioDao.obtenerPorId(id);
    if (!usuarioDestino) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // 🛡️ REGLA DE MATRIZ JERÁRQUICA: Si el operador es Asesor, no puede modificar datos de un Admin
    // Se asume que usuarioDestino trae sus roles o mapeas su rol actual
    const delDestinoEsAdmin = (usuarioDestino.roles || []).some(
      (r) => r.nombreRol.toLowerCase() === "admin",
    );
    if (!esAdmin && delDestinoEsAdmin) {
      return res
        .status(403)
        .json({
          error:
            "Operación denegada: Un Asesor no puede modificar a un Administrador",
        });
    }

    if (correo) {
      if (!REGEX_CORREO.test(correo)) {
        return res.status(400).json({ error: "Formato de correo inválido" });
      }
      await usuarioDao.actualizarCorreo(id, correo);
    }

    // 🛡️ REGLA DE MATRIZ JERÁRQUICA: Estado modificable estrictamente por Admin
    if (typeof estado === "boolean") {
      if (!esAdmin) {
        return res
          .status(403)
          .json({
            error:
              "Operación denegada: El estado solo puede ser modificado por un Administrador",
          });
      }
      await usuarioDao.actualizarEstado(id, estado);
    }
    // =========================================================
    // REGLA DE MATRIZ JERÁRQUICA: MODIFICACIÓN DE ROL Y CARGO (Admin Únicamente)
    // =========================================================
    if (nombreRol) {
      if (!esAdmin) {
        return res
          .status(403)
          .json({
            error:
              "Operación denegada: La reasignación de roles está reservada para Administradores",
          });
      }

      const rol = await rolDao.obtenerPorNombre(nombreRol);
      if (!rol) {
        return res
          .status(400)
          .json({ error: `El rol "${nombreRol}" no existe` });
      }

      // 1. Cambiar el rol en la tabla intermedia `UsuarioRol`
      await usuarioDao.cambiarRol(id, rol.idRol, req.usuario.idUsuario);

      // 2. 🚀 Sincronización Automática con la tabla `Empleado`
      let nuevoCargo = nombreRol;
      let nuevaTarifa = 0.0; // CORRECCIÓN: Inicialización limpia por defecto

      const rolMinuscula = nombreRol.toLowerCase();
      if (rolMinuscula === "admin") {
        nuevoCargo = "Administrador";
        nuevaTarifa = 0.0;
      } else if (rolMinuscula === "tecnico") {
        nuevoCargo = "Tecnico Operativo";
        nuevaTarifa = 25.0; // Tarifa fija para Tecnico
      } else if (rolMinuscula === "asesor") {
        nuevoCargo = "Asesor de Servicio";
        nuevaTarifa = 18.0; // Tarifa fija para Asesor
      } else if (rolMinuscula === "cliente") {
        nuevoCargo = "Cliente Final";
        nuevaTarifa = 0.0;
      }

      // 3. Ejecutar la actualización en la tabla `Empleado` usando el `idEmpleado` vinculado
      await empleadoDao.actualizarInformacionLaboral(
        usuarioDestino.idEmpleado,
        {
          cargoActual: nuevoCargo,
          tarifaHora: nuevaTarifa,
        },
      );

      // 4. Registrar en la tabla `LogAuditoria` de forma detallada (HU-019)
      await registrarAccion(req, {
        accion: "MODIFICAR_ROL_Y_CARGO",
        modulo: "USUARIOS",
        detalle: `El administrador cambió el rol del usuario ID ${id} a [${nombreRol}] y sincronizó su cargo a [${nuevoCargo}] con tarifa: ${nuevaTarifa}`,
      });
    }

    return res.json({ mensaje: "Usuario actualizado con éxito" });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "El correo ya está en uso" });
    }
    console.error("Error al actualizar usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * DELETE /api/usuarios/:id (Desactivar, no borrado físico)
 */
async function desactivar(req, res) {
  const { id } = req.params;
  try {
    const usuario = await usuarioDao.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    // Inactivación lógica segura
    await usuarioDao.actualizarEstado(id, false);

    // HU-019 Log de Auditoría Integrado
    await registrarAccion(req, {
      accion: "DESACTIVAR_USUARIO",
      modulo: "USUARIOS",
      detalle: `El administrador con ID ${req.usuario.idUsuario} desactivó lógicamente al usuario con ID: ${id}`,
    });

    return res.json({ mensaje: "Usuario desactivado con éxito" });
  } catch (error) {
    console.error("Error al desactivar usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function listarRoles(req, res) {
  try {
    const roles = await rolDao.listar();
    return res.json(roles);
  } catch (error) {
    console.error("Error al listar roles:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
async function activar(req, res) {
  const { id } = req.params;
  try {
    const usuario = await usuarioDao.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.estado === true || usuario.estado === 1) {
      return res
        .status(400)
        .json({ mensaje: "El usuario ya se encuentra activo en el sistema" });
    }

    // 1. Activar lógicamente en la tabla `Usuario`
    await usuarioDao.actualizarEstado(id, true);

    // 2. Opcional: Si quieres que su estadoLaboral en la tabla Empleado vuelva a ser activo:
    // (Asumiendo que tu empleadoDao maneja una función similar o puedes usar la de información laboral)
    // await empleadoDao.actualizarEstadoLaboral(usuario.idEmpleado, true);

    // 3. REGISTRO DE AUDITORÍA: REACTIVACIÓN DE USUARIO (HU-019)
    await registrarAccion(req, {
      accion: "ACTIVAR_USUARIO",
      modulo: "USUARIOS",
      detalle: `El administrador con ID ${req.usuario.idUsuario} reactivó con éxito el acceso al usuario con ID: ${id}`,
    });

    return res.json({
      mensaje: "Usuario reactivado con éxito en el sistema ✅",
    });
  } catch (error) {
    console.error("Error al activar usuario:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}
module.exports = {
  crear,
  listar,
  actualizar,
  desactivar,
  listarRoles,
  activar,
};
