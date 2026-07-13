import "./Usuarios.css";

import { useEffect, useState } from "react";
import { FaPlus, FaUndo } from "react-icons/fa";

import PageHeader from "../../components/PageHeader/PageHeader";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import DataTable from "../../components/DataTable/DataTable";
import SearchBar from "../../components/SearchBar/SearchBar";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import UsuarioModal from "../../components/UsuarioModal/UsuarioModal";

import {
  listarUsuarios,
  crearUsuario,
  editarUsuario,
  desactivarUsuario,
  activarUsuario,
} from "../../services/usuarioService";
import { listarRoles } from "../../services/rolService";

const COLUMNAS = [
  { key: "correo", label: "Correo" },
  { key: "nombreEmpleado", label: "Empleado" },
  { key: "roles", label: "Rol" },
  { key: "estado", label: "Estado" },
  { key: "acciones", label: "Acciones" },
];

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [busqueda, setBusqueda] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [usuarioAEstado, setUsuarioAEstado] = useState(null);

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const data = await listarUsuarios();
      setUsuarios(data || []);
    } catch (err) {
      setError(
        err.response?.data?.error || "No se pudo cargar el listado de usuarios.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarRoles() {
    try {
      const data = await listarRoles();
      setRoles(data || []);
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
    setUsuarioEditando(null);
    setModalOpen(true);
  }

  function abrirEditar(usuario) {
    setEditando(true);
    setUsuarioEditando(usuario);
    setModalOpen(true);
  }

  function pedirCambioEstado(usuario) {
    setUsuarioAEstado(usuario);
    setConfirmOpen(true);
  }

  async function confirmarCambioEstado() {
    setMensaje("");
    setError("");

    try {
      if (usuarioAEstado.estado === false || usuarioAEstado.estado === 0) {
        await activarUsuario(usuarioAEstado.idUsuario);
        setMensaje("Usuario activado correctamente.");
      } else {
        await desactivarUsuario(usuarioAEstado.idUsuario);
        setMensaje("Usuario desactivado correctamente.");
      }

      setConfirmOpen(false);
      cargar();
    } catch (err) {
      setError(
        err.response?.data?.error || "No se pudo actualizar el estado del usuario.",
      );
      setConfirmOpen(false);
    }
  }

  async function guardarUsuario(form) {
    if (editando) {
      await editarUsuario(usuarioEditando.idUsuario, {
        correo: form.correo,
        nombreRol: form.nombreRol,
      });
      setMensaje("Usuario actualizado correctamente.");
    } else {
      await crearUsuario(form);
      setMensaje("Usuario creado correctamente.");
    }
    cargar();
  }

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase();

    return (
      usuario.correo?.toLowerCase().includes(texto) ||
      usuario.nombreEmpleado?.toLowerCase().includes(texto) ||
      (Array.isArray(usuario.roles) ? usuario.roles.join(", ") : "")
        .toLowerCase()
        .includes(texto)
    );
  });

  const estaActivo = (usuario) => !(usuario.estado === false || usuario.estado === 0);

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Administración de cuentas y roles de acceso."
        button={
          <button className="btnNuevo" onClick={abrirCrear}>
            <FaPlus />
            Nuevo Usuario
          </button>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="usuariosCard">
        <SearchBar
          placeholder="Buscar por correo, empleado o rol..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />

        {cargando ? (
          <p className="cargandoTexto">Cargando...</p>
        ) : (
          <DataTable
            columns={COLUMNAS}
            data={usuariosFiltrados}
            emptyMessage="No hay usuarios registrados."
            renderCell={(usuario, column) => {
              if (column.key === "roles")
                return Array.isArray(usuario.roles)
                  ? usuario.roles.join(", ")
                  : "Sin rol";

              if (column.key === "estado")
                return (
                  <StatusBadge status={estaActivo(usuario) ? "Activo" : "Inactivo"} />
                );

              if (column.key === "acciones")
                return (
                  <div className="usuariosAcciones">
                    <ActionButtons
                      onEdit={() => abrirEditar(usuario)}
                      onDelete={
                        estaActivo(usuario) ? () => pedirCambioEstado(usuario) : undefined
                      }
                    />

                    {!estaActivo(usuario) && (
                      <button
                        className="accion reactivarBtn"
                        title="Activar"
                        onClick={() => pedirCambioEstado(usuario)}
                      >
                        <FaUndo />
                      </button>
                    )}
                  </div>
                );

              return usuario[column.key];
            }}
          />
        )}
      </div>

      <UsuarioModal
        open={modalOpen}
        usuario={usuarioEditando}
        editando={editando}
        roles={roles}
        onClose={() => setModalOpen(false)}
        onSave={guardarUsuario}
      />

      <ConfirmModal
        open={confirmOpen}
        title={estaActivo(usuarioAEstado || {}) ? "Desactivar Usuario" : "Activar Usuario"}
        message={
          estaActivo(usuarioAEstado || {})
            ? `¿Está seguro de desactivar a ${usuarioAEstado?.correo}?`
            : `¿Está seguro de activar a ${usuarioAEstado?.correo}?`
        }
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarCambioEstado}
      />
    </>
  );
}
