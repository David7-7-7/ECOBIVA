import "./VehiculoDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function VehiculoDetail({ vehiculo }) {
  if (!vehiculo) return null;

  const fechaIngreso = vehiculo.fechaIngreso
    ? new Date(vehiculo.fechaIngreso).toLocaleDateString("es-CO")
    : "-";

  return (
    <>
      <section className="detailSection">
        <h3>Información General</h3>

        <div className="detailGrid">
          <DataField label="Placa" value={vehiculo.placa} />
          <DataField label="Marca" value={vehiculo.marca} />
          <DataField label="Modelo" value={vehiculo.modelo} />
          <DataField label="Color" value={vehiculo.color || "-"} />
          <DataField label="Año" value={vehiculo.anio} />
          <DataField
            label="Kilometraje"
            value={vehiculo.kilometraje ? `${vehiculo.kilometraje} km` : "-"}
          />
          <DataField
            label="Tipo de Vehículo"
            value={vehiculo.tipoVehiculo || "-"}
          />
        </div>
      </section>

      <section className="detailSection">
        <h3>Propietario</h3>

        <div className="detailGrid">
          <DataField label="Cliente" value={vehiculo.nombreCliente || "-"} />

          <DataField label="Teléfono" value={vehiculo.telefono || "-"} />

          <DataField label="Correo" value={vehiculo.correo || "-"} />
        </div>
      </section>

      <section className="detailSection">
        <h3>Registro</h3>

        <div className="detailGrid">
          <DataField label="Fecha de ingreso" value={fechaIngreso} />

          <div>
            <span className="fieldTitle">Estado</span>

            <StatusBadge status={vehiculo.estado} />
          </div>
        </div>
      </section>
    </>
  );
}
