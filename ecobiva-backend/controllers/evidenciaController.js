const evidenciaDao = require("../dao/evidenciaDao");
const ordenDao = require("../dao/ordenDao");
const { registrarAccion } = require("../utils/auditoria");

/**
 * Obtener todas las evidencias asociadas
 * a una orden de servicio.
 */
async function listarPorOrden(req, res) {
  try {
    const orden = await ordenDao.obtenerPorId(req.params.id);

    if (!orden) {
      return res.status(404).json({
        error: "Orden no encontrada",
      });
    }

    const evidencias = await evidenciaDao.obtenerPorVehiculo(
      orden.idVehiculo
    );

    await Promise.all(
      evidencias.map(async (evidencia) => {
        evidencia.fotos = await evidenciaDao.listarFotos(evidencia.idEvidencia);
      }),
    );

    return res.json(evidencias);
  } catch (error) {
    console.error("Error al listar evidencias:", error);

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

/**
 * Obtener una evidencia específica
 */
async function obtenerPorId(req, res) {
  try {
    const evidencia = await evidenciaDao.obtenerPorId(req.params.id);

    if (!evidencia) {
      return res.status(404).json({
        error: "Evidencia no encontrada",
      });
    }

    evidencia.fotos = await evidenciaDao.listarFotos(evidencia.idEvidencia);

    return res.json(evidencia);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

/**
 * Crear evidencia
 */
async function crear(req, res) {
  const { idOrden, observaciones } = req.body;

  if (!idOrden) {
    return res.status(400).json({
      error: "La orden es obligatoria.",
    });
  }

  try {
    const orden = await ordenDao.obtenerPorId(idOrden);

    if (!orden) {
      return res.status(404).json({
        error: "Orden no encontrada.",
      });
    }

    const evidencia = await evidenciaDao.crear({
      observaciones,
      idVehiculo: orden.idVehiculo,
    });

    await registrarAccion(req, {
      accion: "CREAR_EVIDENCIA",
      modulo: "EVIDENCIAS",
      detalle: `Se registró evidencia de ingreso para la orden ${orden.folio}`,
    });

    return res.status(201).json(evidencia);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Error interno",
    });
  }
}

/**
 * Actualizar evidencia
 */
async function actualizar(req, res) {
  try {
    const evidenciaActual = await evidenciaDao.obtenerPorId(req.params.id);

    if (!evidenciaActual) {
      return res.status(404).json({
        error: "Evidencia no encontrada",
      });
    }

    const evidencia = await evidenciaDao.actualizar(
      req.params.id,
      req.body.observaciones
    );

    await registrarAccion(req, {
      accion: "ACTUALIZAR_EVIDENCIA",
      modulo: "EVIDENCIAS",
      detalle: `Se actualizaron las observaciones de la evidencia ${req.params.id}`,
    });

    return res.json(evidencia);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Error interno",
    });
  }
}

/**
 * Eliminar evidencia
 */
async function eliminar(req, res) {
  try {
    const evidencia = await evidenciaDao.obtenerPorId(req.params.id);

    if (!evidencia) {
      return res.status(404).json({
        error: "Evidencia no encontrada",
      });
    }

    await evidenciaDao.eliminar(req.params.id);

    await registrarAccion(req, {
      accion: "ELIMINAR_EVIDENCIA",
      modulo: "EVIDENCIAS",
      detalle: `Se eliminó la evidencia ${req.params.id}`,
    });

    return res.json({
      mensaje: "Evidencia eliminada correctamente.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Error interno",
    });
  }
}

/**
 * Agregar fotografía
 */
async function agregarFoto(req, res) {
  try {
    const { idEvidencia } = req.body;

    if (!idEvidencia) {
      return res.status(400).json({
        error: "Debe indicar la evidencia.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: "Debe seleccionar una fotografía.",
      });
    }

    const evidencia = await evidenciaDao.obtenerPorId(idEvidencia);

    if (!evidencia) {
      return res.status(404).json({
        error: "La evidencia no existe.",
      });
    }

    const idFoto = await evidenciaDao.agregarFoto(
      idEvidencia,
      req.file.filename
    );

    await registrarAccion(req, {
      accion: "AGREGAR_FOTO_EVIDENCIA",
      modulo: "EVIDENCIAS",
      detalle: `Se agregó una fotografía a la evidencia ${idEvidencia}`,
    });

    return res.status(201).json({
      mensaje: "Fotografía registrada correctamente.",
      idFoto,
      archivo: req.file.filename,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Error interno",
    });
  }
}

/**
 * Listar fotografías
 */
async function listarFotos(req, res) {
  try {
    const evidencia = await evidenciaDao.obtenerPorId(req.params.id);

    if (!evidencia) {
      return res.status(404).json({
        error: "Evidencia no encontrada.",
      });
    }

    const fotos = await evidenciaDao.listarFotos(req.params.id);

    return res.json(fotos);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

/**
 * Eliminar fotografía
 */
async function eliminarFoto(req, res) {
  try {
    await evidenciaDao.eliminarFoto(req.params.id);

    await registrarAccion(req, {
      accion: "ELIMINAR_FOTO_EVIDENCIA",
      modulo: "EVIDENCIAS",
      detalle: `Se eliminó la fotografía ${req.params.id}`,
    });

    return res.json({
      mensaje: "Fotografía eliminada correctamente.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      error: error.message || "Error interno",
    });
  }
}

module.exports = {
  listarPorOrden,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  agregarFoto,
  listarFotos,
  eliminarFoto,
};

