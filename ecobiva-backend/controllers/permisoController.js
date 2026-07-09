const permisoDao = require('../dao/permisoDao');
const { registrarAccion } = require('../utils/auditoria');

// GET /api/permisos -> matriz completa (rol x modulo x accion)
async function obtenerMatriz(req, res) {
    try {
        const matriz = await permisoDao.obtenerMatrizCompleta();
        res.json(matriz);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo la matriz de permisos' });
    }
}

// GET /api/permisos/catalogo -> solo el catálogo (sin cruzar con roles)
async function obtenerCatalogo(req, res) {
    try {
        const catalogo = await permisoDao.listarCatalogoPermisos();
        res.json(catalogo);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo el catálogo de permisos' });
    }
}

// GET /api/permisos/mios -> permisos de TODOS los roles activos del usuario autenticado
// (para armar el menú del frontend). req.usuario.roles = [{ idRol, nombreRol }, ...]
async function obtenerMisPermisos(req, res) {
    try {
        const idsRoles = (req.usuario.roles || []).map((r) => r.idRol);
        const permisos = await permisoDao.obtenerPermisosPorRoles(idsRoles);
        res.json(permisos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error obteniendo tus permisos' });
    }
}

// PUT /api/permisos  body: { cambios: [{ idRol, idPermiso, permitido }, ...] }
async function actualizarMatriz(req, res) {
    try {
        const { cambios } = req.body;

        if (!Array.isArray(cambios) || cambios.length === 0) {
            return res.status(400).json({ error: 'Debes enviar un arreglo "cambios" con al menos un elemento' });
        }

        for (const c of cambios) {
            if (!c.idRol || !c.idPermiso || typeof c.permitido !== 'boolean') {
                return res.status(400).json({
                    error: 'Cada cambio requiere idRol, idPermiso y permitido (boolean)'
                });
            }
        }

        await permisoDao.actualizarPermisosMasivo(cambios);

        await registrarAccion(req, {
            accion: 'ACTUALIZAR_PERMISOS',
            modulo: 'permisos',
            detalle: `Se actualizaron ${cambios.length} permisos de la matriz RBAC`
        });

        res.json({ mensaje: 'Matriz de permisos actualizada correctamente' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error actualizando la matriz de permisos' });
    }
}

module.exports = { obtenerMatriz, obtenerCatalogo, obtenerMisPermisos, actualizarMatriz };
