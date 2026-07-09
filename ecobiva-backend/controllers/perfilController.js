const bcrypt = require('bcrypt');
const perfilDao = require('../dao/perfilDao');
const { registrarAccion } = require('../utils/auditoria');
// Si ya tienes utils/validarPassword.js, importa esa función en vez de esta:
const { esPasswordFuerte } = require('../utils/validarPasswordFuerte');

const SALT_ROUNDS = 10;

// PUT /api/perfil/password
// body: { passwordActual, passwordNueva }
// Requiere verificarToken (usa el id del propio usuario autenticado, NO un :id
// de la URL, para que nadie pueda cambiar la contraseña de otro por esta vía).
async function cambiarPassword(req, res) {
    try {
        const idUsuario = req.usuario.idUsuario;
        const { passwordActual, passwordNueva } = req.body;

        if (!passwordActual || !passwordNueva) {
            return res.status(400).json({ error: 'Debes enviar passwordActual y passwordNueva' });
        }

        if (!esPasswordFuerte(passwordNueva)) {
            return res.status(400).json({
                error: 'La nueva contraseña debe tener mínimo 8 caracteres, una mayúscula, una minúscula, un número y un símbolo'
            });
        }

        const registro = await perfilDao.obtenerHashPassword(idUsuario);
        if (!registro) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const coincide = await bcrypt.compare(passwordActual, registro.passwordHash);
        if (!coincide) {
            await registrarAccion(req, {
                accion: 'CAMBIO_PASSWORD_FALLIDO',
                modulo: 'perfil',
                detalle: 'Contraseña actual incorrecta'
            });
            return res.status(401).json({ error: 'La contraseña actual no es correcta' });
        }

        const mismaPassword = await bcrypt.compare(passwordNueva, registro.passwordHash);
        if (mismaPassword) {
            return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
        }

        const nuevoHash = await bcrypt.hash(passwordNueva, SALT_ROUNDS);
        await perfilDao.actualizarPassword(idUsuario, nuevoHash);

        await registrarAccion(req, {
            accion: 'CAMBIO_PASSWORD',
            modulo: 'perfil',
            detalle: 'El usuario cambió su contraseña desde el perfil'
        });

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cambiando la contraseña' });
    }
}

module.exports = { cambiarPassword };
