import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/api';

const AuthContext = createContext(null);

/**
 * NOTA: este contexto asume que POST /api/auth/login responde algo como:
 *   { token: "...", usuario: { idUsuario, correo, roles: [{ idRol, nombreRol }, ...] } }
 * (un usuario puede tener VARIOS roles activos a la vez, por la relación
 * N:M UsuarioRol). Si tu authController devuelve otras claves, ajusta el
 * mapeo dentro de login().
 */
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('ecobiva_token'));
  const [usuario, setUsuario] = useState(() => {
    const guardado = localStorage.getItem('ecobiva_usuario');
    return guardado ? JSON.parse(guardado) : null;
  });
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (token) localStorage.setItem('ecobiva_token', token);
    else localStorage.removeItem('ecobiva_token');
  }, [token]);

  useEffect(() => {
    if (usuario) localStorage.setItem('ecobiva_usuario', JSON.stringify(usuario));
    else localStorage.removeItem('ecobiva_usuario');
  }, [usuario]);

  async function login(correo, password) {
    setCargando(true);
    try {
      const { data } = await authApi.login(correo, password);
      // Ajusta aquí si tu backend nombra los campos distinto
      const nuevoUsuario = data.usuario || {
        idUsuario: data.idUsuario,
        correo: data.correo,
        roles: data.roles || []
      };
      setToken(data.token);
      setUsuario(nuevoUsuario);
      return { ok: true };
    } catch (err) {
      return { ok: false, mensaje: err.response?.data?.error || 'No se pudo iniciar sesión' };
    } finally {
      setCargando(false);
    }
  }

  function logout() {
    setToken(null);
    setUsuario(null);
  }

  // Helpers de conveniencia: nombres de roles activos, y si tiene alguno de una lista dada
  const nombresRoles = (usuario?.roles || []).map((r) => r.nombreRol);
  const tieneAlgunRol = (rolesPermitidos) => rolesPermitidos.some((r) => nombresRoles.includes(r));

  const value = {
    token,
    usuario,
    cargando,
    login,
    logout,
    estaAutenticado: !!token,
    nombresRoles,
    tieneAlgunRol
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
