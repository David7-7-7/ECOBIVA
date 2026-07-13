import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute"; // ajusta la ruta
import MainLayout from "../layouts/MainLayout"; // ajusta la ruta
// Auth
import Login from "../pages/Login/Login";
import Recuperacion from "../pages/Recuperacion/Recuperacion";

// Frontend
import Dashboard from "../pages/Dashboard/Dashboard";
import Clientes from "../pages/Clientes/Clientes";
import Vehiculos from "../pages/Vehiculos/Vehiculos";
import Tecnicos from "../pages/Tecnicos/Tecnicos";
import Inventario from "../pages/Inventario/Inventario";
import Ordenes from "../pages/Ordenes/Ordenes";
import Reportes from "../pages/Reportes/Reportes";
import Configuracion from "../pages/Configuracion/Configuracion";

// Backend
import Usuarios from "../pages/Usuarios/Usuarios";
import Permisos from "../pages/Permisos/Permisos";
import Auditoria from "../pages/Auditoria/Auditoria";
import CambiarPassword from "../pages/Perfil/CambiarPassword";

// RRHH
import Empleados from "../pages/Empleados/Empleados";
import HistorialCargo from "../pages/HistorialCargo/HistorialCargo";
import Nomina from "../pages/Nomina/Nomina";

export default function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}

      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/login" element={<Login />} />

      <Route path="/recuperar" element={<Recuperacion />} />

      {/* Todas las rutas privadas usan MainLayout */}

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/clientes" element={<Clientes />} />

          <Route path="/vehiculos" element={<Vehiculos />} />

          <Route path="/tecnicos" element={<Tecnicos />} />

          <Route path="/inventario" element={<Inventario />} />

          <Route path="/ordenes" element={<Ordenes />} />

          <Route path="/reportes" element={<Reportes />} />

          <Route path="/configuracion" element={<Configuracion />} />

          <Route path="/perfil" element={<CambiarPassword />} />
        </Route>
      </Route>

      {/* Solo Administrador */}

      <Route element={<ProtectedRoute rolesPermitidos={["Admin"]} />}>
        <Route element={<MainLayout />}>
          <Route path="/usuarios" element={<Usuarios />} />

          <Route path="/permisos" element={<Permisos />} />

          <Route path="/auditoria" element={<Auditoria />} />

          <Route path="/empleados" element={<Empleados />} />

          <Route path="/historial-cargo" element={<HistorialCargo />} />

          <Route path="/nomina" element={<Nomina />} />
        </Route>
      </Route>

      {/* Ruta inexistente */}

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
