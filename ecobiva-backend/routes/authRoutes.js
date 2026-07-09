const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const recuperacionController = require('../controllers/recuperacionController');
const verificarToken = require('../middlewares/verificarToken');

router.post('/login', authController.login);

// Catálogo público de preguntas (para configurarlas al crear cuenta)
router.get('/preguntas-catalogo', recuperacionController.catalogoPreguntas);

// Configurar preguntas propias (requiere estar logueado)
router.post('/preguntas-seguridad', verificarToken, recuperacionController.configurarPreguntas);

// Flujo de recuperación (públicos, no requieren token)
router.get('/preguntas-seguridad', recuperacionController.obtenerPreguntasDeUsuario);
router.post('/validar-preguntas', recuperacionController.validarPreguntas);
router.put('/reset-password/:token', recuperacionController.resetPassword);

module.exports = router;