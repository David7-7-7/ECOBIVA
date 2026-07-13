import "./VehiculoDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function VehiculoDetail({ vehiculo }) {

    if (!vehiculo) return null;

    return (

        <>

            <section className="detailSection">

                <h3>Información General</h3>

                <div className="detailGrid">

                    <DataField label="Placa" value={vehiculo.placa} />
                    <DataField label="Marca" value={vehiculo.marca} />
                    <DataField label="Modelo" value={vehiculo.modelo} />
                    <DataField label="Color" value={vehiculo.color} />
                    <DataField label="Año" value={vehiculo.anio} />
                    <DataField label="Combustible" value={vehiculo.combustible} />
                    <DataField label="Kilometraje" value={vehiculo.kilometraje} />

                </div>

            </section>

            <section className="detailSection">

                <h3>Propietario</h3>

                <div className="detailGrid">

                    <DataField label="Cliente" value={vehiculo.nombreCliente || vehiculo.propietario} />
                    <DataField label="Teléfono" value={vehiculo.telefono || ""} />

                </div>

            </section>

            <section className="detailSection">

                <h3>Ingreso al Taller</h3>

                <div className="detailGrid">

                    <DataField label="Fecha Ingreso" value={vehiculo.ingreso} />
                    <DataField label="Fecha Salida" value={vehiculo.salida || "Pendiente"} />

                    <div>

                        <span className="fieldTitle">

                            Estado

                        </span>

                        <StatusBadge status={vehiculo.estado} />

                    </div>

                </div>

            </section>

        </>

    );

}