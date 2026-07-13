const express = require('express');
const router = express.Router();

const bateriaController = require('../controllers/bateriaController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.use(verificarToken);

router.get('/', verificarRol(['Admin']), bateriaController.listar);
router.get('/:id', verificarRol(['Admin']), bateriaController.obtenerPorId);
router.post('/', verificarRol(['Admin']), bateriaController.crear);
router.put('/:id', verificarRol(['Admin']), bateriaController.actualizar);
router.delete('/:id', verificarRol(['Admin']), bateriaController.eliminar);

module.exports = router;
