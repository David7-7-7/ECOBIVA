const bcrypt = require('bcrypt');
const usuarioDao = require('../dao/usuarioDao');
const preguntaSeguridadDao = require('../dao/preguntaSeguridadDao');
const tokenRecuperacionDao = require('../dao/tokenRecuperacionDao');
const validarPassword = require('../utils/validarPassword');

/**
 * GET /api/auth/preguntas-catalogo
 * Público: catálogo completo para que el usuario elija 3 al configurar.
 */
async function catalogoPreguntas(req, res) {
  try {
    const preguntas = await preguntaSeguridadDao.listarCatalogo();
    return res.json(preguntas);
  } catch (error) {
    console.error('Error al listar catálogo de preguntas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * POST /api/auth/preguntas-seguridad
 * Requiere estar logueado. El usuario configura (o reconfigura) sus 3 preguntas.
 * Body: { preguntas: [{ idPregunta, respuesta }, ...] } (exactamente 3)
 */
async function configurarPreguntas(req, res) {
  const { preguntas } = req.body;

  if (!Array.isArray(preguntas) || preguntas.length !== 3) {
    return res.status(400).json({ error: 'Debes seleccionar exactamente 3 preguntas de seguridad' });
  }

  const idsUnicos = new Set(preguntas.map((p) => p.idPregunta));
  if (idsUnicos.size !== 3) {
    return res.status(400).json({ error: 'Las 3 preguntas deben ser distintas' });
  }

  try {
    const preguntasConHash = [];
    for (const { idPregunta, respuesta } of preguntas) {
      if (!idPregunta || !respuesta || !respuesta.trim()) {
        return res.status(400).json({ error: 'Cada pregunta necesita idPregunta y respuesta' });
      }
      // Normalizamos la respuesta (minúsculas, sin espacios extra) antes de hashear,
      // así "Firulais" y "firulais " se consideran la misma respuesta.
      const respuestaNormalizada = respuesta.trim().toLowerCase();
      const respuestaHash = await bcrypt.hash(respuestaNormalizada, 10);
      preguntasConHash.push({ idPregunta, respuestaHash });
    }

    await preguntaSeguridadDao.configurar(req.usuario.idUsuario, preguntasConHash);

    return res.json({ mensaje: 'Preguntas de seguridad configuradas con éxito' });
  } catch (error) {
    console.error('Error al configurar preguntas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /api/auth/preguntas-seguridad?correo=
 * Público (paso 1 de recuperación): devuelve las 3 preguntas de ESE usuario.
 */
async function obtenerPreguntasDeUsuario(req, res) {
  const { correo } = req.query;

  if (!correo) {
    return res.status(400).json({ error: 'El correo es obligatorio' });
  }

  try {
    const preguntas = await preguntaSeguridadDao.obtenerPreguntasPorCorreo(correo);

    if (preguntas.length === 0) {
      // Mensaje genérico: no revelamos si el correo existe o no tiene preguntas configuradas
      return res.status(404).json({ error: 'No se encontraron preguntas de seguridad para ese correo' });
    }

    return res.json(preguntas);
  } catch (error) {
    console.error('Error al obtener preguntas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * POST /api/auth/validar-preguntas
 * Público (paso 2 de recuperación): valida las 3 respuestas.
 * Si las 3 son correctas, genera un TokenRecuperacion.
 * Body: { correo, respuestas: [{ idPregunta, respuesta }, ...] }
 */
async function validarPreguntas(req, res) {
  const { correo, respuestas } = req.body;

  if (!correo || !Array.isArray(respuestas) || respuestas.length !== 3) {
    return res.status(400).json({ error: 'correo y las 3 respuestas son obligatorios' });
  }

  try {
    const usuario = await usuarioDao.obtenerPorCorreo(correo);
    if (!usuario) {
      return res.status(401).json({ error: 'No fue posible validar las respuestas' });
    }

    const respuestasGuardadas = await preguntaSeguridadDao.obtenerRespuestasPorCorreo(correo);

    if (respuestasGuardadas.length !== 3) {
      return res.status(401).json({ error: 'No fue posible validar las respuestas' });
    }

    const mapaGuardadas = new Map(
      respuestasGuardadas.map((r) => [r.idPregunta, r.respuestaHash])
    );

    for (const { idPregunta, respuesta } of respuestas) {
      const hashGuardado = mapaGuardadas.get(idPregunta);
      if (!hashGuardado) {
        return res.status(401).json({ error: 'No fue posible validar las respuestas' });
      }
      const respuestaNormalizada = (respuesta || '').trim().toLowerCase();
      const coincide = await bcrypt.compare(respuestaNormalizada, hashGuardado);
      if (!coincide) {
        return res.status(401).json({ error: 'No fue posible validar las respuestas' });
      }
    }

    // Las 3 respuestas son correctas -> generamos el token de recuperación
    const token = await tokenRecuperacionDao.generar(usuario.idUsuario);

    return res.json({
      mensaje: 'Respuestas correctas, ya puedes cambiar tu contraseña',
      token
    });
  } catch (error) {
    console.error('Error al validar preguntas:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * PUT /api/auth/reset-password/:token
 * Público: usa el token generado para cambiar la contraseña.
 * Body: { nuevaPassword }
 */
async function resetPassword(req, res) {
  const { token } = req.params;
  const { nuevaPassword } = req.body;

  

  if (!nuevaPassword) {
    return res.status(400).json({ error: 'nuevaPassword es obligatoria' + nuevaPassword });
  }

  const validacion = validarPassword(nuevaPassword);
  if (!validacion.valido) {
    return res.status(400).json({ error: validacion.error });
  }

  try {
    const registro = await tokenRecuperacionDao.obtenerValido(token);

    if (!registro) {
      return res.status(400).json({ error: 'Token inválido, expirado o ya utilizado' });
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 10);
    await usuarioDao.actualizarPasswordHash(registro.idUsuario, passwordHash);
    await tokenRecuperacionDao.marcarUsado(registro.idToken);

    return res.json({ mensaje: 'Contraseña actualizada con éxito' });
  } catch (error) {
    console.error('Error en reset password:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  catalogoPreguntas,
  configurarPreguntas,
  obtenerPreguntasDeUsuario,
  validarPreguntas,
  resetPassword
};