import { tecnicosApi } from "../api/api";

export async function listarTecnicos() {
  const { data } = await tecnicosApi.listar();
  return data;
}

export async function obtenerTecnico(id) {
  const { data } = await tecnicosApi.obtenerPorId(id);
  return data;
}

export async function crearTecnico(payload) {
  const { data } = await tecnicosApi.crear(payload);
  return data;
}

export async function editarTecnico(id, payload) {
  const { data } = await tecnicosApi.editar(id, payload);
  return data;
}

export async function desactivarTecnico(id) {
  const { data } = await tecnicosApi.desactivar(id);
  return data;
}

export async function reactivarTecnico(id) {
  const { data } = await tecnicosApi.reactivar(id);
  return data;
}
