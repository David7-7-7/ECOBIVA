const pool = require('../config/db');

async function listar() {
  const [rows] = await pool.execute('SELECT idRol, nombreRol, descripcion FROM Rol');
  return rows;
}

async function obtenerPorNombre(nombreRol) {
  const [rows] = await pool.execute(
    'SELECT idRol, nombreRol, descripcion FROM Rol WHERE nombreRol = ?',
    [nombreRol]
  );
  return rows[0] || null;
}

module.exports = { listar, obtenerPorNombre };