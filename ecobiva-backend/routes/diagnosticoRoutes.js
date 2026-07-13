const express = require("express");
const router = express.Router();

const diagnosticoController = require("../controllers/diagnosticoController");
const diagnosticoRepuestoController = require("../controllers/diagnosticoRepuestoController");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

// Consultar el diagnóstico de una orden (idOrden = idOrdenServicio).
router.get(
  "/:idOrden",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  diagnosticoController.obtenerPorOrden,
);

// Solo Tecnico/Admin llenan el diagnóstico (son quienes revisan el vehículo).
router.put(
  "/:idOrden",
  verificarRol(["Admin", "Tecnico"]),
  diagnosticoController.guardar,
);

// Bloquea el diagnóstico y pasa la orden a "pendiente_aprobacion".
router.post(
  "/:idOrden/enviar-aprobacion",
  verificarRol(["Admin", "Tecnico"]),
  diagnosticoController.enviarAAprobacion,
);

// -----------------------------------------------------------------------------
// Repuestos usados en el diagnóstico: cada línea descuenta stock y genera
// un MovimientoKardex automáticamente (ver diagnosticoRepuestoDao). Mismos
// roles que el resto del módulo: Tecnico/Admin son quienes registran uso
// de repuestos (revisan el vehículo), Asesor solo puede consultar.
// -----------------------------------------------------------------------------

router.get(
  "/:idOrden/repuestos",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  diagnosticoRepuestoController.listar,
);

router.post(
  "/:idOrden/repuestos",
  verificarRol(["Admin", "Tecnico"]),
  diagnosticoRepuestoController.agregar,
);

router.delete(
  "/:idOrden/repuestos/:idDiagnosticoRepuesto",
  verificarRol(["Admin", "Tecnico"]),
  diagnosticoRepuestoController.eliminar,
);

module.exports = router;
