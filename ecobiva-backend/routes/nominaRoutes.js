const express = require("express");
const router = express.Router();

const nominaController = require("../controllers/nominaController");

const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

// ======================
// CONSULTAS
// ======================

// Listar nóminas
router.get("/", verificarRol(["Admin"]), nominaController.listar);

// Obtener una nómina
router.get("/:id", verificarRol(["Admin"]), nominaController.obtenerPorId);

// ======================
// PREVIEW
// ======================

// Simular cálculo sin guardar
router.post("/preview", verificarRol(["Admin"]), nominaController.preview);

// ======================
// GENERAR
// ======================

// Generar nómina
router.post("/", verificarRol(["Admin"]), nominaController.generar);

// ======================
// RECALCULAR
// ======================

// Recalcular una nómina existente
router.put(
  "/:id/recalcular",
  verificarRol(["Admin"]),
  nominaController.recalcular,
);

// ======================
// ACTUALIZAR
// ======================

router.put("/:id", verificarRol(["Admin"]), nominaController.actualizar);

// ======================
// ELIMINAR
// ======================

router.delete("/:id", verificarRol(["Admin"]), nominaController.eliminar);

module.exports = router;
