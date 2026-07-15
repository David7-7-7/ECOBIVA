const alertaStockDao = require("../dao/alertaStockDao");
const { registrarAccion } = require("../utils/auditoria");

/**
 * Listar todas las alertas de stock
 */
async function listar(req, res) {
  try {
    const alertas = await alertaStockDao.listar();
    return res.json(alertas);
  } catch (error) {
    console.error("Error al listar alertas de stock:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Listar alertas filtradas por estado (ej: /alertas-stock?estado=pendiente)
 */
async function listarPorEstado(req, res) {
  const { estado } = req.query;

  if (!estado) {
    return res.status(400).json({ error: "El parámetro 'estado' es obligatorio" });
  }

  try {
    const alertas = await alertaStockDao.listarPorEstado(estado);
    return res.json(alertas);
  } catch (error) {
    console.error("Error al listar alertas por estado:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Obtener una alerta por ID
 */
async function obtenerPorId(req, res) {
  try {
    const alerta = await alertaStockDao.obtenerPorId(req.params.id);
    if (!alerta) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }
    return res.json(alerta);
  } catch (error) {
    console.error("Error al obtener alerta:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Marcar alerta como atendida (cambiar estado a 'atendida')
 */
async function marcarAtendida(req, res) {
  try {
    const alerta = await alertaStockDao.obtenerPorId(req.params.id);
    if (!alerta) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }

    const actualizada = await alertaStockDao.actualizarEstado(
      req.params.id,
      "atendida"
    );

    await registrarAccion(req, {
      accion: "MARCAR_ALERTA_ATENDIDA",
      modulo: "ALERTAS_STOCK",
      detalle: `Alerta de stock para repuesto "${alerta.repuestoNombre}" (#${alerta.idRepuesto}) marcada como atendida`,
    });

    return res.json(actualizada);
  } catch (error) {
    console.error("Error al marcar alerta como atendida:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

/**
 * Eliminar una alerta
 */
async function eliminar(req, res) {
  try {
    const alerta = await alertaStockDao.obtenerPorId(req.params.id);
    if (!alerta) {
      return res.status(404).json({ error: "Alerta no encontrada" });
    }

    await alertaStockDao.eliminar(req.params.id);

    await registrarAccion(req, {
      accion: "ELIMINAR_ALERTA_STOCK",
      modulo: "ALERTAS_STOCK",
      detalle: `Alerta de stock para repuesto "${alerta.repuestoNombre}" (#${alerta.idRepuesto}) eliminada`,
    });

    return res.json({ mensaje: "Alerta eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar alerta:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

module.exports = {
  listar,
  listarPorEstado,
  obtenerPorId,
  marcarAtendida,
  eliminar,
};
