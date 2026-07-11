import { auditoriaApi } from "../api/api";

export async function consultarAuditoria(filtros) {

    const { data } = await auditoriaApi.consultar(filtros);

    return data;

}

export function exportarAuditoria(filtros) {

    return auditoriaApi.exportarUrl(filtros);

}