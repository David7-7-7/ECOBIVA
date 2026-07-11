import "./Vehiculos.css";

import MainLayout from "../../layouts/MainLayout";
import { useState } from "react";

import { FaPlus, FaSearch } from "react-icons/fa";

import VehiculoModal from "../../components/VehiculoModal/VehiculoModal";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";

import StatusBadge from "../../components/StatusBadge/StatusBadge";

import DetailModal from "../../components/DetailModal/DetailModal";
import VehiculoDetail from "../../components/VehiculoDetail/VehiculoDetail";

import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

export default function Vehiculos() {

    const [abrirModal, setAbrirModal] = useState(false);
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);

    const vehiculos = [

        {
            placa: "ABC123",
            marca: "Mazda",
            modelo: "CX-5",
            color: "Rojo",
            anio: 2022,
            kilometraje: "42.300 km",
            combustible: "Gasolina",
            propietario: "Juan Pérez",
            telefono: "3204567890",
            ingreso: "03/07/2026",
            salida: "05/07/2026",
            estado: "En Taller"
        },

        {
            placa: "XYZ456",
            marca: "Chevrolet",
            modelo: "Onix",
            color: "Blanco",
            anio: 2021,
            kilometraje: "31.200 km",
            combustible: "Gasolina",
            propietario: "María López",
            telefono: "3119874561",
            ingreso: "01/07/2026",
            salida: "",
            estado: "Activo"
        },

        {
            placa: "JKL789",
            marca: "Renault",
            modelo: "Duster",
            color: "Negro",
            anio: 2020,
            kilometraje: "81.100 km",
            combustible: "Diésel",
            propietario: "Carlos Ruiz",
            telefono: "3157412589",
            ingreso: "29/06/2026",
            salida: "02/07/2026",
            estado: "Finalizado"
        },

        {
            placa: "QWE258",
            marca: "Toyota",
            modelo: "Corolla",
            color: "Gris",
            anio: 2023,
            kilometraje: "11.400 km",
            combustible: "Híbrido",
            propietario: "Laura Gómez",
            telefono: "3214569874",
            ingreso: "04/07/2026",
            salida: "",
            estado: "Pendiente"
        }

    ];

    return (

        <>

            <PageHeader
                title="Vehículos"
                subtitle="Administración de vehículos."
                button={
                    <button
                        className="btnNuevo"
                        onClick={() => setAbrirModal(true)} >

                        <FaPlus />
                        Nuevo Vehículo
                    </button>
                }
            />


            <div className="vehiculosCard">

                <div className="barraBusqueda">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Buscar vehículo..."
                    />

                </div>

                <table>

                    <thead>

                        <tr>

                            <th>Placa</th>
                            <th>Marca</th>
                            <th>Modelo</th>
                            <th>Propietario</th>
                            <th>Estado</th>
                            <th>Acciones</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            vehiculos.map((vehiculo, index) => (

                                <tr key={index}>

                                    <td>

                                        <strong>

                                            {vehiculo.placa}

                                        </strong>

                                    </td>

                                    <td>{vehiculo.marca}</td>

                                    <td>{vehiculo.modelo}</td>

                                    <td>{vehiculo.propietario}</td>

                                    <td>

                                        <StatusBadge
                                            status={vehiculo.estado}
                                        />

                                    </td>

                                    <td>

                                        <td>

                                            <ActionButtons

                                                onView={() => {
                                                    setVehiculoSeleccionado(vehiculo);
                                                    setDetalleOpen(true);
                                                }}

                                                onEdit={() => console.log("Editar", vehiculo)}

                                                onDelete={() => setConfirmDelete(true)}

                                            />

                                        </td>

                                    </td>

                                </tr>

                            ))

                        }

                    </tbody>

                </table>

            </div>


        <DetailModal

    open={detalleOpen}

    title="Información del Vehículo"

    onClose={() => setDetalleOpen(false)}

>

    <VehiculoDetail

        vehiculo={vehiculoSeleccionado}

    />

</DetailModal>

<ConfirmModal

    open={confirmDelete}

    title="Eliminar Vehículo"

    message="¿Está seguro de eliminar este vehículo? Esta acción es solamente visual."

    onClose={() => setConfirmDelete(false)}

    onConfirm={() => {

        console.log("Eliminar vehículo");

        setConfirmDelete(false);

    }}

/>

        </>

    );

}