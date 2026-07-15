const pool = require("../config/db");

async function crear({ observaciones, idVehiculo }) {
  const sql = `
        INSERT INTO EvidenciaIngreso
        (
            observaciones,
            idVehiculo
        )
        VALUES (?,?)
    `;

  const [resultado] = await pool.query(sql, [observaciones, idVehiculo]);

  return obtenerPorId(resultado.insertId);
}

async function obtenerPorId(idEvidencia) {
  const [rows] = await pool.query(
    `
        SELECT *
        FROM EvidenciaIngreso
        WHERE idEvidencia=?
        `,
    [idEvidencia],
  );

  return rows[0];
}

async function obtenerPorVehiculo(idVehiculo) {
  const [rows] = await pool.query(
    `
        SELECT *
        FROM EvidenciaIngreso
        WHERE idVehiculo=?
        ORDER BY fechaRegistro DESC
        `,
    [idVehiculo],
  );

  return rows;
}

async function actualizar(idEvidencia, observaciones) {
  await pool.query(
    `
        UPDATE EvidenciaIngreso
        SET observaciones=?
        WHERE idEvidencia=?
        `,
    [observaciones, idEvidencia],
  );

  return obtenerPorId(idEvidencia);
}

async function eliminar(idEvidencia) {
  const [resultado] = await pool.query(
    `
        DELETE FROM EvidenciaIngreso
        WHERE idEvidencia=?
        `,
    [idEvidencia],
  );

  return resultado.affectedRows;
}

async function agregarFoto(idEvidencia, url) {
  const [resultado] = await pool.query(
    `
        INSERT INTO EvidenciaFoto
        (
            idEvidencia,
            url
        )
        VALUES (?,?)
        `,
    [idEvidencia, url],
  );

  return resultado.insertId;
}

async function listarFotos(idEvidencia) {
  const [rows] = await pool.query(
    `
        SELECT *
        FROM EvidenciaFoto
        WHERE idEvidencia=?
        ORDER BY idFoto
        `,
    [idEvidencia],
  );

  return rows;
}

async function eliminarFoto(idFoto) {
  const [resultado] = await pool.query(
    `
        DELETE
        FROM EvidenciaFoto
        WHERE idFoto=?
        `,
    [idFoto],
  );

  return resultado.affectedRows;
}

module.exports = {
  crear,
  obtenerPorId,
  obtenerPorVehiculo,
  actualizar,
  eliminar,
  agregarFoto,
  listarFotos,
  eliminarFoto,
};
