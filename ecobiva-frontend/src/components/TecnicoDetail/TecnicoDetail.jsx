import "./TecnicoDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function TecnicoDetail({ tecnico }) {

    if (!tecnico) return null;

    return (

        <section className="detailSection">

            <h3>Información del Técnico</h3>

            <div className="detailGrid">

                <DataField
                    label="Documento"
                    value={tecnico.documento}
                />

                <DataField
                    label="Nombre"
                    value={tecnico.nombre}
                />

                <DataField
                    label="Teléfono"
                    value={tecnico.telefono}
                />

                <DataField
                    label="Correo"
                    value={tecnico.correo}
                />

                <DataField
                    label="Especialidad"
                    value={tecnico.especialidad}
                />

                <DataField
                    label="Experiencia"
                    value={tecnico.experiencia}
                />

                <div>

                    <span className="fieldTitle">

                        Estado

                    </span>

                    <StatusBadge
                        status={tecnico.estado}
                    />

                </div>

            </div>

        </section>

    );

}