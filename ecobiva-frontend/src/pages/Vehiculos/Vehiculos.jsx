import "./Vehiculos.css";

import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";

import VehiculoModal from "../../components/VehiculoModal/VehiculoModal";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import SearchBar from "../../components/SearchBar/SearchBar";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import DetailModal from "../../components/DetailModal/DetailModal";
import VehiculoDetail from "../../components/VehiculoDetail/VehiculoDetail";

import {
  obtenerVehiculos,
  obtenerVehiculo,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo,
  reactivarVehiculo,
} from "../../services/vehiculoService";

export default function Vehiculos() {
  const [abrirModal, setAbrirModal] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [vehiculos, setVehiculos] = useState([]);
  const [vehiculoEditar, setVehiculoEditar] = useState(null);
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null);
  const [vehiculoEliminar, setVehiculoEliminar] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    cargarVehiculos();
  }, []);

  const cargarVehiculos = async () => {
    try {
      const data = await obtenerVehiculos();
      setVehiculos(data);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los vehículos.");
    }
  };

  const guardarVehiculo = async (vehiculo) => {
    try {
      if (vehiculoEditar?.idVehiculo) {
        await actualizarVehiculo(vehiculoEditar.idVehiculo, vehiculo);
      } else {
        await crearVehiculo(vehiculo);
      }

      cerrarModal();
      await cargarVehiculos();
    } catch (error) {
      console.error(error);
      alert("No fue posible guardar el vehículo.");
    }
  };

  const cerrarModal = () => {
    setAbrirModal(false);
    setVehiculoEditar(null);
  };

  const confirmarEliminarVehiculo = async () => {
    try {
      if (!vehiculoEliminar?.idVehiculo) {
        throw new Error("No hay vehículo seleccionado.");
      }

      await eliminarVehiculo(vehiculoEliminar.idVehiculo);

      setConfirmDelete(false);
      setVehiculoEliminar(null);

      await cargarVehiculos();
    } catch (error) {
      console.error(error);
      alert("No fue posible desactivar el vehículo.");
    }
  };

  const reactivar = async (vehiculo) => {
    try {
      await reactivarVehiculo(vehiculo.idVehiculo);
      await cargarVehiculos();
    } catch (error) {
      console.error(error);
      alert("No fue posible reactivar el vehículo.");
    }
  };

  const vehiculosFiltrados = vehiculos.filter(
    (vehiculo) =>
      vehiculo.placa?.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.marca?.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.modelo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      vehiculo.nombreCliente?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Vehículos"
        subtitle="Administración de vehículos."
        button={
          <button
            className="btnNuevo"
            onClick={() => {
              setVehiculoEditar(null);
              setAbrirModal(true);
            }}
          >
            <FaPlus />
            Nuevo Vehículo
          </button>
        }
      />

      <div className="vehiculosCard">
        <SearchBar
          placeholder="Buscar vehículo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        <div className="tableWrapper">
        <table>
          <thead>
            <tr>
              <th>Placa</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Color</th>
              <th>Propietario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {vehiculosFiltrados.map((vehiculo) => (
              <tr key={vehiculo.idVehiculo}>
                <td>
                  <strong>{vehiculo.placa}</strong>
                </td>

                <td>{vehiculo.marca || "-"}</td>

                <td>{vehiculo.modelo || "-"}</td>

                <td>{vehiculo.color || "-"}</td>

                <td>{vehiculo.nombreCliente || "-"}</td>

                <td>
                  <StatusBadge status={vehiculo.estado} />
                </td>

                <td>
                  <ActionButtons
                    onView={async () => {
                      try {
                        const detalle = await obtenerVehiculo(
                          vehiculo.idVehiculo,
                        );

                        setVehiculoSeleccionado(detalle);
                        setDetalleOpen(true);
                      } catch (error) {
                        console.error(error);
                        alert("No fue posible obtener el vehículo.");
                      }
                    }}
                    onEdit={() => {
                      setVehiculoEditar(vehiculo);
                      setAbrirModal(true);
                    }}
                    onDelete={
                      vehiculo.estado === 1
                        ? () => {
                            setVehiculoEliminar(vehiculo);
                            setConfirmDelete(true);
                          }
                        : undefined
                    }
                    onRestore={
                      vehiculo.estado === 0
                        ? () => reactivar(vehiculo)
                        : undefined
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <DetailModal
        open={detalleOpen}
        title="Información del Vehículo"
        onClose={() => setDetalleOpen(false)}
      >
        <VehiculoDetail vehiculo={vehiculoSeleccionado} />
      </DetailModal>

      <VehiculoModal
        open={abrirModal}
        vehiculoEditar={vehiculoEditar}
        onClose={cerrarModal}
        onSave={guardarVehiculo}
      />

      <ConfirmModal
        open={confirmDelete}
        title="Desactivar Vehículo"
        message="¿Está seguro de desactivar este vehículo?"
        onClose={() => {
          setConfirmDelete(false);
          setVehiculoEliminar(null);
        }}
        onConfirm={confirmarEliminarVehiculo}
      />
    </>
  );
}
