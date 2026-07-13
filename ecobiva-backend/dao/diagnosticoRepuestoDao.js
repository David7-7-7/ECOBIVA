const pool = require("../config/db");

// -----------------------------------------------------------------------------
// Conecta el Diagnóstico con el inventario: cada línea de DiagnosticoRepuesto
// representa un repuesto usado en el diagnóstico de una orden. Al agregarla:
//   1. se descuenta Repuesto.stockActual
//   2. se genera un MovimientoKardex tipo 'salida'
//   3. se recalcula Diagnostico.subtotalRepuestos (suma de cantidad*precio)
// Todo en una sola transacción. Solo se permite mientras el diagnóstico
// exista y no esté bloqueado (mismas reglas que diagnosticoDao.guardar()).
// -----------------------------------------------------------------------------

async function listarPorOrden(idOrdenServicio, connection = pool) {
  const [diagRows] = await connection.query(
    "SELECT idDiagnostico FROM Diagnostico WHERE idOrdenServicio = ?",
    [idOrdenServicio],
  );
  const diagnostico = diagRows[0];
  if (!diagnostico) return [];

  const [rows] = await connection.query(
    `
        SELECT
            dr.idDiagnosticoRepuesto,
            dr.idDiagnostico,
            dr.idRepuesto,
            dr.cantidad,
            dr.precioUnitario,
            dr.fecha,
            r.nombre AS repuestoNombre,
            r.categoria AS repuestoCategoria
        FROM DiagnosticoRepuesto dr
        INNER JOIN Repuesto r ON r.idRepuesto = dr.idRepuesto
        WHERE dr.idDiagnostico = ?
        ORDER BY dr.fecha ASC
    `,
    [diagnostico.idDiagnostico],
  );
  return rows;
}

async function recalcularSubtotal(idDiagnostico, connection) {
  const [totalRows] = await connection.query(
    "SELECT COALESCE(SUM(cantidad * precioUnitario), 0) AS total FROM DiagnosticoRepuesto WHERE idDiagnostico = ?",
    [idDiagnostico],
  );
  await connection.query(
    "UPDATE Diagnostico SET subtotalRepuestos = ? WHERE idDiagnostico = ?",
    [totalRows[0].total, idDiagnostico],
  );
}

/**
 * Registra un repuesto usado en el diagnóstico de una orden: descuenta
 * stock y genera el movimiento de Kardex correspondiente.
 */
async function agregar(idOrdenServicio, { idRepuesto, cantidad }, idUsuario) {
  const cantidadNum = Number(cantidad);
  if (!idRepuesto || !cantidadNum || cantidadNum <= 0) {
    throw new Error("idRepuesto y cantidad (mayor a 0) son obligatorios.");
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [diagRows] = await connection.query(
      "SELECT idDiagnostico, bloqueado FROM Diagnostico WHERE idOrdenServicio = ?",
      [idOrdenServicio],
    );
    const diagnostico = diagRows[0];
    if (!diagnostico) {
      throw new Error("La orden todavía no tiene un diagnóstico guardado.");
    }
    if (diagnostico.bloqueado) {
      throw new Error(
        "El diagnóstico ya fue enviado a aprobación y está bloqueado, no se pueden agregar más repuestos.",
      );
    }

    const [repRows] = await connection.query(
      "SELECT stockActual, precioUnitario FROM Repuesto WHERE idRepuesto = ? FOR UPDATE",
      [idRepuesto],
    );
    const repuesto = repRows[0];
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
            INSERT INTO DiagnosticoRepuesto (idDiagnostico, idRepuesto, cantidad, precioUnitario)
            VALUES (?, ?, ?, ?)
        `,
      [
        diagnostico.idDiagnostico,
        idRepuesto,
        cantidadNum,
        repuesto.precioUnitario,
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

    await recalcularSubtotal(diagnostico.idDiagnostico, connection);

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
 * Revierte una línea de repuesto ya registrada (por ejemplo, si se
 * capturó una cantidad equivocada): repone el stock y genera un
 * MovimientoKardex tipo 'entrada' para dejar trazabilidad del ajuste.
 */
async function eliminar(idOrdenServicio, idDiagnosticoRepuesto, idUsuario) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
            SELECT dr.*, d.idOrdenServicio, d.bloqueado
            FROM DiagnosticoRepuesto dr
            INNER JOIN Diagnostico d ON d.idDiagnostico = dr.idDiagnostico
            WHERE dr.idDiagnosticoRepuesto = ?
        `,
      [idDiagnosticoRepuesto],
    );
    const linea = rows[0];
    if (!linea || String(linea.idOrdenServicio) !== String(idOrdenServicio)) {
      throw new Error("La línea de repuesto no existe para esta orden.");
    }
    if (linea.bloqueado) {
      throw new Error(
        "El diagnóstico ya está bloqueado, no se pueden quitar repuestos.",
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
      "DELETE FROM DiagnosticoRepuesto WHERE idDiagnosticoRepuesto = ?",
      [idDiagnosticoRepuesto],
    );

    await recalcularSubtotal(linea.idDiagnostico, connection);

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
