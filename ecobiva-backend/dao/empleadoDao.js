const pool = require("../config/db");

/**
 * Lista todos los empleados.
 * Incluye información del usuario si existe.
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

            u.idUsuario,
            u.correo

        FROM Empleado e

        LEFT JOIN Usuario u
            ON u.idEmpleado = e.idEmpleado

        ORDER BY e.nombre ASC
    `);

  return rows;
}

/**
 * Obtiene un empleado por ID.
 */
async function obtenerPorId(idEmpleado, connection = pool) {
  const [rows] = await connection.query(
    `
        SELECT *
        FROM Empleado
        WHERE idEmpleado=?
    `,
    [idEmpleado],
  );

  return rows[0] || null;
}

/**
 * Crea un empleado.
 */
async function crear(datos) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [result] = await connection.query(
      `

            INSERT INTO Empleado
            (

                nombre,

                documento,

                fechaIngreso,

                cargoActual,

                tarifaHora,

                estadoLaboral

            )

            VALUES (?,?,?,?,?,1)

        `,
      [
        datos.nombre,

        datos.documento,

        datos.fechaIngreso,

        datos.cargoActual,

        datos.tarifaHora,
      ],
    );

    const empleado = await obtenerPorId(
      result.insertId,

      connection,
    );

    await connection.commit();

    return empleado;
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}
/**
 * Actualiza un empleado.
 * Si cambia el cargo, registra automáticamente el historial.
 */
async function actualizar(idEmpleado, datos, idUsuario) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const empleadoActual = await obtenerPorId(
      idEmpleado,

      connection,
    );

    if (!empleadoActual) {
      throw new Error("El empleado no existe.");
    }

    // Registrar historial únicamente si cambia el cargo
    if (empleadoActual.cargoActual !== datos.cargoActual) {
      await connection.query(
        `
                INSERT INTO HistorialCargo
                (
                    idEmpleado,
                    cargoAnterior,
                    cargoNuevo,
                    motivo,
                    idUsuario
                )
                VALUES (?,?,?,?,?)
                `,

        [
          idEmpleado,

          empleadoActual.cargoActual,

          datos.cargoActual,

          datos.motivo || "Cambio de cargo",

          idUsuario,
        ],
      );
    }

    await connection.query(
      `
            UPDATE Empleado
            SET

                nombre=?,

                documento=?,

                cargoActual=?,

                tarifaHora=?

            WHERE idEmpleado=?
            `,

      [
        datos.nombre,

        datos.documento,

        datos.cargoActual,

        datos.tarifaHora,

        idEmpleado,
      ],
    );

    const empleadoActualizado = await obtenerPorId(
      idEmpleado,

      connection,
    );

    await connection.commit();

    return {
      antes: empleadoActual,

      despues: empleadoActualizado,

      cambioCargo: empleadoActual.cargoActual !== datos.cargoActual,

      cambioTarifa:
        Number(empleadoActual.tarifaHora) !== Number(datos.tarifaHora),
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}
/**
 * Desactiva un empleado (baja lógica).
 */
async function desactivar(idEmpleado) {
  const [result] = await pool.query(
    `
        UPDATE Empleado
        SET

            estadoLaboral = 0,

            fechaRetiro = CURDATE()

        WHERE idEmpleado = ?
        `,

    [idEmpleado],
  );

  return result;
}

/**
 * Reactiva un empleado.
 */
async function reactivar(idEmpleado) {
  const [result] = await pool.query(
    `
        UPDATE Empleado
        SET

            estadoLaboral = 1,

            fechaRetiro = NULL

        WHERE idEmpleado = ?
        `,

    [idEmpleado],
  );

  return result;
}
async function obtenerUsuario(idEmpleado, connection = pool) {
  const [rows] = await connection.query(
    `
        SELECT idUsuario, correo, estado
        FROM Usuario
        WHERE idEmpleado = ?
        `,
    [idEmpleado],
  );

  return rows[0] || null;
}
async function crearUsuarioEmpleado(
  idEmpleado,
  correo,
  passwordHash,
  idRol,
  asignadoPor,
) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const empleado = await obtenerPorId(idEmpleado, connection);

    if (!empleado) {
      throw new Error("El empleado no existe.");
    }

    const usuarioExistente = await obtenerUsuario(idEmpleado, connection);

    if (usuarioExistente) {
      throw new Error("El empleado ya tiene un usuario asociado.");
    }

    const [usuario] = await connection.query(
      `
            INSERT INTO Usuario
            (
                correo,
                passwordHash,
                idEmpleado
            )
            VALUES (?,?,?)
            `,
      [correo, passwordHash, idEmpleado],
    );

    await connection.query(
      `
            INSERT INTO UsuarioRol
            (
                idUsuario,
                idRol,
                asignadoPor
            )
            VALUES (?,?,?)
            `,
      [usuario.insertId, idRol, asignadoPor],
    );

    await connection.commit();

    return usuario.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  listar,

  obtenerPorId,

  crear,

  actualizar,

  desactivar,

  reactivar,
  obtenerUsuario,

  crearUsuarioEmpleado,
};
