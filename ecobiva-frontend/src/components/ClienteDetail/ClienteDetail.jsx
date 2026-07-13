import "./ClienteDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function ClienteDetail({cliente}){

    if(!cliente) return null;

    return(

        <>

            <section className="detailSection">

                <h3>Información Personal</h3>

                <div className="detailGrid">

                    <DataField
                        label="Tipo Documento"
                        value={cliente.tipoDocumento}
                    />

                    <DataField
                        label="Documento"
                        value={cliente.documento}
                    />

                    <DataField
                        label="Nombre Completo"
                        value={cliente.nombre}
                    />

                    <DataField
                        label="Teléfono"
                        value={cliente.telefono}
                    />

                    <DataField
                        label="Correo"
                        value={cliente.correo}
                    />

                    <DataField
                        label="Ciudad"
                        value={cliente.ciudad}
                    />

                    <DataField
                        label="Dirección"
                        value={cliente.direccion}
                    />

                </div>

            </section>

            <section className="detailSection">

                <h3>Información General</h3>

                <div className="detailGrid">

                    <div>

                        <span className="fieldTitle">

                            Estado

                        </span>

                        <StatusBadge
                            status={cliente.estado}
                        />

                    </div>

                    <DataField
                        label="Fecha Registro"
                        value={cliente.fechaRegistro}
                    />

                    <DataField
                        label="Última Visita"
                        value={cliente.ultimaVisita}
                    />

                    <DataField
                        label="Órdenes Registradas"
                        value={cliente.ordenes}
                    />

                    <DataField
                        label="Garantías Activas"
                        value={cliente.garantias}
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

                            <th>Estado</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            (cliente.vehiculos || []).length > 0 ?
                                cliente.vehiculos.map((v,index)=>(
                                    <tr key={index}>
                                        <td>{v.placa}</td>
                                        <td>{v.marca}</td>
                                        <td>{v.modelo}</td>
                                        <td>
                                            <StatusBadge
                                                status={v.estado}
                                            />
                                        </td>
                                    </tr>
                                ))
                                :
                                <tr>
                                    <td colSpan="4">No hay vehículos registrados.</td>
                                </tr>

                        }

                    </tbody>

                </table>

            </section>

        </>

    )

}