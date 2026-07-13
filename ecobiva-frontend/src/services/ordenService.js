import api from "../api/api";

export const obtenerOrdenes = async () => {
  const { data } = await api.get("/ordenes");
  return data;
};

export const obtenerOrden = async (id) => {
  const { data } = await api.get(`/ordenes/${id}`);
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

export const eliminarOrden = async (id) => {
  const { data } = await api.delete(`/ordenes/${id}`);
  return data;
};