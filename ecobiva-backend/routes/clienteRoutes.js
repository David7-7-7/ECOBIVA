const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clienteController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.use(verificarToken);

router.get('/', verificarRol(['Admin', 'Asesor']), clienteController.listar);
router.get('/:id', verificarRol(['Admin', 'Asesor']), clienteController.obtenerPorId);
router.post('/', verificarRol(['Admin', 'Asesor']), clienteController.crear);
router.put('/:id', verificarRol(['Admin', 'Asesor']), clienteController.actualizar);
router.delete('/:id', verificarRol(['Admin', 'Asesor']), clienteController.eliminar);

module.exports = router;
