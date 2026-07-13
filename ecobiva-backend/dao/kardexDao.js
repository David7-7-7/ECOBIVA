const pool = require('../config/db');

async function listarTodos() {
  const [rows] = await pool.execute(
    `SELECT m.idMovimiento, m.tipoMovimiento, m.cantidad, m.fecha, m.idRepuesto,
            r.nombre AS nombreRepuesto, m.idOrdenServicio, m.idUsuario
     FROM movimientokardex m
     JOIN repuesto r ON m.idRepuesto = r.idRepuesto
     ORDER BY m.fecha DESC, m.idMovimiento DESC`
  );
  return rows;
}

async function obtenerPorId(idMovimiento) {
  const [rows] = await pool.execute(
    `SELECT m.idMovimiento, m.tipoMovimiento, m.cantidad, m.fecha, m.idRepuesto,
            r.nombre AS nombreRepuesto, m.idOrdenServicio, m.idUsuario
     FROM movimientokardex m
     JOIN repuesto r ON m.idRepuesto = r.idRepuesto
     WHERE m.idMovimiento = ?`,
    [idMovimiento]
  );

  return rows.length === 0 ? null : rows[0];
}

async function crear(movimiento) {
  const [result] = await pool.execute(
    `INSERT INTO movimientokardex
     (tipoMovimiento, cantidad, fecha, idRepuesto, idOrdenServicio, idUsuario)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      movimiento.tipoMovimiento,
      movimiento.cantidad,
      movimiento.fecha || new Date(),
      movimiento.idRepuesto,
      movimiento.idOrdenServicio || null,
      movimiento.idUsuario
    ]
  );
  return result.insertId;
}

async function obtenerMovimientosPorRepuesto(idRepuesto) {
  const [rows] = await pool.execute(
    `SELECT m.idMovimiento, m.tipoMovimiento, m.cantidad, m.fecha, m.idRepuesto,
            r.nombre AS nombreRepuesto, m.idOrdenServicio, m.idUsuario
     FROM movimientokardex m
     JOIN repuesto r ON m.idRepuesto = r.idRepuesto
     WHERE m.idRepuesto = ?
     ORDER BY m.fecha DESC, m.idMovimiento DESC`,
    [idRepuesto]
  );
  return rows;
}

module.exports = {
  listarTodos,
  obtenerPorId,
  crear,
  obtenerMovimientosPorRepuesto
};
