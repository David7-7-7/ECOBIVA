const express = require("express");
const router = express.Router();

const tecnicoController = require("../controllers/tecnicoController");

const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

// Admin y Asesor pueden ver técnicos (el Asesor los necesita para asignarlos a órdenes)
router.get("/", verificarRol(["Admin", "Asesor"]), tecnicoController.listar);
router.get("/:id", verificarRol(["Admin", "Asesor"]), tecnicoController.obtenerPorId);

// Solo Admin gestiona edición/baja de técnicos.
// El ALTA de técnicos ya no se hace aquí (ver DEC de unificación): un
// técnico creado sin Usuario quedaba invisible para la asignación
// automática de órdenes. Ahora nace siempre desde POST /api/usuarios con
// nombreRol="Tecnico" (o desde /api/empleados/:id/crear-usuario), que crea
// Empleado + Usuario + PerfilTecnico juntos en una sola transacción.
router.put("/:id", verificarRol(["Admin"]), tecnicoController.actualizar);
router.patch("/:id/desactivar", verificarRol(["Admin"]), tecnicoController.desactivar);
router.patch("/:id/reactivar", verificarRol(["Admin"]), tecnicoController.reactivar);

module.exports = router;
