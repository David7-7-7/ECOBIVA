const reparacionRepuestoDao = require("../dao/reparacionRepuestoDao");
const { registrarAccion } = require("../utils/auditoria");

async function listar(req, res) {
  try {
    const lista = await reparacionRepuestoDao.listarPorOrden(
      req.params.idOrden,
    );
    return res.json(lista);
  } catch (error) {
    console.error("Error al listar repuestos de la reparación:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

// A diferencia del diagnóstico, cada línea de repuesto de reparación puede
// traer una fotografía (multipart/form-data, campo "foto") y una
// descripción breve (ej. "pastillas de freno traseras"). El precio nunca
// se recibe del frontend: reparacionRepuestoDao lo copia del inventario.
async function agregar(req, res) {
  const { idRepuesto, cantidad, descripcion } = req.body;

  if (!idRepuesto || !cantidad) {
    return res
      .status(400)
      .json({ error: "idRepuesto y cantidad son obligatorios" });
  }

  try {
    const fotoUrl = req.file ? req.file.filename : null;

    const lista = await reparacionRepuestoDao.agregar(
      req.params.idOrden,
      { idRepuesto, cantidad, descripcion, fotoUrl },
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "AGREGAR_REPUESTO_REPARACION",
      modulo: "REPARACION",
      detalle: `Orden #${req.params.idOrden}: se registró el uso de ${cantidad} unidad(es) del repuesto #${idRepuesto} en la reparación (descuento automático de stock + Kardex)`,
    });

    return res.status(201).json(lista);
  } catch (error) {
    console.error("Error al agregar repuesto a la reparación:", error);
    return res
      .status(400)
      .json({ error: error.message || "Error interno del servidor" });
  }
}

async function eliminar(req, res) {
  try {
    const lista = await reparacionRepuestoDao.eliminar(
      req.params.idOrden,
      req.params.idReparacionRepuesto,
      req.usuario.idUsuario,
    );

    await registrarAccion(req, {
      accion: "QUITAR_REPUESTO_REPARACION",
      modulo: "REPARACION",
      detalle: `Orden #${req.params.idOrden}: se revirtió la línea de repuesto #${req.params.idReparacionRepuesto} (se repuso stock + Kardex de entrada)`,
    });

    return res.json(lista);
  } catch (error) {
    console.error("Error al quitar repuesto de la reparación:", error);
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
