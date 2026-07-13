const empleadoDao = require("../dao/empleadoDao");
const { registrarAccion } = require("../utils/auditoria");
const bcrypt = require("bcrypt");

async function listar(req, res) {
  try {
    const empleados = await empleadoDao.listar();

    res.json({
      ok: true,

      data: empleados,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: "Error al listar empleados.",
    });
  }
}

async function obtenerPorId(req, res) {
  try {
    const empleado = await empleadoDao.obtenerPorId(req.params.id);

    if (!empleado) {
      return res.status(404).json({
        ok: false,

        mensaje: "Empleado no encontrado.",
      });
    }

    res.json({
      ok: true,

      data: empleado,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: "Error consultando empleado.",
    });
  }
}

async function crear(req, res) {
  try {
    const empleado = await empleadoDao.crear(req.body);

    await registrarAccion(req, {
      accion: "CREAR_EMPLEADO",

      modulo: "EMPLEADOS",

      detalle: `Se creó el empleado:

Nombre: ${empleado.nombre}

Documento: ${empleado.documento}

Cargo: ${empleado.cargoActual}`,
    });

    res.status(201).json({
      ok: true,

      mensaje: "Empleado creado correctamente.",

      data: empleado,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

async function actualizar(req, res) {
  try {
    const resultado = await empleadoDao.actualizar(
      req.params.id,

      req.body,

      req.usuario.idUsuario,
    );

    if (resultado.sinCambios) {
      return res.json({
        ok: true,

        mensaje: "No hubo cambios.",

        data: resultado,
      });
    }

    let detalle = `Empleado: ${resultado.despues.nombre}\n`;

    if (resultado.cambioCargo) {
      detalle += `

Cargo:

${resultado.antes.cargoActual}

↓

${resultado.despues.cargoActual}

`;
    }

    if (resultado.cambioTarifa) {
      detalle += `

Tarifa:

${resultado.antes.tarifaHora}

↓

${resultado.despues.tarifaHora}

`;
    }

    await registrarAccion(req, {
      accion: "ACTUALIZAR_EMPLEADO",

      modulo: "EMPLEADOS",

      detalle,
    });

    res.json({
      ok: true,

      mensaje: "Empleado actualizado correctamente.",

      data: resultado.despues,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

async function desactivar(req, res) {
  try {
    const empleado = await empleadoDao.obtenerPorId(req.params.id);

    if (!empleado) {
      return res.status(404).json({
        ok: false,

        mensaje: "Empleado no encontrado.",
      });
    }

    await empleadoDao.desactivar(req.params.id);

    await registrarAccion(req, {
      accion: "DESACTIVAR_EMPLEADO",

      modulo: "EMPLEADOS",

      detalle: `Empleado desactivado:

${empleado.nombre}

Documento:

${empleado.documento}`,
    });

    res.json({
      ok: true,

      mensaje: "Empleado desactivado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

async function reactivar(req, res) {
  try {
    const empleado = await empleadoDao.obtenerPorId(req.params.id);

    if (!empleado) {
      return res.status(404).json({
        ok: false,

        mensaje: "Empleado no encontrado.",
      });
    }

    await empleadoDao.reactivar(req.params.id);

    await registrarAccion(req, {
      accion: "REACTIVAR_EMPLEADO",

      modulo: "EMPLEADOS",

      detalle: `Empleado reactivado:

${empleado.nombre}

Documento:

${empleado.documento}`,
    });

    res.json({
      ok: true,

      mensaje: "Empleado reactivado correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

async function crearUsuario(req, res) {
  try {
    const { correo, password, idRol } = req.body;

    if (!correo || !password || !idRol) {
      return res.status(400).json({
        ok: false,

        mensaje: "Correo, contraseña y rol son obligatorios.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const idUsuario = await empleadoDao.crearUsuarioEmpleado(
      req.params.id,

      correo,

      passwordHash,

      idRol,

      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "CREAR_USUARIO",

      modulo: "EMPLEADOS",

      detalle: `Se creó un usuario para el empleado ID ${req.params.id}`,
    });

    res.status(201).json({
      ok: true,

      mensaje: "Usuario creado correctamente.",

      idUsuario,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

module.exports = {
  listar,

  obtenerPorId,

  crear,

  actualizar,

  desactivar,

  reactivar,
  crearUsuario,
};
