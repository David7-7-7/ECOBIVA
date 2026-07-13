import "./NominaDetail.css";

import DataField from "../DataField/DataField";

export default function NominaDetail({ nomina }) {

    if (!nomina) return null;

    return (

        <>

            <section className="detailSection">

                <h3>Empleado</h3>

                <div className="detailGrid">

                    <DataField label="Nombre" value={nomina.nombre} />
                    <DataField label="Documento" value={nomina.documento} />

                </div>

            </section>

            <section className="detailSection">

                <h3>Período</h3>

                <div className="detailGrid">

                    <DataField label="Fecha Inicio" value={nomina.periodoInicio} />
                    <DataField label="Fecha Fin" value={nomina.periodoFin} />

                    <DataField
                        label="Fecha Generación"
                        value={
                            nomina.fechaGeneracion
                                ? new Date(nomina.fechaGeneracion).toLocaleDateString("es-CO")
                                : "-"
                        }
                    />

                </div>

            </section>

            <section className="detailSection">

                <h3>Liquidación</h3>

                <div className="detailGrid">

                    <DataField label="Total Horas" value={nomina.totalHoras} />

                    <DataField
                        label="Tarifa por Hora"
                        value={`$${Number(nomina.tarifaHoraAplicada).toLocaleString("es-CO")}`}
                    />

                    <DataField
                        label="Total a Pagar"
                        value={`$${Number(nomina.totalPagar).toLocaleString("es-CO")}`}
                    />

                </div>

            </section>

        </>

    );

}
