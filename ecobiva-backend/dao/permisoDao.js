const pool = require('../config/db');

/**
 * Devuelve la matriz completa: cada permiso del catálogo, y por cada rol
 * si está permitido o no (LEFT JOIN para incluir permisos aún no asignados).
 */
async function obtenerMatrizCompleta() {
    const [rows] = await pool.query(`
        SELECT
            p.idPermiso,
            p.modulo,
            p.accion,
            p.descripcion,
            r.idRol,
            r.nombreRol AS nombreRol,
            COALESCE(rp.permitido, FALSE) AS permitido
        FROM Permiso p
        CROSS JOIN Rol r
        LEFT JOIN RolPermiso rp
            ON rp.idPermiso = p.idPermiso AND rp.idRol = r.idRol
        ORDER BY p.modulo, p.accion, r.idRol
    `);
    return rows;
}

/**
 * Devuelve los permisos activos de UN conjunto de roles (un usuario puede
 * tener varios roles activos a la vez por la relación UsuarioRol N:M).
 * idsRoles: array de idRol, ej. [2, 3]
 */
async function obtenerPermisosPorRoles(idsRoles) {
    if (!Array.isArray(idsRoles) || idsRoles.length === 0) return [];

    const [rows] = await pool.query(`
        SELECT DISTINCT p.modulo, p.accion
        FROM RolPermiso rp
        JOIN Permiso p ON p.idPermiso = rp.idPermiso
        WHERE rp.idRol IN (?) AND rp.permitido = TRUE
    `, [idsRoles]);
    return rows;
}

/**
 * Verifica si AL MENOS UNO de los roles activos del usuario tiene el
 * permiso puntual (modulo + accion). Usado por verificarPermiso.
 * idsRoles: array de idRol, ej. [2, 3]
 */
async function tienePermisoEnRoles(idsRoles, modulo, accion) {
    if (!Array.isArray(idsRoles) || idsRoles.length === 0) return false;

    const [rows] = await pool.query(`
        SELECT 1
        FROM RolPermiso rp
        JOIN Permiso p ON p.idPermiso = rp.idPermiso
        WHERE rp.idRol IN (?) AND p.modulo = ? AND p.accion = ? AND rp.permitido = TRUE
        LIMIT 1
    `, [idsRoles, modulo, accion]);

    return rows.length > 0;
}

/**
 * Actualiza (o inserta) el valor de permitido para un par rol/permiso.
 * Usado por PUT /api/permisos.
 */
async function actualizarPermiso(idRol, idPermiso, permitido) {
    await pool.query(`
        INSERT INTO RolPermiso (idRol, idPermiso, permitido)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE permitido = VALUES(permitido)
    `, [idRol, idPermiso, permitido]);
}

/**
 * Actualiza varios pares rol/permiso de una sola vez (guardado masivo
 * de la matriz desde el frontend).
 */
async function actualizarPermisosMasivo(cambios) {
    // cambios: [{ idRol, idPermiso, permitido }, ...]
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        for (const c of cambios) {
            await conn.query(`
                INSERT INTO RolPermiso (idRol, idPermiso, permitido)
                VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE permitido = VALUES(permitido)
            `, [c.idRol, c.idPermiso, c.permitido]);
        }
        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
}

async function listarCatalogoPermisos() {
    const [rows] = await pool.query('SELECT * FROM Permiso ORDER BY modulo, accion');
    return rows;
}

module.exports = {
    obtenerMatrizCompleta,
    obtenerPermisosPorRoles,
    tienePermisoEnRoles,
    actualizarPermiso,
    actualizarPermisosMasivo,
    listarCatalogoPermisos
};
