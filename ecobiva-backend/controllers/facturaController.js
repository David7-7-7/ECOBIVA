const facturaDao = require("../dao/facturaDao");
const { registrarAccion } = require("../utils/auditoria");

async function listar(req, res) {
  try {
    const facturas = await facturaDao.listar();
    return res.json(facturas);
  } catch (error) {
    console.error("Error al listar facturas:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function obtenerPorId(req, res) {
  try {
    const factura = await facturaDao.obtenerPorId(req.params.id);
    if (!factura) {
      return res.status(404).json({ error: "Factura no encontrada" });
    }
    return res.json(factura);
  } catch (error) {
    console.error("Error al obtener factura:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function obtenerPorOrden(req, res) {
  try {
    const facturas = await facturaDao.obtenerPorOrden(req.params.idOrden);
    return res.json(facturas);
  } catch (error) {
    console.error("Error al obtener facturas de la orden:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function crearFacturaReparacion(req, res) {
  try {
    const factura = await facturaDao.crearFacturaReparacion(
      req.body.idOrdenServicio,
      req.body,
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "CREAR_FACTURA",
      modulo: "FACTURACION",
      detalle: `Se creó la factura ${factura.numeroFactura} (orden ${factura.ordenFolio}, total: ${factura.total})`,
    });

    return res.status(201).json(factura);
  } catch (error) {
    console.error("Error al crear factura:", error);
    return res.status(400).json({ error: error.message || "Error interno del servidor" });
  }
}

async function marcarPagada(req, res) {
  try {
    const factura = await facturaDao.marcarPagada(req.params.id, req.body);

    await registrarAccion(req, {
      accion: "MARCAR_FACTURA_PAGADA",
      modulo: "FACTURACION",
      detalle: `Factura ${factura.numeroFactura} marcada como pagada (método: ${factura.metodoPago || "N/A"})`,
    });

    return res.json(factura);
  } catch (error) {
    console.error("Error al marcar factura como pagada:", error);
    return res.status(400).json({ error: error.message || "Error interno del servidor" });
  }
}

module.exports = {
  listar,
  obtenerPorId,
  obtenerPorOrden,
  crearFacturaReparacion,
  marcarPagada,
};
