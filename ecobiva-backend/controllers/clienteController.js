const clienteDao = require("../dao/clienteDao");

async function listar(req, res) {
  try {
    const clientes = await clienteDao.listarTodos();
    return res.json(clientes);
  } catch (error) {
    console.error("Error al listar clientes:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function obtenerPorId(req, res) {
  const { id } = req.params;

  try {
    const cliente = await clienteDao.obtenerPorId(id);

    if (!cliente) {
      return res.status(404).json({ error: "Cliente no encontrado" });
    }

    const vehiculos = await clienteDao.obtenerVehiculosPorCliente(id);
    cliente.vehiculos = vehiculos;

    return res.json(cliente);
  } catch (error) {
    console.error("Error al obtener cliente:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function crear(req, res) {
  const {
    tipoDocumento,
    documento,
    nombre,
    telefono,
    correo,
    ciudad,
    direccion,
    tipoComunicacion,
  } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({
      error: "Nombre y documento son obligatorios",
    });
  }

  try {
    const idCliente = await clienteDao.crear({
      tipoDocumento,
      documento,
      nombre,
      telefono,
      correo,
      ciudad,
      direccion,
      tipoComunicacion,
      estado: 1,
      puntosAcumulados: 0,
    });

    return res.status(201).json({
      mensaje: "Cliente creado correctamente",
      idCliente,
    });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Ya existe un cliente con ese documento",
      });
    }

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

async function actualizar(req, res) {
  const { id } = req.params;

  const {
    tipoDocumento,
    documento,
    nombre,
    telefono,
    correo,
    ciudad,
    direccion,
    tipoComunicacion,
    estado,
    puntosAcumulados,
  } = req.body;

  if (!nombre || !documento) {
    return res.status(400).json({
      error: "Nombre y documento son obligatorios",
    });
  }

  try {
    const cliente = await clienteDao.obtenerPorId(id);

    if (!cliente) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      });
    }

    await clienteDao.actualizar(id, {
      tipoDocumento,
      documento,
      nombre,
      telefono,
      correo,
      ciudad,
      direccion,
      tipoComunicacion,
      estado: estado ?? cliente.estado,
      puntosAcumulados: puntosAcumulados ?? cliente.puntosAcumulados,
    });

    return res.json({
      mensaje: "Cliente actualizado correctamente",
    });
  } catch (error) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        error: "Ya existe un cliente con ese documento",
      });
    }

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

async function eliminar(req, res) {
  const { id } = req.params;

  try {
    const cliente = await clienteDao.obtenerPorId(id);

    if (!cliente) {
      return res.status(404).json({
        error: "Cliente no encontrado",
      });
    }

    await clienteDao.eliminar(id);

    return res.json({
      mensaje: "Cliente desactivado correctamente",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
};
