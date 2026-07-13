const express = require("express");
const router = express.Router();

const ordenController = require("../controllers/ordenController");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

// =====================
// CONSULTAS
// Admin, Asesor y Tecnico pueden ver las órdenes (necesario para su trabajo diario).
// =====================
router.get(
  "/",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  ordenController.listar,
);

router.get(
  "/:id",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  ordenController.obtenerPorId,
);

router.get(
  "/:id/historial",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  ordenController.obtenerHistorial,
);

// =====================
// CRUD
// Solo Asesor/Admin pueden abrir o editar los datos generales de una orden.
// =====================
router.post("/", verificarRol(["Admin", "Asesor"]), ordenController.crear);

router.put(
  "/:id",
  verificarRol(["Admin", "Asesor"]),
  ordenController.actualizar,
);

router.delete(
  "/:id",
  verificarRol(["Admin", "Asesor"]),
  ordenController.eliminar,
);

// =====================
// ESTADO
// Solo Tecnico/Admin pueden mover la orden por el flujo de taller.
// =====================
router.patch(
  "/:id/estado",
  verificarRol(["Admin", "Tecnico"]),
  ordenController.actualizarEstado,
);

// =====================
// AUTOASIGNACIÓN
// Un técnico autenticado se asigna a sí mismo una orden que está en
// pendiente_asignacion (cola de espera). Solo Tecnico: no tiene sentido
// que Admin/Asesor "se autoasignen" una orden, ya que no ocupan cupo de
// PerfilTecnico. El idUsuario del técnico sale del token, nunca del body.
// =====================
router.patch(
  "/:id/autoasignar",
  verificarRol(["Tecnico"]),
  ordenController.autoasignar,
);

// =====================
// APROBACIÓN DEL CLIENTE
// El asesor es quien registra la respuesta del cliente (hoy es remota:
// llamada/WhatsApp fuera del sistema), por eso el rol permitido es
// Asesor/Admin y no Tecnico.
// =====================
router.patch(
  "/:id/aprobacion",
  verificarRol(["Admin", "Asesor"]),
  ordenController.registrarAprobacion,
);

module.exports = router;
