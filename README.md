# ECOBIVA
# ECOBIVA — Integración de RBAC, Auditoría, Cambio de contraseña + Frontend

> **Actualizado tras comparar contra tu `CodigoActual.sql` real.** Ver la sección 0 con lo que
> cambió respecto a la primera entrega.

## 0. Qué se corrigió tras el análisis de discrepancias

1. **`LogAuditoria` y `Permiso`**: tu BD real YA tenía la forma correcta (`fechaHora`, `ipOrigen`,
   `idUsuario` nullable; `Permiso` con `modulo`/`accion` dinámico). El script SQL ya no las toca,
   solo falta crear `RolPermiso`.
2. **Columna `Rol.nombreRol`**: `permisoDao.js` decía `r.nombre AS nombreRol` — corregido a
   `r.nombreRol AS nombreRol`.
3. **Roles como array (N:M real)**: tu JWT guarda `roles: [{ idRol, nombreRol }, ...]`, no un
   `idRol` único. Se reescribieron:
   - `permisoDao.js`: `obtenerPermisosPorRol(idRol)` → `obtenerPermisosPorRoles(idsRoles)`;
     `tienePermiso(idRol,...)` → `tienePermisoEnRoles(idsRoles,...)` (acceso si CUALQUIER rol activo
     tiene el permiso).
   - `middlewares/verificarPermiso.js`: ahora lee `req.usuario.roles` (array) en vez de
     `req.usuario.idRol`.
   - `controllers/permisoController.js`: `obtenerMisPermisos` usa `req.usuario.roles.map(r=>r.idRol)`.
   - **Frontend**: `AuthContext`, `Sidebar`, `Dashboard`, `ProtectedRoute` ahora trabajan con
     `usuario.roles` (array) y exponen `nombresRoles` / `tieneAlgunRol(['Admin', ...])`.
4. **Columna `Usuario.passwordHash`**: `perfilDao.js` y `perfilController.js` decían `password` —
   corregido a `passwordHash` (coincide con tu tabla real).

## 1. Base de datos

Abre en DBeaver con **File → Open File** (no copiar/pegar):

```
backend-additions/database/alter_rbac_auditoria.sql
```

Esto crea únicamente `RolPermiso` (lo demás ya existe en tu BD) y siembra la asignación inicial de
permisos por rol **buscando el `idRol` por `nombreRol`** (no asume que Admin=1, Tecnico=2, Asesor=3).
Antes de correrlo, verifica cómo están escritos tus roles:

```sql
SELECT idRol, nombreRol FROM Rol;
```

Si tus roles no se llaman exactamente `Admin`, `Tecnico`, `Asesor` en la columna `nombreRol`, ajusta
esos 3 strings en el script antes de ejecutarlo.

## 2. Copiar archivos al backend

Copia cada archivo de `backend-additions/` a la carpeta equivalente en `ecobiva-backend/`:

```
dao/permisoDao.js              -> ecobiva-backend/dao/
dao/auditoriaDao.js            -> ecobiva-backend/dao/
dao/perfilDao.js               -> ecobiva-backend/dao/
utils/auditoria.js             -> ecobiva-backend/utils/
utils/validarPasswordFuerte.js -> ecobiva-backend/utils/  (o ignora si ya tienes utils/validarPassword.js con la misma regla)
middlewares/verificarPermiso.js -> ecobiva-backend/middlewares/
controllers/permisoController.js  -> ecobiva-backend/controllers/
controllers/auditoriaController.js -> ecobiva-backend/controllers/
controllers/perfilController.js    -> ecobiva-backend/controllers/
routes/permisoRoutes.js        -> ecobiva-backend/routes/
routes/auditoriaRoutes.js      -> ecobiva-backend/routes/
routes/perfilRoutes.js         -> ecobiva-backend/routes/
```

## 3. Registrar las rutas nuevas en `server.js`

```js
app.use('/api/permisos', require('./routes/permisoRoutes'));
app.use('/api/auditoria', require('./routes/auditoriaRoutes'));
app.use('/api/perfil', require('./routes/perfilRoutes'));
```

## 4. Enganchar auditoría en tus controllers existentes

El helper `registrarAccion(req, {...})` **nunca lanza error**, así que es seguro agregarlo al final
de cualquier operación exitosa sin arriesgar romper el flujo.

**En `authController.js`**, dentro del login (recuerda que `req.usuario` aún no existe en este punto,
así que usa `idUsuarioOverride`):

```js
const { registrarAccion } = require('../utils/auditoria');

// login exitoso, antes del res.json final:
await registrarAccion(req, {
    accion: 'LOGIN_EXITOSO',
    modulo: 'auth',
    detalle: `Login de ${usuario.correo} (roles: ${roles.map(r => r.nombreRol).join(', ')})`,
    idUsuarioOverride: usuario.idUsuario
});

// login fallido, antes del res.status(401):
await registrarAccion(req, {
    accion: 'LOGIN_FALLIDO',
    modulo: 'auth',
    detalle: `Intento fallido para correo ${correo}`
});
```

**En `usuarioController.js`**, después de crear/editar/desactivar:

```js
await registrarAccion(req, {
    accion: 'CREAR_USUARIO', // o 'EDITAR_USUARIO' / 'DESACTIVAR_USUARIO'
    modulo: 'usuarios',
    detalle: `Usuario ${correo}`
});
```

**En `recuperacionController.js`**, después de `PUT /reset-password/:token` exitoso:

```js
await registrarAccion(req, {
    accion: 'RESET_PASSWORD',
    modulo: 'auth',
    detalle: 'Se restableció la contraseña vía preguntas de seguridad',
    idUsuarioOverride: idUsuarioDelToken
});
```

## 5. Levantar el frontend

```bash
cd frontend
npm install
npm run dev
```

Abre `http://localhost:5173`. El proxy de Vite ya redirige `/api/*` a `http://localhost:3000`.

El frontend espera que `POST /api/auth/login` devuelva:

```json
{
  "token": "eyJhbGciOi...",
  "usuario": {
    "idUsuario": 5,
    "correo": "juan@ecobiva.com",
    "roles": [{ "idRol": 2, "nombreRol": "Tecnico" }]
  }
}
```

Si un usuario llega a tener varios roles activos a la vez (ej. Tecnico + Asesor), el sidebar muestra
la unión de ambos menús y el dashboard muestra un bloque por cada rol — no hay que elegir "el
principal".

Si el nombre de tus roles no es exactamente `Admin`/`Tecnico`/`Asesor`, ajusta esos strings en:
- `frontend/src/components/Sidebar.jsx` (`MENU_POR_ROL`, `BADGE_CLASE`)
- `frontend/src/pages/Dashboard.jsx` (`CONTENIDO_POR_ROL`)
- `frontend/src/App.jsx` (`rolesPermitidos={['Admin']}`)

## 6. Endpoints nuevos — resumen

| Método | Ruta | Protección |
|---|---|---|
| GET | `/api/permisos/mios` | Cualquier usuario autenticado |
| GET | `/api/permisos` | Permiso `permisos:leer` en alguno de sus roles activos |
| GET | `/api/permisos/catalogo` | Permiso `permisos:leer` |
| PUT | `/api/permisos` | Permiso `permisos:editar` |
| GET | `/api/auditoria` | Permiso `auditoria:leer` |
| GET | `/api/auditoria/exportar` | Permiso `auditoria:exportar` |
| PUT | `/api/perfil/password` | Cualquier usuario autenticado (solo su propia contraseña) |

## 7. Pendiente

- Confirmar que tu endpoint `GET /api/usuarios` devuelve `roles: [{idRol, nombreRol}, ...]` por
  usuario (el frontend ya soporta ese formato en la tabla de `Usuarios.jsx`, con fallback a un
  campo plano si tu API aún no lo trae así).
- Avisar al profesor/equipo sobre el cambio no sustentado de recuperación por preguntas de seguridad.
- Cuando Parte 2 y 3 empiecen sus módulos, usa `verificarPermiso('modulo', 'accion')` en sus rutas.

