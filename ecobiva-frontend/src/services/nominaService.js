import { nominaApi } from "../api/api";

export async function listarNominas() {
  const { data } = await nominaApi.listar();
  return data;
}

export async function obtenerNomina(id) {
  const { data } = await nominaApi.obtenerPorId(id);
  return data;
}

export async function previsualizarNomina(payload) {
  const { data } = await nominaApi.preview(payload);
  return data;
}

export async function generarNomina(payload) {
  const { data } = await nominaApi.generar(payload);
  return data;
}

export async function recalcularNomina(id) {
  const { data } = await nominaApi.recalcular(id);
  return data;
}

export async function editarNomina(id, payload) {
  const { data } = await nominaApi.actualizar(id, payload);
  return data;
}

export async function eliminarNomina(id) {
  const { data } = await nominaApi.eliminar(id);
  return data;
}
