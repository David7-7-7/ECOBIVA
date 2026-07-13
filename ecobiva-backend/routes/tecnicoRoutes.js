const express = require("express");
const router = express.Router();

const tecnicoController = require("../controllers/tecnicoController");

const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

// Admin y Asesor pueden ver técnicos (el Asesor los necesita para asignarlos a órdenes)
router.get("/", verificarRol(["Admin", "Asesor"]), tecnicoController.listar);
router.get("/:id", verificarRol(["Admin", "Asesor"]), tecnicoController.obtenerPorId);

// Solo Admin gestiona el alta/edición/baja de técnicos
router.post("/", verificarRol(["Admin"]), tecnicoController.crear);
router.put("/:id", verificarRol(["Admin"]), tecnicoController.actualizar);
router.patch("/:id/desactivar", verificarRol(["Admin"]), tecnicoController.desactivar);
router.patch("/:id/reactivar", verificarRol(["Admin"]), tecnicoController.reactivar);

module.exports = router;
