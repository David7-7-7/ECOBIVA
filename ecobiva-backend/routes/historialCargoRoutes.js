const express = require("express");
const router = express.Router();

const historialCargoController = require("../controllers/historialCargoController");

const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

// Todas las rutas requieren autenticación
router.use(verificarToken);

// ======================
// CONSULTAS
// ======================

// Listar todo el historial
router.get("/", verificarRol(["Admin"]), historialCargoController.listar);

// Historial por empleado
router.get(
  "/empleado/:idEmpleado",
  verificarRol(["Admin"]),
  historialCargoController.listarPorEmpleado,
);

// Obtener un registro específico
router.get(
  "/:id",
  verificarRol(["Admin"]),
  historialCargoController.obtenerPorId,
);

// ======================
// REGISTRO MANUAL
// ======================

router.post("/", verificarRol(["Admin"]), historialCargoController.crear);

module.exports = router;
