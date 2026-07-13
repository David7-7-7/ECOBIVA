const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const perfilDao = require('../dao/perfilDao');
const usuarioDao = require('../dao/usuarioDao');
const { registrarAccion } = require('../utils/auditoria');
// Si ya tienes utils/validarPassword.js, importa esa función en vez de esta:
const { esPasswordFuerte } = require('../utils/validarPasswordFuerte');

const SALT_ROUNDS = 10;
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
            modulo: 'PERFIL',
            detalle: 'El usuario cambió su contraseña desde el perfil'
        });

        res.json({ mensaje: 'Contraseña actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error cambiando la contraseña' });
    }
}

// GET /api/perfil/me
// Devuelve los datos propios del usuario autenticado (para la tarjeta
// "Información del Usuario" en Configuración). Nombre, correo y cargo se
// muestran de solo lectura porque vienen de Empleado/Usuario y su edición
// pertenece al módulo de Empleados/Usuarios, no a Configuración.
async function obtenerMiPerfil(req, res) {
    try {
        const idUsuario = req.usuario.idUsuario;
        const perfil = await perfilDao.obtenerMiPerfil(idUsuario);

        if (!perfil) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        res.json({
            nombre: perfil.nombre,
            correo: perfil.correo,
            telefono: perfil.telefono || '',
            cargo: perfil.cargoActual
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error consultando el perfil' });
    }
}

// PUT /api/perfil/me
// body: { telefono, correo }
// Campos propios editables desde Configuración: teléfono y correo.
// Nombre y cargo se quedan de solo lectura porque su edición es
// responsabilidad del módulo de Empleados/Usuarios (cambian nómina, RBAC, etc).
async function actualizarMiPerfil(req, res) {
    try {
        const idUsuario = req.usuario.idUsuario;
        const { telefono, correo } = req.body;

        if (telefono !== undefined && telefono !== null && telefono.length > 20) {
            return res.status(400).json({ error: 'El teléfono no puede tener más de 20 caracteres' });
        }

        if (correo !== undefined && correo !== null) {
            if (!REGEX_CORREO.test(correo)) {
                return res.status(400).json({ error: 'Formato de correo inválido' });
            }
        }

        const perfil = await perfilDao.obtenerMiPerfil(idUsuario);
        if (!perfil) {
            return res.status(404).json({ error: 'Perfil no encontrado' });
        }

        if (telefono !== undefined) {
            await perfilDao.actualizarTelefono(perfil.idEmpleado, telefono || null);
        }

        let correoCambio = false;
        if (correo && correo !== perfil.correo) {
            await usuarioDao.actualizarCorreo(idUsuario, correo);
            correoCambio = true;
        }

        await registrarAccion(req, {
            accion: 'ACTUALIZAR_PERFIL',
            modulo: 'PERFIL',
            detalle: 'El usuario actualizó su información de contacto desde Configuración'
        });

        // BUGFIX (correo/JWT desactualizado tras cambiarlo desde Configuración):
        // el JWT lleva el correo en su payload (ver authController.login), así
        // que si el correo cambió acá, el token viejo queda con el valor
        // anterior hasta que expire o el usuario vuelva a loguearse. Para que
        // el frontend pueda refrescar el token y el `usuario` en localStorage
        // de inmediato, reemitimos un JWT nuevo con los datos ya actualizados
        // (mismo payload/expiración que usa authController.login) y lo
        // devolvemos junto con la respuesta.
        let token;
        let usuarioActualizado;
        if (correoCambio) {
            usuarioActualizado = await usuarioDao.obtenerPorId(idUsuario);
            const payload = {
                idUsuario: usuarioActualizado.idUsuario,
                correo: usuarioActualizado.correo,
                roles: usuarioActualizado.roles
            };
            token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
        }

        res.json({
            mensaje: 'Perfil actualizado correctamente',
            ...(correoCambio
                ? {
                    token,
                    usuario: {
                        idUsuario: usuarioActualizado.idUsuario,
                        correo: usuarioActualizado.correo,
                        roles: usuarioActualizado.roles
                    }
                }
                : {})
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'El correo ya está en uso' });
        }
        console.error(err);
        res.status(500).json({ error: 'Error actualizando el perfil' });
    }
}

module.exports = { cambiarPassword, obtenerMiPerfil, actualizarMiPerfil };
