const historialCargoDao = require("../dao/historialCargoDao");
const { registrarAccion } = require("../utils/auditoria");

/**
 * GET /api/historial-cargo
 */
async function listar(req, res) {
  try {
    const historial = await historialCargoDao.listar();

    res.json({
      ok: true,
      data: historial,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar el historial de cargos.",
    });
  }
}

/**
 * GET /api/historial-cargo/:id
 */
async function obtenerPorId(req, res) {
  try {
    const historial = await historialCargoDao.obtenerPorId(req.params.id);

    if (!historial) {
      return res.status(404).json({
        ok: false,
        mensaje: "Registro no encontrado.",
      });
    }

    res.json({
      ok: true,
      data: historial,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: "Error consultando el historial.",
    });
  }
}

/**
 * GET /api/historial-cargo/empleado/:idEmpleado
 */
async function listarPorEmpleado(req, res) {
  try {
    const historial = await historialCargoDao.listarPorEmpleado(
      req.params.idEmpleado,
    );

    res.json({
      ok: true,
      data: historial,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: "Error consultando el historial del empleado.",
    });
  }
}

/**
 * POST /api/historial-cargo
 * Registro manual (opcional).
 */
async function crear(req, res) {
  try {
    const idHistorial = await historialCargoDao.crear({
      ...req.body,

      idUsuario: req.usuario.idUsuario,
    });

    await registrarAccion(req, {
      accion: "CREAR_HISTORIAL_CARGO",

      modulo: "EMPLEADOS",

      detalle: `Se registró manualmente un cambio de cargo para el empleado ${req.body.idEmpleado}.`,
    });

    res.status(201).json({
      ok: true,

      mensaje: "Historial registrado correctamente.",

      idHistorial,
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

  listarPorEmpleado,

  crear,
};
