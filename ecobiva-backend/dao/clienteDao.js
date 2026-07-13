const pool = require("../config/db");

async function listarTodos() {
  const [rows] = await pool.execute(
    `SELECT * FROM Cliente
     ORDER BY idCliente DESC`,
  );
  return rows;
}

async function obtenerPorId(idCliente) {
  const [rows] = await pool.execute(
    `SELECT * FROM Cliente
     WHERE idCliente = ?`,
    [idCliente],
  );

  return rows.length === 0 ? null : rows[0];
}

async function obtenerVehiculosPorCliente(idCliente) {
  const [rows] = await pool.execute(
    `SELECT idVehiculo, placa, marca, modelo, anio, serialMotor, tipoVehiculo, especificacionesBateria, idCliente
     FROM vehiculo
     WHERE idCliente = ?`,
    [idCliente],
  );
  return rows;
}

async function crear(cliente) {
  const [result] = await pool.execute(
    `INSERT INTO Cliente
     (nombre, telefono, correo, documento, preferenciaNotificacion, estado, puntosAcumulados)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      cliente.nombre,
      cliente.telefono || null,
      cliente.correo || null,
      cliente.documento,
      cliente.preferenciaNotificacion || "Correo",
      cliente.estado ?? 1,
      cliente.puntosAcumulados ?? 0,
    ],
  );
  return result.insertId;
}

async function actualizar(idCliente, cliente) {
  await pool.execute(
    `UPDATE Cliente SET
      nombre = ?,
      telefono = ?,
      correo = ?,
      documento = ?,
      preferenciaNotificacion = ?,
      estado = ?,
      puntosAcumulados = ?
     WHERE idCliente = ?`,
    [
      cliente.nombre,
      cliente.telefono || null,
      cliente.correo || null,
      cliente.documento,
      cliente.preferenciaNotificacion || "Correo",
      cliente.estado ?? 1,
      cliente.puntosAcumulados ?? 0,
      idCliente,
    ],
  );
}

async function eliminar(idCliente) {
  // Remueve vehículos asociados primero para evitar errores de clave foránea.
  await pool.execute(`DELETE FROM vehiculo WHERE idCliente = ?`, [idCliente]);

  await pool.execute(`DELETE FROM Cliente WHERE idCliente = ?`, [idCliente]);
}

module.exports = {
  listarTodos,
  obtenerPorId,
  obtenerVehiculosPorCliente,
  crear,
  actualizar,
  eliminar,
};
