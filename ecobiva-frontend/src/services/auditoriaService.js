import { auditoriaApi } from "../api/api";

export async function consultarAuditoria(filtros) {
  const { data } = await auditoriaApi.consultar(filtros);

  return data;
}

export async function exportarAuditoria(filtros) {
  const { data } = await auditoriaApi.exportar(filtros);

  return data;
}
