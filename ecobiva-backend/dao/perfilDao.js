const pool = require('../config/db');

// La columna real en tu tabla Usuario es `passwordHash`, no `password`.
async function obtenerHashPassword(idUsuario) {
    const [rows] = await pool.query(
        'SELECT passwordHash FROM Usuario WHERE idUsuario = ?',
        [idUsuario]
    );
    return rows[0] || null;
}

async function actualizarPassword(idUsuario, nuevoHash) {
    await pool.query(
        'UPDATE Usuario SET passwordHash = ? WHERE idUsuario = ?',
        [nuevoHash, idUsuario]
    );
}

// Datos propios para la tarjeta "Información del Usuario" en Configuración.
// Se apoya en idUsuario (viene del token, nunca de un :id de la URL) para
// que cada quien solo pueda ver/editar su propio registro.
async function obtenerMiPerfil(idUsuario) {
    const [rows] = await pool.query(
        `SELECT u.idUsuario, u.correo, e.idEmpleado, e.nombre, e.telefono, e.cargoActual
         FROM Usuario u
         JOIN Empleado e ON e.idEmpleado = u.idEmpleado
         WHERE u.idUsuario = ?`,
        [idUsuario]
    );
    return rows[0] || null;
}

async function actualizarTelefono(idEmpleado, telefono) {
    await pool.query(
        'UPDATE Empleado SET telefono = ? WHERE idEmpleado = ?',
        [telefono, idEmpleado]
    );
}

module.exports = {
    obtenerHashPassword,
    actualizarPassword,
    obtenerMiPerfil,
    actualizarTelefono
};
