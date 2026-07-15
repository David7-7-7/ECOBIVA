const pool = require("../config/db");
const tecnicoDao = require("./tecnicoDao");

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
 * Busca un empleado por documento (para validar duplicados antes de crear).
 */
async function obtenerPorDocumento(documento, connection = pool) {
  const [rows] = await connection.query(
    `SELECT * FROM Empleado WHERE documento = ?`,
    [documento],
  );

  return rows[0] || null;
}

/**
 * Actualiza cargoActual/tarifaHora de un empleado sin tocar el resto de campos
 * (usado al sincronizar el cargo cuando cambia el rol de su usuario).
 */
async function actualizarInformacionLaboral(idEmpleado, { cargoActual, tarifaHora }) {
  const [result] = await pool.query(
    `UPDATE Empleado SET cargoActual = ?, tarifaHora = ? WHERE idEmpleado = ?`,
    [cargoActual, tarifaHora, idEmpleado],
  );

  return result;
}

/**
 * Crea un empleado. Si se pasa una conexión externa (connExternal), la usa
 * para participar en una transacción ya abierta por el llamador, en vez de
 * abrir/commitear la suya propia (evita romper la atomicidad, p.ej. al crear
 * Empleado + Usuario + preguntas de seguridad en un solo POST /api/usuarios).
 */
async function crear(datos, connExternal = null) {
  const connection = connExternal || (await pool.getConnection());

  try {
    if (!connExternal) await connection.beginTransaction();

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

    if (!connExternal) {
      const empleado = await obtenerPorId(result.insertId, connection);
      await connection.commit();
      return empleado;
    }

    return result.insertId;
  } catch (error) {
    if (!connExternal) await connection.rollback();
    throw error;
  } finally {
    if (!connExternal) connection.release();
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
  datosTecnico = {},
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

    // Mismo criterio que usuarioController.crear(): si el rol otorgado es
    // Técnico, el PerfilTecnico se crea en la misma transacción para que
    // el empleado quede completo (Empleado + Usuario + PerfilTecnico) y no
    // vuelva a quedar invisible para la asignación automática de órdenes.
    const [rolRows] = await connection.query(
      `SELECT nombreRol FROM Rol WHERE idRol = ?`,
      [idRol],
    );
    const nombreRol = rolRows[0]?.nombreRol || "";

    if (nombreRol.toLowerCase() === "tecnico") {
      await tecnicoDao.crearPerfilTecnico(idEmpleado, datosTecnico, connection);
    }

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

  obtenerPorDocumento,

  crear,

  actualizar,

  actualizarInformacionLaboral,

  desactivar,

  reactivar,
  obtenerUsuario,

  crearUsuarioEmpleado,
};
