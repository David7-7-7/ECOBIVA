const pool = require("../config/db");

/**
 * Listar todos los términos de garantía
 */
async function listar() {
  const [rows] = await pool.query(`
    SELECT 
      idTermino,
      categoria,
      textoLegal,
      plazoGarantiaDias,
      version,
      vigente
    FROM TerminoGarantia
    ORDER BY categoria, vigente DESC
  `);
  return rows;
}

/**
 * Listar solo términos vigentes
 */
async function listarVigentes() {
  const [rows] = await pool.query(`
    SELECT 
      idTermino,
      categoria,
      textoLegal,
      plazoGarantiaDias,
      version,
      vigente
    FROM TerminoGarantia
    WHERE vigente = 1
    ORDER BY categoria
  `);
  return rows;
}

/**
 * Obtener un término de garantía por ID
 */
async function obtenerPorId(idTermino) {
  const [rows] = await pool.query(`
    SELECT 
      idTermino,
      categoria,
      textoLegal,
      plazoGarantiaDias,
      version,
      vigente
    FROM TerminoGarantia
    WHERE idTermino = ?
  `, [idTermino]);
  return rows[0] || null;
}

/**
 * Obtener término de garantía por categoría (el vigente más reciente)
 */
async function obtenerPorCategoria(categoria) {
  const [rows] = await pool.query(`
    SELECT 
      idTermino,
      categoria,
      textoLegal,
      plazoGarantiaDias,
      version,
      vigente
    FROM TerminoGarantia
    WHERE categoria = ? AND vigente = 1
    ORDER BY version DESC
    LIMIT 1
  `, [categoria]);
  return rows[0] || null;
}

/**
 * Crear un nuevo término de garantía
 */
async function crear(datos) {
  const { categoria, textoLegal, plazoGarantiaDias, version } = datos;

  if (!categoria) {
    throw new Error("La categoría es obligatoria");
  }

  const [result] = await pool.query(`
    INSERT INTO TerminoGarantia (categoria, textoLegal, plazoGarantiaDias, version, vigente)
    VALUES (?, ?, ?, ?, 1)
  `, [categoria, textoLegal || null, plazoGarantiaDias || 0, version || null]);

  return obtenerPorId(result.insertId);
}

/**
 * Actualizar un término de garantía
 */
async function actualizar(idTermino, datos) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const updates = [];
    const values = [];

    if (datos.categoria !== undefined) {
      updates.push("categoria = ?");
      values.push(datos.categoria);
    }

    if (datos.textoLegal !== undefined) {
      updates.push("textoLegal = ?");
      values.push(datos.textoLegal);
    }

    if (datos.plazoGarantiaDias !== undefined) {
      updates.push("plazoGarantiaDias = ?");
      values.push(datos.plazoGarantiaDias);
    }

    if (datos.version !== undefined) {
      updates.push("version = ?");
      values.push(datos.version);
    }

    if (datos.vigente !== undefined) {
      updates.push("vigente = ?");
      values.push(datos.vigente ? 1 : 0);
    }

    if (updates.length === 0) {
      throw new Error("No hay datos para actualizar");
    }

    values.push(idTermino);

    const [result] = await connection.query(
      `UPDATE TerminoGarantia SET ${updates.join(", ")} WHERE idTermino = ?`,
      values
    );

    if (result.affectedRows === 0) {
      throw new Error("Término de garantía no encontrado");
    }

    await connection.commit();
    return obtenerPorId(idTermino);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Cambiar estado vigencia (1 = vigente, 0 = obsoleto)
 */
async function cambiarVigencia(idTermino, vigente) {
  const [result] = await pool.query(`
    UPDATE TerminoGarantia
    SET vigente = ?
    WHERE idTermino = ?
  `, [vigente ? 1 : 0, idTermino]);

  if (result.affectedRows === 0) {
    throw new Error("Término de garantía no encontrado");
  }

  return obtenerPorId(idTermino);
}

/**
 * Eliminar un término de garantía
 */
async function eliminar(idTermino) {
  const [result] = await pool.query(`
    DELETE FROM TerminoGarantia
    WHERE idTermino = ?
  `, [idTermino]);

  return result.affectedRows;
}

module.exports = {
  listar,
  listarVigentes,
  obtenerPorId,
  obtenerPorCategoria,
  crear,
  actualizar,
  cambiarVigencia,
  eliminar
};
