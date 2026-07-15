const reparacionDao = require("../dao/reparacionDao");
const { registrarAccion } = require("../utils/auditoria");

async function listar(req, res) {
  try {
    const roles = req.usuario.roles || [];

    const esTecnico = roles.includes("Tecnico");

    const reparaciones = await reparacionDao.listar(
      req.usuario.idUsuario,
      esTecnico,
    );

    return res.json(reparaciones);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error al listar reparaciones",
    });
  }
}

async function obtenerPorOrden(req, res) {
  try {
    const reparacion = await reparacionDao.obtenerPorOrden(req.params.idOrden);
    if (!reparacion) {
      return res
        .status(404)
        .json({
          error: "Esta orden todavía no tiene un registro de reparación.",
        });
    }
    return res.json(reparacion);
  } catch (error) {
    console.error("Error al obtener reparación:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// Guarda la descripción y el valor de la mano de obra. Solo permitido
// mientras la orden está "en_reparacion" y la reparación no está bloqueada
// (reparacionDao.guardar valida ambas cosas).
async function guardar(req, res) {
  const { descripcionManoObra, valorManoObra } = req.body;

  try {
    const reparacion = await reparacionDao.guardar(req.params.idOrden, {
      descripcionManoObra,
      valorManoObra,
    });

    await registrarAccion(req, {
      accion: "GUARDAR_REPARACION",
      modulo: "REPARACION",
      detalle: `Mano de obra registrada para la orden #${req.params.idOrden}`,
    });

    return res.json(reparacion);
  } catch (error) {
    console.error("Error al guardar reparación:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

// Finaliza la reparación: bloquea, pasa la orden a "finalizada", libera al
// técnico y genera automáticamente la Factura tipo 'reparacion'.
async function finalizar(req, res) {
  try {
    const resultado = await reparacionDao.finalizar(
      req.params.idOrden,
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "FINALIZAR_REPARACION",
      modulo: "REPARACION",
      detalle: `Reparación de la orden #${req.params.idOrden} finalizada, se generó la factura #${resultado.factura.numeroFactura}`,
    });

    return res.json(resultado);
  } catch (error) {
    console.error("Error al finalizar reparación:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

module.exports = {
  listar,
  obtenerPorOrden,
  guardar,
  finalizar,
};
