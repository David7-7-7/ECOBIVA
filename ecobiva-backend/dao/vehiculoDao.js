const pool = require("../config/db");

async function listarTodos() {
  const [rows] = await pool.execute(`
    SELECT
      v.idVehiculo,
      v.placa,
      v.marca,
      v.modelo,
      v.anio,
      v.color,
      v.kilometraje,
      v.tipoVehiculo,
      v.fechaIngreso,
      v.estado,
      v.idCliente,
      c.nombre AS nombreCliente,
      c.telefono
    FROM Vehiculo v
    INNER JOIN Cliente c
      ON c.idCliente = v.idCliente
    ORDER BY v.idVehiculo DESC
  `);

  return rows;
}

async function obtenerPorId(idVehiculo) {
  const [rows] = await pool.execute(
    `
    SELECT
      v.idVehiculo,
      v.placa,
      v.marca,
      v.modelo,
      v.anio,
      v.color,
      v.kilometraje,
      v.tipoVehiculo,
      v.fechaIngreso,
      v.estado,
      v.idCliente,
      c.nombre AS nombreCliente,
      c.telefono,
      c.correo
    FROM Vehiculo v
    INNER JOIN Cliente c
      ON c.idCliente = v.idCliente
    WHERE v.idVehiculo = ?
    `,
    [idVehiculo],
  );

  return rows.length ? rows[0] : null;
}

async function crear(vehiculo) {
  const [result] = await pool.execute(
    `
    INSERT INTO Vehiculo
    (
      placa,
      marca,
      modelo,
      anio,
      color,
      kilometraje,
      tipoVehiculo,
      idCliente,
      estado
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      vehiculo.placa,
      vehiculo.marca || null,
      vehiculo.modelo || null,
      vehiculo.anio || null,
      vehiculo.color || null,
      vehiculo.kilometraje || null,
      vehiculo.tipoVehiculo || null,
      vehiculo.idCliente,
      1,
    ],
  );

  return result.insertId;
}

async function actualizar(idVehiculo, vehiculo) {
  await pool.execute(
    `
    UPDATE Vehiculo
    SET
      placa=?,
      marca=?,
      modelo=?,
      anio=?,
      color=?,
      kilometraje=?,
      tipoVehiculo=?,
      idCliente=?
    WHERE idVehiculo=?
    `,
    [
      vehiculo.placa,
      vehiculo.marca || null,
      vehiculo.modelo || null,
      vehiculo.anio || null,
      vehiculo.color || null,
      vehiculo.kilometraje || null,
      vehiculo.tipoVehiculo || null,
      vehiculo.idCliente,
      idVehiculo,
    ],
  );
}

async function eliminar(idVehiculo) {
  await pool.execute(
    `
    UPDATE Vehiculo
    SET estado=0
    WHERE idVehiculo=?
    `,
    [idVehiculo],
  );
}

async function reactivar(idVehiculo) {
  await pool.execute(
    `
    UPDATE Vehiculo
    SET estado=1
    WHERE idVehiculo=?
    `,
    [idVehiculo],
  );
}

module.exports = {
  listarTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  reactivar,
};
