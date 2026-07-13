import { useEffect, useState } from "react";
import "./DiagnosticoPanel.css";

import Button from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerDiagnostico,
  guardarDiagnostico,
  enviarDiagnosticoAAprobacion,
} from "../../services/diagnosticoService";

// El checklist se guarda en el backend como un objeto JSON libre
// (item -> observación). Acá lo editamos como una lista de filas
// clave/valor para no forzar una estructura rígida que el backend no pide.
function checklistAFilas(checklist) {
  if (!checklist || typeof checklist !== "object") return [];
  return Object.entries(checklist).map(([item, observacion]) => ({
    item,
    observacion: String(observacion ?? ""),
  }));
}

function filasAChecklist(filas) {
  const checklist = {};
  filas.forEach(({ item, observacion }) => {
    if (item?.trim()) checklist[item.trim()] = observacion?.trim() || "";
  });
  return checklist;
}

export default function DiagnosticoPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();
  const puedeEditar = tieneAlgunRol(["Admin", "Tecnico"]);

  const [diagnostico, setDiagnostico] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tipoDiagnostico, setTipoDiagnostico] = useState("superficial");
  const [costoDiagnostico, setCostoDiagnostico] = useState("");
  const [filas, setFilas] = useState([{ item: "", observacion: "" }]);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orden.idOrden]);

  const cargar = async () => {
    setCargando(true);
    try {
      const data = await obtenerDiagnostico(orden.idOrden);
      setDiagnostico(data);
      setTipoDiagnostico(data.tipoDiagnostico || "superficial");
      setCostoDiagnostico(data.costoDiagnostico ?? "");
      const filasExistentes = checklistAFilas(data.checklist);
      setFilas(
        filasExistentes.length > 0
          ? filasExistentes
          : [{ item: "", observacion: "" }],
      );
    } catch (error) {
      // 404 = todavía no existe diagnóstico para esta orden, es un estado normal.
      setDiagnostico(null);
    } finally {
      setCargando(false);
    }
  };

  const puedeEditarAhora =
    puedeEditar && orden.estado === "en_diagnostico" && !diagnostico?.bloqueado;

  const actualizarFila = (index, campo, valor) => {
    setFilas((prev) =>
      prev.map((fila, i) => (i === index ? { ...fila, [campo]: valor } : fila)),
    );
  };

  const agregarFila = () =>
    setFilas((prev) => [...prev, { item: "", observacion: "" }]);

  const quitarFila = (index) =>
    setFilas((prev) => prev.filter((_, i) => i !== index));

  const guardar = async () => {
    setGuardando(true);
    try {
      const payload = {
        checklist: filasAChecklist(filas),
        tipoDiagnostico,
        costoDiagnostico:
          tipoDiagnostico === "profundo" ? Number(costoDiagnostico || 0) : 0,
      };
      const actualizado = await guardarDiagnostico(orden.idOrden, payload);
      setDiagnostico(actualizado);
      if (onOrdenActualizada) await onOrdenActualizada();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error ||
          "No fue posible guardar el diagnóstico.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const enviarAAprobacion = async () => {
    if (
      !window.confirm(
        "Al enviar a aprobación el diagnóstico queda bloqueado y ya no se podrá editar. ¿Continuar?",
      )
    )
      return;

    setEnviando(true);
    try {
      await enviarDiagnosticoAAprobacion(orden.idOrden);
      await cargar();
      if (onOrdenActualizada) await onOrdenActualizada();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error ||
          "No fue posible enviar el diagnóstico a aprobación.",
      );
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) {
    return (
      <section className="detailSection">
        <h3>Diagnóstico</h3>
        <p className="observaciones">Cargando diagnóstico...</p>
      </section>
    );
  }

  if (!diagnostico && !puedeEditarAhora) {
    return (
      <section className="detailSection">
        <h3>Diagnóstico</h3>
        <p className="observaciones">
          Esta orden todavía no tiene un diagnóstico registrado.
        </p>
      </section>
    );
  }

  return (
    <section className="detailSection">
      <h3>Diagnóstico</h3>

      {diagnostico?.bloqueado && (
        <p className="diagnosticoBloqueado">
          Diagnóstico enviado a aprobación el{" "}
          {diagnostico.fechaEnvio
            ? new Date(diagnostico.fechaEnvio).toLocaleString()
            : "-"}
          . Ya no se puede editar.
        </p>
      )}

      <div className="detailGrid">
        <div className="inputGroup">
          <label>Tipo de diagnóstico</label>
          <select
            value={tipoDiagnostico}
            onChange={(e) => setTipoDiagnostico(e.target.value)}
            disabled={!puedeEditarAhora}
          >
            <option value="superficial">Superficial (gratis)</option>
            <option value="profundo">Profundo (con costo)</option>
          </select>
        </div>

        {tipoDiagnostico === "profundo" && (
          <div className="inputGroup">
            <label>Costo del diagnóstico</label>
            <input
              type="number"
              value={costoDiagnostico}
              onChange={(e) => setCostoDiagnostico(e.target.value)}
              disabled={!puedeEditarAhora}
              placeholder="0"
            />
          </div>
        )}
      </div>

      <div className="checklistWrapper">
        <span className="fieldTitle">Checklist</span>

        {filas.map((fila, index) => (
          <div className="checklistFila" key={index}>
            <input
              type="text"
              placeholder="Ítem (ej: frenos)"
              value={fila.item}
              onChange={(e) => actualizarFila(index, "item", e.target.value)}
              disabled={!puedeEditarAhora}
            />
            <input
              type="text"
              placeholder="Observación"
              value={fila.observacion}
              onChange={(e) =>
                actualizarFila(index, "observacion", e.target.value)
              }
              disabled={!puedeEditarAhora}
            />
            {puedeEditarAhora && filas.length > 1 && (
              <button
                type="button"
                className="checklistQuitar"
                onClick={() => quitarFila(index)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {puedeEditarAhora && (
          <button
            type="button"
            className="checklistAgregar"
            onClick={agregarFila}
          >
            + Agregar ítem
          </button>
        )}
      </div>

      {puedeEditarAhora && (
        <div className="diagnosticoAcciones">
          <Button variant="secondary" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar diagnóstico"}
          </Button>
          <Button
            variant="primary"
            onClick={enviarAAprobacion}
            disabled={enviando || !diagnostico}
          >
            {enviando ? "Enviando..." : "Enviar a aprobación"}
          </Button>
        </div>
      )}
    </section>
  );
}
