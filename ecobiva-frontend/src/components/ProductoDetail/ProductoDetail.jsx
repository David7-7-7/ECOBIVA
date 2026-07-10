import "./ProductoDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";

export default function ProductoDetail({ producto }) {

    if (!producto) return null;

    return (

        <>
        
            <section className="detailSection">

                <h3>Información del Producto</h3>

                <div className="detailGrid">

                    <DataField
                        label="Código"
                        value={producto.codigo}
                    />

                    <DataField
                        label="Producto"
                        value={producto.nombre}
                    />

                    <DataField
                        label="Categoría"
                        value={producto.categoria}
                    />

                    <DataField
                        label="Proveedor"
                        value={producto.proveedor}
                    />

                    <DataField
                        label="Precio"
                        value={producto.precio}
                    />

                    <DataField
                        label="Stock"
                        value={producto.stock}
                    />

                    <DataField
                        label="Stock mínimo"
                        value={producto.minimo}
                    />

                    <div>

                        <span className="fieldTitle">

                            Estado

                        </span>

                        <StatusBadge
                            status={producto.estado}
                        />

                    </div>

                </div>

            </section>

        </>

    );

}