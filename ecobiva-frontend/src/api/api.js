import axios from 'axios';

const api = axios.create({
  baseURL: "http://localhost:3000/api",
});

// Adjunta el token JWT guardado en localStorage a cada request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ecobiva_token');
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
      localStorage.removeItem('ecobiva_token');
      localStorage.removeItem('ecobiva_usuario');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------
export const authApi = {
  login: (correo, password) => api.post('/auth/login', { correo, password }),
  catalogoPreguntas: () => api.get('/auth/preguntas-catalogo'),
  preguntasDeUsuario: (correo) => api.get('/auth/preguntas-seguridad', { params: { correo } }),
  configurarPreguntas: (payload) => api.post('/auth/preguntas-seguridad', payload),
  validarPreguntas: (correo, respuestas) => api.post('/auth/validar-preguntas', { correo, respuestas }),
  resetPassword: (token, nuevaPassword) => api.put(`/auth/reset-password/${token}`, { nuevaPassword })
};

// ---------- Usuarios ----------
export const usuariosApi = {
  listar: () => api.get('/usuarios'),
  crear: (payload) => api.post('/usuarios', payload),
  editar: (id, payload) => api.put(`/usuarios/${id}`, payload),
  desactivar: (id) => api.delete(`/usuarios/${id}`)
};

// ---------- Roles ----------
export const rolesApi = {
  listar: () => api.get('/roles')
};

// ---------- Perfil ----------
export const perfilApi = {
  cambiarPassword: (passwordActual, nuevaPassword) =>
    api.put('/perfil/password', { passwordActual, nuevaPassword })
};

// ---------- Permisos (RBAC) ----------
export const permisosApi = {
  mios: () => api.get('/permisos/mios'),
  matriz: () => api.get('/permisos'),
  catalogo: () => api.get('/permisos/catalogo'),
  actualizar: (cambios) => api.put('/permisos', { cambios })
};

// ---------- Auditoría ----------
export const auditoriaApi = {
  consultar: (filtros) => api.get('/auditoria', { params: filtros }),
  exportarUrl: (filtros) => {
    const params = new URLSearchParams(filtros).toString();
    return `/api/auditoria/exportar?${params}`;
  }
};

export default api;
