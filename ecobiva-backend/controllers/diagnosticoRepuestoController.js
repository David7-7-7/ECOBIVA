const diagnosticoRepuestoDao = require("../dao/diagnosticoRepuestoDao");
const { registrarAccion } = require("../utils/auditoria");

async function listar(req, res) {
  try {
    const lista = await diagnosticoRepuestoDao.listarPorOrden(
      req.params.idOrden,
    );
    return res.json(lista);
  } catch (error) {
    console.error("Error al listar repuestos del diagnóstico:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function agregar(req, res) {
  const { idRepuesto, cantidad } = req.body;

  if (!idRepuesto || !cantidad) {
    return res
      .status(400)
      .json({ error: "idRepuesto y cantidad son obligatorios" });
  }

  try {
    const lista = await diagnosticoRepuestoDao.agregar(
      req.params.idOrden,
      { idRepuesto, cantidad },
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "AGREGAR_REPUESTO_DIAGNOSTICO",
      modulo: "DIAGNOSTICO",
      detalle: `Orden #${req.params.idOrden}: se registró el uso de ${cantidad} unidad(es) del repuesto #${idRepuesto} (descuento automático de stock + Kardex)`,
    });

    return res.status(201).json(lista);
  } catch (error) {
    console.error("Error al agregar repuesto al diagnóstico:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const lista = await diagnosticoRepuestoDao.eliminar(
      req.params.idOrden,
      req.params.idDiagnosticoRepuesto,
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "QUITAR_REPUESTO_DIAGNOSTICO",
      modulo: "DIAGNOSTICO",
      detalle: `Orden #${req.params.idOrden}: se revirtió la línea de repuesto #${req.params.idDiagnosticoRepuesto} (se repuso stock + Kardex de entrada)`,
    });

    return res.json(lista);
  } catch (error) {
    console.error("Error al quitar repuesto del diagnóstico:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

module.exports = {
  listar,
  agregar,
  eliminar,
};
