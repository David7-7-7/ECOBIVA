const express = require("express");
const router = express.Router();

const reparacionController = require("../controllers/reparacionController");
const reparacionRepuestoController = require("../controllers/reparacionRepuestoController");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");
const upload = require("../middlewares/upload");

router.use(verificarToken);

router.get(
  "/",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  reparacionController.listar,
);

// Consultar la reparación de una orden (idOrden = idOrdenServicio). El
// registro lo crea automáticamente ordenDao.registrarAprobacion() en cuanto
// el cliente aprueba el diagnóstico, así que no hay POST de creación aquí.
router.get(
  "/:idOrden",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  reparacionController.obtenerPorOrden,
);

// Solo Tecnico/Admin llenan la mano de obra (son quienes reparan el vehículo).
router.put(
  "/:idOrden",
  verificarRol(["Admin", "Tecnico"]),
  reparacionController.guardar,
);

// Bloquea la reparación, pasa la orden a "finalizada" y genera la factura.
router.post(
  "/:idOrden/finalizar",
  verificarRol(["Admin", "Tecnico"]),
  reparacionController.finalizar,
);

// -----------------------------------------------------------------------------
// Repuestos usados en la reparación: cada línea descuenta stock, genera un
// MovimientoKardex y puede llevar una fotografía del repuesto dañado o
// reemplazado (campo "foto", multipart/form-data). Mismos roles que el
// resto del módulo: Tecnico/Admin registran, Asesor solo consulta.
// -----------------------------------------------------------------------------

router.get(
  "/:idOrden/repuestos",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  reparacionRepuestoController.listar,
);

router.post(
  "/:idOrden/repuestos",
  verificarRol(["Admin", "Tecnico"]),
  upload.single("foto"),
  reparacionRepuestoController.agregar,
);

router.delete(
  "/:idOrden/repuestos/:idReparacionRepuesto",
  verificarRol(["Admin", "Tecnico"]),
  reparacionRepuestoController.eliminar,
);

module.exports = router;
