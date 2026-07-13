import "./HistorialCargoDetail.css";

import DataField from "../DataField/DataField";

export default function HistorialCargoDetail({ historial }) {

    if (!historial) return null;

    return (

        <>

            <section className="detailSection">

                <h3>Empleado</h3>

                <div className="detailGrid">

                    <DataField label="Nombre" value={historial.empleado} />
                    <DataField label="Documento" value={historial.documento} />

                </div>

            </section>

            <section className="detailSection">

                <h3>Cambio de Cargo</h3>

                <div className="detailGrid">

                    <DataField label="Cargo Anterior" value={historial.cargoAnterior} />
                    <DataField label="Cargo Nuevo" value={historial.cargoNuevo} />

                    <DataField
                        label="Fecha de Cambio"
                        value={
                            historial.fechaCambio
                                ? new Date(historial.fechaCambio).toLocaleDateString("es-CO")
                                : "-"
                        }
                    />

                    <DataField label="Motivo" value={historial.motivo || "No especificado"} />

                </div>

            </section>

            <section className="detailSection">

                <h3>Registro</h3>

                <div className="detailGrid">

                    <DataField
                        label="Registrado por"
                        value={historial.usuarioRegistro || "Sistema"}
                    />

                </div>

            </section>

        </>

    );

}
