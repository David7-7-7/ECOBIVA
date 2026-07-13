const pool = require("../config/db");

/**
 * Lista todo el historial de cambios de cargo.
 */
async function listar() {
  const [rows] = await pool.query(`
        SELECT

            h.idHistorial,
            h.idEmpleado,
            e.nombre AS empleado,
            e.documento,

            h.cargoAnterior,
            h.cargoNuevo,
            h.fechaCambio,
            h.motivo,

            h.idUsuario,
            u.correo AS usuarioRegistro

        FROM HistorialCargo h

        INNER JOIN Empleado e
            ON e.idEmpleado = h.idEmpleado

        LEFT JOIN Usuario u
            ON u.idUsuario = h.idUsuario

        ORDER BY h.fechaCambio DESC
    `);

  return rows;
}

/**
 * Obtiene un registro por ID.
 */
async function obtenerPorId(idHistorial) {
  const [rows] = await pool.query(
    `
        SELECT

            h.*,

            e.nombre AS empleado,
            e.documento,

            u.correo AS usuarioRegistro

        FROM HistorialCargo h

        INNER JOIN Empleado e
            ON e.idEmpleado = h.idEmpleado

        LEFT JOIN Usuario u
            ON u.idUsuario = h.idUsuario

        WHERE h.idHistorial=?
        `,

    [idHistorial],
  );

  return rows[0] || null;
}

/**
 * Historial de un empleado.
 */
async function listarPorEmpleado(idEmpleado) {
  const [rows] = await pool.query(
    `
        SELECT *

        FROM HistorialCargo

        WHERE idEmpleado=?

        ORDER BY fechaCambio DESC
        `,

    [idEmpleado],
  );

  return rows;
}

/**
 * Registro manual (opcional).
 */
async function crear(datos) {
  const [result] = await pool.query(
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
      datos.idEmpleado,

      datos.cargoAnterior,

      datos.cargoNuevo,

      datos.motivo,

      datos.idUsuario,
    ],
  );

  return result.insertId;
}

module.exports = {
  listar,

  obtenerPorId,

  listarPorEmpleado,

  crear,
};
