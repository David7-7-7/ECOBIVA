const express = require('express');
const router = express.Router();

const perfilController = require('../controllers/perfilController');
const verificarToken = require('../middlewares/verificarToken');

router.put('/password', verificarToken, perfilController.cambiarPassword);
router.get('/me', verificarToken, perfilController.obtenerMiPerfil);
router.put('/me', verificarToken, perfilController.actualizarMiPerfil);

module.exports = router;
