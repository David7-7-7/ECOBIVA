const diagnosticoDao = require("../dao/diagnosticoDao");
const { registrarAccion } = require("../utils/auditoria");

async function listar(req, res) {
  try {
    const roles = req.usuario.roles || [];

    const esTecnico = roles.includes("Tecnico");

    const diagnosticos = await diagnosticoDao.listar(
      req.usuario.idUsuario,
      esTecnico,
    );

    return res.json(diagnosticos);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error al listar diagnósticos",
    });
  }
}

async function obtenerPorOrden(req, res) {
  try {
    const diagnostico = await diagnosticoDao.obtenerPorOrden(
      req.params.idOrden,
    );
    if (!diagnostico) {
      return res
        .status(404)
        .json({ error: "Esta orden todavía no tiene diagnóstico." });
    }
    return res.json(diagnostico);
  } catch (error) {
    console.error("Error al obtener diagnóstico:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function guardar(req, res) {
  const {
    checklist,
    tipoDiagnostico,
    nivelBateria,
    costoDiagnostico,
    subtotalManoObra,
    subtotalRepuestos,
  } = req.body;

  if (
    tipoDiagnostico &&
    !["superficial", "profundo"].includes(tipoDiagnostico)
  ) {
    return res
      .status(400)
      .json({ error: "tipoDiagnostico debe ser 'superficial' o 'profundo'." });
  }

  try {
    const diagnostico = await diagnosticoDao.guardar(req.params.idOrden, {
      checklist,
      tipoDiagnostico,
      nivelBateria,
      costoDiagnostico,
      subtotalManoObra,
      subtotalRepuestos,
    });

    await registrarAccion(req, {
      accion: "GUARDAR_DIAGNOSTICO",
      modulo: "DIAGNOSTICO",
      detalle: `Diagnóstico guardado para la orden #${req.params.idOrden} (tipo: ${diagnostico.tipoDiagnostico})`,
    });

    return res.json(diagnostico);
  } catch (error) {
    console.error("Error al guardar diagnóstico:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function enviarAAprobacion(req, res) {
  try {
    const diagnostico = await diagnosticoDao.enviarAAprobacion(
      req.params.idOrden,
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "ENVIAR_DIAGNOSTICO_APROBACION",
      modulo: "DIAGNOSTICO",
      detalle: `Diagnóstico de la orden #${req.params.idOrden} enviado a aprobación del cliente`,
    });

    return res.json(diagnostico);
  } catch (error) {
    console.error("Error al enviar diagnóstico a aprobación:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

module.exports = {
  listar,
  obtenerPorOrden,
  guardar,
  enviarAAprobacion,
};
