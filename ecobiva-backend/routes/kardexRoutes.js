const express = require('express');
const router = express.Router();

const kardexController = require('../controllers/kardexController');
const verificarToken = require('../middlewares/verificarToken');
const verificarRol = require('../middlewares/verificarRol');

router.use(verificarToken);

router.get('/', verificarRol(['Admin']), kardexController.listar);
router.get('/:id', verificarRol(['Admin']), kardexController.obtenerPorId);
router.post('/', verificarRol(['Admin']), kardexController.crear);
router.get('/producto/:productoTipo/:idProducto', verificarRol(['Admin']), kardexController.obtenerPorProducto);

module.exports = router;
