const pool = require('../config/db');
const crypto = require('crypto');

/**
 * Genera un token aleatorio seguro, lo guarda con 30 min de vigencia.
 */
async function generar(idUsuario) {
  const token = crypto.randomBytes(32).toString('hex');
  const fechaExpiracion = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

  await pool.execute(
    `INSERT INTO TokenRecuperacion (token, fechaGeneracion, fechaExpiracion, usado, idUsuario)
     VALUES (?, NOW(), ?, FALSE, ?)`,
    [token, fechaExpiracion, idUsuario]
  );

  return token;
}

/**
 * Busca un token válido (no usado y no expirado).
 */
async function obtenerValido(token) {
  const [rows] = await pool.execute(
    `SELECT idToken, idUsuario, fechaExpiracion, usado
     FROM TokenRecuperacion
     WHERE token = ?`,
    [token]
  );

  if (rows.length === 0) return null;

  const registro = rows[0];

  if (registro.usado) return null;
  if (new Date(registro.fechaExpiracion) < new Date()) return null;

  return registro;
}

async function marcarUsado(idToken) {
  await pool.execute(
    'UPDATE TokenRecuperacion SET usado = TRUE WHERE idToken = ?',
    [idToken]
  );
}

module.exports = { generar, obtenerValido, marcarUsado };