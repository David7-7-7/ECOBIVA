const ordenGarantiaDao = require("../dao/ordenGarantiaDao");
const { registrarAccion } = require("../utils/auditoria");

/**
 * Listar todas las órdenes de garantía
 */
async function listar(req, res) {
  try {
    const ordenes = await ordenGarantiaDao.listar();
    return res.json(ordenes);
  } catch (error) {
    console.error("Error al listar órdenes de garantía:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Listar órdenes de garantía por estado (?estado=abierta, cerrada, etc.)
 */
async function listarPorEstado(req, res) {
  const { estado } = req.query;

  if (!estado) {
    return res.status(400).json({ error: "El parámetro 'estado' es obligatorio" });
  }

  try {
    const ordenes = await ordenGarantiaDao.listarPorEstado(estado);
    return res.json(ordenes);
  } catch (error) {
    console.error("Error al listar órdenes de garantía por estado:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Obtener una orden de garantía por ID
 */
async function obtenerPorId(req, res) {
  try {
    const orden = await ordenGarantiaDao.obtenerPorId(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: "Orden de garantía no encontrada" });
    }
    return res.json(orden);
  } catch (error) {
    console.error("Error al obtener orden de garantía:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Obtener órdenes de garantía asociadas a una orden de servicio
 */
async function obtenerPorOrdenOrigen(req, res) {
  try {
    const ordenes = await ordenGarantiaDao.obtenerPorOrdenOrigen(
      req.params.idOrdenOrigen
    );
    return res.json(ordenes);
  } catch (error) {
    console.error("Error al obtener órdenes de garantía de la orden:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Crear una nueva orden de garantía a partir de una orden cerrada
 */
async function crear(req, res) {
  const { ordenOrigenId, costoInterno, notasSeguimiento } = req.body;

  if (!ordenOrigenId) {
    return res.status(400).json({ error: "ordenOrigenId es obligatorio" });
  }

  try {
    const ordenGarantia = await ordenGarantiaDao.crear(ordenOrigenId, {
      costoInterno,
      notasSeguimiento,
    });

    await registrarAccion(req, {
      accion: "CREAR_ORDEN_GARANTIA",
      modulo: "GARANTIA",
      detalle: `Orden de garantía abierta para orden origen #${ordenOrigenId} (folio: ${ordenGarantia.ordenFolio}). Costo interno: ${costoInterno || "N/A"}`,
    });

    return res.status(201).json(ordenGarantia);
  } catch (error) {
    console.error("Error al crear orden de garantía:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

/**
 * Cambiar estado de una orden de garantía (abierta, cerrada, etc.)
 */
async function cambiarEstado(req, res) {
  const { nuevoEstado } = req.body;

  if (!nuevoEstado) {
    return res.status(400).json({ error: "nuevoEstado es obligatorio" });
  }

  try {
    const ordenGarantia = await ordenGarantiaDao.obtenerPorId(req.params.id);
    if (!ordenGarantia) {
      return res.status(404).json({ error: "Orden de garantía no encontrada" });
    }

    const actualizada = await ordenGarantiaDao.actualizarEstado(
      req.params.id,
      nuevoEstado
    );

    await registrarAccion(req, {
      accion: "CAMBIAR_ESTADO_ORDEN_GARANTIA",
      modulo: "GARANTIA",
      detalle: `Orden de garantía #${req.params.id} (origen: ${ordenGarantia.ordenFolio}) cambió de estado "${ordenGarantia.estado}" a "${nuevoEstado}"`,
    });

    return res.json(actualizada);
  } catch (error) {
    console.error("Error al cambiar estado de orden de garantía:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

/**
 * Actualizar notas de seguimiento y/o costo interno
 */
async function actualizar(req, res) {
  try {
    const ordenGarantia = await ordenGarantiaDao.obtenerPorId(req.params.id);
    if (!ordenGarantia) {
      return res.status(404).json({ error: "Orden de garantía no encontrada" });
    }

    const actualizada = await ordenGarantiaDao.actualizar(
      req.params.id,
      req.body
    );

    await registrarAccion(req, {
      accion: "ACTUALIZAR_ORDEN_GARANTIA",
      modulo: "GARANTIA",
      detalle: `Orden de garantía #${req.params.id} (origen: ${ordenGarantia.ordenFolio}) actualizada. Costo interno: ${req.body.costoInterno || ordenGarantia.costoInterno || "N/A"}`,
    });

    return res.json(actualizada);
  } catch (error) {
    console.error("Error al actualizar orden de garantía:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

/**
 * Eliminar una orden de garantía
 */
async function eliminar(req, res) {
  try {
    const ordenGarantia = await ordenGarantiaDao.obtenerPorId(req.params.id);
    if (!ordenGarantia) {
      return res.status(404).json({ error: "Orden de garantía no encontrada" });
    }

    await ordenGarantiaDao.eliminar(req.params.id);

    await registrarAccion(req, {
      accion: "ELIMINAR_ORDEN_GARANTIA",
      modulo: "GARANTIA",
      detalle: `Orden de garantía #${req.params.id} (origen: ${ordenGarantia.ordenFolio}, estado: ${ordenGarantia.estado}) eliminada`,
    });

    return res.json({ mensaje: "Orden de garantía eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar orden de garantía:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

module.exports = {
  listar,
  listarPorEstado,
  obtenerPorId,
  obtenerPorOrdenOrigen,
  crear,
  cambiarEstado,
  actualizar,
  eliminar,
};
