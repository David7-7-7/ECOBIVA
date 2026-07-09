const pool = require('../config/db');

/**
 * Inserta un registro de auditoría. Se usa desde utils/auditoria.js,
 * nunca debería lanzar un error que rompa el flujo principal (ver ese helper).
 */
async function registrar({ idUsuario, accion, modulo, detalle, ipOrigen }) {
    await pool.query(`
        INSERT INTO LogAuditoria (idUsuario, accion, modulo, detalle, ipOrigen)
        VALUES (?, ?, ?, ?, ?)
    `, [idUsuario || null, accion, modulo, detalle || null, ipOrigen || null]);
}

/**
 * Consulta el log con filtros opcionales: usuario, modulo, rango de fechas.
 * Todos los filtros son opcionales y se combinan con AND.
 */
async function consultar({ idUsuario, modulo, desde, hasta, pagina = 1, tamanoPagina = 50 }) {
    const condiciones = [];
    const valores = [];

    if (idUsuario) {
        condiciones.push('l.idUsuario = ?');
        valores.push(idUsuario);
    }
    if (modulo) {
        condiciones.push('l.modulo = ?');
        valores.push(modulo);
    }
    if (desde) {
        condiciones.push('l.fechaHora >= ?');
        valores.push(desde);
    }
    if (hasta) {
        condiciones.push('l.fechaHora <= ?');
        valores.push(hasta);
    }

    const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
    const offset = (pagina - 1) * tamanoPagina;

    const [rows] = await pool.query(`
        SELECT l.idLog, l.idUsuario, u.correo AS correoUsuario,
               l.accion, l.modulo, l.detalle, l.ipOrigen, l.fechaHora
        FROM LogAuditoria l
        LEFT JOIN Usuario u ON u.idUsuario = l.idUsuario
        ${where}
        ORDER BY l.fechaHora DESC
        LIMIT ? OFFSET ?
    `, [...valores, tamanoPagina, offset]);

    const [[{ total }]] = await pool.query(`
        SELECT COUNT(*) AS total FROM LogAuditoria l ${where}
    `, valores);

    return { rows, total, pagina, tamanoPagina };
}

module.exports = { registrar, consultar };
