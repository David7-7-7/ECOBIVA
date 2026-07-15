import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Adjunta el token JWT guardado en localStorage a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ecobiva_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Si el backend responde 401, el token expiró o es inválido -> forzar logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("ecobiva_token");
      localStorage.removeItem("ecobiva_usuario");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

// ---------- Auth ----------
export const authApi = {
  login: (correo, password) => api.post("/auth/login", { correo, password }),
  catalogoPreguntas: () => api.get("/auth/preguntas-catalogo"),
  preguntasDeUsuario: (correo) =>
    api.get("/auth/preguntas-seguridad", { params: { correo } }),
  configurarPreguntas: (payload) =>
    api.post("/auth/preguntas-seguridad", payload),
  validarPreguntas: (correo, respuestas) =>
    api.post("/auth/validar-preguntas", { correo, respuestas }),
  resetPassword: (token, nuevaPassword) =>
    api.put(`/auth/reset-password/${token}`, { nuevaPassword }),
};

// ---------- Usuarios ----------
export const usuariosApi = {
  listar: () => api.get("/usuarios"),
  crear: (payload) => api.post("/usuarios", payload),
  editar: (id, payload) => api.put(`/usuarios/${id}`, payload),
  desactivar: (id) => api.delete(`/usuarios/${id}`),
  activar: (id) => api.patch(`/usuarios/${id}/activar`),
};

// ---------- Roles ----------
export const rolesApi = {
  listar: () => api.get("/roles"),
};

// ---------- Perfil ----------
export const perfilApi = {
  cambiarPassword: (passwordActual, nuevaPassword) =>
    api.put("/perfil/password", { passwordActual, nuevaPassword }),
  miPerfil: () => api.get("/perfil/me"),
  actualizarMiPerfil: (telefono, correo) =>
    api.put("/perfil/me", { telefono, correo }),
};

// ---------- Permisos (RBAC) ----------
export const permisosApi = {
  mios: () => api.get("/permisos/mios"),
  matriz: () => api.get("/permisos"),
  catalogo: () => api.get("/permisos/catalogo"),
  actualizar: (cambios) => api.put("/permisos", { cambios }),
};

// ---------- Auditoría ----------
export const auditoriaApi = {
  consultar: (filtros) => api.get("/auditoria", { params: filtros }),
  exportar: (filtros) =>
    api.get("/auditoria/exportar", { params: filtros, responseType: "blob" }),
};

// ---------- Empleados (RRHH) ----------
export const empleadosApi = {
  listar: () => api.get("/empleados"),
  obtenerPorId: (id) => api.get(`/empleados/${id}`),
  crear: (payload) => api.post("/empleados", payload),
  editar: (id, payload) => api.put(`/empleados/${id}`, payload),
  desactivar: (id) => api.patch(`/empleados/${id}/desactivar`),
  reactivar: (id) => api.patch(`/empleados/${id}/reactivar`),
  crearUsuario: (id, payload) =>
    api.post(`/empleados/${id}/crear-usuario`, payload),
};

// ---------- Técnicos ----------
export const tecnicosApi = {
  listar: () => api.get("/tecnicos"),
  obtenerPorId: (id) => api.get(`/tecnicos/${id}`),
  // Ya no existe POST /tecnicos: el alta se hace desde Usuarios (rol
  // Tecnico) o desde Empleados > crear-usuario.
  editar: (id, payload) => api.put(`/tecnicos/${id}`, payload),
  desactivar: (id) => api.patch(`/tecnicos/${id}/desactivar`),
  reactivar: (id) => api.patch(`/tecnicos/${id}/reactivar`),
};

// ---------- Historial de Cargo (RRHH) ----------
export const historialCargoApi = {
  listar: () => api.get("/historial-cargo"),
  listarPorEmpleado: (idEmpleado) =>
    api.get(`/historial-cargo/empleado/${idEmpleado}`),
  obtenerPorId: (id) => api.get(`/historial-cargo/${id}`),
  crear: (payload) => api.post("/historial-cargo", payload),
};

// ---------- Nómina (RRHH) ----------
export const nominaApi = {
  listar: () => api.get("/nominas"),
  obtenerPorId: (id) => api.get(`/nominas/${id}`),
  preview: (payload) => api.post("/nominas/preview", payload),
  generar: (payload) => api.post("/nominas", payload),
  recalcular: (id) => api.put(`/nominas/${id}/recalcular`),
  actualizar: (id, payload) => api.put(`/nominas/${id}`, payload),
  eliminar: (id) => api.delete(`/nominas/${id}`),
};

export default api;
