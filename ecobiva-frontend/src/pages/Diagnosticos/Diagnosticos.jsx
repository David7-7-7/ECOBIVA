import "../Ordenes/Ordenes.css";
import "./Diagnosticos.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/PageHeader/PageHeader";
import SearchBar from "../../components/SearchBar/SearchBar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import DiagnosticoPanel from "../../components/DiagnosticoPanel/DiagnosticoPanel";
import EvidenciasOrden from "../../components/EvidenciaIngreso/EvidenciasOrden";
import Button from "../../components/Button/Button";

import { listarDiagnosticos } from "../../services/diagnosticoService";

import { obtenerOrden } from "../../services/ordenService";

import {
  ESTADO_LABELS,
  ESTADO_VARIANT,
} from "../../components/OrdenDetail/OrdenDetail";

export default function Diagnostico() {
  const navigate = useNavigate();

  const { idOrden } = useParams();

  const [busqueda, setBusqueda] = useState("");

  const [diagnosticos, setDiagnosticos] = useState([]);

  const [orden, setOrden] = useState(null);

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (idOrden) {
      cargarOrden();
    } else {
      cargarDiagnosticos();
    }
  }, [idOrden]);

  async function cargarDiagnosticos() {
    setCargando(true);

    try {
      const data = await listarDiagnosticos();

      setDiagnosticos(data);
    } catch (error) {
      console.error(error);

      alert("No fue posible cargar los diagnósticos.");
    } finally {
      setCargando(false);
    }
  }

  async function cargarOrden() {
    setCargando(true);

    try {
      const data = await obtenerOrden(idOrden);

      setOrden(data);
    } catch (error) {
      console.error(error);

      alert("No fue posible cargar la orden.");
    } finally {
      setCargando(false);
    }
  }

  async function refrescarOrden() {
    const data = await obtenerOrden(idOrden);

    setOrden(data);
  }

  const filtrados = diagnosticos.filter((d) =>
    [d.folio, d.cliente, d.placa, d.marca, d.modelo, d.estado]
      .join(" ")
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  if (idOrden) {
    return (
      <>
        <PageHeader
          title={`Diagnóstico - ${orden?.folio || ""}`}
          subtitle="Registro del diagnóstico del vehículo."
          button={
            <Button
              variant="secondary"
              onClick={() => navigate("/diagnosticos")}
            >
              Volver
            </Button>
          }
        />

        {!cargando && orden && (
          <>
            <EvidenciasOrden idOrden={orden.idOrden} />
            <DiagnosticoPanel orden={orden} onOrdenActualizada={refrescarOrden} />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Diagnósticos"
        subtitle="Órdenes pendientes por diagnosticar."
      />

      <div className="ordenCard">
        <div className="toolbar">
          <SearchBar
            width="100%"
            placeholder="Buscar..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <div className="tableWrapper">
            <table>
              <thead>
                <tr>
                  <th>Folio</th>

                  <th>Cliente</th>

                  <th>Vehículo</th>

                  <th>Técnico</th>

                  <th>Estado</th>

                  <th></th>
                </tr>
              </thead>

              <tbody>
                {filtrados.map((d) => (
                  <tr key={d.idOrden}>
                    <td>{d.folio}</td>

                    <td>{d.cliente}</td>

                    <td>
                      {d.marca} {d.modelo}
                      <br />
                      {d.placa}
                    </td>

                    <td>{d.tecnicoNombre || "Sin asignar"}</td>

                    <td>
                      <StatusBadge
                        status={ESTADO_LABELS[d.estado] || d.estado}
                        variant={ESTADO_VARIANT[d.estado]}
                      />
                    </td>

                    <td>
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/diagnosticos/${d.idOrden}`)}
                      >
                        Diagnosticar
                      </Button>
                    </td>
                  </tr>
                ))}

                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan="6">No hay órdenes para diagnosticar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
