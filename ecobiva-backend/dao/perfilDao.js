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

module.exports = { obtenerHashPassword, actualizarPassword };
