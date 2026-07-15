const pool = require("../config/db");
const tecnicoDao = require("./tecnicoDao");
// ordenDao se requiere de forma diferida (dentro de finalizar()) porque
// ordenDao.js requiere este mismo archivo (referencia circular): en el
// momento en que finalizar() efectivamente se ejecuta, ambos módulos ya
// están completamente cargados por Node, así que no hay problema.

// -----------------------------------------------------------------------------
// Una Reparacion es 1:1 con una OrdenServicio (idOrdenServicio UNIQUE), mismo
// patrón que Diagnostico. A diferencia del Diagnóstico (que lo crea el propio
// técnico a mano), el registro de Reparacion se crea AUTOMÁTICAMENTE por
// ordenDao.registrarAprobacion() en cuanto el cliente aprueba el diagnóstico
// (ver iniciar() más abajo) — el técnico solo la completa (mano de obra +
// repuestos) y la finaliza.
//
// idTecnico puede ser distinto de OrdenServicio.idTecnico: el técnico que
// diagnosticó no necesariamente es el mismo que repara (la carga se libera
// entre etapas, ver diagnosticoDao.enviarAAprobacion).
// -----------------------------------------------------------------------------

async function obtenerPorOrden(idOrdenServicio, connection = pool) {
  const [rows] = await connection.query(
    "SELECT * FROM Reparacion WHERE idOrdenServicio = ?",
    [idOrdenServicio],
  );
  return rows[0] || null;
}

/**
 * Lista las órdenes que están en proceso de reparación (o esperando técnico
 * para reparación), mismo patrón que diagnosticoDao.listar(): pensado para
 * la página "Reparaciones". Si esTecnico=true, se filtra por el técnico
 * autenticado (idUsuario); Admin/Asesor ven todas.
 */
async function listar(idUsuario = null, esTecnico = false) {
  let sql = `
    SELECT
      o.idOrden,
      o.folio,
      o.estado,
      o.fechaCreacion,

      c.nombre AS cliente,
      c.telefono,

      v.placa,
      v.marca,
      v.modelo,

      r.idReparacion,
      r.bloqueada,
      r.fechaInicio,
      r.fechaFin,
      r.valorManoObra,
      r.subtotalRepuestos,

      et.nombre AS tecnicoNombre

    FROM OrdenServicio o

    INNER JOIN Cliente c
      ON c.idCliente = o.idCliente

    INNER JOIN Vehiculo v
      ON v.idVehiculo = o.idVehiculo

    LEFT JOIN Reparacion r
      ON r.idOrdenServicio = o.idOrden

    LEFT JOIN Usuario ut
      ON ut.idUsuario = COALESCE(r.idTecnico, o.idTecnico)
    LEFT JOIN Empleado et
      ON et.idEmpleado = ut.idEmpleado

    WHERE o.estado = 'en_reparacion'
  `;

  const params = [];

  if (esTecnico) {
    sql += " AND COALESCE(r.idTecnico, o.idTecnico) = ?";
    params.push(idUsuario);
  }

  sql += " ORDER BY o.fechaCreacion DESC";

  const [rows] = await pool.query(sql, params);

  return rows;
}

/**
 * Crea el registro (vacío) de Reparacion para una orden. Se llama desde
 * ordenDao.moverAReparacion() dentro de la misma transacción que aprueba el
 * diagnóstico, tanto si ya se encontró técnico (idTecnico viene informado)
 * como si la orden quedó en "pendiente_asignacion_reparacion" (idTecnico =
 * null, se completa después vía asignarTecnico()).
 *
 * No se expone directamente por rutas: es un detalle interno del flujo de
 * aprobación, por eso vive acá pero se invoca desde ordenDao.
 */
async function iniciar(idOrdenServicio, idTecnico, connection) {
  await connection.query(
    `
        INSERT INTO Reparacion (idOrdenServicio, idTecnico)
        VALUES (?, ?)
    `,
    [idOrdenServicio, idTecnico || null],
  );
  return obtenerPorOrden(idOrdenServicio, connection);
}

/**
 * Asigna (o reemplaza) el técnico de una reparación ya creada. Se usa cuando
 * la orden estaba en "pendiente_asignacion_reparacion" (sin técnico al
 * momento de aprobarse) y se libera cupo más adelante — ver
 * ordenDao.asignarPrimeraOrdenPendiente().
 */
async function asignarTecnico(idOrdenServicio, idTecnico, connection) {
  await connection.query(
    "UPDATE Reparacion SET idTecnico = ? WHERE idOrdenServicio = ?",
    [idTecnico, idOrdenServicio],
  );
}

/**
 * Actualiza mano de obra (descripción + valor) de la reparación. Solo
 * permitido mientras la orden está "en_reparacion" y la reparación no está
 * bloqueada (misma regla que Diagnostico/guardar).
 */
async function guardar(idOrdenServicio, datos) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      "SELECT estado FROM OrdenServicio WHERE idOrden = ?",
      [idOrdenServicio],
    );
    const orden = ordenRows[0];
    if (!orden) {
      throw new Error("La orden no existe.");
    }
    if (orden.estado !== "en_reparacion") {
      throw new Error(
        `Solo se puede editar la reparación mientras la orden está "en_reparacion" (estado actual: "${orden.estado}").`,
      );
    }

    const existente = await obtenerPorOrden(idOrdenServicio, connection);
    if (!existente) {
      throw new Error("Esta orden todavía no tiene un registro de reparación.");
    }
    if (existente.bloqueada) {
      throw new Error(
        "La reparación ya fue finalizada y quedó bloqueada, no se puede editar.",
      );
    }

    const descripcionManoObra =
      datos.descripcionManoObra ?? existente.descripcionManoObra ?? null;
    const valorManoObra = Number(
      datos.valorManoObra ?? existente.valorManoObra ?? 0,
    );

    await connection.query(
      `
            UPDATE Reparacion
            SET descripcionManoObra = ?, valorManoObra = ?
            WHERE idOrdenServicio = ?
        `,
      [descripcionManoObra, valorManoObra, idOrdenServicio],
    );

    const actualizado = await obtenerPorOrden(idOrdenServicio, connection);

    await connection.commit();
    return actualizado;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Finaliza la reparación: la bloquea, mueve la orden a "finalizada", libera
 * la carga del técnico (ya no está ocupado con esta orden) y genera
 * automáticamente la Factura tipo 'reparacion' con los totales acumulados
 * (mano de obra + repuestos). Es el equivalente de
 * diagnosticoDao.enviarAAprobacion pero para el cierre de la reparación.
 */
async function finalizar(idOrdenServicio, idUsuario) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      "SELECT idOrden, folio, estado, idTecnico FROM OrdenServicio WHERE idOrden = ? FOR UPDATE",
      [idOrdenServicio],
    );
    const orden = ordenRows[0];
    if (!orden) {
      throw new Error("La orden no existe.");
    }
    if (orden.estado !== "en_reparacion") {
      throw new Error(
        `Solo se puede finalizar la reparación desde "en_reparacion" (estado actual: "${orden.estado}").`,
      );
    }

    const reparacion = await obtenerPorOrden(idOrdenServicio, connection);
    if (!reparacion) {
      throw new Error("Esta orden todavía no tiene un registro de reparación.");
    }
    if (reparacion.bloqueada) {
      throw new Error("Esta reparación ya fue finalizada antes.");
    }

    await connection.query(
      "UPDATE Reparacion SET bloqueada = 1, fechaFin = NOW() WHERE idOrdenServicio = ?",
      [idOrdenServicio],
    );

    await connection.query(
      "UPDATE OrdenServicio SET estado = 'finalizada' WHERE idOrden = ?",
      [idOrdenServicio],
    );

    await connection.query(
      `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES ('en_reparacion', 'finalizada', ?, 'Reparación finalizada por el técnico', ?)
        `,
      [idUsuario, idOrdenServicio],
    );

    // El técnico deja de estar ocupado con esta orden (equivalente a lo que
    // hace diagnosticoDao.enviarAAprobacion al terminar la etapa de
    // diagnóstico). No se toca OrdenServicio.idTecnico: se conserva para
    // trazabilidad de quién hizo la reparación.
    if (orden.idTecnico) {
      await tecnicoDao.decrementarCargaPorUsuario(orden.idTecnico, connection);
    }

    // Al liberar cupo, se intenta resolver la primera orden en cola de
    // espera (diagnóstico o reparación), igual que en ordenDao.
    // eslint-disable-next-line global-require
    const ordenDao = require("./ordenDao");
    await ordenDao.intentarAsignarColasEspera(connection);

    // Genera automáticamente la factura de reparación con lo acumulado.
    const subtotalManoObra = Number(reparacion.valorManoObra || 0);
    const subtotalRepuestos = Number(reparacion.subtotalRepuestos || 0);

    const numeroFactura = await ordenDao.generarNumeroFactura(connection);
    const total = subtotalManoObra + subtotalRepuestos;

    const [resultFactura] = await connection.query(
      `
            INSERT INTO Factura
            (idOrdenServicio, numeroFactura, tipo, subtotalManoObra, subtotalRepuestos, descuento, impuestos, total, idUsuarioCreador)
            VALUES (?, ?, 'reparacion', ?, ?, 0, 0, ?, ?)
        `,
      [
        idOrdenServicio,
        numeroFactura,
        subtotalManoObra,
        subtotalRepuestos,
        total,
        idUsuario,
      ],
    );

    const [facturaRows] = await connection.query(
      "SELECT * FROM Factura WHERE idFactura = ?",
      [resultFactura.insertId],
    );

    const actualizado = await obtenerPorOrden(idOrdenServicio, connection);

    await connection.commit();
    return { reparacion: actualizado, factura: facturaRows[0] };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  obtenerPorOrden,
  listar,
  iniciar,
  asignarTecnico,
  guardar,
  finalizar,
};
