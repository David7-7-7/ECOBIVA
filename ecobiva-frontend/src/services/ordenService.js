import api from "../api/api";

export const obtenerOrdenes = async () => {
  const { data } = await api.get("/ordenes");
  return data;
};

export const obtenerOrden = async (id) => {
  const { data } = await api.get(`/ordenes/${id}`);
  return data;
};

export const obtenerHistorialOrden = async (id) => {
  const { data } = await api.get(`/ordenes/${id}/historial`);
  return data;
};

export const crearOrden = async (orden) => {
  const { data } = await api.post("/ordenes", orden);
  return data;
};

export const actualizarOrden = async (id, orden) => {
  const { data } = await api.put(`/ordenes/${id}`, orden);
  return data;
};

export const cambiarEstadoOrden = async (id, estado, motivo) => {
  const { data } = await api.patch(`/ordenes/${id}/estado`, { estado, motivo });
  return data;
};

// Autoasignación: el técnico autenticado se asigna a sí mismo una orden
// que está en pendiente_asignacion. El backend valida cupo/estado; acá
// solo se dispara la acción.
export const autoasignarOrden = async (id) => {
  const { data } = await api.patch(`/ordenes/${id}/autoasignar`);
  return data;
};

// Registra la respuesta del cliente (aprobado/rechazado) frente al
// diagnóstico de la orden. La captura hoy es remota: el asesor la marca
// en el sistema después de hablar con el cliente por fuera (WhatsApp/llamada).
export const registrarAprobacionOrden = async (id, aprobado, notas) => {
  const { data } = await api.patch(`/ordenes/${id}/aprobacion`, {
    aprobado,
    notas,
  });
  return data;
};

export const eliminarOrden = async (id) => {
  const { data } = await api.delete(`/ordenes/${id}`);
  return data;
};
