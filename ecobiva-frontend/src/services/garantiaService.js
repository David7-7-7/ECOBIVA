import api from "../api/api";

export const crearOrdenGarantia = async (datos) => (await api.post("/ordenes-garantia", datos)).data;
export const obtenerGarantiasPorOrden = async (idOrden) => (await api.get(`/ordenes-garantia/origen/${idOrden}`)).data;
export const actualizarGarantia = async (id, datos) => (await api.put(`/ordenes-garantia/${id}`, datos)).data;
export const cambiarEstadoGarantia = async (id, nuevoEstado) => (await api.patch(`/ordenes-garantia/${id}/estado`, { nuevoEstado })).data;
export const listarTerminosGarantia = async () => (await api.get("/terminos-garantia")).data;
export const crearTerminoGarantia = async (datos) => (await api.post("/terminos-garantia", datos)).data;
export const actualizarTerminoGarantia = async (id, datos) => (await api.put(`/terminos-garantia/${id}`, datos)).data;
export const cambiarVigenciaTermino = async (id, vigente) => (await api.patch(`/terminos-garantia/${id}/vigencia`, { vigente })).data;
