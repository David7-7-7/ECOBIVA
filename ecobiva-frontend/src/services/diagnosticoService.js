import api from "../api/api";

// Obtener el diagnóstico de una orden (1:1 con idOrdenServicio).
export const obtenerDiagnostico = async (idOrden) => {
  const { data } = await api.get(`/diagnosticos/${idOrden}`);
  return data;
};

// Crear o actualizar (upsert) el diagnóstico de una orden. Solo permitido
// mientras la orden está "en_diagnostico" y el diagnóstico no está bloqueado.
export const guardarDiagnostico = async (idOrden, diagnostico) => {
  const { data } = await api.put(`/diagnosticos/${idOrden}`, diagnostico);
  return data;
};

// Bloquea el diagnóstico y pasa la orden a "pendiente_aprobacion".
export const enviarDiagnosticoAAprobacion = async (idOrden) => {
  const { data } = await api.post(
    `/diagnosticos/${idOrden}/enviar-aprobacion`,
  );
  return data;
};
