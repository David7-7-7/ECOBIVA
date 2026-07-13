import "./Sidebar.css";

import {
  FaHome,
  FaUsers,
  FaCar,
  FaClipboardList,
  FaWarehouse,
  FaTools,
  FaChartPie,
  FaCog,
  FaUserShield,
  FaKey,
  FaHistory,
  FaLock,
  FaSignOutAlt,
  FaBars,
  FaUserTie,
  FaExchangeAlt,
  FaMoneyCheckAlt,
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";

import { useLayout } from "../../context/LayoutContext";
import { useAuth } from "../../context/AuthContext";

const MENU = [
  {
    nombre: "Dashboard",
    ruta: "/dashboard",
    icono: <FaHome />,
    roles: ["Admin", "Asesor", "Tecnico"],
  },
  {
    nombre: "Clientes",
    ruta: "/clientes",
    icono: <FaUsers />,
    roles: ["Admin", "Asesor"],
  },
  {
    nombre: "Vehículos",
    ruta: "/vehiculos",
    icono: <FaCar />,
    roles: ["Admin", "Asesor", "Tecnico"],
  },
  {
    nombre: "Órdenes",
    ruta: "/ordenes",
    icono: <FaClipboardList />,
    roles: ["Admin", "Asesor", "Tecnico"],
  },
  {
    nombre: "Inventario",
    ruta: "/inventario",
    icono: <FaWarehouse />,
    roles: ["Admin"],
  },
  {
    nombre: "Técnicos",
    ruta: "/tecnicos",
    icono: <FaTools />,
    roles: ["Admin"],
  },
  {
    nombre: "Reportes",
    ruta: "/reportes",
    icono: <FaChartPie />,
    roles: ["Admin"],
  },
  {
    nombre: "Configuración",
    ruta: "/configuracion",
    icono: <FaCog />,
    roles: ["Admin"],
  },

  // Seguridad
  {
    nombre: "Usuarios",
    ruta: "/usuarios",
    icono: <FaUserShield />,
    roles: ["Admin"],
  },
  {
    nombre: "Permisos",
    ruta: "/permisos",
    icono: <FaKey />,
    roles: ["Admin"],
  },
  {
    nombre: "Auditoría",
    ruta: "/auditoria",
    icono: <FaHistory />,
    roles: ["Admin"],
  },

  // RRHH
  {
    nombre: "Empleados",
    ruta: "/empleados",
    icono: <FaUserTie />,
    roles: ["Admin"],
  },
  {
    nombre: "Historial Cargo",
    ruta: "/historial-cargo",
    icono: <FaExchangeAlt />,
    roles: ["Admin"],
  },
  {
    nombre: "Nómina",
    ruta: "/nomina",
    icono: <FaMoneyCheckAlt />,
    roles: ["Admin"],
  },

  {
    nombre: "Mi contraseña",
    ruta: "/perfil",
    icono: <FaLock />,
    roles: ["Admin", "Asesor", "Tecnico"],
  },
];

export default function Sidebar() {
  const location = useLocation();

  const { sidebarOpen, toggleSidebar } = useLayout();

  const { usuario, nombresRoles, logout } = useAuth();

  const menuVisible = MENU.filter((item) =>
    item.roles.some((r) => nombresRoles.includes(r)),
  );

  return (
    <aside className={sidebarOpen ? "sidebar" : "sidebar collapsed"}>
      <div>
        <div className="brand">
          <div className="brand-logo">E</div>

          {sidebarOpen && (
            <div>
              <h2>ECOBIVA</h2>

              <p>{usuario?.correo}</p>

              <small>{nombresRoles.join(" · ")}</small>
            </div>
          )}
        </div>

        <div className="collapseButton" onClick={toggleSidebar}>
          <FaBars />
        </div>

        <ul>
          {menuVisible.map((item) => (
            <li
              key={item.ruta}
              className={location.pathname === item.ruta ? "active" : ""}
            >
              <Link to={item.ruta}>
                {item.icono}

                {sidebarOpen && <span>{item.nombre}</span>}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <button className="logoutButton" onClick={logout}>
        <FaSignOutAlt />

        {sidebarOpen && <span>Cerrar sesión</span>}
      </button>
    </aside>
  );
}
