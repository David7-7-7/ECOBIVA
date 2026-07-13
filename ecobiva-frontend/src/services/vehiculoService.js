import api from '../api/api';

export const obtenerVehiculos = async () => {
  const { data } = await api.get('/vehiculos');
  return data;
};

export const obtenerVehiculo = async (id) => {
  const { data } = await api.get(`/vehiculos/${id}`);
  return data;
};

export const crearVehiculo = async (vehiculo) => {
  const { data } = await api.post('/vehiculos', vehiculo);
  return data;
};

export const actualizarVehiculo = async (id, vehiculo) => {
  const { data } = await api.put(`/vehiculos/${id}`, vehiculo);
  return data;
};

export const eliminarVehiculo = async (id) => {
  const { data } = await api.delete(`/vehiculos/${id}`);
  return data;
};
