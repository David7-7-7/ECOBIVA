import api from '../api/api';

export const obtenerKardex = async () => {
  const { data } = await api.get('/kardex');
  return data;
};

export const obtenerMovimientos = obtenerKardex;

export const crearMovimiento = async (movimiento) => {
  const { data } = await api.post('/kardex', movimiento);
  return data;
};

export const obtenerMovimientosPorRepuesto = async (idRepuesto) => {
  const { data } = await api.get(`/kardex/producto/repuesto/${idRepuesto}`);
  return data;
};