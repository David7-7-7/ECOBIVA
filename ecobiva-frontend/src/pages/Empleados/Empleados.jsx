import "./Empleados.css";

import { useEffect, useState } from "react";
import { FaPlus, FaUserPlus, FaUndo } from "react-icons/fa";

import PageHeader from "../../components/PageHeader/PageHeader";
import DataTable from "../../components/DataTable/DataTable";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import SearchBar from "../../components/SearchBar/SearchBar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import DetailModal from "../../components/DetailModal/DetailModal";

import EmpleadoModal from "../../components/EmpleadoModal/EmpleadoModal";
import EmpleadoDetail from "../../components/EmpleadoDetail/EmpleadoDetail";
import CrearUsuarioEmpleadoModal from "../../components/CrearUsuarioEmpleadoModal/CrearUsuarioEmpleadoModal";

import {
  listarEmpleados,
  desactivarEmpleado,
  reactivarEmpleado,
} from "../../services/empleadoService";
import { listarRoles } from "../../services/rolService";

const COLUMNAS = [
  { key: "nombre", label: "Nombre" },
  { key: "documento", label: "Documento" },
  { key: "cargoActual", label: "Cargo" },
  { key: "tarifaHora", label: "Tarifa/Hora" },
  { key: "correo", label: "Usuario" },
  { key: "estadoLaboral", label: "Estado" },
  { key: "acciones", label: "Acciones" },
];

export default function Empleados() {
  const [empleados, setEmpleados] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [empleadoEditando, setEmpleadoEditando] = useState(null);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [empleadoSeleccionado, setEmpleadoSeleccionado] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [empleadoAEstado, setEmpleadoAEstado] = useState(null);

  const [usuarioModalOpen, setUsuarioModalOpen] = useState(false);
  const [empleadoParaUsuario, setEmpleadoParaUsuario] = useState(null);

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await listarEmpleados();
      setEmpleados(respuesta.data || []);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No se pudo cargar el listado de empleados.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarRoles() {
    try {
      const respuesta = await listarRoles();
      setRoles(respuesta || []);
    } catch {
      setRoles([]);
    }
  }

  useEffect(() => {
    cargar();
    cargarRoles();
  }, []);

  function abrirCrear() {
    setEditando(false);
    setEmpleadoEditando(null);
    setModalOpen(true);
  }

  function abrirEditar(empleado) {
    setEditando(true);
    setEmpleadoEditando(empleado);
    setModalOpen(true);
  }

  function pedirCambioEstado(empleado) {
    setEmpleadoAEstado(empleado);
    setConfirmOpen(true);
  }

  async function confirmarCambioEstado() {
    setMensaje("");
    setError("");

    try {
      if (empleadoAEstado.estadoLaboral) {
        await desactivarEmpleado(empleadoAEstado.idEmpleado);
        setMensaje("Empleado desactivado correctamente.");
      } else {
        await reactivarEmpleado(empleadoAEstado.idEmpleado);
        setMensaje("Empleado reactivado correctamente.");
      }

      setConfirmOpen(false);
      cargar();
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No se pudo actualizar el estado del empleado.",
      );
      setConfirmOpen(false);
    }
  }

  function abrirCrearUsuario(empleado) {
    setEmpleadoParaUsuario(empleado);
    setUsuarioModalOpen(true);
  }

  const empleadosFiltrados = empleados.filter((empleado) => {
    const texto = busqueda.toLowerCase();

    return (
      empleado.nombre?.toLowerCase().includes(texto) ||
      empleado.documento?.toLowerCase().includes(texto) ||
      empleado.cargoActual?.toLowerCase().includes(texto)
    );
  });

  return (
    <>
      <PageHeader
        title="Empleados"
        subtitle="Administración del personal de la empresa."
        button={
          <button className="btnNuevo" onClick={abrirCrear}>
            <FaPlus />
            Nuevo Empleado
          </button>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="empleadosCard">
        <SearchBar
          placeholder="Buscar por nombre, documento o cargo..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {cargando ? (
          <p className="cargandoTexto">Cargando...</p>
        ) : (
          <DataTable
            columns={COLUMNAS}
            data={empleadosFiltrados}
            emptyMessage="No hay empleados registrados."
            renderCell={(empleado, column) => {
              if (column.key === "tarifaHora")
                return `$${Number(empleado.tarifaHora).toLocaleString("es-CO")}`;

              if (column.key === "correo")
                return empleado.correo || "Sin usuario";

              if (column.key === "estadoLaboral")
                return (
                  <StatusBadge
                    status={empleado.estadoLaboral ? "Activo" : "Inactivo"}
                  />
                );

              if (column.key === "acciones")
                return (
                  <div className="empleadosAcciones">
                    <ActionButtons
                      onView={() => {
                        setEmpleadoSeleccionado(empleado);
                        setDetalleOpen(true);
                      }}
                      onEdit={() => abrirEditar(empleado)}
                      onDelete={() => pedirCambioEstado(empleado)}
                    />

                    {!empleado.estadoLaboral && (
                      <button
                        className="accion reactivarBtn"
                        title="Reactivar"
                        onClick={() => pedirCambioEstado(empleado)}
                      >
                        <FaUndo />
                      </button>
                    )}

                    {!empleado.idUsuario && empleado.estadoLaboral && (
                      <button
                        className="accion crearUsuarioBtn"
                        title="Crear Usuario"
                        onClick={() => abrirCrearUsuario(empleado)}
                      >
                        <FaUserPlus />
                      </button>
                    )}
                  </div>
                );

              return empleado[column.key];
            }}
          />
        )}
      </div>

      <EmpleadoModal
        open={modalOpen}
        empleado={empleadoEditando}
        editando={editando}
        onClose={() => setModalOpen(false)}
        onGuardado={() => {
          setMensaje(
            editando
              ? "Empleado actualizado correctamente."
              : "Empleado creado correctamente.",
          );
          cargar();
        }}
      />

      <DetailModal
        open={detalleOpen}
        title="Información del Empleado"
        onClose={() => setDetalleOpen(false)}
      >
        <EmpleadoDetail empleado={empleadoSeleccionado} />
      </DetailModal>

      <CrearUsuarioEmpleadoModal
        open={usuarioModalOpen}
        empleado={empleadoParaUsuario}
        roles={roles}
        onClose={() => setUsuarioModalOpen(false)}
        onGuardado={() => {
          setMensaje("Usuario creado correctamente para el empleado.");
          cargar();
        }}
      />

      <ConfirmModal
        open={confirmOpen}
        title={
          empleadoAEstado?.estadoLaboral
            ? "Desactivar Empleado"
            : "Reactivar Empleado"
        }
        message={
          empleadoAEstado?.estadoLaboral
            ? `¿Está seguro de desactivar a ${empleadoAEstado?.nombre}?`
            : `¿Está seguro de reactivar a ${empleadoAEstado?.nombre}?`
        }
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarCambioEstado}
      />
    </>
  );
}
