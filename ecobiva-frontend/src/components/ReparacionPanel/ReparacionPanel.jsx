import { useEffect, useState } from "react";
import "./ReparacionPanel.css";

import Button from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerReparacion,
  guardarReparacion,
  finalizarReparacion,
  listarRepuestosReparacion,
  agregarRepuestoReparacion,
  eliminarRepuestoReparacion,
} from "../../services/reparacionService";
import { obtenerRepuestos } from "../../services/repuestoService";

const REPUESTO_INICIAL = {
  idRepuesto: "",
  cantidad: "1",
  descripcion: "",
  foto: null,
};

export default function ReparacionPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();

  const puedeEditar = tieneAlgunRol(["Admin", "Tecnico"]);

  const [reparacion, setReparacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [descripcionManoObra, setDescripcionManoObra] = useState("");
  const [valorManoObra, setValorManoObra] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);

  const [repuestos, setRepuestos] = useState([]);
  const [inventario, setInventario] = useState([]);
  const [nuevoRepuesto, setNuevoRepuesto] = useState(REPUESTO_INICIAL);
  const [agregando, setAgregando] = useState(false);
  const [eliminandoId, setEliminandoId] = useState(null);

  useEffect(() => {
    if (!orden?.idOrden) return;

    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden]);

  const cargar = async () => {
    setCargando(true);

    try {
      const data = await obtenerReparacion(orden.idOrden);

      setReparacion(data);
      setDescripcionManoObra(data.descripcionManoObra || "");
      setValorManoObra(data.valorManoObra ?? "");

      const listaRepuestos = await listarRepuestosReparacion(orden.idOrden);
      setRepuestos(listaRepuestos);

      if (tieneAlgunRol(["Admin", "Tecnico"])) {
        const listaInventario = await obtenerRepuestos();
        setInventario(listaInventario.filter((r) => r.stockActual > 0));
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setReparacion(null);
      } else {
        console.error(error);
        alert("No fue posible cargar la reparación.");
      }
    } finally {
      setCargando(false);
    }
  };

  const puedeEditarAhora =
    puedeEditar && orden.estado === "en_reparacion" && !reparacion?.bloqueada;

  const guardar = async () => {
    setGuardando(true);

    try {
      await guardarReparacion(orden.idOrden, {
        descripcionManoObra,
        valorManoObra: Number(valorManoObra || 0),
      });

      await cargar();

      if (onOrdenActualizada) {
        await onOrdenActualizada();
      }
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ??
          "No fue posible guardar la reparación.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const agregarRepuesto = async () => {
    if (!nuevoRepuesto.idRepuesto || !nuevoRepuesto.cantidad) {
      alert("Seleccione un repuesto e indique la cantidad.");
      return;
    }

    setAgregando(true);

    try {
      await agregarRepuestoReparacion(orden.idOrden, nuevoRepuesto);

      setNuevoRepuesto(REPUESTO_INICIAL);

      await cargar();

      if (onOrdenActualizada) {
        await onOrdenActualizada();
      }
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ??
          "No fue posible agregar el repuesto.",
      );
    } finally {
      setAgregando(false);
    }
  };

  const quitarRepuesto = async (idReparacionRepuesto) => {
    if (!window.confirm("¿Quitar este repuesto? Se repondrá el stock.")) {
      return;
    }

    setEliminandoId(idReparacionRepuesto);

    try {
      await eliminarRepuestoReparacion(orden.idOrden, idReparacionRepuesto);

      await cargar();

      if (onOrdenActualizada) {
        await onOrdenActualizada();
      }
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ??
          "No fue posible quitar el repuesto.",
      );
    } finally {
      setEliminandoId(null);
    }
  };

  const finalizar = async () => {
    if (
      !window.confirm(
        "Al finalizar la reparación quedará bloqueada y se generará automáticamente la factura. ¿Desea continuar?",
      )
    ) {
      return;
    }

    setFinalizando(true);

    try {
      await finalizarReparacion(orden.idOrden);

      await cargar();

      if (onOrdenActualizada) {
        await onOrdenActualizada();
      }
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ??
          "No fue posible finalizar la reparación.",
      );
    } finally {
      setFinalizando(false);
    }
  };

  if (cargando) {
    return (
      <section className="detailSection">
        <h3>Reparación</h3>
        <p className="observaciones">Cargando reparación...</p>
      </section>
    );
  }

  if (!reparacion) {
    return (
      <section className="detailSection">
        <h3>Reparación</h3>
        <p className="observaciones">
          Esta orden todavía no tiene una reparación en curso. El registro se
          crea automáticamente cuando el cliente aprueba el diagnóstico.
        </p>
      </section>
    );
  }

  return (
    <section className="detailSection">
      <div className="reparacionHeader">
        <h3>Reparación</h3>
      </div>

      <p className="reparacionFolio">
        <strong>Orden:</strong> {orden.folio}
      </p>
      <p className="reparacionFolio">
        <strong>Técnico asignado:</strong> {orden.tecnicoNombre || "Sin asignar"}
      </p>

      {reparacion.bloqueada && (
        <p className="reparacionBloqueada">
          Reparación finalizada el{" "}
          {reparacion.fechaFin
            ? new Date(reparacion.fechaFin).toLocaleString()
            : "-"}
          . Se generó la factura de reparación automáticamente.
        </p>
      )}

      <div className="detailGrid">
        <div className="inputGroup">
          <label>Descripción de mano de obra</label>
          <textarea
            rows={3}
            value={descripcionManoObra}
            onChange={(e) => setDescripcionManoObra(e.target.value)}
            disabled={!puedeEditarAhora}
            placeholder="Describa el trabajo realizado..."
          />
        </div>

        <div className="inputGroup">
          <label>Valor de mano de obra</label>
          <input
            type="number"
            min="0"
            value={valorManoObra}
            onChange={(e) => setValorManoObra(e.target.value)}
            disabled={!puedeEditarAhora}
          />
        </div>
      </div>

      {puedeEditarAhora && (
        <div className="reparacionAcciones">
          <Button variant="secondary" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar mano de obra"}
          </Button>
        </div>
      )}

      <div className="repuestosWrapper">
        <span className="fieldTitle">Repuestos usados</span>

        {repuestos.length === 0 ? (
          <p className="observaciones">Sin repuestos registrados.</p>
        ) : (
          <table className="repuestosTable">
            <thead>
              <tr>
                <th>Repuesto</th>
                <th>Cantidad</th>
                <th>Precio unit.</th>
                <th>Descripción</th>
                <th>Foto</th>
                {puedeEditarAhora && <th></th>}
              </tr>
            </thead>
            <tbody>
              {repuestos.map((rep) => (
                <tr key={rep.idReparacionRepuesto}>
                  <td>{rep.repuestoNombre}</td>
                  <td>{rep.cantidad}</td>
                  <td>{rep.precioUnitario}</td>
                  <td>{rep.descripcion || "-"}</td>
                  <td>
                    {rep.fotoUrl ? (
                      <a
                        href={`http://localhost:3000/uploads/evidencias/${rep.fotoUrl}`}
                        target="_blank"
                        rel="noreferrer"
                        className="fotoPreview"
                      >
                        <img
                          src={`http://localhost:3000/uploads/evidencias/${rep.fotoUrl}`}
                          alt={rep.repuestoNombre}
                        />
                      </a>
                    ) : (
                      "-"
                    )}
                  </td>
                  {puedeEditarAhora && (
                    <td>
                      <button
                        type="button"
                        className="checklistQuitar"
                        onClick={() => quitarRepuesto(rep.idReparacionRepuesto)}
                        disabled={eliminandoId === rep.idReparacionRepuesto}
                      >
                        ×
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {puedeEditarAhora && (
          <div className="repuestoNuevo">
            <div className="detailGrid">
              <div className="inputGroup">
                <label>Repuesto</label>
                <select
                  value={nuevoRepuesto.idRepuesto}
                  onChange={(e) =>
                    setNuevoRepuesto({
                      ...nuevoRepuesto,
                      idRepuesto: e.target.value,
                    })
                  }
                >
                  <option value="">Seleccione...</option>
                  {inventario.map((rep) => (
                    <option key={rep.idRepuesto} value={rep.idRepuesto}>
                      {rep.nombre} (stock: {rep.stockActual})
                    </option>
                  ))}
                </select>
              </div>

              <div className="inputGroup">
                <label>Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={nuevoRepuesto.cantidad}
                  onChange={(e) =>
                    setNuevoRepuesto({
                      ...nuevoRepuesto,
                      cantidad: e.target.value,
                    })
                  }
                />
              </div>

              <div className="inputGroup">
                <label>Descripción (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. pastillas de freno traseras"
                  value={nuevoRepuesto.descripcion}
                  onChange={(e) =>
                    setNuevoRepuesto({
                      ...nuevoRepuesto,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>

              <div className="inputGroup">
                <label>Foto (opcional)</label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={(e) =>
                    setNuevoRepuesto({
                      ...nuevoRepuesto,
                      foto: e.target.files?.[0] || null,
                    })
                  }
                />
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={agregarRepuesto}
              disabled={agregando}
            >
              {agregando ? "Agregando..." : "Agregar repuesto"}
            </Button>
          </div>
        )}
      </div>

      {puedeEditarAhora && (
        <div className="reparacionAcciones">
          <Button variant="primary" onClick={finalizar} disabled={finalizando}>
            {finalizando ? "Finalizando..." : "Finalizar reparación"}
          </Button>
        </div>
      )}
    </section>
  );
}
