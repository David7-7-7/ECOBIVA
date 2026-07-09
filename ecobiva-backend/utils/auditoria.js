const auditoriaDao = require('../dao/auditoriaDao');

/**
 * Registra una entrada de auditoría de forma segura: si falla el log,
 * solo se imprime en consola y NO se interrumpe la respuesta al usuario.
 *
 * Uso típico dentro de un controller, después de una operación exitosa:
 *
 *   const { registrarAccion } = require('../utils/auditoria');
 *   await registrarAccion(req, {
 *       accion: 'CREAR_USUARIO',
 *       modulo: 'usuarios',
 *       detalle: `Se creó el usuario ${nuevoUsuario.correo}`
 *   });
 *
 * req debe traer req.usuario (seteado por verificarToken) para poder
 * extraer idUsuario e IP automáticamente.
 */
async function registrarAccion(req, { accion, modulo, detalle, idUsuarioOverride }) {
    try {
        const idUsuario = idUsuarioOverride ?? req?.usuario?.idUsuario ?? null;
        const ipOrigen = req?.ip || req?.connection?.remoteAddress || null;

        await auditoriaDao.registrar({ idUsuario, accion, modulo, detalle, ipOrigen });
    } catch (err) {
        console.error('[auditoria] No se pudo registrar el log:', err.message);
    }
}

module.exports = { registrarAccion };
