const express = require('express');
const router = express.Router();

const repuestoController = require('../controllers/repuestoController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.use(verificarToken);

router.get('/', verificarRol(['Admin']), repuestoController.listar);
router.get('/:id', verificarRol(['Admin']), repuestoController.obtenerPorId);
router.post('/', verificarRol(['Admin']), repuestoController.crear);
router.put('/:id', verificarRol(['Admin']), repuestoController.actualizar);
router.delete('/:id', verificarRol(['Admin']), repuestoController.eliminar);

module.exports = router;
