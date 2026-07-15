const pool = require("../config/db");
const tecnicoDao = require("./tecnicoDao");

// -----------------------------------------------------------------------------
// Un Diagnostico es 1:1 con una OrdenServicio (columna idOrdenServicio es
// UNIQUE). Solo se puede crear/editar mientras la orden está en estado
// "en_diagnostico" y mientras el diagnóstico no esté bloqueado. Al enviarse
// a aprobación se congela (bloqueado=1) y la orden pasa a
// "pendiente_aprobacion" — ver enviarAAprobacion().
// -----------------------------------------------------------------------------

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

      d.idDiagnostico,
      d.tipoDiagnostico,
      d.bloqueado,
      d.fechaEnvio,

      et.nombre AS tecnicoNombre

    FROM OrdenServicio o

    INNER JOIN Cliente c
      ON c.idCliente = o.idCliente

    INNER JOIN Vehiculo v
      ON v.idVehiculo = o.idVehiculo

    LEFT JOIN Diagnostico d
      ON d.idOrdenServicio = o.idOrden

    LEFT JOIN Usuario ut
      ON ut.idUsuario = o.idTecnico
    LEFT JOIN Empleado et
      ON et.idEmpleado = ut.idEmpleado

    WHERE o.estado IN ('en_diagnostico','pendiente_aprobacion')
  `;

  const params = [];

  if (esTecnico) {
    sql += " AND o.idTecnico = ?";
    params.push(idUsuario);
  }

  sql += " ORDER BY o.fechaCreacion DESC";

  const [rows] = await pool.query(sql, params);

  return rows;
}

function parseChecklist(diagnostico) {
  if (
    diagnostico &&
    diagnostico.checklist &&
    typeof diagnostico.checklist === "string"
  ) {
    try {
      diagnostico.checklist = JSON.parse(diagnostico.checklist);
    } catch (error) {
      // Si por alguna razón quedó un string no-JSON guardado, lo dejamos tal
      // cual en vez de romper la respuesta.
    }
  }
  return diagnostico;
}

async function obtenerPorOrden(idOrdenServicio, connection = pool) {
  const [rows] = await connection.query(
    "SELECT * FROM Diagnostico WHERE idOrdenServicio = ?",
    [idOrdenServicio],
  );
  return parseChecklist(rows[0] || null);
}

/**
 * Crea o actualiza (upsert, aprovechando que idOrdenServicio es UNIQUE) el
 * diagnóstico de una orden. Solo permitido mientras la orden está
 * "en_diagnostico" y el diagnóstico no está bloqueado.
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
    if (orden.estado !== "en_diagnostico") {
      throw new Error(
        `Solo se puede editar el diagnóstico mientras la orden está "en_diagnostico" (estado actual: "${orden.estado}"). Cambia el estado de la orden primero.`,
      );
    }

    const existente = await obtenerPorOrden(idOrdenServicio, connection);
    if (existente && existente.bloqueado) {
      throw new Error(
        "El diagnóstico ya fue enviado a aprobación y quedó bloqueado, no se puede editar.",
      );
    }

    const tipoDiagnostico =
      datos.tipoDiagnostico || existente?.tipoDiagnostico || "superficial";
    if (!["superficial", "profundo"].includes(tipoDiagnostico)) {
      throw new Error("tipoDiagnostico debe ser 'superficial' o 'profundo'.");
    }

    // El diagnóstico superficial siempre es gratis, aunque manden un costo.
    const costoDiagnostico =
      tipoDiagnostico === "profundo"
        ? Number(datos.costoDiagnostico ?? existente?.costoDiagnostico ?? 0)
        : 0;

    const checklist =
      datos.checklist !== undefined
        ? JSON.stringify(datos.checklist)
        : existente
          ? JSON.stringify(existente.checklist)
          : null;

    const subtotalManoObra = Number(
      datos.subtotalManoObra ?? existente?.subtotalManoObra ?? 0,
    );
    const subtotalRepuestos = Number(
      datos.subtotalRepuestos ?? existente?.subtotalRepuestos ?? 0,
    );

    // Nivel de batería: ya no se pide al cliente al crear la orden (decisión
    // 3.2 de la bitácora), lo mide el técnico acá, durante el diagnóstico.
    let nivelBateria = datos.nivelBateria ?? existente?.nivelBateria ?? null;
    if (nivelBateria !== null && nivelBateria !== undefined) {
      nivelBateria = Number(nivelBateria);
      if (
        Number.isNaN(nivelBateria) ||
        nivelBateria < 0 ||
        nivelBateria > 100
      ) {
        throw new Error("nivelBateria debe ser un número entre 0 y 100.");
      }
    }

    await connection.query(
      `
            INSERT INTO Diagnostico
            (checklist, tipoDiagnostico, nivelBateria, costoDiagnostico, subtotalManoObra, subtotalRepuestos, idOrdenServicio)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                checklist = VALUES(checklist),
                tipoDiagnostico = VALUES(tipoDiagnostico),
                nivelBateria = VALUES(nivelBateria),
                costoDiagnostico = VALUES(costoDiagnostico),
                subtotalManoObra = VALUES(subtotalManoObra),
                subtotalRepuestos = VALUES(subtotalRepuestos)
        `,
      [
        checklist,
        tipoDiagnostico,
        nivelBateria,
        costoDiagnostico,
        subtotalManoObra,
        subtotalRepuestos,
        idOrdenServicio,
      ],
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
 * Bloquea el diagnóstico (ya no se puede editar) y mueve la orden a
 * "pendiente_aprobacion". A partir de acá el siguiente paso es
 * ordenDao.registrarAprobacion() cuando el asesor marque la respuesta del
 * cliente.
 */
async function enviarAAprobacion(idOrdenServicio, idUsuario) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      "SELECT estado, idTecnico FROM OrdenServicio WHERE idOrden = ? FOR UPDATE",
      [idOrdenServicio],
    );
    const orden = ordenRows[0];
    if (!orden) {
      throw new Error("La orden no existe.");
    }
    if (orden.estado !== "en_diagnostico") {
      throw new Error(
        `Solo se puede enviar a aprobación desde "en_diagnostico" (estado actual: "${orden.estado}").`,
      );
    }

    const diagnostico = await obtenerPorOrden(idOrdenServicio, connection);
    if (!diagnostico) {
      throw new Error(
        "La orden todavía no tiene un diagnóstico guardado, no se puede enviar a aprobación.",
      );
    }
    if (diagnostico.bloqueado) {
      throw new Error("Este diagnóstico ya fue enviado a aprobación antes.");
    }

    await connection.query(
      "UPDATE Diagnostico SET bloqueado = 1, fechaEnvio = NOW() WHERE idOrdenServicio = ?",
      [idOrdenServicio],
    );

    await connection.query(
      "UPDATE OrdenServicio SET estado = 'pendiente_aprobacion' WHERE idOrden = ?",
      [idOrdenServicio],
    );

    // El técnico termina su parte (el diagnóstico) acá, no cuando la orden
    // se entrega: se libera cupo de inmediato para que pueda tomar otro
    // diagnóstico o una reparación mientras el cliente decide. No se borra
    // OrdenServicio.idTecnico (se conserva como referencia de quién
    // diagnosticó); solo deja de contar contra su cargaActual.
    if (orden.idTecnico) {
      await tecnicoDao.decrementarCargaPorUsuario(orden.idTecnico, connection);

      // eslint-disable-next-line global-require
      const ordenDao = require("./ordenDao");
      await ordenDao.intentarAsignarColasEspera(connection);
    }

    await connection.query(
      `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES (?, 'pendiente_aprobacion', ?, 'Diagnóstico enviado a aprobación del cliente (técnico liberado)', ?)
        `,
      [orden.estado, idUsuario, idOrdenServicio],
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

module.exports = {
  listar,
  obtenerPorOrden,
  guardar,
  enviarAAprobacion,
};
