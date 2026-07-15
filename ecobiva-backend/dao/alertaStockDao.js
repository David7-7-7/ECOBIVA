const pool = require("../config/db");

/**
 * Listar todas las alertas de stock
 */
async function listar() {
  const [rows] = await pool.query(`
    SELECT 
      a.idAlerta,
      a.fechaGeneracion,
      a.estadoGestion,
      a.idRepuesto,
      r.nombre AS repuestoNombre,
      r.stockActual,
      r.stockMinimo,
      r.precioUnitario
    FROM AlertaStock a
    JOIN Repuesto r ON r.idRepuesto = a.idRepuesto
    ORDER BY a.fechaGeneracion DESC
  `);
  return rows;
}

/**
 * Listar alertas por estado
 */
async function listarPorEstado(estado) {
  const [rows] = await pool.query(`
    SELECT 
      a.idAlerta,
      a.fechaGeneracion,
      a.estadoGestion,
      a.idRepuesto,
      r.nombre AS repuestoNombre,
      r.stockActual,
      r.stockMinimo,
      r.precioUnitario
    FROM AlertaStock a
    JOIN Repuesto r ON r.idRepuesto = a.idRepuesto
    WHERE a.estadoGestion = ?
    ORDER BY a.fechaGeneracion DESC
  `, [estado]);
  return rows;
}

/**
 * Obtener una alerta por ID
 */
async function obtenerPorId(idAlerta) {
  const [rows] = await pool.query(`
    SELECT 
      a.idAlerta,
      a.fechaGeneracion,
      a.estadoGestion,
      a.idRepuesto,
      r.nombre AS repuestoNombre,
      r.stockActual,
      r.stockMinimo,
      r.precioUnitario
    FROM AlertaStock a
    JOIN Repuesto r ON r.idRepuesto = a.idRepuesto
    WHERE a.idAlerta = ?
  `, [idAlerta]);
  return rows[0] || null;
}

/**
 * Crear una alerta de stock (normalmente llamado automáticamente cuando
 * stockActual <= stockMinimo en alguna operación)
 */
async function crear(idRepuesto) {
  const [result] = await pool.query(`
    INSERT INTO AlertaStock (idRepuesto, estadoGestion)
    VALUES (?, 'pendiente')
  `, [idRepuesto]);
  
  return obtenerPorId(result.insertId);
}

/**
 * Actualizar estado de una alerta (por ej: 'pendiente' → 'atendida')
 */
async function actualizarEstado(idAlerta, nuevoEstado) {
  const [result] = await pool.query(`
    UPDATE AlertaStock
    SET estadoGestion = ?
    WHERE idAlerta = ?
  `, [nuevoEstado, idAlerta]);
  
  if (result.affectedRows === 0) {
    throw new Error("Alerta no encontrada");
  }
  
  return obtenerPorId(idAlerta);
}

/**
 * Eliminar una alerta
 */
async function eliminar(idAlerta) {
  const [result] = await pool.query(`
    DELETE FROM AlertaStock
    WHERE idAlerta = ?
  `, [idAlerta]);
  
  return result.affectedRows;
}

/**
 * Verificar si existe una alerta pendiente para un repuesto
 */
async function existeAlertaPendiente(idRepuesto) {
  const [rows] = await pool.query(`
    SELECT idAlerta FROM AlertaStock
    WHERE idRepuesto = ? AND estadoGestion = 'pendiente'
    LIMIT 1
  `, [idRepuesto]);
  
  return rows.length > 0;
}

async function generarSiStockBajo(idRepuesto) {
  const [repuestos] = await pool.query(
    "SELECT stockActual, stockMinimo FROM Repuesto WHERE idRepuesto = ?",
    [idRepuesto],
  );
  const repuesto = repuestos[0];
  if (!repuesto || Number(repuesto.stockActual) > Number(repuesto.stockMinimo)) return null;
  if (await existeAlertaPendiente(idRepuesto)) return null;
  return crear(idRepuesto);
}

module.exports = {
  listar,
  listarPorEstado,
  obtenerPorId,
  crear,
  actualizarEstado,
  eliminar,
  existeAlertaPendiente
  ,generarSiStockBajo
};
