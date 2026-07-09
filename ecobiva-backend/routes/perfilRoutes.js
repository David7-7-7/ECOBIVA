const express = require('express');
const router = express.Router();

const perfilController = require('../controllers/perfilController');
const verificarToken = require('../middlewares/verificarToken');

router.put('/password', verificarToken, perfilController.cambiarPassword);

module.exports = router;
