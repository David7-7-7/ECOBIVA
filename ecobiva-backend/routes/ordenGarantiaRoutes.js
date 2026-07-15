const express = require("express");
const router = express.Router();

const ordenGarantiaController = require("../controllers/ordenGarantiaController");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

/**
 * GET /api/ordenes-garantia
 * Listar todas las órdenes de garantía o filtrar por estado (?estado=abierta)
 */
router.get(
  "/",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  async (req, res) => {
    if (req.query.estado) {
      return ordenGarantiaController.listarPorEstado(req, res);
    }
    return ordenGarantiaController.listar(req, res);
  }
);

/**
 * GET /api/ordenes-garantia/:id
 * Obtener una orden de garantía específica
 */
/**
 * GET /api/ordenes-garantia/origen/:idOrdenOrigen
 * Obtener órdenes de garantía de una orden origen
 */
router.get(
  "/origen/:idOrdenOrigen",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  ordenGarantiaController.obtenerPorOrdenOrigen
);

router.get(
  "/:id",
  verificarRol(["Admin", "Asesor", "Tecnico"]),
  ordenGarantiaController.obtenerPorId
);

/**
 * POST /api/ordenes-garantia
 * Crear una nueva orden de garantía
 */
router.post(
  "/",
  verificarRol(["Admin", "Asesor"]),
  ordenGarantiaController.crear
);

/**
 * PATCH /api/ordenes-garantia/:id/estado
 * Cambiar estado de una orden de garantía
 */
router.patch(
  "/:id/estado",
  verificarRol(["Admin", "Asesor"]),
  ordenGarantiaController.cambiarEstado
);

/**
 * PUT /api/ordenes-garantia/:id
 * Actualizar notas/costo de una orden de garantía
 */
router.put(
  "/:id",
  verificarRol(["Admin", "Asesor"]),
  ordenGarantiaController.actualizar
);

/**
 * DELETE /api/ordenes-garantia/:id
 * Eliminar una orden de garantía
 */
router.delete(
  "/:id",
  verificarRol(["Admin", "Asesor"]),
  ordenGarantiaController.eliminar
);

module.exports = router;
