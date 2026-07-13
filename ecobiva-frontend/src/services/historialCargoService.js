import { historialCargoApi } from "../api/api";

export async function listarHistorialCargo() {
  const { data } = await historialCargoApi.listar();
  return data;
}

export async function listarHistorialPorEmpleado(idEmpleado) {
  const { data } = await historialCargoApi.listarPorEmpleado(idEmpleado);
  return data;
}

export async function obtenerHistorialCargo(id) {
  const { data } = await historialCargoApi.obtenerPorId(id);
  return data;
}

export async function crearHistorialCargo(payload) {
  const { data } = await historialCargoApi.crear(payload);
  return data;
}
