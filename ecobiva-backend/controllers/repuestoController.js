const repuestoDao = require('../dao/repuestoDao');

async function listar(req, res) {
  try {
    const repuestos = await repuestoDao.listarTodos();
    return res.json(repuestos);
  } catch (error) {
    console.error('Error al listar repuestos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function obtenerPorId(req, res) {
  const { id } = req.params;

  try {
    const repuesto = await repuestoDao.obtenerPorId(id);
    if (!repuesto) {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }
    return res.json(repuesto);
  } catch (error) {
    console.error('Error al obtener repuesto por id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function crear(req, res) {
  const { nombre, categoria, precioUnitario, proveedor, stockActual, stockMinimo } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del repuesto es obligatorio' });
  }

  try {
    const idRepuesto = await repuestoDao.crear({
      nombre,
      categoria,
      precioUnitario,
      proveedor,
      stockActual,
      stockMinimo
    });

    return res.status(201).json({ mensaje: 'Repuesto creado correctamente', idRepuesto });
  } catch (error) {
    console.error('Error al crear repuesto:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function actualizar(req, res) {
  const { id } = req.params;
  const { nombre, categoria, precioUnitario, proveedor, stockActual, stockMinimo } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del repuesto es obligatorio' });
  }

  try {
    const repuesto = await repuestoDao.obtenerPorId(id);
    if (!repuesto) {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }

    await repuestoDao.actualizar(id, {
      nombre,
      categoria,
      precioUnitario,
      proveedor,
      stockActual,
      stockMinimo
    });

    return res.json({ mensaje: 'Repuesto actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar repuesto:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function eliminar(req, res) {
  const { id } = req.params;

  try {
    const repuesto = await repuestoDao.obtenerPorId(id);
    if (!repuesto) {
      return res.status(404).json({ error: 'Repuesto no encontrado' });
    }

    await repuestoDao.eliminar(id);
    return res.json({ mensaje: 'Repuesto eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar repuesto:', error);
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
