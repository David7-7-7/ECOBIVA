const vehiculoDao = require('../dao/vehiculoDao');

async function listar(req, res) {
  try {
    const vehiculos = await vehiculoDao.listarTodos();
    return res.json(vehiculos);
  } catch (error) {
    console.error('Error al listar vehículos:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function obtenerPorId(req, res) {
  const { id } = req.params;

  try {
    const vehiculo = await vehiculoDao.obtenerPorId(id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    return res.json(vehiculo);
  } catch (error) {
    console.error('Error al obtener vehículo por id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function crear(req, res) {
  const {
    placa,
    marca,
    modelo,
    anio,
    serialMotor,
    tipoVehiculo,
    especificacionesBateria,
    idCliente
  } = req.body;

  if (!placa || !idCliente) {
    return res.status(400).json({ error: 'Placa e idCliente son obligatorios' });
  }

  try {
    const idVehiculo = await vehiculoDao.crear({
      placa,
      marca,
      modelo,
      anio,
      serialMotor,
      tipoVehiculo,
      especificacionesBateria,
      idCliente
    });

    return res.status(201).json({
      mensaje: 'Vehículo creado correctamente',
      idVehiculo
    });
  } catch (error) {
    console.error('Error al crear vehículo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa placa' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function actualizar(req, res) {
  const { id } = req.params;
  const {
    placa,
    marca,
    modelo,
    anio,
    serialMotor,
    tipoVehiculo,
    especificacionesBateria,
    idCliente
  } = req.body;

  if (!placa || !idCliente) {
    return res.status(400).json({ error: 'Placa e idCliente son obligatorios' });
  }

  try {
    const vehiculo = await vehiculoDao.obtenerPorId(id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    await vehiculoDao.actualizar(id, {
      placa,
      marca,
      modelo,
      anio,
      serialMotor,
      tipoVehiculo,
      especificacionesBateria,
      idCliente
    });

    return res.json({ mensaje: 'Vehículo actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar vehículo:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Ya existe un vehículo con esa placa' });
    }
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function eliminar(req, res) {
  const { id } = req.params;

  try {
    const vehiculo = await vehiculoDao.obtenerPorId(id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }

    await vehiculoDao.eliminar(id);
    return res.json({ mensaje: 'Vehículo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar vehículo:', error);
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
