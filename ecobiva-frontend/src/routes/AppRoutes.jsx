import { Routes, Route, Navigate } from "react-router-dom";

import ProtectedRoute from "./ProtectedRoute";
import MainLayout from "../layouts/MainLayout";

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
import Diagnosticos from "../pages/Diagnosticos/Diagnosticos";
import Reportes from "../pages/Reportes/Reportes";
import Configuracion from "../pages/Configuracion/Configuracion";
import AlertasStock from "../pages/AlertasStock/AlertasStock";
import TerminosGarantia from "../pages/TerminosGarantia/TerminosGarantia";

// Backend
import Usuarios from "../pages/Usuarios/Usuarios";
import Permisos from "../pages/Permisos/Permisos";
import Auditoria from "../pages/Auditoria/Auditoria";

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

      {/* Privadas */}

      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/clientes" element={<Clientes />} />

          <Route path="/vehiculos" element={<Vehiculos />} />

          <Route path="/tecnicos" element={<Tecnicos />} />

          <Route path="/inventario" element={<Inventario />} />

          <Route path="/ordenes" element={<Ordenes />} />

          <Route path="/diagnosticos" element={<Diagnosticos />} />

          <Route path="/diagnosticos/:idOrden" element={<Diagnosticos />} />

          <Route path="/reportes" element={<Reportes />} />

          <Route path="/configuracion" element={<Configuracion />} />

          <Route path="/alertas-stock" element={<AlertasStock />} />
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

          <Route path="/terminos-garantia" element={<TerminosGarantia />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
