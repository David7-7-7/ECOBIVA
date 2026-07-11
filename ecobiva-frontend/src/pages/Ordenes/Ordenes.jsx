import "./Ordenes.css";

import MainLayout from "../../layouts/MainLayout";
import { FaPlus, FaSearch, FaFilter } from "react-icons/fa";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useState } from "react";

import DetailModal from "../../components/DetailModal/DetailModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import OrdenDetail from "../../components/OrdenDetail/OrdenDetail";



export default function Ordenes() {

    const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const ordenes = [

        {
            id: "OT-001",
            cliente: "Juan Pérez",
            vehiculo: "Mazda CX-5",
            placa: "ABC123",
            tecnico: "Carlos Martínez",
            servicio: "Mantenimiento Preventivo",
            fecha: "05/07/2026",
            entrega: "06/07/2026",
            estado: "En Taller",
            total: "$450.000",
            observaciones: "Cambio de aceite, filtros y revisión general."
        },

        {
            id: "OT-002",
            cliente: "María López",
            vehiculo: "Chevrolet Onix",
            placa: "XYZ456",
            tecnico: "Andrés Rojas",
            servicio: "Cambio de Frenos",
            fecha: "04/07/2026",
            entrega: "05/07/2026",
            estado: "Finalizado",
            total: "$820.000",
            observaciones: "Cambio de pastillas y discos delanteros."
        },

        {
            id: "OT-003",
            cliente: "Carlos Ruiz",
            vehiculo: "Renault Duster",
            placa: "JKL789",
            tecnico: "Luis Gómez",
            servicio: "Diagnóstico",
            fecha: "03/07/2026",
            entrega: "",
            estado: "Pendiente",
            total: "$120.000",
            observaciones: "Vehículo presenta falla eléctrica."
        }

    ];
    return (

        <>

            <PageHeader

                title="Órdenes"

                subtitle="Gestión de órdenes de servicio."

                button={

                    <button className="btnNuevo">

                        <FaPlus />

                        Nueva Orden

                    </button>

                }

            />

            <div className="ordenCard">

                <div className="toolbar">

                    <div className="barraBusqueda">

                        <FaSearch />

                        <input

                            type="text"

                            placeholder="Buscar orden..."

                        />

                    </div>

                    <button className="btnFiltro">

                        <FaFilter />

                        Filtrar

                    </button>

                </div>

                <table>

                    <thead>

                        <tr>
                            <th>OT</th>
                            <th>Cliente</th>
                            <th>Vehículo</th>
                            <th>Técnico</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>

                    </thead>

                    <tbody>

                        {

                            ordenes.map((orden, index) => (

                                <tr key={index}>
                                    <td>
                                        <strong>
                                            {orden.id}
                                        </strong>
                                    </td>

                                    <td>{orden.cliente}</td>
                                    <td>{orden.vehiculo}</td>
                                    <td>{orden.tecnico}</td>

                                    <td>

                                        <StatusBadge
                                            status={orden.estado}
                                        />

                                    </td>

                                    <td>{orden.fecha}</td>
                                    <td>{orden.total}</td>

                                    <td>

                                        <ActionButtons

                                            onView={() => {
                                                setOrdenSeleccionada(orden);
                                                setDetalleOpen(true);
                                            }}

                                            onEdit={() => console.log(orden)}

                                            onDelete={() => setConfirmDelete(true)}

                                        />

                                    </td>

                                </tr>
                            ))

                        }

                    </tbody>

                </table>

            </div>

            <DetailModal

                open={detalleOpen}

                title="Información de la Orden"

                onClose={() => setDetalleOpen(false)}

            >

                <OrdenDetail

                    orden={ordenSeleccionada}

                />

            </DetailModal>

            <ConfirmModal

                open={confirmDelete}

                title="Eliminar Orden"

                message="¿Está seguro de eliminar esta orden? Esta acción solamente es visual."

                onClose={() => setConfirmDelete(false)}

                onConfirm={() => {

                    console.log("Eliminar Orden");

                    setConfirmDelete(false);

                }}

            />


        </>

    )

}