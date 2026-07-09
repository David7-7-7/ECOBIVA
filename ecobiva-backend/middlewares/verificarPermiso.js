const permisoDao = require('../dao/permisoDao');
const { registrarAccion } = require('../utils/auditoria');

/**
 * Middleware de autorización granular basado en la matriz RolPermiso.
 * Se usa DESPUÉS de verificarToken.
 *
 * IMPORTANTE: en este proyecto el JWT guarda un ARRAY de roles activos
 * (por la relación N:M UsuarioRol), no un idRol único:
 *   req.usuario.roles = [{ idRol: 2, nombreRol: 'Tecnico' }, ...]
 *
 * El acceso se concede si ALGUNO de los roles activos del usuario tiene
 * el permiso solicitado (OR lógico entre roles).
 *
 * Ejemplo de uso en una ruta:
 *   router.post('/api/ordenes', verificarToken, verificarPermiso('ordenes', 'crear'), crearOrden);
 */
function verificarPermiso(modulo, accion) {
    return async (req, res, next) => {
        try {
            const roles = req.usuario?.roles;

            if (!Array.isArray(roles) || roles.length === 0) {
                return res.status(401).json({ error: 'No autenticado' });
            }

            const idsRoles = roles.map((r) => r.idRol);
            const permitido = await permisoDao.tienePermisoEnRoles(idsRoles, modulo, accion);

            if (!permitido) {
                await registrarAccion(req, {
                    accion: 'ACCESO_DENEGADO',
                    modulo,
                    detalle: `Intento de "${accion}" en "${modulo}" sin permiso (roles=${idsRoles.join(',')})`
                });
                return res.status(403).json({ error: 'No tienes permiso para realizar esta acción' });
            }

            next();
        } catch (err) {
            console.error('[verificarPermiso] Error:', err);
            res.status(500).json({ error: 'Error verificando permisos' });
        }
    };
}

module.exports = verificarPermiso;
