const pool = require("../config/db");

/**
 * Un "Técnico" es un Empleado que tiene un registro en PerfilTecnico.
 * Esta tabla ya existía en el schema pero no tenía DAO/controller/rutas.
 */

async function listar() {
  const [rows] = await pool.query(`
        SELECT
            e.idEmpleado,
            e.nombre,
            e.documento,
            e.fechaIngreso,
            e.cargoActual,
            e.tarifaHora,
            e.estadoLaboral,
            e.fechaRetiro,

            pt.idPerfilTecnico,
            pt.especialidad,
            pt.cargaActual,
            pt.capacidadMaxima,

            u.idUsuario,
            u.correo

        FROM Empleado e
        INNER JOIN PerfilTecnico pt ON pt.idEmpleado = e.idEmpleado
        LEFT JOIN Usuario u ON u.idEmpleado = e.idEmpleado

        ORDER BY e.nombre ASC
    `);

  return rows;
}

async function obtenerPorId(idEmpleado, connection = pool) {
  const [rows] = await connection.query(
    `
        SELECT
            e.idEmpleado,
            e.nombre,
            e.documento,
            e.fechaIngreso,
            e.cargoActual,
            e.tarifaHora,
            e.estadoLaboral,
            e.fechaRetiro,

            pt.idPerfilTecnico,
            pt.especialidad,
            pt.cargaActual,
            pt.capacidadMaxima,

            u.idUsuario,
            u.correo

        FROM Empleado e
        INNER JOIN PerfilTecnico pt ON pt.idEmpleado = e.idEmpleado
        LEFT JOIN Usuario u ON u.idEmpleado = e.idEmpleado

        WHERE e.idEmpleado = ?
    `,
    [idEmpleado],
  );

  return rows[0] || null;
}

/**
 * Crea un técnico: Empleado + PerfilTecnico en una sola transacción.
 */
async function crear(datos) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [empleadoResult] = await connection.query(
      `
            INSERT INTO Empleado
            (nombre, documento, fechaIngreso, cargoActual, tarifaHora, estadoLaboral)
            VALUES (?, ?, ?, ?, ?, 1)
        `,
      [
        datos.nombre,
        datos.documento,
        datos.fechaIngreso,
        datos.cargoActual || "Tecnico",
        datos.tarifaHora || 0,
      ],
    );

    const idEmpleado = empleadoResult.insertId;

    await connection.query(
      `
            INSERT INTO PerfilTecnico (idEmpleado, especialidad, cargaActual)
            VALUES (?, ?, 0)
        `,
      [idEmpleado, datos.especialidad || null],
    );

    const tecnico = await obtenerPorId(idEmpleado, connection);

    await connection.commit();

    return tecnico;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Actualiza los datos de un técnico (Empleado + PerfilTecnico).
 *
 * `datos.capacidadMaxima` es opcional (compatibilidad con llamadas
 * anteriores que no la enviaban, y con la creación, que sigue usando el
 * default de la columna). Si viene, se valida que sea un entero >= 1 y que
 * no quede por debajo de la cargaActual del técnico, para no romper el
 * invariante que usa toda la asignación automática
 * (PerfilTecnico.cargaActual <= capacidadMaxima, ver obtenerDisponible()).
 */
async function actualizar(idEmpleado, datos) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const actual = await obtenerPorId(idEmpleado, connection);
    if (!actual) {
      throw new Error("El técnico no existe.");
    }

    let capacidadMaxima = actual.capacidadMaxima;

    if (
      datos.capacidadMaxima !== undefined &&
      datos.capacidadMaxima !== null &&
      datos.capacidadMaxima !== ""
    ) {
      const nuevaCapacidad = Number(datos.capacidadMaxima);

      if (!Number.isInteger(nuevaCapacidad) || nuevaCapacidad < 1) {
        throw new Error(
          "La capacidad máxima debe ser un número entero mayor o igual a 1.",
        );
      }

      if (nuevaCapacidad < actual.cargaActual) {
        throw new Error(
          `No se puede fijar la capacidad máxima en ${nuevaCapacidad}: el técnico ya tiene ${actual.cargaActual} orden(es) activa(s) asignada(s).`,
        );
      }

      capacidadMaxima = nuevaCapacidad;
    }

    await connection.query(
      `
            UPDATE Empleado
            SET nombre = ?, documento = ?, tarifaHora = ?
            WHERE idEmpleado = ?
        `,
      [datos.nombre, datos.documento, datos.tarifaHora, idEmpleado],
    );

    await connection.query(
      `
            UPDATE PerfilTecnico
            SET especialidad = ?, capacidadMaxima = ?
            WHERE idEmpleado = ?
        `,
      [datos.especialidad || null, capacidadMaxima, idEmpleado],
    );

    const actualizado = await obtenerPorId(idEmpleado, connection);

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
 * Baja/alta lógica reutilizando el estadoLaboral de Empleado.
 */
async function desactivar(idEmpleado) {
  const [result] = await pool.query(
    `UPDATE Empleado SET estadoLaboral = 0, fechaRetiro = CURDATE() WHERE idEmpleado = ?`,
    [idEmpleado],
  );

  return result;
}

async function reactivar(idEmpleado) {
  const [result] = await pool.query(
    `UPDATE Empleado SET estadoLaboral = 1, fechaRetiro = NULL WHERE idEmpleado = ?`,
    [idEmpleado],
  );

  return result;
}

/**
 * Asignación automática de técnico.
 *
 * Regla (decidida acá, no estaba definida antes): entre los técnicos
 * activos (Empleado.estadoLaboral = 1), se elige el que tenga MENOR
 * PerfilTecnico.cargaActual. Si ese mínimo ya es >= 3 (todos los técnicos
 * tienen 3 o más órdenes activas), no se asigna nadie automáticamente
 * (se deja idTecnico = NULL para que un Admin/Asesor lo asigne a mano).
 *
 * Devuelve el idUsuario del técnico elegido, o null si no hay ninguno
 * disponible. Recibe una connection opcional para poder llamarse dentro
 * de la misma transacción que crea la orden (evita condiciones de carrera
 * entre "leer candidato" y "usarlo").
 */
async function obtenerDisponible(connection = pool) {
  const [rows] = await connection.query(`
        SELECT
            u.idUsuario,
            pt.cargaActual,
            pt.capacidadMaxima
        FROM PerfilTecnico pt
        INNER JOIN Empleado e
            ON e.idEmpleado = pt.idEmpleado
        INNER JOIN Usuario u
            ON u.idEmpleado = pt.idEmpleado
        WHERE e.estadoLaboral = 1
          AND pt.cargaActual < pt.capacidadMaxima
        ORDER BY pt.cargaActual ASC
        LIMIT 1
        FOR UPDATE
    `);

  const candidato = rows[0];

  if (!candidato) {
    return null;
  }

  return candidato.idUsuario;
}

/**
 * Suma 1 a PerfilTecnico.cargaActual del técnico dueño de ese idUsuario.
 * Se llama al asignarle una orden (creación o reasignación).
 */
async function incrementarCargaPorUsuario(idUsuario, connection = pool) {
  if (!idUsuario) return;
  await connection.query(
    `
        UPDATE PerfilTecnico pt
        INNER JOIN Usuario u ON u.idEmpleado = pt.idEmpleado
        SET pt.cargaActual = pt.cargaActual + 1
        WHERE u.idUsuario = ?
    `,
    [idUsuario],
  );
}

/**
 * Resta 1 a PerfilTecnico.cargaActual del técnico dueño de ese idUsuario
 * (sin bajar de 0). Se llama al quitarle una orden (reasignación) o cuando
 * la orden llega a un estado final que ya no ocupa su tiempo
 * (entregada/cancelada).
 */
async function decrementarCargaPorUsuario(idUsuario, connection = pool) {
  if (!idUsuario) return;
  await connection.query(
    `
        UPDATE PerfilTecnico pt
        INNER JOIN Usuario u ON u.idEmpleado = pt.idEmpleado
        SET pt.cargaActual = GREATEST(pt.cargaActual - 1, 0)
        WHERE u.idUsuario = ?
    `,
    [idUsuario],
  );
}

/**
 * Busca el PerfilTecnico asociado a un idUsuario, bloqueando la fila
 * (FOR UPDATE) para poder validar cupo/estado y modificar cargaActual
 * dentro de la misma transacción sin condiciones de carrera (ver DEC-006).
 * Se usa en la autoasignación: el propio técnico autenticado se asigna
 * una orden en pendiente_asignacion.
 *
 * Devuelve null si el usuario no tiene un PerfilTecnico asociado (por
 * ejemplo, un Admin o Asesor sin perfil técnico).
 */
async function obtenerPerfilPorUsuarioParaAutoasignar(
  idUsuario,
  connection = pool,
) {
  const [rows] = await connection.query(
    `
        SELECT
            pt.idPerfilTecnico,
            pt.cargaActual,
            pt.capacidadMaxima,
            e.estadoLaboral
        FROM PerfilTecnico pt
        INNER JOIN Empleado e ON e.idEmpleado = pt.idEmpleado
        INNER JOIN Usuario u ON u.idEmpleado = pt.idEmpleado
        WHERE u.idUsuario = ?
        FOR UPDATE
    `,
    [idUsuario],
  );

  return rows[0] || null;
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  desactivar,
  reactivar,
  obtenerDisponible,
  incrementarCargaPorUsuario,
  decrementarCargaPorUsuario,
  obtenerPerfilPorUsuarioParaAutoasignar,
};
