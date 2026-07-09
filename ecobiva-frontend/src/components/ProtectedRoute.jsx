import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

// rolesPermitidos: array de nombres de rol, ej. ['Admin'] o ['Admin', 'Tecnico']
// Se concede acceso si el usuario tiene AL MENOS UNO de esos roles activos.
// Si se omite, solo exige estar autenticado (cualquier rol pasa).
export default function ProtectedRoute({ children, rolesPermitidos }) {
  const { estaAutenticado, tieneAlgunRol } = useAuth();

  if (!estaAutenticado) {
    return <Navigate to="/login" replace />;
  }

  if (rolesPermitidos && !tieneAlgunRol(rolesPermitidos)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
