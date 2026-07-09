const express = require('express');
const router = express.Router();

const permisoController = require('../controllers/permisoController');
const verificarToken = require('../middlewares/verificarToken');
const verificarPermiso = require('../middlewares/verificarPermiso');

// Cualquier usuario autenticado puede ver SUS propios permisos (para armar su menú)
router.get('/mios', verificarToken, permisoController.obtenerMisPermisos);

// Solo quien tenga permiso "permisos:leer" puede ver la matriz completa / catálogo
router.get('/', verificarToken, verificarPermiso('permisos', 'leer'), permisoController.obtenerMatriz);
router.get('/catalogo', verificarToken, verificarPermiso('permisos', 'leer'), permisoController.obtenerCatalogo);

// Solo quien tenga permiso "permisos:editar" puede modificar la matriz
router.put('/', verificarToken, verificarPermiso('permisos', 'editar'), permisoController.actualizarMatriz);

module.exports = router;
