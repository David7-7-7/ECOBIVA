import api from "../api/api";

// Obtener todos
export const obtenerVehiculos = async () => {
  const { data } = await api.get("/vehiculos");
  return data;
};

// Obtener uno
export const obtenerVehiculo = async (id) => {
  const { data } = await api.get(`/vehiculos/${id}`);
  return data;
};

// Crear
export const crearVehiculo = async (vehiculo) => {
  const { data } = await api.post("/vehiculos", vehiculo);
  return data;
};

// Actualizar
export const actualizarVehiculo = async (id, vehiculo) => {
  const { data } = await api.put(`/vehiculos/${id}`, vehiculo);
  return data;
};

// Desactivar
export const eliminarVehiculo = async (id) => {
  const { data } = await api.delete(`/vehiculos/${id}`);
  return data;
};

// Reactivar
export const reactivarVehiculo = async (id) => {
  const { data } = await api.put(`/vehiculos/${id}/reactivar`);
  return data;
};
