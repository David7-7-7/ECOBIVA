const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const usuarioDao = require('../dao/usuarioDao');

// 1. Importamos la función del helper de auditoría
const { registrarAccion } = require('../utils/auditoria');

async function login(req, res) {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
    }

    const usuario = await usuarioDao.obtenerPorCorreo(correo);

    if (!usuario) {
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

    // ====================================================================
    // 2. REGISTRO DE AUDITORÍA (Aquí aplicamos el idUsuarioOverride de forma explícita)
    // ====================================================================
    await registrarAccion(req, {
      accion: 'LOGIN',
      modulo: 'AUTH',
      detalle: `Inicio de sesión exitoso para el correo: ${usuario.correo}`,
      idUsuarioOverride: usuario.idUsuario
    });
    // ====================================================================

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

async function obtenerPerfil(req, res) {
  try {
    // req.usuario fue inyectado de forma segura por el middleware 'verificarToken'
    if (!req.usuario) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const permisos = await usuarioDao.obtenerPermisosPorUsuario(req.usuario.idUsuario);

    // Devolvemos los datos del usuario logueado con sus respectivos roles y permisos
    return res.status(200).json({
      idUsuario: req.usuario.idUsuario,
      correo: req.usuario.correo,
      roles: req.usuario.roles, // Aquí vendrá el arreglo con sus roles y permisos asignados
      accesos: permisos 
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { login, obtenerPerfil };