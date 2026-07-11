import "./Tecnicos.css";

import MainLayout from "../../layouts/MainLayout";
import { FaPlus, FaSearch } from "react-icons/fa";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useState } from "react";

import SearchBar from "../../components/SearchBar/SearchBar";
import DetailModal from "../../components/DetailModal/DetailModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import TecnicoDetail from "../../components/TecnicoDetail/TecnicoDetail";


export default function Tecnicos() {

    const [abrirModal, setAbrirModal] = useState(false);
    const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);
    const [detalleOpen, setDetalleOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [busqueda, setBusqueda] = useState("");

    const tecnicos = [

        {
            documento: "1001234567",
            nombre: "Carlos Martínez",
            telefono: "3204567890",
            correo: "carlos@ecobiva.com",
            especialidad: "Motor",
            experiencia: "8 años",
            estado: "Activo"
        },

        {
            documento: "1004567891",
            nombre: "Andrés Rojas",
            telefono: "3112223344",
            correo: "andres@ecobiva.com",
            especialidad: "Electricidad",
            experiencia: "5 años",
            estado: "Activo"
        },

        {
            documento: "1012223344",
            nombre: "Luis Gómez",
            telefono: "3154445566",
            correo: "luis@ecobiva.com",
            especialidad: "Suspensión",
            experiencia: "6 años",
            estado: "Inactivo"
        }

    ];
    return (

        <>

            <PageHeader

                title="Técnicos"

                subtitle="Administración del personal."

                button={

                    <button className="btnNuevo">

                        <FaPlus />

                        Nuevo Técnico

                    </button>

                }

            />

            <div className="tecnicosCard">

                <SearchBar
                    placeholder="Buscar técnico..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                />

                <table>

                    <thead>

                        <tr>
                            <th>Documento</th>
                            <th>Nombre</th>
                            <th>Especialidad</th>
                            <th>Teléfono</th>
                            <th>Correo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>

                    </thead>

                    <tbody>

                        {

                            tecnicos.map((tecnico, index) => (

                                <tr key={index}>

                                    <td>{tecnico.documento}</td>

                                    <td>{tecnico.nombre}</td>

                                    <td>{tecnico.especialidad}</td>

                                    <td>{tecnico.telefono}</td>

                                    <td>{tecnico.correo}</td>

                                    <td>

                                        <StatusBadge
                                            status={tecnico.estado}
                                        />

                                    </td>

                                    <td>

                                        <ActionButtons

                                            onView={() => {
                                                setTecnicoSeleccionado(tecnico);
                                                setDetalleOpen(true);
                                            }}

                                            onEdit={() => console.log(tecnico)}

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

                title="Información del Técnico"

                onClose={() => setDetalleOpen(false)}

            >

                <TecnicoDetail

                    tecnico={tecnicoSeleccionado}

                />

            </DetailModal>

            <ConfirmModal

                open={confirmDelete}

                title="Eliminar Técnico"

                message="¿Está seguro de eliminar este técnico?"

                onClose={() => setConfirmDelete(false)}

                onConfirm={() => {

                    console.log("Eliminar");

                    setConfirmDelete(false);

                }}

            />


        </>

    )

}