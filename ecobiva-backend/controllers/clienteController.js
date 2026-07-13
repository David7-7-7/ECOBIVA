const clienteDao = require('../dao/clienteDao');

async function listar(req, res) {
  try {
    const clientes = await clienteDao.listarTodos();
    return res.json(clientes);
  } catch (error) {
    console.error('Error al listar clientes:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function obtenerPorId(req, res) {
  const { id } = req.params;

  try {
    const cliente = await clienteDao.obtenerPorId(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const vehiculos = await clienteDao.obtenerVehiculosPorCliente(id);
    cliente.vehiculos = vehiculos;

    return res.json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente por id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function crear(req, res) {
  const { nombre, telefono, correo, documento, preferenciaNotificacion } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Nombre y documento son obligatorios' });
  }

  try {
    const idCliente = await clienteDao.crear({
      nombre,
      telefono,
      correo,
      documento,
      preferenciaNotificacion,
      estado: 1,
      puntosAcumulados: 0
    });

    return res.status(201).json({
      mensaje: 'Cliente creado correctamente',
      idCliente
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese documento' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function actualizar(req, res) {
  const { id } = req.params;
  const { nombre, telefono, correo, documento, preferenciaNotificacion, estado, puntosAcumulados } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({ error: 'Nombre y documento son obligatorios' });
  }

  try {
    const cliente = await clienteDao.obtenerPorId(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await clienteDao.actualizar(id, {
      nombre,
      telefono,
      correo,
      documento,
      preferenciaNotificacion,
      estado: typeof estado !== 'undefined' ? estado : cliente.estado,
      puntosAcumulados: typeof puntosAcumulados !== 'undefined' ? puntosAcumulados : cliente.puntosAcumulados
    });

    return res.json({ mensaje: 'Cliente actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un cliente con ese documento' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function eliminar(req, res) {
  const { id } = req.params;

  try {
    const cliente = await clienteDao.obtenerPorId(id);
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    await clienteDao.eliminar(id);
    return res.json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar
};
