import "./TecnicoDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function TecnicoDetail({ tecnico }) {
  if (!tecnico) return null;

  return (
    <section className="detailSection">
      <h3>Información del Técnico</h3>

      <div className="detailGrid">
        <DataField label="Documento" value={tecnico.documento} />

        <DataField label="Nombre" value={tecnico.nombre} />

        <DataField
          label="Correo"
          value={tecnico.correo || "Sin usuario asignado"}
        />

        <DataField
          label="Especialidad"
          value={tecnico.especialidad || "Sin especialidad"}
        />

        <DataField
          label="Fecha de Ingreso"
          value={
            tecnico.fechaIngreso
              ? String(tecnico.fechaIngreso).slice(0, 10)
              : "-"
          }
        />

        <DataField
          label="Tarifa por Hora"
          value={`$${Number(tecnico.tarifaHora || 0).toLocaleString("es-CO")}`}
        />

        <DataField
          label="Carga de trabajo"
          value={`${tecnico.cargaActual ?? 0} / ${tecnico.capacidadMaxima ?? "-"}`}
        />

        <div>
          <span className="fieldTitle">Estado</span>

          <StatusBadge status={tecnico.estadoLaboral ? "Activo" : "Inactivo"} />
        </div>
      </div>
    </section>
  );
}
