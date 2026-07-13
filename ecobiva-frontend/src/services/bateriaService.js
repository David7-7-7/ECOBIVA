import api from '../api/api';

export const obtenerBaterias = async () => {
  const { data } = await api.get('/baterias');
  return data;
};

export const obtenerBateria = async (id) => {
  const { data } = await api.get(`/baterias/${id}`);
  return data;
};

export const crearBateria = async (bateria) => {
  const { data } = await api.post('/baterias', bateria);
  return data;
};

export const actualizarBateria = async (id, bateria) => {
  const { data } = await api.put(`/baterias/${id}`, bateria);
  return data;
};

export const eliminarBateria = async (id) => {
  const { data } = await api.delete(`/baterias/${id}`);
  return data;
};