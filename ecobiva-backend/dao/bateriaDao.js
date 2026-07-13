const pool = require('../config/db');

async function listarTodos() {
  const [rows] = await pool.execute(
    `SELECT b.idRepuesto, r.nombre, r.categoria, r.precioUnitario, r.proveedor,
            r.stockActual, r.stockMinimo,
            b.serial, b.modeloCompatible, b.estado, b.voltajeFinal, b.amperajeFinal, b.idVehiculo
     FROM bateria b
     JOIN repuesto r ON b.idRepuesto = r.idRepuesto
     ORDER BY b.idRepuesto DESC`
  );
  return rows;
}

async function obtenerPorId(idRepuesto) {
  const [rows] = await pool.execute(
    `SELECT b.idRepuesto, r.nombre, r.categoria, r.precioUnitario, r.proveedor,
            r.stockActual, r.stockMinimo,
            b.serial, b.modeloCompatible, b.estado, b.voltajeFinal, b.amperajeFinal, b.idVehiculo
     FROM bateria b
     JOIN repuesto r ON b.idRepuesto = r.idRepuesto
     WHERE b.idRepuesto = ?`,
    [idRepuesto]
  );

  return rows.length === 0 ? null : rows[0];
}

async function crear(bateria) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO repuesto
       (nombre, categoria, precioUnitario, proveedor, stockActual, stockMinimo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        bateria.nombre,
        bateria.categoria || null,
        bateria.precioUnitario || 0,
        bateria.proveedor || null,
        bateria.stockActual || 0,
        bateria.stockMinimo || 0
      ]
    );

    const idRepuesto = result.insertId;

    await connection.execute(
      `INSERT INTO bateria
       (idRepuesto, serial, modeloCompatible, estado, voltajeFinal, amperajeFinal, idVehiculo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idRepuesto,
        bateria.serial,
        bateria.modeloCompatible || null,
        bateria.estado || null,
        bateria.voltajeFinal || null,
        bateria.amperajeFinal || null,
        bateria.idVehiculo || null
      ]
    );

    await connection.commit();
    return idRepuesto;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function actualizar(idRepuesto, bateria) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await connection.execute(
      `UPDATE repuesto SET
        nombre = ?,
        categoria = ?,
        precioUnitario = ?,
        proveedor = ?,
        stockActual = ?,
        stockMinimo = ?
       WHERE idRepuesto = ?`,
      [
        bateria.nombre,
        bateria.categoria || null,
        bateria.precioUnitario || 0,
        bateria.proveedor || null,
        bateria.stockActual || 0,
        bateria.stockMinimo || 0,
        idRepuesto
      ]
    );

    await connection.execute(
      `UPDATE bateria SET
        serial = ?,
        modeloCompatible = ?,
        estado = ?,
        voltajeFinal = ?,
        amperajeFinal = ?,
        idVehiculo = ?
       WHERE idRepuesto = ?`,
      [
        bateria.serial,
        bateria.modeloCompatible || null,
        bateria.estado || null,
        bateria.voltajeFinal || null,
        bateria.amperajeFinal || null,
        bateria.idVehiculo || null,
        idRepuesto
      ]
    );

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function eliminar(idRepuesto) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    await connection.execute(`DELETE FROM bateria WHERE idRepuesto = ?`, [idRepuesto]);
    await connection.execute(`DELETE FROM repuesto WHERE idRepuesto = ?`, [idRepuesto]);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listarTodos,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
