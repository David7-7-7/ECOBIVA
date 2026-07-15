const pool = require("../config/db");

// -----------------------------------------------------------------------------
// Igual que DiagnosticoRepuesto: conecta la Reparacion con el inventario. Al
// agregar una línea:
//   1. se descuenta Repuesto.stockActual
//   2. se genera un MovimientoKardex tipo 'salida'
//   3. se recalcula Reparacion.subtotalRepuestos
// El precio se copia del Repuesto en el momento de usarlo (no se recibe del
// Frontend) para que la factura no cambie si luego cambia el precio del
// inventario. Además, cada línea guarda una `descripcion` (ej. "pastillas de
// freno traseras") y una `fotoUrl` (nombre de archivo subido con
// middlewares/upload.js, mismo mecanismo que EvidenciaFoto).
// -----------------------------------------------------------------------------

async function listarPorOrden(idOrdenServicio, connection = pool) {
  const [repRows] = await connection.query(
    "SELECT idReparacion FROM Reparacion WHERE idOrdenServicio = ?",
    [idOrdenServicio],
  );
  const reparacion = repRows[0];
  if (!reparacion) return [];

  const [rows] = await connection.query(
    `
        SELECT
            rr.idReparacionRepuesto,
            rr.idReparacion,
            rr.idRepuesto,
            rr.cantidad,
            rr.precioUnitario,
            rr.descripcion,
            rr.fotoUrl,
            rr.fecha,
            r.nombre AS repuestoNombre,
            r.categoria AS repuestoCategoria
        FROM ReparacionRepuesto rr
        INNER JOIN Repuesto r ON r.idRepuesto = rr.idRepuesto
        WHERE rr.idReparacion = ?
        ORDER BY rr.fecha ASC
    `,
    [reparacion.idReparacion],
  );
  return rows;
}

async function recalcularSubtotal(idReparacion, connection) {
  const [totalRows] = await connection.query(
    "SELECT COALESCE(SUM(cantidad * precioUnitario), 0) AS total FROM ReparacionRepuesto WHERE idReparacion = ?",
    [idReparacion],
  );
  await connection.query(
    "UPDATE Reparacion SET subtotalRepuestos = ? WHERE idReparacion = ?",
    [totalRows[0].total, idReparacion],
  );
}

/**
 * Registra un repuesto usado en la reparación de una orden: descuenta stock
 * y genera el movimiento de Kardex correspondiente.
 */
async function agregar(
  idOrdenServicio,
  { idRepuesto, cantidad, descripcion, fotoUrl },
  idUsuario,
) {
  const cantidadNum = Number(cantidad);
  if (!idRepuesto || !cantidadNum || cantidadNum <= 0) {
    throw new Error("idRepuesto y cantidad (mayor a 0) son obligatorios.");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [repRows] = await connection.query(
      "SELECT idReparacion, bloqueada FROM Reparacion WHERE idOrdenServicio = ?",
      [idOrdenServicio],
    );
    const reparacion = repRows[0];
    if (!reparacion) {
      throw new Error("La orden todavía no tiene un registro de reparación.");
    }
    if (reparacion.bloqueada) {
      throw new Error(
        "La reparación ya fue finalizada y está bloqueada, no se pueden agregar más repuestos.",
      );
    }

    const [invRows] = await connection.query(
      "SELECT stockActual, precioUnitario FROM Repuesto WHERE idRepuesto = ? FOR UPDATE",
      [idRepuesto],
    );
    const repuesto = invRows[0];
    if (!repuesto) {
      throw new Error("El repuesto no existe.");
    }
    if (repuesto.stockActual < cantidadNum) {
      throw new Error(
        `Stock insuficiente (disponible: ${repuesto.stockActual}, solicitado: ${cantidadNum}).`,
      );
    }

    await connection.query(
      `
            INSERT INTO ReparacionRepuesto (idReparacion, idRepuesto, cantidad, precioUnitario, descripcion, fotoUrl)
            VALUES (?, ?, ?, ?, ?, ?)
        `,
      [
        reparacion.idReparacion,
        idRepuesto,
        cantidadNum,
        repuesto.precioUnitario,
        descripcion || null,
        fotoUrl || null,
      ],
    );

    await connection.query(
      "UPDATE Repuesto SET stockActual = stockActual - ? WHERE idRepuesto = ?",
      [cantidadNum, idRepuesto],
    );

    await connection.query(
      `
            INSERT INTO MovimientoKardex (tipoMovimiento, cantidad, idRepuesto, idOrdenServicio, idUsuario)
            VALUES ('salida', ?, ?, ?, ?)
        `,
      [cantidadNum, idRepuesto, idOrdenServicio, idUsuario],
    );

    await recalcularSubtotal(reparacion.idReparacion, connection);

    const lista = await listarPorOrden(idOrdenServicio, connection);

    await connection.commit();
    return lista;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Revierte una línea de repuesto ya registrada: repone el stock y genera un
 * MovimientoKardex tipo 'entrada' para dejar trazabilidad del ajuste.
 */
async function eliminar(idOrdenServicio, idReparacionRepuesto, idUsuario) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
            SELECT rr.*, r.idOrdenServicio, r.bloqueada
            FROM ReparacionRepuesto rr
            INNER JOIN Reparacion r ON r.idReparacion = rr.idReparacion
            WHERE rr.idReparacionRepuesto = ?
        `,
      [idReparacionRepuesto],
    );
    const linea = rows[0];
    if (!linea || String(linea.idOrdenServicio) !== String(idOrdenServicio)) {
      throw new Error("La línea de repuesto no existe para esta orden.");
    }
    if (linea.bloqueada) {
      throw new Error(
        "La reparación ya está bloqueada, no se pueden quitar repuestos.",
      );
    }

    await connection.query(
      "UPDATE Repuesto SET stockActual = stockActual + ? WHERE idRepuesto = ?",
      [linea.cantidad, linea.idRepuesto],
    );

    await connection.query(
      `
            INSERT INTO MovimientoKardex (tipoMovimiento, cantidad, idRepuesto, idOrdenServicio, idUsuario)
            VALUES ('entrada', ?, ?, ?, ?)
        `,
      [linea.cantidad, linea.idRepuesto, idOrdenServicio, idUsuario],
    );

    await connection.query(
      "DELETE FROM ReparacionRepuesto WHERE idReparacionRepuesto = ?",
      [idReparacionRepuesto],
    );

    await recalcularSubtotal(linea.idReparacion, connection);

    const lista = await listarPorOrden(idOrdenServicio, connection);

    await connection.commit();
    return lista;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listarPorOrden,
  agregar,
  eliminar,
};
