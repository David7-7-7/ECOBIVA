import "./Ordenes.css";

import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa";
import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import SearchBar from "../../components/SearchBar/SearchBar";
import DetailModal from "../../components/DetailModal/DetailModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import OrdenDetail, {
  ESTADO_LABELS,
  ESTADO_VARIANT,
} from "../../components/OrdenDetail/OrdenDetail";
import OrdenModal from "../../components/OrdenModal/OrdenModal";
import { useNavigate } from "react-router-dom";
import {
  obtenerOrdenes,
  obtenerOrden,
  crearOrden,
  actualizarOrden,
  cambiarEstadoOrden,
  eliminarOrden,
} from "../../services/ordenService";
import { crearEvidencia, subirFoto } from "../../services/evidenciaService";

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [ordenEditar, setOrdenEditar] = useState(null);
  const [ordenEliminar, setOrdenEliminar] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

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

  const guardarOrden = async ({ orden, evidencia }) => {
    try {
      if (ordenEditar?.idOrden) {
        await actualizarOrden(ordenEditar.idOrden, orden);
      } else {
        const nuevaOrden = await crearOrden(orden);

        const nuevaEvidencia = await crearEvidencia({
          idOrden: nuevaOrden.idOrden,
          observaciones: evidencia.observaciones,
        });

        if (evidencia.fotos.length > 0) {
          for (const foto of evidencia.fotos) {
            await subirFoto(nuevaEvidencia.idEvidencia, foto.archivo);
          }
        }
      }
      cerrarModal();
      await cargarOrdenes();
    } catch (error) {
      console.error(error);
      alert(error?.response?.data?.error || "No fue posible guardar la orden.");
    }
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setOrdenEditar(null);
  };

  const verDetalle = async (orden) => {
    try {
      const detalle = await obtenerOrden(orden.idOrden);
      setOrdenSeleccionada(detalle);
      setDetalleOpen(true);
    } catch (error) {
      console.error(error);
      alert("No fue posible obtener la orden.");
    }
  };

  const cambiarEstado = async (idOrden, estado, motivo) => {
    try {
      await cambiarEstadoOrden(idOrden, estado, motivo);
      await cargarOrdenes();
      const detalle = await obtenerOrden(idOrden);
      setOrdenSeleccionada(detalle);
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error ||
          "No fue posible cambiar el estado de la orden.",
      );
    }
  };

  const refrescarOrdenSeleccionada = async () => {
    try {
      await cargarOrdenes();
      if (ordenSeleccionada?.idOrden) {
        const detalle = await obtenerOrden(ordenSeleccionada.idOrden);
        setOrdenSeleccionada(detalle);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const confirmarEliminarOrden = async () => {
    try {
      if (!ordenEliminar?.idOrden) {
        throw new Error("No hay orden seleccionada");
      }
      const resultado = await eliminarOrden(ordenEliminar.idOrden);
      setConfirmDelete(false);
      setOrdenEliminar(null);
      await cargarOrdenes();
      if (resultado?.mensaje) alert(resultado.mensaje);
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error || "No fue posible eliminar la orden.",
      );
    }
  };

  const ordenesFiltradas = ordenes.filter((orden) =>
    [
      orden.folio,
      orden.clienteNombre,
      orden.vehiculoPlaca,
      orden.tecnicoNombre,
      orden.asesorNombre,
      orden.estado,
    ]
      .join(" ")
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
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
                <th>Folio</th>
                <th>Cliente</th>
                <th>Vehículo</th>
                <th>Tecnico</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {ordenesFiltradas.map((orden) => (
                <tr key={orden.idOrden}>
                  <td>
                    <strong>{orden.folio}</strong>
                  </td>
                  <td>{orden.clienteNombre}</td>
                  <td>{orden.vehiculoPlaca}</td>
                  <td>{orden.tecnicoNombre || "Sin asignar"}</td>
                  <td>
                    <StatusBadge
                      status={ESTADO_LABELS[orden.estado] || orden.estado}
                      variant={ESTADO_VARIANT[orden.estado]}
                    />
                  </td>
                  <td>
                    {orden.fechaCreacion
                      ? new Date(orden.fechaCreacion).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    <ActionButtons
                      onView={() => verDetalle(orden)}
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
        <OrdenDetail
          orden={ordenSeleccionada}
          onCambiarEstado={cambiarEstado}
          onOrdenActualizada={refrescarOrdenSeleccionada}
        />
      </DetailModal>

      <ConfirmModal
        open={confirmDelete}
        title="Eliminar Orden"
        message="¿Está seguro de eliminar esta orden? Si ya tiene registros asociados (diagnóstico, evidencias, etc.) se cancelará en su lugar."
        onClose={() => setConfirmDelete(false)}
        onConfirm={confirmarEliminarOrden}
      />
      <ActionButtons
        onView={() => verDetalle(orden)}
        onEdit={() => {
          setOrdenEditar(orden);
          setModalOpen(true);
        }}
        onDelete={() => {
          setOrdenEliminar(orden);
          setConfirmDelete(true);
        }}
        onDiagnosticar={() => navigate(`/diagnostico/${orden.idOrden}`)}
      />
    </>
  );
}
