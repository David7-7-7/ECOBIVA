const pool = require("../config/db");

async function listarTodos() {
  const [rows] = await pool.execute(`
    SELECT *
    FROM Cliente
    ORDER BY idCliente DESC
  `);

  return rows;
}

async function obtenerPorId(idCliente) {
  const [rows] = await pool.execute(
    `
    SELECT *
    FROM Cliente
    WHERE idCliente = ?
  `,
    [idCliente],
  );

  return rows.length ? rows[0] : null;
}

async function obtenerVehiculosPorCliente(idCliente) {
  const [rows] = await pool.execute(
    `
    SELECT
      idVehiculo,
      placa,
      marca,
      modelo,
      anio,
      serialMotor,
      tipoVehiculo,
      especificacionesBateria,
      idCliente
    FROM Vehiculo
    WHERE idCliente = ?
      AND estado = 1
  `,
    [idCliente],
  );

  return rows;
}

async function crear(cliente) {
  const [result] = await pool.execute(
    `
    INSERT INTO Cliente
    (
      tipoDocumento,
      documento,
      nombre,
      telefono,
      correo,
      ciudad,
      direccion,
      tipoComunicacion,
      estado,
      puntosAcumulados
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      cliente.tipoDocumento || "CC",
      cliente.documento,
      cliente.nombre,
      cliente.telefono || null,
      cliente.correo || null,
      cliente.ciudad || null,
      cliente.direccion || null,
      cliente.tipoComunicacion || "Correo",
      cliente.estado ?? 1,
      cliente.puntosAcumulados ?? 0,
    ],
  );

  return result.insertId;
}

async function actualizar(idCliente, cliente) {
  await pool.execute(
    `
    UPDATE Cliente
    SET
      tipoDocumento = ?,
      documento = ?,
      nombre = ?,
      telefono = ?,
      correo = ?,
      ciudad = ?,
      direccion = ?,
      tipoComunicacion = ?,
      estado = ?,
      puntosAcumulados = ?
    WHERE idCliente = ?
  `,
    [
      cliente.tipoDocumento || "CC",
      cliente.documento,
      cliente.nombre,
      cliente.telefono || null,
      cliente.correo || null,
      cliente.ciudad || null,
      cliente.direccion || null,
      cliente.tipoComunicacion || "Correo",
      cliente.estado ?? 1,
      cliente.puntosAcumulados ?? 0,
      idCliente,
    ],
  );
}

async function eliminar(idCliente) {
  // Desactivar cliente
  await pool.execute(
    `
    UPDATE Cliente
    SET estado = 0
    WHERE idCliente = ?
  `,
    [idCliente],
  );

  // Desactivar vehículos asociados
  await pool.execute(
    `
    UPDATE Vehiculo
    SET estado = 0
    WHERE idCliente = ?
  `,
    [idCliente],
  );
}

module.exports = {
  listarTodos,
  obtenerPorId,
  obtenerVehiculosPorCliente,
  crear,
  actualizar,
  eliminar,
};
