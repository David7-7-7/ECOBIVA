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
    FaSignOutAlt,
    FaBars
} from "react-icons/fa";

import { Link, useLocation } from "react-router-dom";

import { useLayout } from "../../context/LayoutContext";

export default function Sidebar() {

    const location = useLocation();

    const {
        sidebarOpen,
        toggleSidebar
    } = useLayout();

    const menu = [

        {
            nombre: "Dashboard",
            ruta: "/dashboard",
            icon: <FaHome />
        },

        {
            nombre: "Clientes",
            ruta: "/clientes",
            icon: <FaUsers />
        },

        {
            nombre: "Vehículos",
            ruta: "/vehiculos",
            icon: <FaCar />
        },

        {
            nombre: "Órdenes",
            ruta: "/ordenes",
            icon: <FaClipboardList />
        },

        {
            nombre: "Inventario",
            ruta: "/inventario",
            icon: <FaWarehouse />
        },

        {
            nombre: "Técnicos",
            ruta: "/tecnicos",
            icon: <FaTools />
        },

        {
            nombre: "Reportes",
            ruta: "/reportes",
            icon: <FaChartPie />
        },

        {
            nombre: "Configuración",
            ruta: "/configuracion",
            icon: <FaCog />
        }

    ];

    return (

        <aside
            className={
                sidebarOpen
                    ? "sidebar"
                    : "sidebar collapsed"
            }
        >

            <div>

                <div className="brand">

                    <div className="brand-logo">

                        E

                    </div>

                    {

                        sidebarOpen && (

                            <>

                                <h2>ECOBIVA</h2>

                                <p>

                                    Sistema de Gestión

                                </p>

                            </>

                        )

                    }

                </div>

                <div
                    className="collapseButton"
                    onClick={toggleSidebar}
                >

                    <FaBars />

                </div>

                <ul>

                    {

                        menu.map((item) => (

                            <li
                                key={item.ruta}
                                className={
                                    location.pathname === item.ruta
                                        ? "active"
                                        : ""
                                }
                            >

                                <Link to={item.ruta}>

                                    {item.icon}

                                    {

                                        sidebarOpen &&

                                        <span>

                                            {item.nombre}

                                        </span>

                                    }

                                </Link>

                            </li>

                        ))

                    }

                </ul>

            </div>

            <button className="logoutButton">

                <FaSignOutAlt />

                {

                    sidebarOpen &&

                    <span>

                        Cerrar sesión

                    </span>

                }

            </button>

        </aside>

    );

}