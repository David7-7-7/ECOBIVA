const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const usuarioDao = require('../dao/usuarioDao');

async function login(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await usuarioDao.obtenerPorCorreo(correo);

    if (!usuario) {
      // Mensaje genérico a propósito: no revelar si el correo existe o no
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.estado) {
      return res.status(403).json({ error: 'Usuario inactivo, contacta a un administrador' });
    }

    const passwordValido = await bcrypt.compare(password, usuario.passwordHash);

    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      idUsuario: usuario.idUsuario,
      correo: usuario.correo,
      roles: usuario.roles
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '2h'
    });

    await usuarioDao.actualizarUltimoAcceso(usuario.idUsuario);

    return res.json({
      token,
      usuario: {
        idUsuario: usuario.idUsuario,
        correo: usuario.correo,
        roles: usuario.roles
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { login };