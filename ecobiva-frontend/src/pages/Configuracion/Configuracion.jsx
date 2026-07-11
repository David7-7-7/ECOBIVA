import "./Configuracion.css";

import MainLayout from "../../layouts/MainLayout";

import { FaPlus, FaSearch, FaFilter } from "react-icons/fa";
import PageHeader from "../../components/PageHeader/PageHeader";


import { FaUserCog, FaBuilding, FaLock, FaPalette, FaCog, FaSave }

    from "react-icons/fa";

export default function Configuracion() {

    return (

        <>

            <PageHeader

                title="Configuración"

                subtitle="Configuración general del sistema."

            />

            <div className="configContainer">

                <div className="configMenu">

                    <button>

                        <FaUserCog />

                        Perfil

                    </button>

                    <button>

                        <FaBuilding />

                        Empresa

                    </button>

                    <button>

                        <FaLock />

                        Seguridad

                    </button>

                    <button>

                        <FaPalette />

                        Apariencia

                    </button>

                    <button>

                        <FaCog />

                        Preferencias

                    </button>

                </div>

                <div className="configContent">

                    <div className="configCard">

                        <h2>Información del Usuario</h2>

                        <div className="grid2">

                            <div>

                                <label>Nombre</label>

                                <input

                                    type="text"

                                    value="Administrador"

                                    readOnly

                                />

                            </div>

                            <div>

                                <label>Correo</label>

                                <input

                                    type="email"

                                    value="admin@ecobiva.com"

                                    readOnly

                                />

                            </div>

                            <div>

                                <label>Teléfono</label>

                                <input

                                    type="text"

                                    value="3201234567"

                                />

                            </div>

                            <div>

                                <label>Cargo</label>

                                <input

                                    value="Administrador"

                                    readOnly

                                />

                            </div>

                        </div>

                    </div>

                    <div className="configCard">

                        <h2>Cambiar Contraseña</h2>

                        <div className="grid2">

                            <div>

                                <label>Contraseña Actual</label>

                                <input type="password" />

                            </div>

                            <div>

                                <label>Nueva Contraseña</label>

                                <input type="password" />

                            </div>

                        </div>

                    </div>

                    <div className="configFooter">

                        <button className="guardarConfig">

                            <FaSave />

                            Guardar Cambios

                        </button>

                    </div>

                </div>

            </div>

        </>

    )

}