const terminoGarantiaDao = require("../dao/terminoGarantiaDao");
const { registrarAccion } = require("../utils/auditoria");

/**
 * Listar todos los términos de garantía
 */
async function listar(req, res) {
  try {
    const terminos = await terminoGarantiaDao.listar();
    return res.json(terminos);
  } catch (error) {
    console.error("Error al listar términos de garantía:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Listar solo términos vigentes (?vigentes=true)
 */
async function listarVigentes(req, res) {
  try {
    const terminos = await terminoGarantiaDao.listarVigentes();
    return res.json(terminos);
  } catch (error) {
    console.error("Error al listar términos vigentes:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Obtener un término de garantía por ID
 */
async function obtenerPorId(req, res) {
  try {
    const termino = await terminoGarantiaDao.obtenerPorId(req.params.id);
    if (!termino) {
      return res.status(404).json({ error: "Término de garantía no encontrado" });
    }
    return res.json(termino);
  } catch (error) {
    console.error("Error al obtener término de garantía:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Obtener término vigente por categoría
 */
async function obtenerPorCategoria(req, res) {
  const { categoria } = req.params;

  if (!categoria) {
    return res.status(400).json({ error: "La categoría es obligatoria" });
  }

  try {
    const termino = await terminoGarantiaDao.obtenerPorCategoria(categoria);
    if (!termino) {
      return res.status(404).json({ 
        error: `No hay término de garantía vigente para la categoría "${categoria}"` 
      });
    }
    return res.json(termino);
  } catch (error) {
    console.error("Error al obtener término por categoría:", error);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
}

/**
 * Crear un nuevo término de garantía
 */
async function crear(req, res) {
  const { categoria, textoLegal, plazoGarantiaDias, version } = req.body;

  if (!categoria) {
    return res.status(400).json({ error: "La categoría es obligatoria" });
  }

  try {
    const termino = await terminoGarantiaDao.crear({
      categoria,
      textoLegal,
      plazoGarantiaDias,
      version
    });

    await registrarAccion(req, {
      accion: "CREAR_TERMINO_GARANTIA",
      modulo: "GARANTIA",
      detalle: `Término de garantía creado para categoría "${categoria}" (versión: ${version || "S/V"}, plazo: ${plazoGarantiaDias} días)`
    });

    return res.status(201).json(termino);
  } catch (error) {
    console.error("Error al crear término de garantía:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

/**
 * Actualizar un término de garantía
 */
async function actualizar(req, res) {
  try {
    const termino = await terminoGarantiaDao.obtenerPorId(req.params.id);
    if (!termino) {
      return res.status(404).json({ error: "Término de garantía no encontrado" });
    }

    const actualizado = await terminoGarantiaDao.actualizar(
      req.params.id,
      req.body
    );

    await registrarAccion(req, {
      accion: "ACTUALIZAR_TERMINO_GARANTIA",
      modulo: "GARANTIA",
      detalle: `Término de garantía #${req.params.id} (categoría: "${termino.categoria}") actualizado`
    });

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al actualizar término de garantía:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

/**
 * Cambiar vigencia de un término (marcar como vigente/obsoleto)
 */
async function cambiarVigencia(req, res) {
  const { vigente } = req.body;

  if (vigente === undefined || vigente === null) {
    return res.status(400).json({ error: "El parámetro 'vigente' es obligatorio" });
  }

  try {
    const termino = await terminoGarantiaDao.obtenerPorId(req.params.id);
    if (!termino) {
      return res.status(404).json({ error: "Término de garantía no encontrado" });
    }

    const actualizado = await terminoGarantiaDao.cambiarVigencia(
      req.params.id,
      vigente
    );

    await registrarAccion(req, {
      accion: "CAMBIAR_VIGENCIA_TERMINO",
      modulo: "GARANTIA",
      detalle: `Término de garantía #${req.params.id} (categoría: "${termino.categoria}") marcado como ${vigente ? "vigente" : "obsoleto"}`
    });

    return res.json(actualizado);
  } catch (error) {
    console.error("Error al cambiar vigencia de término:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

/**
 * Eliminar un término de garantía
 */
async function eliminar(req, res) {
  try {
    const termino = await terminoGarantiaDao.obtenerPorId(req.params.id);
    if (!termino) {
      return res.status(404).json({ error: "Término de garantía no encontrado" });
    }

    await terminoGarantiaDao.eliminar(req.params.id);

    await registrarAccion(req, {
      accion: "ELIMINAR_TERMINO_GARANTIA",
      modulo: "GARANTIA",
      detalle: `Término de garantía #${req.params.id} (categoría: "${termino.categoria}", versión: ${termino.version || "S/V"}) eliminado`
    });

    return res.json({ mensaje: "Término de garantía eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar término de garantía:", error);
    return res.status(400).json({ error: error.message || "Error interno" });
  }
}

module.exports = {
  listar,
  listarVigentes,
  obtenerPorId,
  obtenerPorCategoria,
  crear,
  actualizar,
  cambiarVigencia,
  eliminar
};
