const kardexDao = require('../dao/kardexDao');

async function listar(req, res) {
  try {
    const movimientos = await kardexDao.listarTodos();
    return res.json(movimientos);
  } catch (error) {
    console.error('Error al listar kardex:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function obtenerPorId(req, res) {
  const { id } = req.params;

  try {
    const movimiento = await kardexDao.obtenerPorId(id);
    if (!movimiento) {
      return res.status(404).json({ error: 'Movimiento no encontrado' });
    }
    return res.json(movimiento);
  } catch (error) {
    console.error('Error al obtener movimiento por id:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function crear(req, res) {
  const { tipoMovimiento, fecha, codigoProducto, cantidad, precioUnitario, total, observaciones, productoTipo, idProducto } = req.body;

  if (!tipoMovimiento || !codigoProducto || !cantidad || !productoTipo) {
    return res.status(400).json({ error: 'Tipo de movimiento, código de producto, cantidad y tipo de producto son obligatorios' });
  }

  try {
    const idKardex = await kardexDao.crear({
      tipoMovimiento,
      fecha,
      codigoProducto,
      cantidad,
      precioUnitario,
      total,
      observaciones,
      productoTipo,
      idProducto
    });

    return res.status(201).json({ mensaje: 'Movimiento registrado correctamente', idKardex });
  } catch (error) {
    console.error('Error al crear movimiento de kardex:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

async function obtenerPorProducto(req, res) {
  const { productoTipo, idProducto } = req.params;

  try {
    const movimientos = await kardexDao.obtenerMovimientosPorProducto(productoTipo, idProducto);
    return res.json(movimientos);
  } catch (error) {
    console.error('Error al listar movimientos por producto:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  obtenerPorProducto
};
