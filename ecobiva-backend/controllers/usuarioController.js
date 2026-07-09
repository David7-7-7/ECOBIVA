const bcrypt = require('bcrypt');
const pool = require('../config/db');
const usuarioDao = require('../dao/usuarioDao');
const empleadoDao = require('../dao/empleadoDao');
const rolDao = require('../dao/rolDao');
const validarPassword = require('../utils/validarPassword');

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/usuarios
 * Crea un Empleado nuevo + su Usuario + su UsuarioRol inicial,
 * todo en una sola transacción.
 */
async function crear(req, res) {
  const { nombre, documento, correo, password, nombreRol, cargoActual, tarifaHora } = req.body;

  if (!nombre || !documento || !correo || !password || !nombreRol) {
    return res.status(400).json({
      error: 'nombre, documento, correo, password y nombreRol son obligatorios'
    });
  }

  if (!REGEX_CORREO.test(correo)) {
    return res.status(400).json({ error: 'Formato de correo inválido' });
  }

  const validacion = validarPassword(password);
  if (!validacion.valido) {
    return res.status(400).json({ error: validacion.error });
  }

  const rol = await rolDao.obtenerPorNombre(nombreRol);
  if (!rol) {
    return res.status(400).json({ error: `El rol "${nombreRol}" no existe` });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const empleadoExistente = await empleadoDao.obtenerPorDocumento(documento);
    if (empleadoExistente) {
      await conn.rollback();
      return res.status(409).json({ error: 'Ya existe un empleado con ese documento' });
    }

    const idEmpleado = await empleadoDao.crear(
      {
        nombre,
        documento,
        fechaIngreso: new Date(),
        cargoActual: cargoActual || nombreRol,
        tarifaHora: tarifaHora || 0
      },
      conn
    );

    const passwordHash = await bcrypt.hash(password, 10);
    const idUsuario = await usuarioDao.crear({ correo, passwordHash, idEmpleado }, conn);

    // asignadoPor: quien está creando el usuario (viene del token)
    await usuarioDao.asignarRolInicial(idUsuario, rol.idRol, req.usuario.idUsuario, conn);

    await conn.commit();

    return res.status(201).json({
      mensaje: 'Usuario creado con éxito',
      idUsuario,
      correo,
      rol: rol.nombreRol
    });
  } catch (error) {
    await conn.rollback();
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo ya está registrado' });
    }
    console.error('Error al crear usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
}

/**
 * GET /api/usuarios
 */
async function listar(req, res) {
  try {
    const usuarios = await usuarioDao.listarTodos();
    return res.json(usuarios);
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * PUT /api/usuarios/:id
 * Rol y estado solo modificables por Admin (ya se protege con verificarRol en la ruta).
 */
async function actualizar(req, res) {
  const { id } = req.params;
  const { correo, estado, nombreRol } = req.body;

  try {
    const usuario = await usuarioDao.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (correo) {
      if (!REGEX_CORREO.test(correo)) {
        return res.status(400).json({ error: 'Formato de correo inválido' });
      }
      await usuarioDao.actualizarCorreo(id, correo);
    }

    if (typeof estado === 'boolean') {
      await usuarioDao.actualizarEstado(id, estado);
    }

    if (nombreRol) {
      const rol = await rolDao.obtenerPorNombre(nombreRol);
      if (!rol) {
        return res.status(400).json({ error: `El rol "${nombreRol}" no existe` });
      }
      await usuarioDao.cambiarRol(id, rol.idRol, req.usuario.idUsuario);
    }

    return res.json({ mensaje: 'Usuario actualizado con éxito' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'El correo ya está en uso' });
    }
    console.error('Error al actualizar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * DELETE /api/usuarios/:id
 * Desactiva (no borra físico).
 */
async function desactivar(req, res) {
  const { id } = req.params;
  try {
    const usuario = await usuarioDao.obtenerPorId(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    await usuarioDao.actualizarEstado(id, false);
    return res.json({ mensaje: 'Usuario desactivado con éxito' });
  } catch (error) {
    console.error('Error al desactivar usuario:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

/**
 * GET /api/roles
 */
async function listarRoles(req, res) {
  try {
    const roles = await rolDao.listar();
    return res.json(roles);
  } catch (error) {
    console.error('Error al listar roles:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = { crear, listar, actualizar, desactivar, listarRoles };