const tecnicoDao = require("../dao/tecnicoDao");
const empleadoDao = require("../dao/empleadoDao");
const ordenDao = require("../dao/ordenDao");
const { registrarAccion } = require("../utils/auditoria");

async function listar(req, res) {
  try {
    const tecnicos = await tecnicoDao.listar();
    res.json({ ok: true, data: tecnicos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error al listar técnicos." });
  }
}

async function obtenerPorId(req, res) {
  try {
    const tecnico = await tecnicoDao.obtenerPorId(req.params.id);
    if (!tecnico) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Técnico no encontrado." });
    }
    res.json({ ok: true, data: tecnico });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: "Error consultando técnico." });
  }
}

async function crear(req, res) {
  try {
    const existente = await empleadoDao.obtenerPorDocumento(req.body.documento);
    if (existente) {
      return res
        .status(409)
        .json({
          ok: false,
          mensaje: "Ya existe un empleado con ese documento.",
        });
    }

    const tecnico = await tecnicoDao.crear(req.body);

    await registrarAccion(req, {
      accion: "CREAR_TECNICO",
      modulo: "TECNICOS",
      detalle: `Se creó el técnico:\nNombre: ${tecnico.nombre}\nDocumento: ${tecnico.documento}\nEspecialidad: ${tecnico.especialidad || "N/A"}`,
    });

    res
      .status(201)
      .json({
        ok: true,
        mensaje: "Técnico creado correctamente.",
        data: tecnico,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function actualizar(req, res) {
  try {
    const tecnico = await tecnicoDao.actualizar(req.params.id, req.body);

    await registrarAccion(req, {
      accion: "ACTUALIZAR_TECNICO",
      modulo: "TECNICOS",
      detalle: `Técnico actualizado: ${tecnico.nombre} (Documento: ${tecnico.documento})`,
    });

    res.json({
      ok: true,
      mensaje: "Técnico actualizado correctamente.",
      data: tecnico,
    });
  } catch (error) {
    console.error(error);
    // Mismo criterio que ordenController.actualizar(): los errores de
    // negocio (ej. capacidadMaxima inválida) responden 400, no 500, para
    // que el frontend los distinga de un fallo interno real.
    res.status(400).json({ ok: false, mensaje: error.message });
  }
}

async function desactivar(req, res) {
  try {
    const tecnico = await tecnicoDao.obtenerPorId(req.params.id);
    if (!tecnico) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Técnico no encontrado." });
    }

    await tecnicoDao.desactivar(req.params.id);

    // DEC-011: al desactivar un técnico, sus órdenes activas se reasignan
    // automáticamente (misma regla de "menor cargaActual" que la asignación
    // automática). Se llama DESPUÉS de desactivar() para que el técnico
    // saliente ya no aparezca como candidato. Si el técnico no tenía cuenta
    // de Usuario, no puede tener órdenes asignadas y esto no hace nada.
    const { reasignadas, sinTecnicoDisponible } =
      await ordenDao.reasignarOrdenesPorDesactivacion(
        tecnico.idUsuario,
        tecnico.nombre,
        req.usuario.idUsuario,
      );

    await registrarAccion(req, {
      accion: "DESACTIVAR_TECNICO",
      modulo: "TECNICOS",
      detalle: `Técnico desactivado: ${tecnico.nombre}\nDocumento: ${tecnico.documento}\nÓrdenes reasignadas automáticamente: ${reasignadas.length}\nÓrdenes sin técnico disponible (requieren asignación manual): ${sinTecnicoDisponible.length}`,
    });

    res.json({
      ok: true,
      mensaje:
        reasignadas.length > 0 || sinTecnicoDisponible.length > 0
          ? `Técnico desactivado correctamente. ${reasignadas.length} orden(es) reasignada(s) automáticamente${sinTecnicoDisponible.length > 0 ? ` y ${sinTecnicoDisponible.length} sin técnico disponible (requieren asignación manual).` : "."}`
          : "Técnico desactivado correctamente.",
      data: { reasignadas, sinTecnicoDisponible },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
}

async function reactivar(req, res) {
  try {
    const tecnico = await tecnicoDao.obtenerPorId(req.params.id);
    if (!tecnico) {
      return res
        .status(404)
        .json({ ok: false, mensaje: "Técnico no encontrado." });
    }

    await tecnicoDao.reactivar(req.params.id);

    await registrarAccion(req, {
      accion: "REACTIVAR_TECNICO",
      modulo: "TECNICOS",
      detalle: `Técnico reactivado: ${tecnico.nombre}\nDocumento: ${tecnico.documento}`,
    });

    res.json({ ok: true, mensaje: "Técnico reactivado correctamente." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  desactivar,
  reactivar,
};
