const pool = require('../config/db');

async function listarTodos() {
  const [rows] = await pool.execute(
    `SELECT r.idRepuesto, r.nombre, r.categoria, r.precioUnitario, r.proveedor,
            r.stockActual, r.stockMinimo,
            CASE
              WHEN r.stockActual <= 0 THEN 'Agotado'
              WHEN r.stockActual <= r.stockMinimo THEN 'Stock Bajo'
              ELSE 'Disponible'
            END AS estado
     FROM repuesto r
     LEFT JOIN bateria b ON r.idRepuesto = b.idRepuesto
     WHERE b.idRepuesto IS NULL
     ORDER BY r.idRepuesto DESC`
  );
  return rows;
}

async function obtenerPorId(idRepuesto) {
  const [rows] = await pool.execute(
    `SELECT idRepuesto, nombre, categoria, precioUnitario, proveedor, stockActual, stockMinimo
     FROM repuesto
     WHERE idRepuesto = ?`,
    [idRepuesto]
  );

  return rows.length === 0 ? null : rows[0];
}

async function crear(repuesto) {
  const [result] = await pool.execute(
    `INSERT INTO repuesto
     (nombre, categoria, precioUnitario, proveedor, stockActual, stockMinimo)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      repuesto.nombre,
      repuesto.categoria || null,
      repuesto.precioUnitario || 0,
      repuesto.proveedor || null,
      repuesto.stockActual || 0,
      repuesto.stockMinimo || 0
    ]
  );
  return result.insertId;
}

async function actualizar(idRepuesto, repuesto) {
  await pool.execute(
    `UPDATE repuesto SET
      nombre = ?,
      categoria = ?,
      precioUnitario = ?,
      proveedor = ?,
      stockActual = ?,
      stockMinimo = ?
     WHERE idRepuesto = ?`,
    [
      repuesto.nombre,
      repuesto.categoria || null,
      repuesto.precioUnitario || 0,
      repuesto.proveedor || null,
      repuesto.stockActual || 0,
      repuesto.stockMinimo || 0,
      idRepuesto
    ]
  );
}

async function eliminar(idRepuesto) {
  await pool.execute(
    `DELETE FROM repuesto WHERE idRepuesto = ?`,
    [idRepuesto]
  );
}

module.exports = {
  listarTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
