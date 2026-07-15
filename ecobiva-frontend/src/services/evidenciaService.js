import api from "../api/api";

export const crearEvidencia = async (datos) => {
  const response = await api.post("/evidencias", datos);
  return response.data;
};

export const subirFoto = async (idEvidencia, archivo) => {
  const formData = new FormData();

  formData.append("idEvidencia", idEvidencia);
  formData.append("foto", archivo);

  const response = await api.post("/evidencias/foto", formData);

  return response.data;
};

export const obtenerEvidenciasPorOrden = async (idOrden) => {
  const { data } = await api.get(`/evidencias/orden/${idOrden}`);
  return data;
};
