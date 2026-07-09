import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Layout from './components/Layout.jsx';

import Login from './pages/Login.jsx';
import Recuperacion from './pages/Recuperacion.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Usuarios from './pages/Usuarios.jsx';
import Permisos from './pages/Permisos.jsx';
import Auditoria from './pages/Auditoria.jsx';
import CambiarPassword from './pages/CambiarPassword.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar" element={<Recuperacion />} />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/perfil" element={
        <ProtectedRoute>
          <Layout><CambiarPassword /></Layout>
        </ProtectedRoute>
      } />

      {/* Solo Admin */}
      <Route path="/usuarios" element={
        <ProtectedRoute rolesPermitidos={['Admin']}>
          <Layout><Usuarios /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/permisos" element={
        <ProtectedRoute rolesPermitidos={['Admin']}>
          <Layout><Permisos /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/auditoria" element={
        <ProtectedRoute rolesPermitidos={['Admin']}>
          <Layout><Auditoria /></Layout>
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
