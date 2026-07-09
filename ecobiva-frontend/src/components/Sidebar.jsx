import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const BADGE_CLASE = {
  Admin: 'badge-admin',
  Tecnico: 'badge-tecnico',
  Asesor: 'badge-asesor'
};

// Menú por rol. Un usuario con varios roles activos ve la UNIÓN de los
// menús de todos sus roles (ej. si alguna vez tiene Tecnico + Asesor).
const MENU_POR_ROL = {
  Admin: [
    { to: '/usuarios', label: 'Usuarios' },
    { to: '/permisos', label: 'Permisos (RBAC)' },
    { to: '/auditoria', label: 'Auditoría' }
  ],
  Tecnico: [],
  Asesor: []
};

export default function Sidebar() {
  const { usuario, logout, nombresRoles } = useAuth();

  // Inicio y Mi contraseña siempre están, sin importar el rol
  const itemsBase = [{ to: '/dashboard', label: 'Inicio' }];
  const itemsPorRoles = nombresRoles.flatMap((rol) => MENU_POR_ROL[rol] || []);
  // Deduplicar por "to" en caso de que dos roles compartan una opción
  const itemsUnicos = [...new Map(itemsPorRoles.map((i) => [i.to, i])).values()];
  const items = [...itemsBase, ...itemsUnicos, { to: '/perfil', label: 'Mi contraseña' }];

  return (
    <aside className="sidebar">
      <div className="sidebar__brand">
        <div className="tag">ECOBIVA · Panel de pruebas</div>
        <h1>Taller EV</h1>
        <div className="sidebar__role">
          {usuario?.correo}
          <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {nombresRoles.map((rol) => (
              <span key={rol} className={`badge ${BADGE_CLASE[rol] || ''}`}>{rol}</span>
            ))}
          </div>
        </div>
      </div>

      <nav>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
      </div>
    </aside>
  );
}
