const pool = require("../config/db");
const tecnicoDao = require("./tecnicoDao");
const usuarioDao = require("./usuarioDao");
// reparacionDao se requiere de forma diferida (dentro de las funciones que
// lo usan) porque reparacionDao.js requiere este mismo archivo para poder
// generar el número de factura y resolver las colas de espera al finalizar
// una reparación (referencia circular). Para cuando esas funciones se
// ejecutan de verdad, Node ya cargó completamente ambos módulos.

// -----------------------------------------------------------------------------
// Estados válidos y transiciones permitidas.
//
// pendiente_asignacion -> en_diagnostico -> pendiente_aprobacion -> aprobada -> [pendiente_asignacion_reparacion ->] en_reparacion -> finalizada -> entregada
//                                                                 -> rechazada (el cliente puede cambiar de opinión: rechazada -> aprobada)
// cualquier estado no terminal puede pasar a cancelada.
//
// DECISIÓN: la orden entra directo a "en_diagnostico" en cuanto tiene
// técnico asignado (al crearse, al asignarse manualmente, al autoasignarse o
// al liberarse cupo desde la cola de espera) — ya no pasa por un estado
// intermedio "recibido". "recibido" se conserva en ESTADOS/TRANSICIONES
// únicamente por compatibilidad con órdenes históricas que ya quedaron en
// ese estado antes de este cambio; ninguna orden nueva llega a él.
//
// NUEVO (módulo de Reparación): al aprobarse el diagnóstico (ver
// registrarAprobacion -> moverAReparacion), la orden intenta encontrar
// técnico automáticamente, igual que al crearse. Si hay uno con cupo, pasa
// directo a "en_reparacion"; si no, queda en "pendiente_asignacion_reparacion"
// (cola de espera para reparación, análoga a "pendiente_asignacion" para
// diagnóstico) hasta que algún técnico libere cupo.
//
// "entregada" solo se permite si la orden ya tiene una Factura (ver
// facturaDao) — se valida en actualizarEstado más abajo.
// -----------------------------------------------------------------------------
const ESTADOS = [
  "pendiente_asignacion",
  "recibido",
  "en_diagnostico",
  "pendiente_aprobacion",
  "aprobada",
  "rechazada",
  "pendiente_asignacion_reparacion",
  "en_reparacion",
  "finalizada",
  "entregada",
  "cancelada",
];

const TRANSICIONES = {
  pendiente_asignacion: ["en_diagnostico", "cancelada"],

  // Solo relevante para órdenes históricas que ya estaban en "recibido".
  recibido: ["en_diagnostico", "cancelada"],
  en_diagnostico: ["pendiente_aprobacion", "cancelada"],
  pendiente_aprobacion: ["aprobada", "rechazada", "cancelada"],
  // El cliente rechazó, pero puede cambiar de opinión más adelante.
  rechazada: ["aprobada", "cancelada"],
  // "en_reparacion" y "pendiente_asignacion_reparacion" ya NO se disparan a
  // mano: los aplica automáticamente moverAReparacion() en cuanto se aprueba
  // el diagnóstico (mismo criterio que "en_diagnostico" no es manual).
  aprobada: ["en_reparacion", "pendiente_asignacion_reparacion", "cancelada"],
  pendiente_asignacion_reparacion: ["en_reparacion", "cancelada"],
  en_reparacion: ["finalizada", "cancelada"],
  finalizada: ["entregada"],
  entregada: [],
  cancelada: [],
};

// Estados en los que un técnico está efectivamente ocupado con la orden
// (cuenta contra su cargaActual). Se usa para decidir cuándo cancelar una
// orden debe liberar cupo: si el estado anterior no está en esta lista, el
// técnico ya se había liberado antes (ver diagnosticoDao.enviarAAprobacion y
// reparacionDao.finalizar) y no hay nada que descontar de nuevo.
const ESTADOS_CON_TECNICO_OCUPADO = [
  "recibido",
  "en_diagnostico",
  "en_reparacion",
];

const SELECT_BASE = `
    SELECT
        o.idOrden,
        o.folio,
        o.fechaCreacion,
        o.estado,
        o.kilometrajeIngreso,
        o.nivelBateriaIngreso,
        o.motivoIngreso,
        o.idCliente,
        o.idVehiculo,
        o.idTecnico,
        o.idAsesor,

        c.nombre AS clienteNombre,
        c.documento AS clienteDocumento,
        c.telefono AS clienteTelefono,
        c.correo AS clienteCorreo,

        v.placa AS vehiculoPlaca,
        v.marca AS vehiculoMarca,
        v.modelo AS vehiculoModelo,
        v.anio AS vehiculoAnio,

        et.nombre AS tecnicoNombre,
        ea.nombre AS asesorNombre

    FROM OrdenServicio o
    JOIN Cliente c ON c.idCliente = o.idCliente
    JOIN Vehiculo v ON v.idVehiculo = o.idVehiculo
    LEFT JOIN Usuario ut ON ut.idUsuario = o.idTecnico
    LEFT JOIN Empleado et ON et.idEmpleado = ut.idEmpleado
    LEFT JOIN Usuario ua ON ua.idUsuario = o.idAsesor
    LEFT JOIN Empleado ea ON ea.idEmpleado = ua.idEmpleado
`;

async function listar() {
  const [rows] = await pool.query(
    `${SELECT_BASE} ORDER BY o.fechaCreacion DESC`,
  );
  return rows;
}

async function obtenerPorId(idOrden, connection = pool) {
  const [rows] = await connection.query(`${SELECT_BASE} WHERE o.idOrden = ?`, [
    idOrden,
  ]);
  return rows[0] || null;
}

async function obtenerHistorialEstado(idOrden) {
  const [rows] = await pool.query(
    `
        SELECT
            h.idHistorial,
            h.estadoAnterior,
            h.estadoNuevo,
            h.fecha,
            h.motivo,
            h.usuarioId,
            e.nombre AS usuarioNombre
        FROM HistorialEstado h
        LEFT JOIN Usuario u ON u.idUsuario = h.usuarioId
        LEFT JOIN Empleado e ON e.idEmpleado = u.idEmpleado
        WHERE h.idOrdenServicio = ?
        ORDER BY h.fecha ASC
    `,
    [idOrden],
  );
  return rows;
}

async function generarFolio(connection) {
  // OT-000001, OT-000002, ... basado en el conteo actual de órdenes.
  // Si por carrera de concurrencia el folio ya existe, se reintenta.
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS total FROM OrdenServicio",
  );
  let siguiente = rows[0].total + 1;
  let folio = `OT-${String(siguiente).padStart(6, "0")}`;

  // Reintento simple por si hubo una carrera con otra inserción concurrente.
  for (let intentos = 0; intentos < 5; intentos++) {
    const [existe] = await connection.query(
      "SELECT idOrden FROM OrdenServicio WHERE folio = ?",
      [folio],
    );
    if (existe.length === 0) return folio;
    siguiente += 1;
    folio = `OT-${String(siguiente).padStart(6, "0")}`;
  }
  return folio;
}

/**
 * Resuelve la cola de espera de DIAGNÓSTICO: toma la orden más antigua en
 * "pendiente_asignacion" (sin técnico) y, si hay alguno disponible, se la
 * asigna y la pasa a "en_diagnostico".
 */
async function asignarPrimeraOrdenPendiente(connection) {
  const [ordenes] = await connection.query(`
        SELECT idOrden
        FROM OrdenServicio
        WHERE estado = 'pendiente_asignacion'
        ORDER BY fechaCreacion ASC
        LIMIT 1
        FOR UPDATE
    `);

  if (ordenes.length === 0) {
    return null;
  }

  const idTecnico = await tecnicoDao.obtenerDisponible(connection);

  if (!idTecnico) {
    return null;
  }

  const idOrden = ordenes[0].idOrden;

  await connection.query(
    `
        UPDATE OrdenServicio
        SET idTecnico = ?, estado = 'en_diagnostico'
        WHERE idOrden = ?
        `,
    [idTecnico, idOrden],
  );

  await tecnicoDao.incrementarCargaPorUsuario(idTecnico, connection);

  await connection.query(
    `
        INSERT INTO HistorialEstado
        (
            estadoAnterior,
            estadoNuevo,
            usuarioId,
            motivo,
            idOrdenServicio
        )
        VALUES
        (
            'pendiente_asignacion',
            'en_diagnostico',
            NULL,
            'Asignación automática por liberación de técnico',
            ?
        )
        `,
    [idOrden],
  );

  return idOrden;
}

/**
 * Resuelve la cola de espera de REPARACIÓN: toma la orden más antigua en
 * "pendiente_asignacion_reparacion" (aprobada por el cliente, pero sin
 * técnico libre en el momento de la aprobación) y, si hay alguno disponible,
 * se la asigna, actualiza el registro de Reparacion (idTecnico) y la pasa a
 * "en_reparacion". Es el equivalente de asignarPrimeraOrdenPendiente() para
 * la segunda etapa del flujo (ver módulo de Reparación).
 */
async function asignarPrimeraOrdenPendienteReparacion(connection) {
  const [ordenes] = await connection.query(`
        SELECT idOrden
        FROM OrdenServicio
        WHERE estado = 'pendiente_asignacion_reparacion'
        ORDER BY fechaCreacion ASC
        LIMIT 1
        FOR UPDATE
    `);

  if (ordenes.length === 0) {
    return null;
  }

  const idTecnico = await tecnicoDao.obtenerDisponible(connection);

  if (!idTecnico) {
    return null;
  }

  const idOrden = ordenes[0].idOrden;

  await connection.query(
    `
        UPDATE OrdenServicio
        SET idTecnico = ?, estado = 'en_reparacion'
        WHERE idOrden = ?
        `,
    [idTecnico, idOrden],
  );

  await tecnicoDao.incrementarCargaPorUsuario(idTecnico, connection);

  const reparacionDao = require("./reparacionDao");
  await reparacionDao.asignarTecnico(idOrden, idTecnico, connection);

  await connection.query(
    `
        INSERT INTO HistorialEstado
        (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
        VALUES ('pendiente_asignacion_reparacion', 'en_reparacion', NULL, 'Asignación automática por liberación de técnico', ?)
        `,
    [idOrden],
  );

  return idOrden;
}

/**
 * Intenta resolver, en orden, la cola de diagnóstico y luego la de
 * reparación. Se llama cada vez que un técnico libera cupo (al enviar un
 * diagnóstico a aprobación, al finalizar una reparación, al cancelar/
 * entregar una orden, o al desactivarse un técnico). Solo resuelve UNA
 * orden por llamada (la que corresponda), igual que el comportamiento
 * original: si liberar ese cupo permite resolver más colas, el próximo
 * evento de liberación las seguirá resolviendo.
 */
async function intentarAsignarColasEspera(connection) {
  const idOrdenDiagnostico = await asignarPrimeraOrdenPendiente(connection);
  if (idOrdenDiagnostico)
    return { tipo: "diagnostico", idOrden: idOrdenDiagnostico };

  const idOrdenReparacion =
    await asignarPrimeraOrdenPendienteReparacion(connection);
  if (idOrdenReparacion)
    return { tipo: "reparacion", idOrden: idOrdenReparacion };

  return null;
}
/**
 * Crea una Orden de Servicio y registra el estado inicial en HistorialEstado.
 *
 * Asignación automática de técnico (decisión: se dispara al CREAR la orden,
 * no al pasar a "en_diagnostico" — así el técnico ya sabe desde el ingreso
 * qué vehículos tiene asignados, y el asesor puede corregirlo a mano con
 * PUT /:id si hace falta antes de que empiece el diagnóstico):
 * si no viene `datos.idTecnico`, se busca el técnico activo con menor
 * `cargaActual` (tecnicoDao.obtenerDisponible). Si ninguno tiene cupo
 * (cargaActual < capacidadMaxima, normalmente 3), la orden queda sin
 * técnico (idTecnico = NULL) para que un Admin/Asesor lo asigne
 * manualmente más tarde.
 *
 * En cuanto la orden queda con técnico (automático o enviado en
 * `datos.idTecnico`), arranca directo en "en_diagnostico": ya no existe un
 * paso intermedio "recibido" — el técnico ve la orden lista para diagnosticar
 * desde el momento en que se crea. Si no hay técnico disponible, la orden
 * queda en "pendiente_asignacion" hasta que se libere cupo o se asigne a
 * mano (ver actualizar()).
 */
async function crear(datos, idUsuarioCreador) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const folio = await generarFolio(connection);

    let estadoInicial = "en_diagnostico";

    let idTecnico = datos.idTecnico ?? null;

    if (!idTecnico) {
      idTecnico = await tecnicoDao.obtenerDisponible(connection);

      if (!idTecnico) {
        estadoInicial = "pendiente_asignacion";
      }
    }

    const [result] = await connection.query(
      `
            INSERT INTO OrdenServicio
            (
                folio,
                estado,
                kilometrajeIngreso,
                nivelBateriaIngreso,
                motivoIngreso,
                idCliente,
                idVehiculo,
                idTecnico,
                idAsesor
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        folio,
        estadoInicial,
        datos.kilometrajeIngreso,
        // nivelBateriaIngreso ya no se captura al crear la orden (decisión
        // 3.2 de la bitácora): el técnico la mide durante el diagnóstico
        // (ver Diagnostico.nivelBateria). Si algún día vuelve a mandarse
        // desde el formulario, esto lo sigue soportando; si no, queda NULL.
        datos.nivelBateriaIngreso ?? null,
        datos.motivoIngreso,
        datos.idCliente,
        datos.idVehiculo,
        idTecnico,
        datos.idAsesor ?? idUsuarioCreador ?? null,
      ],
    );

    if (idTecnico) {
      await tecnicoDao.incrementarCargaPorUsuario(idTecnico, connection);
    }

    await connection.query(
      `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES (NULL, ?, ?, 'Creación de la orden', ?)
        `,
      [estadoInicial, idUsuarioCreador, result.insertId],
    );

    const orden = await obtenerPorId(result.insertId, connection);

    await connection.commit();
    return orden;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Actualiza los campos generales de la orden (no el estado, salvo el caso
 * especial de asignación manual descrito abajo).
 *
 * Si `datos.idTecnico` viene y es distinto del actual, es una reasignación
 * manual: se descuenta cargaActual del técnico saliente (si tenía) y se
 * suma al entrante (si se asignó uno nuevo), para que cargaActual siga
 * reflejando cuántas órdenes activas tiene cada técnico.
 *
 * BUGFIX: si la orden estaba en "pendiente_asignacion" (sin técnico) y esta
 * llamada le asigna uno (idTecnico pasa de NULL a un valor), la orden debe
 * salir de la cola de espera igual que lo hace la asignación automática:
 * su estado pasa a "en_diagnostico" y queda registrado en HistorialEstado
 * con el usuario que hizo la asignación manual. Antes esto no ocurría: el
 * admin podía asignar técnico a mano y la orden se quedaba "fantasma" —con
 * técnico puesto pero estado "pendiente_asignacion"— rompiendo la cola
 * automática (nunca se contaba como resuelta).
 *
 * FALLBACK "técnico mayor" (Admin/Asesor): cuando todos los técnicos reales
 * están al tope de cupo, se permite asignar manualmente la orden a un
 * usuario con rol Admin o Asesor (activo) aunque no tenga PerfilTecnico ni
 * esté sujeto al límite de 3 diagnósticos. Si el usuario elegido SÍ es un
 * técnico con PerfilTecnico, se le siguen validando estado activo y cupo
 * normalmente.
 */
async function actualizar(idOrden, datos, idUsuario = null) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const ordenActual = await obtenerPorId(idOrden, connection);
    if (!ordenActual) {
      throw new Error("La orden no existe.");
    }

    const idTecnicoNuevo =
      datos.idTecnico !== undefined ? datos.idTecnico : ordenActual.idTecnico;

    const cambiaTecnico = idTecnicoNuevo !== ordenActual.idTecnico;

    // Si se asigna un técnico nuevo (reasignación manual), se valida su cupo
    // y estado ANTES de tocar cargaActual de nadie. Se bloquea su perfil con
    // FOR UPDATE (mismo patrón que la autoasignación, ver DEC-006) para
    // evitar que dos reasignaciones concurrentes sobrepasen su capacidad.
    if (cambiaTecnico && idTecnicoNuevo) {
      const perfilTecnicoNuevo =
        await tecnicoDao.obtenerPerfilPorUsuarioParaAutoasignar(
          idTecnicoNuevo,
          connection,
        );

      if (perfilTecnicoNuevo) {
        // Es un técnico real (tiene PerfilTecnico): se le aplican las reglas
        // normales de cupo/estado.
        if (perfilTecnicoNuevo.estadoLaboral !== 1) {
          throw new Error(
            "No se puede asignar la orden: el técnico está inactivo.",
          );
        }
        if (
          perfilTecnicoNuevo.cargaActual >= perfilTecnicoNuevo.capacidadMaxima
        ) {
          throw new Error(
            "No se puede asignar la orden: el técnico ya alcanzó su capacidad máxima.",
          );
        }
      } else {
        // No tiene PerfilTecnico: solo se permite si es Admin o Asesor
        // activo (fallback manual para cuando no hay técnicos con cupo).
        const usuario = await usuarioDao.obtenerPorId(idTecnicoNuevo);
        const nombresRoles = (usuario?.roles || []).map((r) => r.nombreRol);

        if (
          !usuario ||
          Number(usuario.estado) !== 1 ||
          !nombresRoles.some((r) => ["Admin", "Asesor"].includes(r))
        ) {
          throw new Error(
            "El usuario seleccionado no es un técnico ni tiene rol de Administrador/Asesor activo para asignación manual.",
          );
        }
      }
    }

    if (cambiaTecnico) {
      if (ordenActual.idTecnico) {
        await tecnicoDao.decrementarCargaPorUsuario(
          ordenActual.idTecnico,
          connection,
        );
      }
      if (idTecnicoNuevo) {
        await tecnicoDao.incrementarCargaPorUsuario(idTecnicoNuevo, connection);
      }
    }

    // Asignación manual que saca a la orden de la cola de espera.
    const salioDeColaDeEspera =
      ordenActual.estado === "pendiente_asignacion" &&
      !ordenActual.idTecnico &&
      !!idTecnicoNuevo;

    const estadoNuevo = salioDeColaDeEspera
      ? "en_diagnostico"
      : ordenActual.estado;

    await connection.query(
      `
            UPDATE OrdenServicio
            SET
                kilometrajeIngreso = ?,
                nivelBateriaIngreso = ?,
                motivoIngreso = ?,
                idTecnico = ?,
                idAsesor = ?,
                estado = ?
            WHERE idOrden = ?
        `,
      [
        datos.kilometrajeIngreso ?? ordenActual.kilometrajeIngreso,
        datos.nivelBateriaIngreso ?? ordenActual.nivelBateriaIngreso,
        datos.motivoIngreso ?? ordenActual.motivoIngreso,
        idTecnicoNuevo,
        datos.idAsesor !== undefined ? datos.idAsesor : ordenActual.idAsesor,
        estadoNuevo,
        idOrden,
      ],
    );

    if (salioDeColaDeEspera) {
      await connection.query(
        `
                INSERT INTO HistorialEstado
                (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
                VALUES ('pendiente_asignacion', 'en_diagnostico', ?, 'Asignación manual de técnico', ?)
            `,
        [idUsuario, idOrden],
      );
    }

    const actualizada = await obtenerPorId(idOrden, connection);

    await connection.commit();
    return actualizada;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Cambia el estado de una orden validando la transición y dejando
 * trazabilidad en HistorialEstado.
 */
async function actualizarEstado(idOrden, estadoNuevo, motivo, idUsuario) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const orden = await obtenerPorId(idOrden, connection);
    if (!orden) {
      throw new Error("La orden no existe.");
    }

    if (!ESTADOS.includes(estadoNuevo)) {
      throw new Error(`Estado "${estadoNuevo}" no es válido.`);
    }

    const permitidas = TRANSICIONES[orden.estado] || [];
    if (!permitidas.includes(estadoNuevo)) {
      throw new Error(
        `No se puede pasar de "${orden.estado}" a "${estadoNuevo}". Transiciones válidas desde "${orden.estado}": ${
          permitidas.length ? permitidas.join(", ") : "ninguna (estado final)"
        }.`,
      );
    }

    // "finalizada" ya no se dispara a mano: reparacionDao.finalizar() es
    // quien la aplica (bloquea la Reparacion, libera al técnico y genera la
    // Factura automáticamente). Forzarla acá dejaría la orden "finalizada"
    // sin factura, rompiendo la validación de "entregada" de más abajo.
    if (estadoNuevo === "finalizada") {
      throw new Error(
        "La reparación debe finalizarse desde el módulo de Reparación (POST /api/reparaciones/:idOrden/finalizar), no cambiando el estado manualmente.",
      );
    }

    // No se puede marcar como entregada sin haber facturado la reparación.
    if (estadoNuevo === "entregada") {
      const [facturas] = await connection.query(
        "SELECT idFactura FROM Factura WHERE idOrdenServicio = ? AND tipo = 'reparacion'",
        [idOrden],
      );
      if (facturas.length === 0) {
        throw new Error(
          "No se puede entregar la orden sin haberla facturado primero (POST /api/facturas).",
        );
      }
    }

    await connection.query(
      "UPDATE OrdenServicio SET estado = ? WHERE idOrden = ?",
      [estadoNuevo, idOrden],
    );

    // La carga del técnico YA se libera antes de llegar a un estado final:
    // - al enviar el diagnóstico a aprobación (diagnosticoDao.enviarAAprobacion)
    // - al finalizar la reparación (reparacionDao.finalizar)
    // Por eso "entregada" (que solo se alcanza desde "finalizada") ya NO
    // decrementa acá: haría un segundo descuento sobre un técnico que ya
    // estaba libre. Solo "cancelada" puede sorprender a un técnico
    // TODAVÍA ocupado (en_diagnostico o en_reparacion); si la orden se
    // cancela desde un estado donde el técnico ya se había liberado
    // (pendiente_aprobacion, aprobada, rechazada, pendiente_asignacion_reparacion),
    // no hay nada que descontar.
    if (
      estadoNuevo === "cancelada" &&
      ESTADOS_CON_TECNICO_OCUPADO.includes(orden.estado) &&
      orden.idTecnico
    ) {
      await tecnicoDao.decrementarCargaPorUsuario(orden.idTecnico, connection);

      await intentarAsignarColasEspera(connection);
    }

    await connection.query(
      `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES (?, ?, ?, ?, ?)
        `,
      [orden.estado, estadoNuevo, idUsuario, motivo || null, idOrden],
    );

    const actualizada = await obtenerPorId(idOrden, connection);

    await connection.commit();
    return actualizada;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * "Elimina" una orden. Si aún no tiene módulos dependientes creados,
 * hace un borrado físico; si ya tiene historial/diagnóstico/etc. asociado
 * (o la FK lo impide), la cancela en su lugar para no perder trazabilidad.
 */
async function eliminarOCancelar(idOrden, idUsuario) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const orden = await obtenerPorId(idOrden, connection);
    if (!orden) {
      throw new Error("La orden no existe.");
    }

    try {
      await connection.query(
        "DELETE FROM HistorialEstado WHERE idOrdenServicio = ?",
        [idOrden],
      );
      await connection.query("DELETE FROM OrdenServicio WHERE idOrden = ?", [
        idOrden,
      ]);
      if (
        orden.idTecnico &&
        ESTADOS_CON_TECNICO_OCUPADO.includes(orden.estado)
      ) {
        await tecnicoDao.decrementarCargaPorUsuario(
          orden.idTecnico,
          connection,
        );

        // Igual que en el flujo de cancelación (más abajo): al liberar cupo
        // de un técnico, se intenta asignar automáticamente la primera
        // orden en espera (diagnóstico o reparación). Antes esto solo pasaba
        // al cancelar/entregar/reasignar por desactivación; si la orden se
        // borraba físicamente (sin dependientes todavía) el cupo quedaba
        // libre en PerfilTecnico pero nadie de la cola de espera se
        // beneficiaba hasta el siguiente cambio de estado en OTRA orden.
        await intentarAsignarColasEspera(connection);
      }
      await connection.commit();
      return { eliminada: true, cancelada: false };
    } catch (errorDelete) {
      // Tiene dependientes (Diagnostico, EvidenciaIngreso, Kardex, etc.) -> cancelar en vez de romper integridad.
      await connection.rollback();
      await connection.beginTransaction();

      if (orden.estado === "cancelada" || orden.estado === "entregada") {
        await connection.commit();
        return { eliminada: false, cancelada: false, yaFinal: true };
      }

      await connection.query(
        "UPDATE OrdenServicio SET estado = 'cancelada' WHERE idOrden = ?",
        [idOrden],
      );
      await connection.query(
        `
                INSERT INTO HistorialEstado
                (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
                VALUES (?, 'cancelada', ?, 'Cancelada (no se pudo eliminar: tiene registros asociados)', ?)
            `,
        [orden.estado, idUsuario, idOrden],
      );

      if (
        orden.idTecnico &&
        ESTADOS_CON_TECNICO_OCUPADO.includes(orden.estado)
      ) {
        await tecnicoDao.decrementarCargaPorUsuario(
          orden.idTecnico,
          connection,
        );

        await intentarAsignarColasEspera(connection);
      }

      await connection.commit();
      return { eliminada: false, cancelada: true };
    }
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Registra la aprobación o el rechazo del cliente sobre el diagnóstico de
 * una orden que está en "pendiente_aprobacion" (o "rechazada", si el
 * cliente había dicho que no y ahora cambió de opinión).
 *
 * Hoy en día la aprobación se captura de forma remota (el asesor llama o
 * le manda el diagnóstico al cliente por fuera del sistema, y es el propio
 * asesor quien marca el resultado acá) — por eso FirmaDigital queda sin
 * imagenFirma y con metodoCaptura = 'remoto_asesor'. El día que haya firma
 * real en tablet/celular, solo hay que mandar imagenFirma y otro
 * metodoCaptura; el resto de la lógica no cambia.
 *
 * Si el cliente rechaza un diagnóstico "profundo" que tenía costo, se
 * genera automáticamente una Factura tipo 'diagnostico' por ese valor
 * (el diagnóstico "superficial" es gratis y no genera factura).
 */
async function registrarAprobacion(
  idOrden,
  { aprobado, notas, imagenFirma, metodoCaptura, terminosAceptados },
  idUsuario,
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const orden = await obtenerPorId(idOrden, connection);
    if (!orden) {
      throw new Error("La orden no existe.");
    }

    if (!["pendiente_aprobacion", "rechazada"].includes(orden.estado)) {
      throw new Error(
        `Solo se puede aprobar/rechazar una orden en "pendiente_aprobacion" o "rechazada" (estado actual: "${orden.estado}").`,
      );
    }

    const estadoNuevo = aprobado ? "aprobada" : "rechazada";
    const permitidas = TRANSICIONES[orden.estado] || [];
    if (!permitidas.includes(estadoNuevo)) {
      throw new Error(
        `No se puede pasar de "${orden.estado}" a "${estadoNuevo}".`,
      );
    }

    const metodoFinal = metodoCaptura || "remoto_asesor";
    const firmaFinal = imagenFirma || null;
    if (
      metodoFinal === "canvas_cliente" &&
      (!firmaFinal || !firmaFinal.startsWith("data:image/"))
    ) {
      throw new Error("La firma capturada no es válida.");
    }
    if (aprobado && !terminosAceptados) {
      throw new Error(
        "El cliente debe aceptar los términos antes de aprobar el diagnóstico.",
      );
    }
    const terminosFlag = terminosAceptados ? 1 : 0;

    await connection.query(
      `
            INSERT INTO FirmaDigital
            (imagenFirma, metodoCaptura, terminosAceptados, idOrden)
            VALUES (?, ?, ?, ?)
        `,
      [firmaFinal, metodoFinal, terminosFlag, idOrden],
    );

    await connection.query(
      "UPDATE OrdenServicio SET estado = ? WHERE idOrden = ?",
      [estadoNuevo, idOrden],
    );

    await connection.query(
      `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES (?, ?, ?, ?, ?)
        `,
      [orden.estado, estadoNuevo, idUsuario, notas || null, idOrden],
    );

    // NUEVO (módulo de Reparación): en cuanto el cliente aprueba, la orden
    // arranca directo la etapa de reparación — mismo criterio que "en cuanto
    // tiene técnico, entra directo a en_diagnostico" al crearse. Se crea el
    // registro de Reparacion (vacío) y se busca técnico disponible; si hay,
    // pasa a "en_reparacion", si no, queda en "pendiente_asignacion_reparacion"
    // hasta que alguno libere cupo (ver asignarPrimeraOrdenPendienteReparacion).
    if (aprobado) {
      const reparacionDao = require("./reparacionDao");

      const idTecnicoReparacion =
        await tecnicoDao.obtenerDisponible(connection);
      const estadoReparacion = idTecnicoReparacion
        ? "en_reparacion"
        : "pendiente_asignacion_reparacion";

      await connection.query(
        "UPDATE OrdenServicio SET idTecnico = ?, estado = ? WHERE idOrden = ?",
        [idTecnicoReparacion, estadoReparacion, idOrden],
      );

      if (idTecnicoReparacion) {
        await tecnicoDao.incrementarCargaPorUsuario(
          idTecnicoReparacion,
          connection,
        );
      }

      await reparacionDao.iniciar(idOrden, idTecnicoReparacion, connection);

      await connection.query(
        `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES ('aprobada', ?, ?, ?, ?)
        `,
        [
          estadoReparacion,
          idUsuario,
          idTecnicoReparacion
            ? "Asignación automática de técnico para la reparación"
            : "Sin técnico disponible: en cola de espera para reparación",
          idOrden,
        ],
      );
    }

    let facturaDiagnostico = null;

    if (!aprobado) {
      const [diagnosticos] = await connection.query(
        "SELECT tipoDiagnostico, costoDiagnostico FROM Diagnostico WHERE idOrdenServicio = ?",
        [idOrden],
      );
      const diagnostico = diagnosticos[0];

      if (
        diagnostico &&
        diagnostico.tipoDiagnostico === "profundo" &&
        Number(diagnostico.costoDiagnostico) > 0
      ) {
        const numeroFactura = await generarNumeroFactura(connection);
        const costo = Number(diagnostico.costoDiagnostico);

        const [resultFactura] = await connection.query(
          `
                    INSERT INTO Factura
                    (idOrdenServicio, numeroFactura, tipo, subtotalManoObra, subtotalRepuestos, descuento, impuestos, total, idUsuarioCreador)
                    VALUES (?, ?, 'diagnostico', ?, 0, 0, 0, ?, ?)
                `,
          [idOrden, numeroFactura, costo, costo, idUsuario],
        );

        const [facturas] = await connection.query(
          "SELECT * FROM Factura WHERE idFactura = ?",
          [resultFactura.insertId],
        );
        facturaDiagnostico = facturas[0];
      }
    }

    const actualizada = await obtenerPorId(idOrden, connection);

    await connection.commit();
    return { orden: actualizada, facturaDiagnostico };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Genera un número de factura secuencial tipo FAC-000001, con el mismo
 * patrón de reintento por concurrencia que generarFolio(). Se comparte acá
 * porque registrarAprobacion() también puede generar una Factura
 * (tipo='diagnostico') dentro de su propia transacción.
 */
async function generarNumeroFactura(connection) {
  const [rows] = await connection.query(
    "SELECT COUNT(*) AS total FROM Factura",
  );
  let siguiente = rows[0].total + 1;
  let numero = `FAC-${String(siguiente).padStart(6, "0")}`;

  for (let intentos = 0; intentos < 5; intentos++) {
    const [existe] = await connection.query(
      "SELECT idFactura FROM Factura WHERE numeroFactura = ?",
      [numero],
    );
    if (existe.length === 0) return numero;
    siguiente += 1;
    numero = `FAC-${String(siguiente).padStart(6, "0")}`;
  }
  return numero;
}

/**
 * Autoasignación: el propio técnico autenticado se asigna una orden que
 * está en "pendiente_asignacion" (cola de espera sin cupo disponible).
 *
 * Reutiliza exactamente las mismas reglas que la asignación automática y
 * la manual:
 * - DEC-002: toda la lógica vive acá, en el Backend.
 * - DEC-003: cargaActual solo se modifica vía tecnicoDao, nunca desde el
 *   Frontend.
 * - DEC-006: se bloquea la orden y el perfil del técnico con FOR UPDATE,
 *   dentro de la misma transacción, para evitar que dos técnicos se
 *   autoasignen la misma orden o que un técnico se pase de cupo por una
 *   condición de carrera.
 * - DEC-007: al asignarse técnico, la orden pasa automáticamente a
 *   "en_diagnostico".
 * - DEC-005: el movimiento queda registrado en HistorialEstado.
 *
 * idUsuarioTecnico viene siempre del token (req.usuario.idUsuario), nunca
 * del body: un técnico solo puede autoasignarse a sí mismo.
 */
async function autoasignar(idOrden, idUsuarioTecnico) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      `SELECT idOrden, estado, idTecnico FROM OrdenServicio WHERE idOrden = ? FOR UPDATE`,
      [idOrden],
    );
    const ordenBloqueada = ordenRows[0];

    if (!ordenBloqueada) {
      throw new Error("La orden no existe.");
    }

    if (ordenBloqueada.estado !== "pendiente_asignacion") {
      throw new Error(
        `Solo se puede autoasignar una orden en "pendiente_asignacion" (estado actual: "${ordenBloqueada.estado}").`,
      );
    }

    if (ordenBloqueada.idTecnico) {
      throw new Error("La orden ya tiene un técnico asignado.");
    }

    const perfil = await tecnicoDao.obtenerPerfilPorUsuarioParaAutoasignar(
      idUsuarioTecnico,
      connection,
    );

    if (!perfil) {
      throw new Error(
        "No se encontró un perfil de técnico asociado a este usuario.",
      );
    }

    if (Number(perfil.estadoLaboral) !== 1) {
      throw new Error(
        "Tu perfil de técnico está inactivo, no puedes autoasignarte órdenes.",
      );
    }

    if (perfil.cargaActual >= perfil.capacidadMaxima) {
      throw new Error(
        `No tienes cupo disponible (${perfil.cargaActual}/${perfil.capacidadMaxima}).`,
      );
    }

    await connection.query(
      `UPDATE OrdenServicio SET idTecnico = ?, estado = 'en_diagnostico' WHERE idOrden = ?`,
      [idUsuarioTecnico, idOrden],
    );

    await tecnicoDao.incrementarCargaPorUsuario(idUsuarioTecnico, connection);

    await connection.query(
      `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES ('pendiente_asignacion', 'en_diagnostico', ?, 'Autoasignación del técnico', ?)
        `,
      [idUsuarioTecnico, idOrden],
    );

    const actualizada = await obtenerPorId(idOrden, connection);

    await connection.commit();
    return actualizada;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Autoasignación para REPARACIÓN: mismo mecanismo que autoasignar(), pero
 * para una orden en "pendiente_asignacion_reparacion" (aprobada por el
 * cliente, sin técnico libre en el momento). Actualiza también el registro
 * de Reparacion (idTecnico), que autoasignar() no toca porque no aplica a
 * la etapa de diagnóstico.
 */
async function autoasignarReparacion(idOrden, idUsuarioTecnico) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      `SELECT idOrden, estado, idTecnico FROM OrdenServicio WHERE idOrden = ? FOR UPDATE`,
      [idOrden],
    );
    const ordenBloqueada = ordenRows[0];

    if (!ordenBloqueada) {
      throw new Error("La orden no existe.");
    }

    if (ordenBloqueada.estado !== "pendiente_asignacion_reparacion") {
      throw new Error(
        `Solo se puede autoasignar para reparación una orden en "pendiente_asignacion_reparacion" (estado actual: "${ordenBloqueada.estado}").`,
      );
    }

    if (ordenBloqueada.idTecnico) {
      throw new Error("La orden ya tiene un técnico asignado.");
    }

    const perfil = await tecnicoDao.obtenerPerfilPorUsuarioParaAutoasignar(
      idUsuarioTecnico,
      connection,
    );

    if (!perfil) {
      throw new Error(
        "No se encontró un perfil de técnico asociado a este usuario.",
      );
    }

    if (Number(perfil.estadoLaboral) !== 1) {
      throw new Error(
        "Tu perfil de técnico está inactivo, no puedes autoasignarte órdenes.",
      );
    }

    if (perfil.cargaActual >= perfil.capacidadMaxima) {
      throw new Error(
        `No tienes cupo disponible (${perfil.cargaActual}/${perfil.capacidadMaxima}).`,
      );
    }

    await connection.query(
      `UPDATE OrdenServicio SET idTecnico = ?, estado = 'en_reparacion' WHERE idOrden = ?`,
      [idUsuarioTecnico, idOrden],
    );

    await tecnicoDao.incrementarCargaPorUsuario(idUsuarioTecnico, connection);

    const reparacionDao = require("./reparacionDao");
    await reparacionDao.asignarTecnico(idOrden, idUsuarioTecnico, connection);

    await connection.query(
      `
            INSERT INTO HistorialEstado
            (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
            VALUES ('pendiente_asignacion_reparacion', 'en_reparacion', ?, 'Autoasignación del técnico para reparación', ?)
        `,
      [idUsuarioTecnico, idOrden],
    );

    const actualizadaReparacion = await obtenerPorId(idOrden, connection);

    await connection.commit();
    return actualizadaReparacion;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Reasignación automática de las órdenes activas de un técnico que acaba de
 * ser desactivado (DEC-011).
 *
 * Se llama DESPUÉS de que tecnicoDao.desactivar() ya puso
 * Empleado.estadoLaboral = 0, para que tecnicoDao.obtenerDisponible()
 * excluya automáticamente al técnico saliente de los candidatos.
 *
 * Para cada orden activa del técnico saliente (idTecnico = idUsuarioSaliente
 * y estado NOT IN ('entregada','cancelada'); pendiente_asignacion queda
 * fuera por definición porque esas órdenes no tienen idTecnico), se busca un
 * técnico disponible con la misma regla que la asignación automática
 * (tecnicoDao.obtenerDisponible: menor cargaActual, con cupo). El estado de
 * la orden NO cambia (solo cambia el técnico); si estuviera "recibido",
 * "en_diagnostico", etc., sigue en el mismo estado con el nuevo técnico.
 *
 * Queda registrado en HistorialEstado (motivo) que la orden traía un
 * técnico anterior y que fue reasignada por su desactivación — es el lugar
 * donde hoy se documentan estos movimientos, ya que OrdenServicio no tiene
 * una columna de descripción/observaciones propia (ver schema.sql).
 *
 * Si no hay ningún técnico disponible para alguna orden, esta NO se toca
 * (se deja con el técnico saliente, ya inactivo) y también queda anotado en
 * HistorialEstado para que un Admin la reasigne a mano; forzarla a
 * "pendiente_asignacion" implicaría un retroceso de estado no contemplado
 * en TRANSICIONES para estados posteriores a "recibido".
 *
 * Devuelve { reasignadas: [{idOrden, idTecnicoNuevo}], sinTecnicoDisponible: [idOrden, ...] }.
 */
async function reasignarOrdenesPorDesactivacion(
  idUsuarioTecnicoSaliente,
  nombreTecnicoSaliente,
  idUsuarioAdmin,
) {
  if (!idUsuarioTecnicoSaliente) {
    // Técnico sin cuenta de Usuario: no puede tener órdenes asignadas
    // (OrdenServicio.idTecnico referencia Usuario.idUsuario).
    return { reasignadas: [], sinTecnicoDisponible: [] };
  }

  const connection = await pool.getConnection();
  const reasignadas = [];
  const sinTecnicoDisponible = [];

  try {
    await connection.beginTransaction();

    const [ordenes] = await connection.query(
      `
            SELECT idOrden, estado
            FROM OrdenServicio
            WHERE idTecnico = ?
              AND estado NOT IN ('entregada', 'cancelada')
            ORDER BY fechaCreacion ASC
            FOR UPDATE
        `,
      [idUsuarioTecnicoSaliente],
    );

    for (const orden of ordenes) {
      const idTecnicoNuevo = await tecnicoDao.obtenerDisponible(connection);

      if (!idTecnicoNuevo) {
        await connection.query(
          `
                    INSERT INTO HistorialEstado
                    (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
                    VALUES (?, ?, ?, ?, ?)
                `,
          [
            orden.estado,
            orden.estado,
            idUsuarioAdmin,
            `Técnico anterior "${nombreTecnicoSaliente}" desactivado. Sin técnico disponible para reasignar automáticamente; requiere asignación manual.`,
            orden.idOrden,
          ],
        );
        sinTecnicoDisponible.push(orden.idOrden);
        continue;
      }

      await connection.query(
        `UPDATE OrdenServicio SET idTecnico = ? WHERE idOrden = ?`,
        [idTecnicoNuevo, orden.idOrden],
      );

      // Solo se mueve cargaActual si el técnico saliente todavía estaba
      // "ocupado" con esta orden (ver ESTADOS_CON_TECNICO_OCUPADO): si la
      // orden está en pendiente_aprobacion/aprobada/rechazada/finalizada,
      // su carga ya se había liberado antes (enviarAAprobacion / finalizar)
      // y el idTecnico que quedaba ahí era solo de referencia histórica.
      if (ESTADOS_CON_TECNICO_OCUPADO.includes(orden.estado)) {
        await tecnicoDao.decrementarCargaPorUsuario(
          idUsuarioTecnicoSaliente,
          connection,
        );
        await tecnicoDao.incrementarCargaPorUsuario(idTecnicoNuevo, connection);
      }

      // Si la orden está en reparación, el registro de Reparacion también
      // debe apuntar al nuevo técnico.
      if (orden.estado === "en_reparacion") {
        const reparacionDao = require("./reparacionDao");
        await reparacionDao.asignarTecnico(
          orden.idOrden,
          idTecnicoNuevo,
          connection,
        );
      }

      await connection.query(
        `
                INSERT INTO HistorialEstado
                (estadoAnterior, estadoNuevo, usuarioId, motivo, idOrdenServicio)
                VALUES (?, ?, ?, ?, ?)
            `,
        [
          orden.estado,
          orden.estado,
          idUsuarioAdmin,
          `Reasignación automática: técnico anterior "${nombreTecnicoSaliente}" fue desactivado.`,
          orden.idOrden,
        ],
      );

      reasignadas.push({ idOrden: orden.idOrden, idTecnicoNuevo });
    }

    await connection.commit();
    return { reasignadas, sinTecnicoDisponible };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  ESTADOS,
  TRANSICIONES,
  listar,
  obtenerPorId,
  obtenerHistorialEstado,
  crear,
  actualizar,
  actualizarEstado,
  eliminarOCancelar,
  registrarAprobacion,
  generarNumeroFactura,
  asignarPrimeraOrdenPendiente,
  asignarPrimeraOrdenPendienteReparacion,
  intentarAsignarColasEspera,
  autoasignar,
  autoasignarReparacion,
  reasignarOrdenesPorDesactivacion,
};
