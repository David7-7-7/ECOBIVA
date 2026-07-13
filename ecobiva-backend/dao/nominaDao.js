const pool = require("../config/db");

/**
 * Función privada.
 * Calcula una nómina sin almacenarla.
 */
async function calcularNomina(
  idEmpleado,
  periodoInicio,
  periodoFin,
  connection = pool,
) {
  const [empleados] = await connection.query(
    `
        SELECT
            idEmpleado,
            nombre,
            documento,
            tarifaHora
        FROM Empleado
        WHERE idEmpleado = ?
    `,
    [idEmpleado],
  );

  if (!empleados.length) {
    throw new Error("El empleado no existe.");
  }

  const empleado = empleados[0];

  const [horas] = await connection.query(
    `
        SELECT
            IFNULL(SUM(horasTrabajadas),0) AS totalHoras
        FROM RegistroHoras
        WHERE idEmpleado = ?
        AND fecha BETWEEN ? AND ?
    `,
    [idEmpleado, periodoInicio, periodoFin],
  );

  const totalHoras = Number(horas[0].totalHoras);
  const tarifaHora = Number(empleado.tarifaHora);
  const totalPagar = totalHoras * tarifaHora;

  return {
    idEmpleado,

    empleado: empleado.nombre,

    documento: empleado.documento,

    periodoInicio,

    periodoFin,

    totalHoras,

    tarifaHoraAplicada: tarifaHora,

    totalPagar,
  };
}

async function listar() {
  const [rows] = await pool.query(`
        SELECT
            n.*,
            e.nombre,
            e.documento
        FROM Nomina n
        INNER JOIN Empleado e
            ON e.idEmpleado = n.idEmpleado
        ORDER BY n.fechaGeneracion DESC
    `);

  return rows;
}

async function obtenerPorId(idNomina, connection = pool) {
  const [rows] = await connection.query(
    `
        SELECT *
        FROM Nomina
        WHERE idNomina = ?
    `,
    [idNomina],
  );

  return rows[0] || null;
}

async function existeNomina(idEmpleado, periodoInicio, periodoFin) {
  const [rows] = await pool.query(
    `
        SELECT idNomina
        FROM Nomina
        WHERE idEmpleado=?
        AND periodoInicio=?
        AND periodoFin=?
    `,
    [idEmpleado, periodoInicio, periodoFin],
  );

  return rows.length > 0;
}

async function preview(datos) {
  return calcularNomina(
    datos.idEmpleado,
    datos.periodoInicio,
    datos.periodoFin,
  );
}

async function generar(datos) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const nomina = await calcularNomina(
      datos.idEmpleado,

      datos.periodoInicio,

      datos.periodoFin,

      connection,
    );

    const [result] = await connection.query(
      `
            INSERT INTO Nomina
            (
                idEmpleado,
                periodoInicio,
                periodoFin,
                totalHoras,
                tarifaHoraAplicada,
                totalPagar
            )
            VALUES (?,?,?,?,?,?)
        `,
      [
        nomina.idEmpleado,

        nomina.periodoInicio,

        nomina.periodoFin,

        nomina.totalHoras,

        nomina.tarifaHoraAplicada,

        nomina.totalPagar,
      ],
    );

    await connection.commit();

    return {
      idNomina: result.insertId,

      ...nomina,
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

async function recalcular(idNomina) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const nominaActual = await obtenerPorId(idNomina, connection);

    if (!nominaActual) {
      throw new Error("La nómina no existe.");
    }

    const antes = {
      totalHoras: Number(nominaActual.totalHoras),

      tarifaHoraAplicada: Number(nominaActual.tarifaHoraAplicada),

      totalPagar: Number(nominaActual.totalPagar),
    };

    const despues = await calcularNomina(
      nominaActual.idEmpleado,

      nominaActual.periodoInicio,

      nominaActual.periodoFin,

      connection,
    );

    if (
      antes.totalHoras === despues.totalHoras &&
      antes.tarifaHoraAplicada === despues.tarifaHoraAplicada &&
      antes.totalPagar === despues.totalPagar
    ) {
      await connection.rollback();

      return {
        sinCambios: true,

        empleado: despues.empleado,

        documento: despues.documento,

        antes,

        despues,
      };
    }

    await connection.query(
      `
            UPDATE Nomina
            SET
                totalHoras=?,
                tarifaHoraAplicada=?,
                totalPagar=?
            WHERE idNomina=?
        `,
      [
        despues.totalHoras,

        despues.tarifaHoraAplicada,

        despues.totalPagar,

        idNomina,
      ],
    );

    await connection.commit();

    return {
      empleado: despues.empleado,

      documento: despues.documento,

      antes,

      despues,
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

async function actualizar(idNomina, datos) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const nominaActual = await obtenerPorId(idNomina, connection);

    if (!nominaActual) {
      throw new Error("La nómina no existe.");
    }

    const [empleados] = await connection.query(
      `
        SELECT nombre, documento
        FROM Empleado
        WHERE idEmpleado = ?
    `,
      [nominaActual.idEmpleado],
    );

    const empleado = empleados[0] || {};

    const antes = {
      totalHoras: Number(nominaActual.totalHoras),

      tarifaHoraAplicada: Number(nominaActual.tarifaHoraAplicada),

      totalPagar: Number(nominaActual.totalPagar),
    };

    const totalHoras =
      datos.totalHoras !== undefined
        ? Number(datos.totalHoras)
        : antes.totalHoras;

    const tarifaHoraAplicada =
      datos.tarifaHoraAplicada !== undefined
        ? Number(datos.tarifaHoraAplicada)
        : antes.tarifaHoraAplicada;

    const totalPagar = totalHoras * tarifaHoraAplicada;

    await connection.query(
      `
            UPDATE Nomina
            SET
                totalHoras=?,
                tarifaHoraAplicada=?,
                totalPagar=?
            WHERE idNomina=?
        `,
      [totalHoras, tarifaHoraAplicada, totalPagar, idNomina],
    );

    await connection.commit();

    return {
      empleado: empleado.nombre,

      documento: empleado.documento,

      antes,

      despues: {
        totalHoras,

        tarifaHoraAplicada,

        totalPagar,
      },
    };
  } catch (error) {
    await connection.rollback();

    throw error;
  } finally {
    connection.release();
  }
}

async function eliminar(idNomina) {
  const [result] = await pool.query(
    `
        DELETE FROM Nomina
        WHERE idNomina=?
    `,
    [idNomina],
  );

  return result;
}

module.exports = {
  listar,

  obtenerPorId,

  existeNomina,

  preview,

  generar,

  recalcular,

  actualizar,

  eliminar,
};
