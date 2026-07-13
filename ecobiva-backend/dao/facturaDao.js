const pool = require("../config/db");
const { generarNumeroFactura } = require("./ordenDao");

// -----------------------------------------------------------------------------
// Una orden puede llegar a tener HASTA DOS facturas: una tipo 'diagnostico'
// (generada automáticamente por ordenDao.registrarAprobacion si el cliente
// rechaza un diagnóstico profundo con costo) y una tipo 'reparacion' (la que
// se crea manualmente acá, desde este módulo, cuando la reparación termina).
// La clave única compuesta (idOrdenServicio, tipo) en la tabla Factura es lo
// que permite que coexistan ambas sin chocar.
// -----------------------------------------------------------------------------

const SELECT_BASE = `
    SELECT
        f.idFactura,
        f.idOrdenServicio,
        f.numeroFactura,
        f.tipo,
        f.fechaEmision,
        f.subtotalManoObra,
        f.subtotalRepuestos,
        f.descuento,
        f.impuestos,
        f.total,
        f.metodoPago,
        f.pagoConfirmado,
        f.fechaPago,
        f.idUsuarioCreador,
        o.folio AS ordenFolio,
        o.estado AS ordenEstado
    FROM Factura f
    JOIN OrdenServicio o ON o.idOrden = f.idOrdenServicio
`;

async function listar() {
  const [rows] = await pool.query(`${SELECT_BASE} ORDER BY f.fechaEmision DESC`);
  return rows;
}

async function obtenerPorId(idFactura, connection = pool) {
  const [rows] = await connection.query(`${SELECT_BASE} WHERE f.idFactura = ?`, [idFactura]);
  return rows[0] || null;
}

async function obtenerPorOrden(idOrdenServicio) {
  const [rows] = await pool.query(
    `${SELECT_BASE} WHERE f.idOrdenServicio = ? ORDER BY f.fechaEmision ASC`,
    [idOrdenServicio],
  );
  return rows;
}

/**
 * Crea la factura de reparación de una orden. Solo se permite cuando la
 * orden está "finalizada" (la reparación ya terminó, pero todavía no se
 * entrega) — esto es justamente lo que exige ordenDao.actualizarEstado antes
 * de dejar pasar a "entregada".
 */
async function crearFacturaReparacion(idOrdenServicio, datos, idUsuario) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [ordenRows] = await connection.query(
      "SELECT estado, folio FROM OrdenServicio WHERE idOrden = ?",
      [idOrdenServicio],
    );
    const orden = ordenRows[0];
    if (!orden) {
      throw new Error("La orden no existe.");
    }
    if (orden.estado !== "finalizada") {
      throw new Error(
        `Solo se puede facturar la reparación cuando la orden está "finalizada" (estado actual: "${orden.estado}").`,
      );
    }

    const [existentes] = await connection.query(
      "SELECT idFactura FROM Factura WHERE idOrdenServicio = ? AND tipo = 'reparacion'",
      [idOrdenServicio],
    );
    if (existentes.length > 0) {
      throw new Error(`La orden ${orden.folio} ya tiene una factura de reparación.`);
    }

    const subtotalManoObra = Number(datos.subtotalManoObra || 0);
    const subtotalRepuestos = Number(datos.subtotalRepuestos || 0);
    const descuento = Number(datos.descuento || 0);
    const impuestos = Number(datos.impuestos || 0);
    const total = subtotalManoObra + subtotalRepuestos + impuestos - descuento;

    const numeroFactura = await generarNumeroFactura(connection);

    const [result] = await connection.query(
      `
            INSERT INTO Factura
            (idOrdenServicio, numeroFactura, tipo, subtotalManoObra, subtotalRepuestos, descuento, impuestos, total, metodoPago, pagoConfirmado, idUsuarioCreador)
            VALUES (?, ?, 'reparacion', ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      [
        idOrdenServicio,
        numeroFactura,
        subtotalManoObra,
        subtotalRepuestos,
        descuento,
        impuestos,
        total,
        datos.metodoPago ?? null,
        datos.pagoConfirmado ? 1 : 0,
        idUsuario,
      ],
    );

    const factura = await obtenerPorId(result.insertId, connection);

    await connection.commit();
    return factura;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Marca una factura como pagada. No cambia el estado de la orden (eso se
 * hace aparte, vía PATCH /api/ordenes/:id/estado a "entregada").
 */
async function marcarPagada(idFactura, { metodoPago, fechaPago }) {
  const existente = await obtenerPorId(idFactura);
  if (!existente) {
    throw new Error("La factura no existe.");
  }
  if (existente.pagoConfirmado) {
    throw new Error(`La factura ${existente.numeroFactura} ya estaba marcada como pagada.`);
  }

  await pool.query(
    `
        UPDATE Factura
        SET pagoConfirmado = 1,
            metodoPago = ?,
            fechaPago = ?
        WHERE idFactura = ?
    `,
    [metodoPago || existente.metodoPago || null, fechaPago || new Date(), idFactura],
  );

  return obtenerPorId(idFactura);
}

module.exports = {
  listar,
  obtenerPorId,
  obtenerPorOrden,
  crearFacturaReparacion,
  marcarPagada,
};
