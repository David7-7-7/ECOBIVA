import "./ClienteDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function ClienteDetail({ cliente }) {
  if (!cliente) return null;

  return (
    <>
      <section className="detailSection">
        <h3>Información Personal</h3>

        <div className="detailGrid">
          <DataField
            label="Tipo de documento"
            value={cliente.tipoDocumento || "-"}
          />

          <DataField label="Documento" value={cliente.documento || "-"} />

          <DataField label="Nombre completo" value={cliente.nombre || "-"} />

          <DataField label="Teléfono" value={cliente.telefono || "-"} />

          <DataField label="Correo electrónico" value={cliente.correo || "-"} />

          <DataField label="Ciudad" value={cliente.ciudad || "-"} />

          <DataField label="Dirección" value={cliente.direccion || "-"} />

          <DataField
            label="Tipo de comunicación"
            value={cliente.tipoComunicacion || "-"}
          />
        </div>
      </section>

      <section className="detailSection">
        <h3>Información General</h3>

        <div className="detailGrid">
          <div>
            <span className="fieldTitle">Estado</span>

            <StatusBadge status={cliente.estado} />
          </div>

          <DataField
            label="Fecha de registro"
            value={
              cliente.fechaRegistro
                ? new Date(cliente.fechaRegistro).toLocaleDateString()
                : "-"
            }
          />

          <DataField
            label="Última visita"
            value={cliente.ultimaVisita || "Sin visitas registradas"}
          />

          <DataField label="Órdenes registradas" value={cliente.ordenes ?? 0} />

          <DataField label="Garantías activas" value={cliente.garantias ?? 0} />

          <DataField
            label="Puntos acumulados"
            value={cliente.puntosAcumulados ?? 0}
          />
        </div>
      </section>

      <section className="detailSection">
        <h3>Vehículos Registrados</h3>

        <table>
          <thead>
            <tr>
              <th>Placa</th>

              <th>Marca</th>

              <th>Modelo</th>

              <th>Tipo</th>

              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {(cliente.vehiculos || []).length > 0 ? (
              cliente.vehiculos.map((vehiculo) => (
                <tr key={vehiculo.idVehiculo}>
                  <td>{vehiculo.placa}</td>

                  <td>{vehiculo.marca}</td>

                  <td>{vehiculo.modelo}</td>

                  <td>{vehiculo.tipoVehiculo}</td>

                  <td>
                    <StatusBadge status={vehiculo.estado} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">No hay vehículos registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
}
