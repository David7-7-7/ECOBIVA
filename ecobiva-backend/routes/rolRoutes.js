const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.get('/', verificarToken, verificarRol(['Admin']), usuarioController.listarRoles);

module.exports = router;