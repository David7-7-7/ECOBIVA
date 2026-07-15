import api from "../api/api";

// ===============================
// LISTADO
// ===============================

export const listarReparaciones = async () => {
  const { data } = await api.get("/reparaciones");
  return data;
};

// ===============================
// OBTENER
// ===============================

export const obtenerReparacion = async (idOrden) => {
  const { data } = await api.get(`/reparaciones/${idOrden}`);
  return data;
};

// ===============================
// GUARDAR (mano de obra)
// ===============================

export const guardarReparacion = async (idOrden, reparacion) => {
  const { data } = await api.put(`/reparaciones/${idOrden}`, reparacion);
  return data;
};

// ===============================
// FINALIZAR (bloquea, pasa la orden a "finalizada" y genera la factura)
// ===============================

export const finalizarReparacion = async (idOrden) => {
  const { data } = await api.post(`/reparaciones/${idOrden}/finalizar`);
  return data;
};

// ===============================
// REPUESTOS
// ===============================

export const listarRepuestosReparacion = async (idOrden) => {
  const { data } = await api.get(`/reparaciones/${idOrden}/repuestos`);
  return data;
};

// datos: { idRepuesto, cantidad, descripcion, foto } — foto es un File
// opcional. Se envía como multipart/form-data porque el backend acepta una
// fotografía del repuesto usado (req.file, campo "foto").
export const agregarRepuestoReparacion = async (idOrden, datos) => {
  const formData = new FormData();

  formData.append("idRepuesto", datos.idRepuesto);
  formData.append("cantidad", datos.cantidad);
  if (datos.descripcion) formData.append("descripcion", datos.descripcion);
  if (datos.foto) formData.append("foto", datos.foto);

  const { data } = await api.post(
    `/reparaciones/${idOrden}/repuestos`,
    formData,
  );

  return data;
};

export const eliminarRepuestoReparacion = async (
  idOrden,
  idReparacionRepuesto,
) => {
  const { data } = await api.delete(
    `/reparaciones/${idOrden}/repuestos/${idReparacionRepuesto}`,
  );
  return data;
};
