import "./HistorialCargo.css";

import { useEffect, useState } from "react";

import { FaEye } from "react-icons/fa";

import PageHeader from "../../components/PageHeader/PageHeader";
import DataTable from "../../components/DataTable/DataTable";
import SearchBar from "../../components/SearchBar/SearchBar";
import DetailModal from "../../components/DetailModal/DetailModal";
import HistorialCargoDetail from "../../components/HistorialCargoDetail/HistorialCargoDetail";

import {
  listarHistorialCargo,
  listarHistorialPorEmpleado,
} from "../../services/historialCargoService";
import { listarEmpleados } from "../../services/empleadoService";

const COLUMNAS = [
  { key: "empleado", label: "Empleado" },
  { key: "documento", label: "Documento" },
  { key: "cargoAnterior", label: "Cargo Anterior" },
  { key: "cargoNuevo", label: "Cargo Nuevo" },
  { key: "fechaCambio", label: "Fecha de Cambio" },
  { key: "acciones", label: "Acciones" },
];

export default function HistorialCargo() {
  const [historial, setHistorial] = useState([]);
  const [empleados, setEmpleados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [empleadoFiltro, setEmpleadoFiltro] = useState("");

  const [detalleOpen, setDetalleOpen] = useState(false);
  const [historialSeleccionado, setHistorialSeleccionado] = useState(null);

  async function cargar(idEmpleado = "") {
    setCargando(true);
    setError("");

    try {
      const respuesta = idEmpleado
        ? await listarHistorialPorEmpleado(idEmpleado)
        : await listarHistorialCargo();

      setHistorial(respuesta.data || []);
    } catch (err) {
      setError(
        err.response?.data?.mensaje ||
          "No se pudo cargar el historial de cargos.",
      );
    } finally {
      setCargando(false);
    }
  }

  async function cargarEmpleados() {
    try {
      const respuesta = await listarEmpleados();
      setEmpleados(respuesta.data || []);
    } catch {
      setEmpleados([]);
    }
  }

  useEffect(() => {
    cargar();
    cargarEmpleados();
  }, []);

  function cambiarEmpleadoFiltro(idEmpleado) {
    setEmpleadoFiltro(idEmpleado);
    cargar(idEmpleado);
  }

  const historialFiltrado = historial.filter((item) => {
    const texto = busqueda.toLowerCase();

    return (
      item.empleado?.toLowerCase().includes(texto) ||
      item.documento?.toLowerCase().includes(texto) ||
      item.cargoNuevo?.toLowerCase().includes(texto)
    );
  });

  return (
    <>
      <PageHeader
        title="Historial de Cargos"
        subtitle="Consulta de cambios de cargo y tarifa del personal."
      />

      {error && <div className="alert alert-error">{error}</div>}

      <div className="historialCargoCard">
        <div className="historialFiltros">
          <SearchBar
            placeholder="Buscar por empleado, documento o cargo..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />

          <select
            className="filtroEmpleado"
            value={empleadoFiltro}
            onChange={(e) => cambiarEmpleadoFiltro(e.target.value)}
          >
            <option value="">Todos los empleados</option>

            {empleados.map((empleado) => (
              <option key={empleado.idEmpleado} value={empleado.idEmpleado}>
                {empleado.nombre} — {empleado.documento}
              </option>
            ))}
          </select>
        </div>

        {cargando ? (
          <p className="cargandoTexto">Cargando...</p>
        ) : (
          <DataTable
            columns={COLUMNAS}
            data={historialFiltrado}
            emptyMessage="No hay cambios de cargo registrados."
            renderCell={(item, column) => {
              if (column.key === "fechaCambio")
                return item.fechaCambio
                  ? new Date(item.fechaCambio).toLocaleDateString("es-CO")
                  : "-";

              if (column.key === "acciones")
                return (
                  <div className="historialAcciones">
                    <button
                      className="accion ver"
                      title="Ver detalle"
                      onClick={() => {
                        setHistorialSeleccionado(item);
                        setDetalleOpen(true);
                      }}
                    >
                      <FaEye />
                    </button>
                  </div>
                );

              return item[column.key];
            }}
          />
        )}
      </div>

      <DetailModal
        open={detalleOpen}
        title="Detalle del Cambio de Cargo"
        onClose={() => setDetalleOpen(false)}
      >
        <HistorialCargoDetail historial={historialSeleccionado} />
      </DetailModal>
    </>
  );
}
