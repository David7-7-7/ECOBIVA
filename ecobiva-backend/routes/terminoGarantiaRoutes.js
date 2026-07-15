const express = require("express");
const router = express.Router();

const terminoGarantiaController = require("../controllers/terminoGarantiaController");
const verificarToken = require("../middlewares/verificarToken");
const verificarRol = require("../middlewares/verificarRol");

router.use(verificarToken);

/**
 * GET /api/terminos-garantia
 * Listar todos los términos o solo vigentes (?vigentes=true)
 */
router.get(
  "/",
  verificarRol(["Admin", "Asesor"]),
  async (req, res) => {
    if (req.query.vigentes === "true") {
      return terminoGarantiaController.listarVigentes(req, res);
    }
    return terminoGarantiaController.listar(req, res);
  }
);

/**
 * GET /api/terminos-garantia/:id
 * Obtener un término específico por ID
 */
/**
 * GET /api/terminos-garantia/categoria/:categoria
 * Obtener término vigente de una categoría específica
 */
router.get(
  "/categoria/:categoria",
  verificarRol(["Admin", "Asesor"]),
  terminoGarantiaController.obtenerPorCategoria
);

router.get(
  "/:id",
  verificarRol(["Admin", "Asesor"]),
  terminoGarantiaController.obtenerPorId
);

/**
 * POST /api/terminos-garantia
 * Crear nuevo término de garantía
 */
router.post(
  "/",
  verificarRol(["Admin"]),
  terminoGarantiaController.crear
);

/**
 * PUT /api/terminos-garantia/:id
 * Actualizar un término de garantía
 */
router.put(
  "/:id",
  verificarRol(["Admin"]),
  terminoGarantiaController.actualizar
);

/**
 * PATCH /api/terminos-garantia/:id/vigencia
 * Cambiar vigencia de un término
 */
router.patch(
  "/:id/vigencia",
  verificarRol(["Admin"]),
  terminoGarantiaController.cambiarVigencia
);

/**
 * DELETE /api/terminos-garantia/:id
 * Eliminar un término de garantía
 */
router.delete(
  "/:id",
  verificarRol(["Admin"]),
  terminoGarantiaController.eliminar
);

module.exports = router;
