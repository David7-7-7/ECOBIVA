import { empleadosApi } from "../api/api";

export async function listarEmpleados() {
  const { data } = await empleadosApi.listar();
  return data;
}

export async function obtenerEmpleado(id) {
  const { data } = await empleadosApi.obtenerPorId(id);
  return data;
}

export async function crearEmpleado(payload) {
  const { data } = await empleadosApi.crear(payload);
  return data;
}

export async function editarEmpleado(id, payload) {
  const { data } = await empleadosApi.editar(id, payload);
  return data;
}

export async function desactivarEmpleado(id) {
  const { data } = await empleadosApi.desactivar(id);
  return data;
}

export async function reactivarEmpleado(id) {
  const { data } = await empleadosApi.reactivar(id);
  return data;
}

export async function crearUsuarioDeEmpleado(id, payload) {
  const { data } = await empleadosApi.crearUsuario(id, payload);
  return data;
}
