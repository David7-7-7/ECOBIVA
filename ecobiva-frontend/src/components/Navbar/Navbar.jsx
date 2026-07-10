import "./Navbar.css";

import { FaBell } from "react-icons/fa";

export default function Navbar() {

    return (

        <header className="navbar">

            <div>

                <h2>

                    Sistema de Gestión Taller

                </h2>

                <p>

                    EcoBiva

                </p>

            </div>

            <div className="navbar-right">

                <FaBell className="icon" />

                <div className="profile">

                    <div className="avatar">

                        A

                    </div>

                    <div>

                        <strong>Administrador</strong>

                        <p>Administrador General</p>

                    </div>

                </div>

            </div>

        </header>

    )

}