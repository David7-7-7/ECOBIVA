const pool = require('../config/db');


/**
 * Busca un usuario por correo, junto con sus roles ACTIVOS
 * (aquellos en UsuarioRol donde fechaFin sigue en NULL).
 */
async function obtenerPorCorreo(correo) {
  const [rows] = await pool.execute(
    `SELECT
        u.idUsuario,
        u.correo,
        u.passwordHash,
        u.estado,
        u.idEmpleado
     FROM Usuario u
     WHERE u.correo = ?`,
    [correo]
  );

  if (rows.length === 0) return null;

  const usuario = rows[0];
  usuario.roles = await obtenerRolesActivos(usuario.idUsuario);

  return usuario;
}

async function obtenerPorId(idUsuario) {
  const [rows] = await pool.execute(
    `SELECT idUsuario, correo, estado, ultimoAcceso, idEmpleado
     FROM Usuario WHERE idUsuario = ?`,
    [idUsuario]
  );
  if (rows.length === 0) return null;

  const usuario = rows[0];
  usuario.roles = await obtenerRolesActivos(idUsuario);
  return usuario;
}

async function obtenerRolesActivos(idUsuario) {
  const [roles] = await pool.execute(
    `SELECT r.idRol, r.nombreRol
     FROM UsuarioRol ur
     JOIN Rol r ON r.idRol = ur.idRol
     WHERE ur.idUsuario = ? AND ur.fechaFin IS NULL`,
    [idUsuario]
  );
  return roles;
}

/**
 * Lista todos los usuarios con su empleado y roles activos.
 */
async function listarTodos() {
  const [usuarios] = await pool.execute(
    `SELECT u.idUsuario, u.correo, u.estado, u.ultimoAcceso, e.nombre AS nombreEmpleado
     FROM Usuario u
     JOIN Empleado e ON e.idEmpleado = u.idEmpleado
     ORDER BY u.idUsuario DESC`
  );

  for (const u of usuarios) {
    u.roles = (await obtenerRolesActivos(u.idUsuario)).map((r) => r.nombreRol);
  }

  return usuarios;
}

async function crear({ correo, passwordHash, idEmpleado }, conn = pool) {
  const [result] = await conn.execute(
    `INSERT INTO Usuario (correo, passwordHash, estado, idEmpleado)
     VALUES (?, ?, TRUE, ?)`,
    [correo, passwordHash, idEmpleado]
  );
  return result.insertId;
}

async function actualizarCorreo(idUsuario, correo) {
  await pool.execute('UPDATE Usuario SET correo = ? WHERE idUsuario = ?', [correo, idUsuario]);
}

async function actualizarEstado(idUsuario, estado) {
  await pool.execute('UPDATE Usuario SET estado = ? WHERE idUsuario = ?', [estado, idUsuario]);
}

async function actualizarPasswordHash(idUsuario, passwordHash) {
  await pool.execute(
    'UPDATE Usuario SET passwordHash = ? WHERE idUsuario = ?',
    [passwordHash, idUsuario]
  );
}

async function actualizarUltimoAcceso(idUsuario) {
  await pool.execute(
    'UPDATE Usuario SET ultimoAcceso = NOW() WHERE idUsuario = ?',
    [idUsuario]
  );
}

/**
 * Cierra el rol activo actual (fechaFin = NOW) y asigna uno nuevo.
 * Así se mantiene historial completo de cambios de rol.
 */
async function cambiarRol(idUsuario, idRolNuevo, asignadoPor) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      `UPDATE UsuarioRol SET fechaFin = NOW()
       WHERE idUsuario = ? AND fechaFin IS NULL`,
      [idUsuario]
    );

    await conn.execute(
      `INSERT INTO UsuarioRol (idUsuario, idRol, fechaAsignacion, asignadoPor)
       VALUES (?, ?, NOW(), ?)`,
      [idUsuario, idRolNuevo, asignadoPor]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function asignarRolInicial(idUsuario, idRol, asignadoPor, conn = pool) {
  await conn.execute(
    `INSERT INTO UsuarioRol (idUsuario, idRol, fechaAsignacion, asignadoPor)
     VALUES (?, ?, NOW(), ?)`,
    [idUsuario, idRol, asignadoPor]
  );
}

async function obtenerPermisosPorUsuario(idUsuario) {
  const query = `
    SELECT p.modulo, p.accion 
    FROM UsuarioRol ur
    INNER JOIN RolPermiso rp ON ur.idRol = rp.idRol
    INNER JOIN Permiso p ON rp.idPermiso = p.idPermiso
    WHERE ur.idUsuario = ? AND rp.permitido = 1
  `;
  
  const [rows] = await pool.query(query, [idUsuario]);
  return rows; // Retorna un arreglo como: [{ modulo: 'VEHICULOS', accion: 'LEER' }, ...]
}

module.exports = {
  obtenerPorCorreo,
  obtenerPorId,
  obtenerRolesActivos,
  listarTodos,
  crear,
  actualizarCorreo,
  actualizarEstado,
  actualizarPasswordHash,
  actualizarUltimoAcceso,
  cambiarRol,
  asignarRolInicial, 
  obtenerPermisosPorUsuario
};