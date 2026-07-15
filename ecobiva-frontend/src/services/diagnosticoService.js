import api from "../api/api";

// ===============================
// LISTADO
// ===============================

export const listarDiagnosticos = async () => {
  const { data } = await api.get("/diagnosticos");
  return data;
};

// ===============================
// OBTENER
// ===============================

export const obtenerDiagnostico = async (idOrden) => {
  const { data } = await api.get(`/diagnosticos/${idOrden}`);
  return data;
};

// ===============================
// GUARDAR (UPSERT)
// ===============================

export const guardarDiagnostico = async (idOrden, diagnostico) => {
  const { data } = await api.put(`/diagnosticos/${idOrden}`, diagnostico);

  return data;
};

// ===============================
// ENVIAR A APROBACIÓN
// ===============================

export const enviarDiagnosticoAAprobacion = async (idOrden) => {
  const { data } = await api.post(`/diagnosticos/${idOrden}/enviar-aprobacion`);

  return data;
};
