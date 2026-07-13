const express = require('express');
const router = express.Router();

const vehiculoController = require('../controllers/vehiculoController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.use(verificarToken);

router.get('/', verificarRol(['Admin', 'Asesor']), vehiculoController.listar);
router.get('/:id', verificarRol(['Admin', 'Asesor']), vehiculoController.obtenerPorId);
router.post('/', verificarRol(['Admin', 'Asesor']), vehiculoController.crear);
router.put('/:id', verificarRol(['Admin', 'Asesor']), vehiculoController.actualizar);
router.delete('/:id', verificarRol(['Admin', 'Asesor']), vehiculoController.eliminar);

module.exports = router;
