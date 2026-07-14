import "./Clientes.css";

import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import ClienteModal from "../../components/ClienteModal/ClienteModal";
import PageHeader from "../../components/PageHeader/PageHeader";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import SearchBar from "../../components/SearchBar/SearchBar";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";

import DetailModal from "../../components/DetailModal/DetailModal";
import ClienteDetail from "../../components/ClienteDetail/ClienteDetail";
import {
  obtenerClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
} from "../../services/clienteService";

export default function Clientes() {
  const [abrirModal, setAbrirModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [clientes, setClientes] = useState([]);
  const [clienteEditar, setClienteEditar] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  useEffect(() => {
    cargarClientes();
  }, []);

  const cargarClientes = async () => {
    try {
      const data = await obtenerClientes();
      setClientes(data);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los clientes");
    }
  };

  const guardarCliente = async (cliente) => {
    try {
      if (clienteEditar?.idCliente) {
        await actualizarCliente(clienteEditar.idCliente, cliente);
      } else {
        await crearCliente(cliente);
      }
      setAbrirModal(false);
      setClienteEditar(null);
      await cargarClientes();
    } catch (error) {
      console.error(error);
      alert("No fue posible guardar el cliente");
    }
  };

  const confirmarEliminarCliente = async () => {
    try {
      if (!clienteSeleccionado?.idCliente) {
        throw new Error("No hay cliente seleccionado");
      }
      await eliminarCliente(clienteSeleccionado.idCliente);
      setConfirmDelete(false);
      setClienteSeleccionado(null);
      await cargarClientes();
    } catch (error) {
      console.error(error);
      alert("No fue posible eliminar el cliente");
    }
  };

  const clientesFiltrados = clientes.filter(
    (cliente) =>
      cliente.nombre?.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente.documento?.includes(busqueda),
  );

  return (
    <>
      <PageHeader
        title="Clientes"
        subtitle="Administración de clientes registrados."
        button={
          <button
            className="btnNuevo"
            onClick={() => {
              setClienteEditar(null);
              setAbrirModal(true);
            }}
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
            {clientesFiltrados.map((cliente) => (
              <tr key={cliente.idCliente || cliente.documento}>
                <td>{cliente.documento}</td>
                <td>{cliente.nombre}</td>
                <td>{cliente.telefono}</td>
                <td>{cliente.correo}</td>
                <td>
                  <StatusBadge status={cliente.estado} />
                </td>
                <td>
                  <ActionButtons
                    onView={async () => {
                      try {
                        const clienteDetalle = await obtenerCliente(
                          cliente.idCliente,
                        );
                        setClienteSeleccionado(clienteDetalle);
                        setDetalleOpen(true);
                      } catch (error) {
                        console.error(error);
                        alert("No fue posible obtener el cliente");
                      }
                    }}
                    onEdit={() => {
                      setClienteEditar(cliente);
                      setAbrirModal(true);
                    }}
                    onDelete={() => {
                      setClienteSeleccionado(cliente);
                      setConfirmDelete(true);
                    }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ClienteModal
        open={abrirModal}
        clienteEditar={clienteEditar}
        onClose={() => {
          setAbrirModal(false);
          setClienteEditar(null);
        }}
        onSave={guardarCliente}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Eliminar Cliente"
        message="¿Está seguro de eliminar este cliente? Esta acción eliminará el cliente de forma permanente."
        onClose={() => setConfirmDelete(false)}
        onConfirm={confirmarEliminarCliente}
      />

      <DetailModal
        open={detalleOpen}
        title="Información del Cliente"
        onClose={() => setDetalleOpen(false)}
      >
        <ClienteDetail cliente={clienteSeleccionado} />
      </DetailModal>
    </>
  );
}
