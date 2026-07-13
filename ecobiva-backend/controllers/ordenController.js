const ordenDao = require("../dao/ordenDao");
const { registrarAccion } = require("../utils/auditoria");

async function listar(req, res) {
  try {
    const ordenes = await ordenDao.listar();
    return res.json(ordenes);
  } catch (error) {
    console.error("Error al listar órdenes:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function obtenerPorId(req, res) {
  try {
    const orden = await ordenDao.obtenerPorId(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const historialEstado = await ordenDao.obtenerHistorialEstado(
      req.params.id,
    );
    orden.historialEstado = historialEstado;

    return res.json(orden);
  } catch (error) {
    console.error("Error al obtener orden:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function obtenerHistorial(req, res) {
  try {
    const orden = await ordenDao.obtenerPorId(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const historial = await ordenDao.obtenerHistorialEstado(req.params.id);
    return res.json(historial);
  } catch (error) {
    console.error("Error al obtener historial de la orden:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function crear(req, res) {
  const { idCliente, idVehiculo } = req.body;

  if (!idCliente || !idVehiculo) {
    return res
      .status(400)
      .json({ error: "Cliente y vehículo son obligatorios" });
  }

  try {
    const orden = await ordenDao.crear(req.body, req.usuario.idUsuario);

    await registrarAccion(req, {
      accion: "CREAR_ORDEN",
      modulo: "ORDENES",
      detalle: `Se creó la orden ${orden.folio} (Cliente: ${orden.clienteNombre}, Vehículo: ${orden.vehiculoPlaca})`,
    });

    return res.status(201).json(orden);
  } catch (error) {
    console.error("Error al crear orden:", error);
    return res
      .status(500)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function actualizar(req, res) {
  try {
    const ordenActual = await ordenDao.obtenerPorId(req.params.id);
    if (!ordenActual) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const orden = await ordenDao.actualizar(
      req.params.id,
      req.body,
      req.usuario.idUsuario,
    );

    const salioDeColaDeEspera =
      ordenActual.estado === "pendiente_asignacion" &&
      orden.estado === "recibido";

    await registrarAccion(req, {
      accion: "ACTUALIZAR_ORDEN",
      modulo: "ORDENES",
      detalle: salioDeColaDeEspera
        ? `Se actualizaron datos de la orden ${orden.folio} y se asignó técnico manualmente (pendiente_asignacion → recibido)`
        : `Se actualizaron datos de la orden ${orden.folio}`,
    });

    return res.json(orden);
  } catch (error) {
    console.error("Error al actualizar orden:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function actualizarEstado(req, res) {
  const { estado, motivo } = req.body;

  if (!estado) {
    return res.status(400).json({ error: "El nuevo estado es obligatorio" });
  }

  try {
    const ordenAnterior = await ordenDao.obtenerPorId(req.params.id);
    if (!ordenAnterior) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const orden = await ordenDao.actualizarEstado(
      req.params.id,
      estado,
      motivo,
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "CAMBIAR_ESTADO_ORDEN",
      modulo: "ORDENES",
      detalle: `Orden ${orden.folio}: ${ordenAnterior.estado} → ${estado}${motivo ? ` (Motivo: ${motivo})` : ""}`,
    });

    return res.json(orden);
  } catch (error) {
    console.error("Error al cambiar estado de la orden:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function registrarAprobacion(req, res) {
  const { aprobado, notas } = req.body;

  if (typeof aprobado !== "boolean") {
    return res.status(400).json({
      error: "El campo 'aprobado' es obligatorio y debe ser true/false",
    });
  }

  try {
    const ordenAnterior = await ordenDao.obtenerPorId(req.params.id);
    if (!ordenAnterior) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const { orden, facturaDiagnostico } = await ordenDao.registrarAprobacion(
      req.params.id,
      { aprobado, notas },
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: aprobado ? "APROBAR_DIAGNOSTICO" : "RECHAZAR_DIAGNOSTICO",
      modulo: "ORDENES",
      detalle: `Orden ${orden.folio}: cliente ${aprobado ? "aprobó" : "rechazó"} el diagnóstico${
        notas ? ` (Notas: ${notas})` : ""
      }${facturaDiagnostico ? ` — se generó factura ${facturaDiagnostico.numeroFactura} por diagnóstico profundo` : ""}`,
    });

    return res.json({ orden, facturaDiagnostico });
  } catch (error) {
    console.error("Error al registrar aprobación de la orden:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const orden = await ordenDao.obtenerPorId(req.params.id);
    if (!orden) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const resultado = await ordenDao.eliminarOCancelar(
      req.params.id,
      req.usuario.idUsuario,
    );

    if (resultado.yaFinal) {
      return res.status(400).json({
        error: `La orden ${orden.folio} ya está en un estado final (${orden.estado}) y no puede eliminarse ni cancelarse.`,
      });
    }

    await registrarAccion(req, {
      accion: resultado.eliminada ? "ELIMINAR_ORDEN" : "CANCELAR_ORDEN",
      modulo: "ORDENES",
      detalle: resultado.eliminada
        ? `Se eliminó la orden ${orden.folio}`
        : `Se canceló la orden ${orden.folio} (tenía registros asociados)`,
    });

    return res.json({
      mensaje: resultado.eliminada
        ? "Orden eliminada correctamente."
        : "La orden tenía registros asociados (diagnóstico, evidencias, etc.), así que se canceló en vez de eliminarse.",
      ...resultado,
    });
  } catch (error) {
    console.error("Error al eliminar/cancelar orden:", error);
    return res
      .status(500)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function autoasignar(req, res) {
  try {
    const ordenActual = await ordenDao.obtenerPorId(req.params.id);
    if (!ordenActual) {
      return res.status(404).json({ error: "Orden no encontrada" });
    }

    const orden = await ordenDao.autoasignar(
      req.params.id,
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "AUTOASIGNAR_ORDEN",
      modulo: "ORDENES",
      detalle: `El técnico se autoasignó la orden ${orden.folio} (pendiente_asignacion → recibido)`,
    });

    return res.json(orden);
  } catch (error) {
    console.error("Error al autoasignar orden:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

module.exports = {
  listar,
  obtenerPorId,
  obtenerHistorial,
  crear,
  actualizar,
  actualizarEstado,
  registrarAprobacion,
  eliminar,
  autoasignar,
};
