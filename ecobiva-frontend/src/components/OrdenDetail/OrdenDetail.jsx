import "./OrdenDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function OrdenDetail({ orden }) {

    if (!orden) return null;

    return (

        <>

            <section className="detailSection">

                <h3>Información General</h3>

                <div className="detailGrid">

                    <DataField label="Orden" value={orden.id} />
                    <DataField label="Cliente" value={orden.cliente} />
                    <DataField label="Vehículo" value={orden.vehiculo} />
                    <DataField label="Placa" value={orden.placa} />
                    <DataField label="Técnico" value={orden.tecnico} />
                    <DataField label="Servicio" value={orden.servicio} />

                </div>

            </section>

            <section className="detailSection">

                <h3>Proceso</h3>

                <div className="detailGrid">

                    <DataField label="Ingreso" value={orden.fecha} />
                    <DataField label="Entrega" value={orden.entrega || "Pendiente"} />
                    <DataField label="Valor" value={orden.total} />

                    <div>

                        <span className="fieldTitle">

                            Estado

                        </span>

                        <StatusBadge

                            status={orden.estado}

                        />

                    </div>

                </div>

            </section>

            <section className="detailSection">

                <h3>Observaciones</h3>

                <p className="observaciones">

                    {orden.observaciones}

                </p>

            </section>

        </>

    );

}