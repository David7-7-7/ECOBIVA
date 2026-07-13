const express = require("express");
const router = express.Router();

const empleadoController = require("../controllers/empleadoController");

const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

// Todas las rutas requieren autenticación
router.use(verificarToken);

// =====================
// CONSULTAS
// =====================

router.get("/", verificarRol(["Admin"]), empleadoController.listar);

router.get("/:id", verificarRol(["Admin"]), empleadoController.obtenerPorId);

// =====================
// CRUD
// =====================

router.post("/", verificarRol(["Admin"]), empleadoController.crear);

router.put("/:id", verificarRol(["Admin"]), empleadoController.actualizar);

// =====================
// ESTADO LABORAL
// =====================

router.patch(
  "/:id/desactivar",
  verificarRol(["Admin"]),
  empleadoController.desactivar,
);

router.patch(
  "/:id/reactivar",
  verificarRol(["Admin"]),
  empleadoController.reactivar,
);

// =====================
// USUARIO DEL EMPLEADO
// =====================

router.post(
  "/:id/crear-usuario",
  verificarRol(["Admin"]),
  empleadoController.crearUsuario,
);

module.exports = router;
