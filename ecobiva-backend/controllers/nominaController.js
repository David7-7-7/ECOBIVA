const nominaDao = require("../dao/nominaDao");
const { registrarAccion } = require("../utils/auditoria");

/**
 * GET /api/nomina
 */
async function listar(req, res) {
  try {
    const nominas = await nominaDao.listar();

    res.json({
      ok: true,
      data: nominas,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,
      mensaje: "Error al listar las nóminas.",
    });
  }
}

/**
 * GET /api/nomina/:id
 */
async function obtenerPorId(req, res) {
  try {
    const { id } = req.params;

    const nomina = await nominaDao.obtenerPorId(id);

    if (!nomina) {
      return res.status(404).json({
        ok: false,

        mensaje: "La nómina no existe.",
      });
    }

    res.json({
      ok: true,

      data: nomina,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: "Error consultando la nómina.",
    });
  }
}

/**
 * POST /api/nomina/preview
 */
async function preview(req, res) {
  try {
    const {
      idEmpleado,

      periodoInicio,

      periodoFin,
    } = req.body;

    if (!idEmpleado || !periodoInicio || !periodoFin) {
      return res.status(400).json({
        ok: false,

        mensaje: "Todos los campos son obligatorios.",
      });
    }

    if (new Date(periodoInicio) > new Date(periodoFin)) {
      return res.status(400).json({
        ok: false,

        mensaje: "La fecha inicial no puede ser mayor que la final.",
      });
    }

    const resultado = await nominaDao.preview(req.body);

    res.json({
      ok: true,

      data: resultado,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

/**
 * POST /api/nomina
 */
async function generar(req, res) {
  try {
    const {
      idEmpleado,

      periodoInicio,

      periodoFin,
    } = req.body;

    if (!idEmpleado || !periodoInicio || !periodoFin) {
      return res.status(400).json({
        ok: false,

        mensaje: "Todos los campos son obligatorios.",
      });
    }

    if (new Date(periodoInicio) > new Date(periodoFin)) {
      return res.status(400).json({
        ok: false,

        mensaje: "La fecha inicial no puede ser mayor que la final.",
      });
    }

    const existe = await nominaDao.existeNomina(
      idEmpleado,

      periodoInicio,

      periodoFin,
    );

    if (existe) {
      return res.status(400).json({
        ok: false,

        mensaje: "Ya existe una nómina para ese empleado en ese período.",
      });
    }

    const resultado = await nominaDao.generar(req.body);

    await registrarAccion(req, {
      accion: "GENERAR_NOMINA",

      modulo: "NOMINA",

      detalle: `Se generó la nómina del empleado ${resultado.empleado}
Documento: ${resultado.documento}
Periodo: ${resultado.periodoInicio} - ${resultado.periodoFin}
Horas: ${resultado.totalHoras}
Tarifa: ${resultado.tarifaHoraAplicada}
Total: ${resultado.totalPagar}`,
    });

    res.status(201).json({
      ok: true,

      mensaje: "Nómina generada correctamente.",

      data: resultado,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

/**
 * PUT /api/nomina/:id/recalcular
 */
async function recalcular(req, res) {
  try {
    const { id } = req.params;

    const resultado = await nominaDao.recalcular(id);

    if (resultado.sinCambios) {
      return res.json({
        ok: true,

        mensaje: "La nómina ya está actualizada.",

        data: resultado,
      });
    }

    await registrarAccion(req, {
      accion: "RECALCULAR_NOMINA",

      modulo: "NOMINA",

      detalle: `Empleado: ${resultado.empleado}
Documento: ${resultado.documento}

Horas:
${resultado.antes.totalHoras} → ${resultado.despues.totalHoras}

Tarifa:
${resultado.antes.tarifaHoraAplicada} → ${resultado.despues.tarifaHoraAplicada}

Total:
${resultado.antes.totalPagar} → ${resultado.despues.totalPagar}`,
    });

    res.json({
      ok: true,

      mensaje: "Nómina recalculada correctamente.",

      data: resultado,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

/**
 * PUT /api/nomina/:id
 */
async function actualizar(req, res) {
  try {
    const { id } = req.params;

    const resultado = await nominaDao.actualizar(id, req.body);

    await registrarAccion(req, {
      accion: "ACTUALIZAR_NOMINA",

      modulo: "NOMINA",

      detalle: `Empleado: ${resultado.empleado}
Documento: ${resultado.documento}

Horas:
${resultado.antes.totalHoras} → ${resultado.despues.totalHoras}

Tarifa:
${resultado.antes.tarifaHoraAplicada} → ${resultado.despues.tarifaHoraAplicada}

Total:
${resultado.antes.totalPagar} → ${resultado.despues.totalPagar}`,
    });

    res.json({
      ok: true,

      mensaje: "Nómina actualizada correctamente.",

      data: resultado,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

/**
 * DELETE /api/nomina/:id
 */
async function eliminar(req, res) {
  try {
    const { id } = req.params;

    const nomina = await nominaDao.obtenerPorId(id);

    if (!nomina) {
      return res.status(404).json({
        ok: false,

        mensaje: "La nómina no existe.",
      });
    }

    await nominaDao.eliminar(id);

    await registrarAccion(req, {
      accion: "ELIMINAR_NOMINA",

      modulo: "NOMINA",

      detalle: `Se eliminó la nómina con ID ${id}.`,
    });

    res.json({
      ok: true,

      mensaje: "Nómina eliminada correctamente.",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      ok: false,

      mensaje: error.message,
    });
  }
}

module.exports = {
  listar,

  obtenerPorId,

  preview,

  generar,

  recalcular,

  actualizar,

  eliminar,
};
