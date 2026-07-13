import "./Ordenes.css";

import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import SearchBar from "../../components/SearchBar/SearchBar";
import DetailModal from "../../components/DetailModal/DetailModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import OrdenDetail from "../../components/OrdenDetail/OrdenDetail";
import OrdenModal from "../../components/OrdenModal/OrdenModal";
import {
  obtenerOrdenes,
  obtenerOrden,
  crearOrden,
  actualizarOrden,
  eliminarOrden,
} from "../../services/ordenService";

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [ordenEditar, setOrdenEditar] = useState(null);
  const [ordenEliminar, setOrdenEliminar] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const cargarOrdenes = async () => {
    try {
      const data = await obtenerOrdenes();
      setOrdenes(data);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar las órdenes de servicio.");
    }
  };

  const guardarOrden = async (orden) => {
    try {
      if (ordenEditar?.id) {
        await actualizarOrden(ordenEditar.id, orden);
      } else {
        await crearOrden(orden);
      }
      cerrarModal();
      await cargarOrdenes();
    } catch (error) {
      console.error(error);
      alert("No fue posible guardar la orden.");
    }
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setOrdenEditar(null);
  };

  const confirmarEliminarOrden = async () => {
    try {
      if (!ordenEliminar?.id) {
        throw new Error("No hay orden seleccionada");
      }
      await eliminarOrden(ordenEliminar.id);
      setConfirmDelete(false);
      setOrdenEliminar(null);
      await cargarOrdenes();
    } catch (error) {
      console.error(error);
      alert("No fue posible eliminar la orden.");
    }
  };

  const ordenesFiltradas = ordenes.filter((orden) =>
    [orden.id, orden.cliente, orden.vehiculo, orden.tecnico, orden.servicio, orden.estado]
      .join(" ")
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Órdenes"
        subtitle="Gestión de órdenes de servicio."
        button={
          <button
            className="btnNuevo"
            onClick={() => {
              setOrdenEditar(null);
              setModalOpen(true);
            }}
          >
            <FaPlus />
            Nueva Orden
          </button>
        }
      />

      <div className="ordenCard">
        <div className="toolbar">
          <SearchBar
            placeholder="Buscar orden..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            width="100%"
          />
        </div>

        <div className="tableWrapper">
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
              {ordenesFiltradas.map((orden) => (
                <tr key={orden.id || `${orden.cliente}-${orden.fecha}`}>
                  <td>
                    <strong>{orden.id}</strong>
                  </td>
                  <td>{orden.cliente}</td>
                  <td>{orden.vehiculo}</td>
                  <td>{orden.tecnico}</td>
                  <td>
                    <StatusBadge status={orden.estado} />
                  </td>
                  <td>{orden.fecha}</td>
                  <td>{orden.total}</td>
                  <td>
                    <ActionButtons
                      onView={async () => {
                        try {
                          const detalle = await obtenerOrden(orden.id);
                          setOrdenSeleccionada(detalle);
                          setDetalleOpen(true);
                        } catch (error) {
                          console.error(error);
                          alert("No fue posible obtener la orden.");
                        }
                      }}
                      onEdit={() => {
                        setOrdenEditar(orden);
                        setModalOpen(true);
                      }}
                      onDelete={() => {
                        setOrdenEliminar(orden);
                        setConfirmDelete(true);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <OrdenModal
        open={modalOpen}
        ordenEditar={ordenEditar}
        onClose={cerrarModal}
        onSave={guardarOrden}
      />

      <DetailModal
        open={detalleOpen}
        title="Información de la Orden"
        onClose={() => setDetalleOpen(false)}
      >
        <OrdenDetail orden={ordenSeleccionada} />
      </DetailModal>

      <ConfirmModal
        open={confirmDelete}
        title="Eliminar Orden"
        message="¿Está seguro de eliminar esta orden? Esta acción eliminará el registro permanentemente."
        onClose={() => setConfirmDelete(false)}
        onConfirm={confirmarEliminarOrden}
      />
    </>
  );
}
