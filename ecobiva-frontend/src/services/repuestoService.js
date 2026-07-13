import api from '../api/api';

export const obtenerRepuestos = async () => {
  const { data } = await api.get('/repuestos');
  return data;
};

export const obtenerRepuesto = async (id) => {
  const { data } = await api.get(`/repuestos/${id}`);
  return data;
};

export const crearRepuesto = async (repuesto) => {
  const { data } = await api.post('/repuestos', repuesto);
  return data;
};

export const actualizarRepuesto = async (id, repuesto) => {
  const { data } = await api.put(`/repuestos/${id}`, repuesto);
  return data;
};

export const eliminarRepuesto = async (id) => {
  const { data } = await api.delete(`/repuestos/${id}`);
  return data;
};