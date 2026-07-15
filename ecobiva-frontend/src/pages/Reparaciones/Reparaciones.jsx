import "../Ordenes/Ordenes.css";

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import PageHeader from "../../components/PageHeader/PageHeader";
import SearchBar from "../../components/SearchBar/SearchBar";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import ReparacionPanel from "../../components/ReparacionPanel/ReparacionPanel";
import EvidenciasOrden from "../../components/EvidenciaIngreso/EvidenciasOrden";
import Button from "../../components/Button/Button";

import { listarReparaciones } from "../../services/reparacionService";

import { obtenerOrden } from "../../services/ordenService";

import {
  ESTADO_LABELS,
  ESTADO_VARIANT,
} from "../../components/OrdenDetail/OrdenDetail";

export default function Reparaciones() {
  const navigate = useNavigate();

  const { idOrden } = useParams();

  const [busqueda, setBusqueda] = useState("");

  const [reparaciones, setReparaciones] = useState([]);

  const [orden, setOrden] = useState(null);

  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (idOrden) {
      cargarOrden();
    } else {
      cargarReparaciones();
    }
  }, [idOrden]);

  async function cargarReparaciones() {
    setCargando(true);

    try {
      const data = await listarReparaciones();

      setReparaciones(data);
    } catch (error) {
      console.error(error);

      alert("No fue posible cargar las reparaciones.");
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

  const filtrados = reparaciones.filter((r) =>
    [r.folio, r.cliente, r.placa, r.marca, r.modelo, r.estado]
      .join(" ")
      .toLowerCase()
      .includes(busqueda.toLowerCase()),
  );

  if (idOrden) {
    return (
      <>
        <PageHeader
          title={`Reparación - ${orden?.folio || ""}`}
          subtitle="Registro de la reparación del vehículo."
          button={
            <Button
              variant="secondary"
              onClick={() => navigate("/reparaciones")}
            >
              Volver
            </Button>
          }
        />

        {!cargando && orden && (
          <>
            <EvidenciasOrden idOrden={orden.idOrden} />
            <ReparacionPanel orden={orden} onOrdenActualizada={refrescarOrden} />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Reparaciones"
        subtitle="Órdenes en proceso de reparación."
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
                {filtrados.map((r) => (
                  <tr key={r.idOrden}>
                    <td>{r.folio}</td>

                    <td>{r.cliente}</td>

                    <td>
                      {r.marca} {r.modelo}
                      <br />
                      {r.placa}
                    </td>

                    <td>{r.tecnicoNombre || "Sin asignar"}</td>

                    <td>
                      <StatusBadge
                        status={ESTADO_LABELS[r.estado] || r.estado}
                        variant={ESTADO_VARIANT[r.estado]}
                      />
                    </td>

                    <td>
                      <Button
                        variant="primary"
                        onClick={() => navigate(`/reparaciones/${r.idOrden}`)}
                      >
                        Reparar
                      </Button>
                    </td>
                  </tr>
                ))}

                {filtrados.length === 0 && (
                  <tr>
                    <td colSpan="6">No hay órdenes en reparación.</td>
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
