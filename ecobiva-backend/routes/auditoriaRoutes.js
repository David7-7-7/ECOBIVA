const express = require('express');
const router = express.Router();

const auditoriaController = require('../controllers/auditoriaController');
const verificarToken = require('../middlewares/verificarToken');
const verificarPermiso = require('../middlewares/verificarPermiso');

router.get('/', verificarToken, verificarPermiso('auditoria', 'leer'), auditoriaController.consultar);
router.get('/exportar', verificarToken, verificarPermiso('auditoria', 'exportar'), auditoriaController.exportar);

module.exports = router;
