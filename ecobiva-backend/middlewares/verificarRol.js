
function verificarRol(rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      // Esto no debería pasar si se usa después de verificarToken,
      // pero lo dejamos como salvavidas.
      return res.status(401).json({ error: 'No autenticado' });
    }

    const rolesUsuario = req.usuario.roles || [];

    const tienePermiso = rolesUsuario.some((rol) => rolesPermitidos.includes(rol.nombreRol));

    if (!tienePermiso) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
}

module.exports = verificarRol;