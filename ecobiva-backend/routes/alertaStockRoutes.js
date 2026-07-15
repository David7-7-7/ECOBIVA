const express = require("express");
const router = express.Router();

const alertaStockController = require("../controllers/alertaStockController");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

/**
 * GET /api/alertas-stock
 * Listar todas las alertas o filtrar por estado (?estado=pendiente)
 */
router.get(
  "/",
  verificarRol(["Admin", "Asesor"]),
  async (req, res) => {
    if (req.query.estado) {
      return alertaStockController.listarPorEstado(req, res);
    }
    return alertaStockController.listar(req, res);
  }
);

/**
 * GET /api/alertas-stock/:id
 * Obtener una alerta específica
 */
router.get(
  "/:id",
  verificarRol(["Admin", "Asesor"]),
  alertaStockController.obtenerPorId
);

/**
 * PATCH /api/alertas-stock/:id/atender
 * Marcar una alerta como atendida
 */
router.patch(
  "/:id/atender",
  verificarRol(["Admin", "Asesor"]),
  alertaStockController.marcarAtendida
);

/**
 * DELETE /api/alertas-stock/:id
 * Eliminar una alerta
 */
router.delete(
  "/:id",
  verificarRol(["Admin", "Asesor"]),
  alertaStockController.eliminar
);

module.exports = router;
