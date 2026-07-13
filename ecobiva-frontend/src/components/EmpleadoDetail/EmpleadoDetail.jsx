import "./EmpleadoDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function EmpleadoDetail({ empleado }) {

    if (!empleado) return null;

    return (

        <>

            <section className="detailSection">

                <h3>Información General</h3>

                <div className="detailGrid">

                    <DataField label="Nombre" value={empleado.nombre} />
                    <DataField label="Documento" value={empleado.documento} />
                    <DataField label="Cargo Actual" value={empleado.cargoActual} />

                    <DataField
                        label="Tarifa por Hora"
                        value={`$${Number(empleado.tarifaHora).toLocaleString("es-CO")}`}
                    />

                </div>

            </section>

            <section className="detailSection">

                <h3>Estado Laboral</h3>

                <div className="detailGrid">

                    <DataField label="Fecha de Ingreso" value={empleado.fechaIngreso} />
                    <DataField label="Fecha de Retiro" value={empleado.fechaRetiro || "N/A"} />

                    <div>

                        <span className="fieldTitle">
                            Estado
                        </span>

                        <StatusBadge
                            status={empleado.estadoLaboral ? "Activo" : "Inactivo"}
                        />

                    </div>

                </div>

            </section>

            <section className="detailSection">

                <h3>Usuario del Sistema</h3>

                <div className="detailGrid">

                    <DataField
                        label="Correo"
                        value={empleado.correo || "Sin usuario asignado"}
                    />

                </div>

            </section>

        </>

    );

}
