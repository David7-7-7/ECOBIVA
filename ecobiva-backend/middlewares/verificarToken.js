const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }

  // Se espera el formato: "Bearer <token>"
  const partes = authHeader.split(' ');

  if (partes.length !== 2 || partes[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Formato de token inválido, usa: Bearer <token>' });
  }

  const token = partes[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, payload) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Sesión expirada, inicia sesión de nuevo' });
      }
      return res.status(401).json({ error: 'Token inválido' });
    }

    // Dejamos disponible la info del usuario para los siguientes middlewares/controllers
    req.usuario = payload; // { idUsuario, correo, roles }
    next();
  });
}

module.exports = verificarToken;