import api from "../api/api";

export async function listarAlertasStock(estado) {
  const { data } = await api.get("/alertas-stock", { params: estado ? { estado } : {} });
  return data;
}

export async function atenderAlertaStock(id) {
  const { data } = await api.patch(`/alertas-stock/${id}/atender`);
  return data;
}
