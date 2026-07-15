import "./Reportes.css";

import MainLayout from "../../layouts/MainLayout";

import PageHeader from "../../components/PageHeader/PageHeader";

import {

    FaFileInvoice,

    FaUsers,

    FaCar,

    FaBoxOpen,

    FaMoneyBillWave,

    FaChartLine,

    FaDownload

}

    from "react-icons/fa";

export default function Reportes() {

    return (

        <>

            <PageHeader

                title="Reportes"

                subtitle="Indicadores y estadísticas del taller."

                actions={

                    <button className="btnDescargar">

                        <FaDownload />

                        Exportar PDF

                    </button>

                }

            />

            <div className="cardsReportes">

                <div className="reporteCard">

                    <FaFileInvoice className="iconReporte" />

                    <h2>258</h2>

                    <p>Órdenes realizadas</p>

                </div>

                <div className="reporteCard">

                    <FaUsers className="iconReporte" />

                    <h2>148</h2>

                    <p>Clientes registrados</p>

                </div>

                <div className="reporteCard">

                    <FaCar className="iconReporte" />

                    <h2>213</h2>

                    <p>Vehículos registrados</p>

                </div>

                <div className="reporteCard">

                    <FaBoxOpen className="iconReporte" />

                    <h2>92</h2>

                    <p>Productos</p>

                </div>

                <div className="reporteCard">

                    <FaMoneyBillWave className="iconReporte" />

                    <h2>$15.300.000</h2>

                    <p>Ingresos</p>

                </div>

                <div className="reporteCard">

                    <FaChartLine className="iconReporte" />

                    <h2>95%</h2>

                    <p>Eficiencia</p>

                </div>

            </div>

            <div className="paneles">

                <div className="grafica">

                    <h2>Órdenes por Mes</h2>

                    <div className="fakeChart">

                        <div style={{ height: "70%" }}></div>

                        <div style={{ height: "50%" }}></div>

                        <div style={{ height: "90%" }}></div>

                        <div style={{ height: "35%" }}></div>

                        <div style={{ height: "65%" }}></div>

                        <div style={{ height: "80%" }}></div>

                    </div>

                </div>

                <div className="grafica">

                    <h2>Servicios más realizados</h2>

                    <div className="tableWrapper">
                    <table>

                        <thead>

                            <tr>

                                <th>Servicio</th>

                                <th>Cantidad</th>

                            </tr>

                        </thead>

                        <tbody>

                            <tr>

                                <td>Cambio de aceite</td>

                                <td>78</td>

                            </tr>

                            <tr>

                                <td>Frenos</td>

                                <td>65</td>

                            </tr>

                            <tr>

                                <td>Suspensión</td>

                                <td>43</td>

                            </tr>

                            <tr>

                                <td>Motor</td>

                                <td>26</td>

                            </tr>

                        </tbody>

                    </table>
                    </div>

                </div>

            </div>

        </>

    )

}