import "./Nomina.css";

import { useEffect, useState } from "react";
import { FaPlus, FaSyncAlt } from "react-icons/fa";

import PageHeader from "../../components/PageHeader/PageHeader";
import DataTable from "../../components/DataTable/DataTable";
import ActionButtons from "../../components/ActionButtons/ActionButtons";
import ConfirmModal from "../../components/ConfirmModal/ConfirmModal";
import DetailModal from "../../components/DetailModal/DetailModal";

import NominaModal from "../../components/NominaModal/NominaModal";
import NominaDetail from "../../components/NominaDetail/NominaDetail";

import {
  listarNominas,
  recalcularNomina,
  eliminarNomina,
} from "../../services/nominaService";
import { listarEmpleados } from "../../services/empleadoService";

const COLUMNAS = [
  { key: "nombre", label: "Empleado" },
  { key: "documento", label: "Documento" },
  { key: "periodo", label: "Período" },
  { key: "totalHoras", label: "Horas" },
  { key: "tarifaHoraAplicada", label: "Tarifa" },
  { key: "totalPagar", label: "Total" },
  { key: "fechaGeneracion", label: "Fecha Generación" },
  { key: "acciones", label: "Acciones" },
];

export default function Nomina() {
  const [nominas, setNominas] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modoModal, setModoModal] = useState("generar");
  const [nominaEditando, setNominaEditando] = useState(null);

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [nominaSeleccionada, setNominaSeleccionada] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [nominaAEliminar, setNominaAEliminar] = useState(null);

  async function cargar() {
    setCargando(true);
    setError("");

    try {
      const respuesta = await listarNominas();
      setNominas(respuesta.data || []);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No se pudo cargar el listado de nóminas.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarEmpleados() {
    try {
      const respuesta = await listarEmpleados();
      setEmpleados((respuesta.data || []).filter((e) => e.estadoLaboral));
    } catch {
      setEmpleados([]);
    }
  }

  useEffect(() => {
    cargar();
    cargarEmpleados();
  }, []);

  function abrirGenerar() {
    setModoModal("generar");
    setNominaEditando(null);
    setModalOpen(true);
  }

  function abrirEditar(nomina) {
    setModoModal("editar");
    setNominaEditando(nomina);
    setModalOpen(true);
  }

  async function recalcular(nomina) {
    setMensaje("");
    setError("");

    try {
      const resultado = await recalcularNomina(nomina.idNomina);

      if (resultado.data?.sinCambios) {
        setMensaje("La nómina ya estaba actualizada.");
      } else {
        setMensaje("Nómina recalculada correctamente.");
      }

      cargar();
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "No se pudo recalcular la nómina.",
      );
    }
  }

  function pedirEliminar(nomina) {
    setNominaAEliminar(nomina);
    setConfirmOpen(true);
  }

  async function confirmarEliminar() {
    setMensaje("");
    setError("");

    try {
      await eliminarNomina(nominaAEliminar.idNomina);
      setMensaje("Nómina eliminada correctamente.");
      setConfirmOpen(false);
      cargar();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo eliminar la nómina.");
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Nómina"
        subtitle="Generación y control de pagos del personal."
        button={
          <button className="btnNuevo" onClick={abrirGenerar}>
            <FaPlus />
            Generar Nómina
          </button>
        }
      />

      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="nominaCard">
        {cargando ? (
          <p className="cargandoTexto">Cargando...</p>
        ) : (
          <DataTable
            columns={COLUMNAS}
            data={nominas}
            emptyMessage="No hay nóminas generadas."
            renderCell={(nomina, column) => {
              if (column.key === "periodo")
                return `${nomina.periodoInicio} a ${nomina.periodoFin}`;

              if (column.key === "tarifaHoraAplicada")
                return `$${Number(nomina.tarifaHoraAplicada).toLocaleString("es-CO")}`;

              if (column.key === "totalPagar")
                return `$${Number(nomina.totalPagar).toLocaleString("es-CO")}`;

              if (column.key === "fechaGeneracion")
                return new Date(nomina.fechaGeneracion).toLocaleDateString(
                  "es-CO",
                );

              if (column.key === "acciones")
                return (
                  <div className="nominaAcciones">
                    <ActionButtons
                      onView={() => {
                        setNominaSeleccionada(nomina);
                        setDetalleOpen(true);
                      }}
                      onEdit={() => abrirEditar(nomina)}
                      onDelete={() => pedirEliminar(nomina)}
                    />

                    <button
                      className="accion recalcular"
                      title="Recalcular"
                      onClick={() => recalcular(nomina)}
                    >
                      <FaSyncAlt />
                    </button>
                  </div>
                );

              return nomina[column.key];
            }}
          />
        )}
      </div>

      <NominaModal
        open={modalOpen}
        modo={modoModal}
        nomina={nominaEditando}
        empleados={empleados}
        onClose={() => setModalOpen(false)}
        onGuardado={() => {
          setMensaje(
            modoModal === "editar"
              ? "Nómina actualizada correctamente."
              : "Nómina generada correctamente.",
          );
          cargar();
        }}
      />

      <DetailModal
        open={detalleOpen}
        title="Detalle de la Nómina"
        onClose={() => setDetalleOpen(false)}
      >
        <NominaDetail nomina={nominaSeleccionada} />
      </DetailModal>

      <ConfirmModal
        open={confirmOpen}
        title="Eliminar Nómina"
        message={`¿Está seguro de eliminar la nómina de ${nominaAEliminar?.nombre}?`}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarEliminar}
      />
    </>
  );
}
