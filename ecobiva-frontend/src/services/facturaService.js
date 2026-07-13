import api from "../api/api";

export const listarFacturas = async () => {
  const { data } = await api.get("/facturas");
  return data;
};

export const obtenerFactura = async (id) => {
  const { data } = await api.get(`/facturas/${id}`);
  return data;
};

// Una orden puede tener hasta 2 facturas: 'diagnostico' (automática, solo si
// el cliente rechaza un diagnóstico profundo con costo) y 'reparacion'
// (manual, se crea desde este módulo cuando la reparación termina).
export const obtenerFacturasPorOrden = async (idOrden) => {
  const { data } = await api.get(`/facturas/orden/${idOrden}`);
  return data;
};

// Crea la factura de reparación de una orden. Solo funciona si la orden
// está "finalizada" y no tiene ya una factura tipo 'reparacion'.
export const crearFacturaReparacion = async (factura) => {
  const { data } = await api.post("/facturas", factura);
  return data;
};

export const marcarFacturaPagada = async (id, { metodoPago, fechaPago }) => {
  const { data } = await api.patch(`/facturas/${id}/pagar`, {
    metodoPago,
    fechaPago,
  });
  return data;
};
