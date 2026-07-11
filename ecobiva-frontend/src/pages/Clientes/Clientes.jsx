import "./Clientes.css";
import MainLayout from "../../layouts/MainLayout";

import { useState } from "react";
import { FaPlus, FaSearch } from "react-icons/fa";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import ClienteModal from "../../components/ClienteModal/ClienteModal";
import PageHeader from "../../components/PageHeader/PageHeader";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import SearchBar from "../../components/SearchBar/SearchBar";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

import DetailModal from "../../components/DetailModal/DetailModal";
import ClienteDetail from "../../components/ClienteDetail/ClienteDetail";

export default function Clientes() {

    const [abrirModal, setAbrirModal] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);

    const [detalleOpen, setDetalleOpen] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

    const clientes = [
        {
            tipoDocumento: "CC",
            documento: "1012456789",
            nombre: "Juan Pérez",
            telefono: "3204567890",
            correo: "juan@gmail.com",
            ciudad: "Bogotá",
            direccion: "Cra 10 #25-36",
            estado: "Activo",
            fechaRegistro: "12/03/2026",
            ultimaVisita: "05/07/2026",
            ordenes: 12,
            garantias: 2,
            vehiculos: [
                {
                    placa: "ABC123",
                    marca: "Mazda",
                    modelo: "CX5",
                    estado: "Activo"
                },
                {
                    placa: "XYZ456",
                    marca: "Renault",
                    modelo: "Duster",
                    estado: "En Taller"
                }
            ]

        },
        {
            documento: "1023654897",
            nombre: "María López",
            telefono: "3119874561",
            correo: "maria@gmail.com",
            estado: "Activo"
        },
        {
            documento: "1001456321",
            nombre: "Carlos Ruiz",
            telefono: "3157412589",
            correo: "carlos@gmail.com",
            estado: "Inactivo"
        },
        {
            documento: "1002456897",
            nombre: "Laura Gómez",
            telefono: "3214569874",
            correo: "laura@gmail.com",
            estado: "Activo"
        }
    ];

    return (

        <>

            <PageHeader

                title="Clientes"

                subtitle="Administración de clientes registrados."

                button={

                    <button
                        className="btnNuevo"
                        onClick={() => setAbrirModal(true)}
                    >

                        <FaPlus />

                        Nuevo Cliente

                    </button>

                }

            />

            <div className="clientesCard">

                <SearchBar

                    placeholder="Buscar cliente..."

                    value={busqueda}

                    onChange={(e) => setBusqueda(e.target.value)}

                />

                <table>

                    <thead>

                        <tr>

                            <th>Documento</th>

                            <th>Nombre</th>

                            <th>Teléfono</th>

                            <th>Correo</th>

                            <th>Estado</th>

                            <th>Acciones</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            clientes.map((cliente, index) => (

                                <tr key={index}>

                                    <td>{cliente.documento}</td>

                                    <td>{cliente.nombre}</td>

                                    <td>{cliente.telefono}</td>

                                    <td>{cliente.correo}</td>

                                    <td>

                                        <StatusBadge
                                            status={cliente.estado}
                                        />

                                    </td>

                                    <td>

                                        <td>

                                            <ActionButtons

                                                onView={() => {

                                                    setClienteSeleccionado(cliente);
                                                    setDetalleOpen(true);

                                                }}

                                                onEdit={() => console.log(cliente)}

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


            <ClienteModal
                open={abrirModal}
                onClose={() => setAbrirModal(false)}
            />

            <ConfirmModal

                open={confirmDelete}

                title="Eliminar Cliente"

                message="¿Está seguro de eliminar este cliente? Esta acción solamente es visual por el momento."

                onClose={() => setConfirmDelete(false)}

                onConfirm={() => {

                    console.log("Eliminar");

                    setConfirmDelete(false);

                }}

            />

            <DetailModal

                open={detalleOpen}
                title="Información del Cliente"
                onClose={() => setDetalleOpen(false)}

            >
                <ClienteDetail
                    cliente={clienteSeleccionado}
                />

            </DetailModal>


        </>

    );

}