import "./Tecnicos.css";

import { useEffect, useState } from "react";
import { FaUndo } from "react-icons/fa";

import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import DataTable from "../../components/DataTable/DataTable";
import SearchBar from "../../components/SearchBar/SearchBar";
import DetailModal from "../../components/DetailModal/DetailModal";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import TecnicoDetail from "../../components/TecnicoDetail/TecnicoDetail";
import TecnicoModal from "../../components/TecnicoModal/TecnicoModal";

import {
  listarTecnicos,
  desactivarTecnico,
  reactivarTecnico,
} from "../../services/tecnicoService";

const COLUMNAS = [
  { key: "documento", label: "Documento" },
  { key: "nombre", label: "Nombre" },
  { key: "especialidad", label: "Especialidad" },
  { key: "correo", label: "Usuario" },
  { key: "carga", label: "Carga" },
  { key: "estadoLaboral", label: "Estado" },
  { key: "acciones", label: "Acciones" },
];

export default function Tecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [tecnicoEditando, setTecnicoEditando] = useState(null);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [tecnicoSeleccionado, setTecnicoSeleccionado] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [tecnicoAEstado, setTecnicoAEstado] = useState(null);

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await listarTecnicos();
      setTecnicos(respuesta.data || []);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No se pudo cargar el listado de técnicos.",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirEditar(tecnico) {
    setEditando(true);
    setTecnicoEditando(tecnico);
    setModalOpen(true);
  }

  function pedirCambioEstado(tecnico) {
    setTecnicoAEstado(tecnico);
    setConfirmOpen(true);
  }

  async function confirmarCambioEstado() {
    setMensaje("");
    setError("");

    try {
      if (tecnicoAEstado.estadoLaboral) {
        await desactivarTecnico(tecnicoAEstado.idEmpleado);
        setMensaje("Técnico desactivado correctamente.");
      } else {
        await reactivarTecnico(tecnicoAEstado.idEmpleado);
        setMensaje("Técnico reactivado correctamente.");
      }

      setConfirmOpen(false);
      cargar();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No se pudo actualizar el estado del técnico.",
      );
      setConfirmOpen(false);
    }
  }

  const tecnicosFiltrados = tecnicos.filter((tecnico) => {
    const texto = busqueda.toLowerCase();

    return (
      tecnico.nombre?.toLowerCase().includes(texto) ||
      tecnico.documento?.toLowerCase().includes(texto) ||
      tecnico.especialidad?.toLowerCase().includes(texto)
    );
  });

  return (
    <>
      <PageHeader
        title="Técnicos"
        subtitle="Gestión del personal técnico. Para dar de alta un técnico nuevo, usa Usuarios → Nuevo Usuario y elige el rol Técnico."
      />

      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="tecnicosCard">
        <SearchBar
          placeholder="Buscar técnico..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {cargando ? (
          <p className="cargandoTexto">Cargando...</p>
        ) : (
          <DataTable
            columns={COLUMNAS}
            data={tecnicosFiltrados}
            emptyMessage="No hay técnicos registrados."
            renderCell={(tecnico, column) => {
              if (column.key === "correo")
                return tecnico.correo || "Sin usuario";

              if (column.key === "carga")
                return `${tecnico.cargaActual ?? 0} / ${tecnico.capacidadMaxima ?? "-"}`;

              if (column.key === "estadoLaboral")
                return (
                  <StatusBadge
                    status={tecnico.estadoLaboral ? "Activo" : "Inactivo"}
                  />
                );

              if (column.key === "acciones")
                return (
                  <div className="tecnicosAcciones">
                    <ActionButtons
                      onView={() => {
                        setTecnicoSeleccionado(tecnico);
                        setDetalleOpen(true);
                      }}
                      onEdit={() => abrirEditar(tecnico)}
                      onDelete={() => pedirCambioEstado(tecnico)}
                    />

                    {!tecnico.estadoLaboral && (
                      <button
                        className="accion reactivarBtn"
                        title="Reactivar"
                        onClick={() => pedirCambioEstado(tecnico)}
                      >
                        <FaUndo />
                      </button>
                    )}
                  </div>
                );

              return tecnico[column.key];
            }}
          />
        )}
      </div>

      <TecnicoModal
        open={modalOpen}
        tecnico={tecnicoEditando}
        editando={editando}
        onClose={() => setModalOpen(false)}
        onGuardado={() => {
          setMensaje(
            editando
              ? "Técnico actualizado correctamente."
              : "Técnico creado correctamente.",
          );
          cargar();
        }}
      />

      <DetailModal
        open={detalleOpen}
        title="Información del Técnico"
        onClose={() => setDetalleOpen(false)}
      >
        <TecnicoDetail tecnico={tecnicoSeleccionado} />
      </DetailModal>

      <ConfirmModal
        open={confirmOpen}
        title={
          tecnicoAEstado?.estadoLaboral
            ? "Desactivar Técnico"
            : "Reactivar Técnico"
        }
        message={
          tecnicoAEstado?.estadoLaboral
            ? `¿Está seguro de desactivar a ${tecnicoAEstado?.nombre}?`
            : `¿Está seguro de reactivar a ${tecnicoAEstado?.nombre}?`
        }
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarCambioEstado}
      />
    </>
  );
}
