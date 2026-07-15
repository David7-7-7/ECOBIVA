const pool = require("../config/db");

/**
 * Listar todas las órdenes de garantía
 */
async function listar() {
  const [rows] = await pool.query(`
    SELECT 
      og.idOrdenGarantia,
      og.ordenOrigenId,
      og.estado,
      og.costoInterno,
      og.fechaApertura,
      og.notasSeguimiento,
      os.folio AS ordenFolio,
      os.estado AS ordenEstado,
      c.nombre AS clienteNombre,
      v.placa AS vehiculoPlaca
    FROM OrdenGarantia og
    JOIN OrdenServicio os ON os.idOrden = og.ordenOrigenId
    JOIN Cliente c ON c.idCliente = os.idCliente
    JOIN Vehiculo v ON v.idVehiculo = os.idVehiculo
    ORDER BY og.fechaApertura DESC
  `);
  return rows;
}

/**
 * Listar órdenes de garantía por estado
 */
async function listarPorEstado(estado) {
  const [rows] = await pool.query(`
    SELECT 
      og.idOrdenGarantia,
      og.ordenOrigenId,
      og.estado,
      og.costoInterno,
      og.fechaApertura,
      og.notasSeguimiento,
      os.folio AS ordenFolio,
      os.estado AS ordenEstado,
      c.nombre AS clienteNombre,
      v.placa AS vehiculoPlaca
    FROM OrdenGarantia og
    JOIN OrdenServicio os ON os.idOrden = og.ordenOrigenId
    JOIN Cliente c ON c.idCliente = os.idCliente
    JOIN Vehiculo v ON v.idVehiculo = os.idVehiculo
    WHERE og.estado = ?
    ORDER BY og.fechaApertura DESC
  `, [estado]);
  return rows;
}

/**
 * Obtener una orden de garantía por ID
 */
async function obtenerPorId(idOrdenGarantia) {
  const [rows] = await pool.query(`
    SELECT 
      og.idOrdenGarantia,
      og.ordenOrigenId,
      og.estado,
      og.costoInterno,
      og.fechaApertura,
      og.notasSeguimiento,
      os.folio AS ordenFolio,
      os.estado AS ordenEstado,
      c.nombre AS clienteNombre,
      c.idCliente,
      v.placa AS vehiculoPlaca,
      v.idVehiculo
    FROM OrdenGarantia og
    JOIN OrdenServicio os ON os.idOrden = og.ordenOrigenId
    JOIN Cliente c ON c.idCliente = os.idCliente
    JOIN Vehiculo v ON v.idVehiculo = os.idVehiculo
    WHERE og.idOrdenGarantia = ?
  `, [idOrdenGarantia]);
  return rows[0] || null;
}

/**
 * Obtener órdenes de garantía por orden origen
 */
async function obtenerPorOrdenOrigen(ordenOrigenId) {
  const [rows] = await pool.query(`
    SELECT 
      og.idOrdenGarantia,
      og.ordenOrigenId,
      og.estado,
      og.costoInterno,
      og.fechaApertura,
      og.notasSeguimiento,
      os.folio AS ordenFolio
    FROM OrdenGarantia og
    JOIN OrdenServicio os ON os.idOrden = og.ordenOrigenId
    WHERE og.ordenOrigenId = ?
    ORDER BY og.fechaApertura DESC
  `, [ordenOrigenId]);
  return rows;
}

/**
 * Crear una nueva orden de garantía
 */
async function crear(ordenOrigenId, datos) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Verificar que la orden origen exista y esté cerrada/entregada
    const [ordenRows] = await connection.query(
      "SELECT estado FROM OrdenServicio WHERE idOrden = ?",
      [ordenOrigenId]
    );
    
    if (ordenRows.length === 0) {
      throw new Error("La orden de origen no existe");
    }
    if (ordenRows[0].estado !== "entregada") {
      throw new Error("Solo se puede abrir una garant\u00eda para una orden entregada.");
    }

    // Insertar la orden de garantía
    const [result] = await connection.query(`
      INSERT INTO OrdenGarantia 
      (ordenOrigenId, estado, costoInterno, notasSeguimiento)
      VALUES (?, 'abierta', ?, ?)
    `, [
      ordenOrigenId,
      datos.costoInterno || null,
      datos.notasSeguimiento || null
    ]);

    await connection.commit();
    return obtenerPorId(result.insertId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Actualizar estado de una orden de garantía
 */
async function actualizarEstado(idOrdenGarantia, nuevoEstado) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.query(`
      UPDATE OrdenGarantia
      SET estado = ?
      WHERE idOrdenGarantia = ?
    `, [nuevoEstado, idOrdenGarantia]);

    if (result.affectedRows === 0) {
      throw new Error("Orden de garantía no encontrada");
    }

    await connection.commit();
    return obtenerPorId(idOrdenGarantia);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Actualizar costo interno y/o notas de seguimiento
 */
async function actualizar(idOrdenGarantia, datos) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (datos.costoInterno !== undefined) {
      updates.push("costoInterno = ?");
      values.push(datos.costoInterno);
    }

    if (datos.notasSeguimiento !== undefined) {
      updates.push("notasSeguimiento = ?");
      values.push(datos.notasSeguimiento);
    }

    if (updates.length === 0) {
      throw new Error("No hay datos para actualizar");
    }

    values.push(idOrdenGarantia);

    const [result] = await connection.query(
      `UPDATE OrdenGarantia SET ${updates.join(", ")} WHERE idOrdenGarantia = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error("Orden de garantía no encontrada");
    }

    await connection.commit();
    return obtenerPorId(idOrdenGarantia);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Eliminar una orden de garantía
 */
async function eliminar(idOrdenGarantia) {
  const [result] = await pool.query(`
    DELETE FROM OrdenGarantia
    WHERE idOrdenGarantia = ?
  `, [idOrdenGarantia]);

  return result.affectedRows;
}

module.exports = {
  listar,
  listarPorEstado,
  obtenerPorId,
  obtenerPorOrdenOrigen,
  crear,
  actualizarEstado,
  actualizar,
  eliminar
};
