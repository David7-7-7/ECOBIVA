const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

// Todas las rutas de usuarios requieren estar logueado Y ser Admin
router.post('/', verificarToken, verificarRol(['Admin']), usuarioController.crear);
router.get('/', verificarToken, verificarRol(['Admin']), usuarioController.listar);
router.put('/:id', verificarToken, verificarRol(['Admin']), usuarioController.actualizar);
router.delete('/:id', verificarToken, verificarRol(['Admin']), usuarioController.desactivar);

module.exports = router;