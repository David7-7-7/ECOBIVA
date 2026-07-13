const pool = require('../config/db');

async function listarTodos() {
  const [rows] = await pool.execute(
    `SELECT v.idVehiculo,
            v.placa,
            v.marca,
            v.modelo,
            v.anio,
            v.serialMotor,
            v.tipoVehiculo,
            v.especificacionesBateria,
            v.idCliente,
            c.nombre AS nombreCliente
     FROM vehiculo v
     JOIN cliente c ON c.idCliente = v.idCliente
     ORDER BY v.idVehiculo DESC`
  );
  return rows;
}

async function obtenerPorId(idVehiculo) {
  const [rows] = await pool.execute(
    `SELECT v.idVehiculo,
            v.placa,
            v.marca,
            v.modelo,
            v.anio,
            v.serialMotor,
            v.tipoVehiculo,
            v.especificacionesBateria,
            v.idCliente,
            c.nombre AS nombreCliente
     FROM vehiculo v
     JOIN cliente c ON c.idCliente = v.idCliente
     WHERE v.idVehiculo = ?`,
    [idVehiculo]
  );

  return rows.length === 0 ? null : rows[0];
}

async function crear(vehiculo) {
  const [result] = await pool.execute(
    `INSERT INTO vehiculo
     (placa, marca, modelo, anio, serialMotor, tipoVehiculo, especificacionesBateria, idCliente)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      vehiculo.placa,
      vehiculo.marca || null,
      vehiculo.modelo || null,
      vehiculo.anio || null,
      vehiculo.serialMotor || null,
      vehiculo.tipoVehiculo || null,
      vehiculo.especificacionesBateria || null,
      vehiculo.idCliente
    ]
  );
  return result.insertId;
}

async function actualizar(idVehiculo, vehiculo) {
  await pool.execute(
    `UPDATE vehiculo SET
      placa = ?,
      marca = ?,
      modelo = ?,
      anio = ?,
      serialMotor = ?,
      tipoVehiculo = ?,
      especificacionesBateria = ?,
      idCliente = ?
     WHERE idVehiculo = ?`,
    [
      vehiculo.placa,
      vehiculo.marca || null,
      vehiculo.modelo || null,
      vehiculo.anio || null,
      vehiculo.serialMotor || null,
      vehiculo.tipoVehiculo || null,
      vehiculo.especificacionesBateria || null,
      vehiculo.idCliente,
      idVehiculo
    ]
  );
}

async function eliminar(idVehiculo) {
  await pool.execute(
    `DELETE FROM vehiculo WHERE idVehiculo = ?`,
    [idVehiculo]
  );
}

module.exports = {
  listarTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
