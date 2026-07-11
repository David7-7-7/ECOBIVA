import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function ProtectedRoute({ rolesPermitidos }) {

    const { estaAutenticado, tieneAlgunRol } = useAuth();

    if (!estaAutenticado) {
        return <Navigate to="/login" replace />;
    }

    if (
        rolesPermitidos &&
        !tieneAlgunRol(rolesPermitidos)
    ) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;

}