const express = require("express");
const router = express.Router();

const facturaController = require("../controllers/facturaController");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

router.get(
  "/",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  facturaController.listar,
);

router.get(
  "/orden/:idOrden",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  facturaController.obtenerPorOrden,
);

router.get(
  "/:id",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  facturaController.obtenerPorId,
);

// Crear/cobrar factura: tarea de Asesor/Admin, no de Tecnico.
router.post(
  "/",
  verificarRol(["Admin", "Asesor"]),
  facturaController.crearFacturaReparacion,
);

router.patch(
  "/:id/pagar",
  verificarRol(["Admin", "Asesor"]),
  facturaController.marcarPagada,
);

module.exports = router;
