import { useEffect, useState } from "react";
import "./DiagnosticoPanel.css";
import jsPDF from "jspdf";

import Button from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import {
  obtenerDiagnostico,
  guardarDiagnostico,
  enviarDiagnosticoAAprobacion,
} from "../../services/diagnosticoService";

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
    if (item?.trim()) {
      checklist[item.trim()] = observacion?.trim() || "";
    }
  });
  return checklist;
}

export default function DiagnosticoPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();

  const puedeEditar = tieneAlgunRol(["Admin", "Tecnico"]);

  const [diagnostico, setDiagnostico] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [tipoDiagnostico, setTipoDiagnostico] = useState("superficial");
  const [nivelBateria, setNivelBateria] = useState("");
  const [costoDiagnostico, setCostoDiagnostico] = useState("");
  const [filas, setFilas] = useState([{ item: "", observacion: "" }]);
  const [guardando, setGuardando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!orden?.idOrden) return;

    cargar();
  }, [orden]);

  const cargar = async () => {
    setCargando(true);

    try {
      const data = await obtenerDiagnostico(orden.idOrden);

      setDiagnostico(data);
      setTipoDiagnostico(data.tipoDiagnostico || "superficial");
      setNivelBateria(data.nivelBateria ?? "");
      setCostoDiagnostico(data.costoDiagnostico ?? "");

      const filasExistentes = checklistAFilas(data.checklist);

      setFilas(
        filasExistentes.length > 0
          ? filasExistentes
          : [{ item: "", observacion: "" }],
      );
    } catch (error) {
      if (error.response?.status === 404) {
        setDiagnostico(null);
      } else {
        console.error(error);
        alert("No fue posible cargar el diagnóstico.");
      }
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

  const agregarFila = () => {
    setFilas((prev) => [...prev, { item: "", observacion: "" }]);
  };

  const quitarFila = (index) => {
    setFilas((prev) => prev.filter((_, i) => i !== index));
  };

  const guardar = async () => {
    setGuardando(true);

    try {
      const payload = {
        checklist: filasAChecklist(filas),
        tipoDiagnostico,
        nivelBateria: nivelBateria === "" ? null : Number(nivelBateria),
        costoDiagnostico:
          tipoDiagnostico === "profundo" ? Number(costoDiagnostico || 0) : 0,
      };

      await guardarDiagnostico(orden.idOrden, payload);

      await cargar();

      if (onOrdenActualizada) {
        await onOrdenActualizada();
      }
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ??
          "No fue posible guardar el diagnóstico.",
      );
    } finally {
      setGuardando(false);
    }
  };

  const enviarAAprobacion = async () => {
    if (
      !window.confirm(
        "Al enviar a aprobación el diagnóstico quedará bloqueado. ¿Desea continuar?",
      )
    ) {
      return;
    }

    setEnviando(true);

    try {
      await enviarDiagnosticoAAprobacion(orden.idOrden);

      await cargar();

      if (onOrdenActualizada) {
        await onOrdenActualizada();
      }
    } catch (error) {
      console.error(error);

      alert(
        error?.response?.data?.error ?? "No fue posible enviar el diagnóstico.",
      );
    } finally {
      setEnviando(false);
    }
  };

  const descargarPdf = () => {
    const doc = new jsPDF();
    const margenIzq = 15;
    let y = 20;

    const saltoDeLinea = (alto = 7) => {
      y += alto;
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
    };

    doc.setFontSize(16);
    doc.text("Diagnóstico de vehículo", margenIzq, y);
    saltoDeLinea(10);

    doc.setFontSize(11);
    doc.text(`Orden: ${orden.folio || ""}`, margenIzq, y);
    saltoDeLinea();
    doc.text(`Cliente: ${orden.clienteNombre || "-"}`, margenIzq, y);
    saltoDeLinea();
    doc.text(
      `Vehículo: ${orden.vehiculoPlaca || ""} ${orden.vehiculoMarca || ""} ${orden.vehiculoModelo || ""}`.trim(),
      margenIzq,
      y,
    );
    saltoDeLinea();
    doc.text(`Técnico: ${orden.tecnicoNombre || "-"}`, margenIzq, y);
    saltoDeLinea(10);

    if (orden.motivoIngreso) {
      doc.setFont(undefined, "bold");
      doc.text("Motivo de ingreso reportado por el cliente:", margenIzq, y);
      doc.setFont(undefined, "normal");
      saltoDeLinea();
      const motivoLineas = doc.splitTextToSize(orden.motivoIngreso, 180);
      doc.text(motivoLineas, margenIzq, y);
      saltoDeLinea(motivoLineas.length * 6 + 4);
    }

    doc.setFont(undefined, "bold");
    doc.text("Resultado del diagnóstico", margenIzq, y);
    doc.setFont(undefined, "normal");
    saltoDeLinea();
    doc.text(
      `Tipo: ${tipoDiagnostico === "profundo" ? "Profundo (con costo)" : "Superficial (gratis)"}`,
      margenIzq,
      y,
    );
    saltoDeLinea();
    doc.text(`Nivel de batería: ${nivelBateria !== "" ? `${nivelBateria}%` : "-"}`, margenIzq, y);
    saltoDeLinea();
    if (tipoDiagnostico === "profundo") {
      doc.text(`Costo del diagnóstico: $${costoDiagnostico || 0}`, margenIzq, y);
      saltoDeLinea();
    }
    saltoDeLinea(4);

    doc.setFont(undefined, "bold");
    doc.text("Checklist", margenIzq, y);
    doc.setFont(undefined, "normal");
    saltoDeLinea();

    const filasConContenido = filas.filter((f) => f.item?.trim());
    if (filasConContenido.length === 0) {
      doc.text("Sin ítems registrados.", margenIzq, y);
      saltoDeLinea();
    } else {
      filasConContenido.forEach((fila) => {
        const linea = `• ${fila.item}${fila.observacion ? `: ${fila.observacion}` : ""}`;
        const lineasDivididas = doc.splitTextToSize(linea, 180);
        doc.text(lineasDivididas, margenIzq, y);
        saltoDeLinea(lineasDivididas.length * 6);
      });
    }

    doc.save(`diagnostico-${orden.folio || orden.idOrden}.pdf`);
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
          Esta orden aún no tiene diagnóstico. Cuando el vehículo esté en estado
          "En diagnóstico" podrás registrarlo aquí.
        </p>
      </section>
    );
  }

  return (
    <section className="detailSection">
      <div className="diagnosticoHeader">
        <h3>Diagnóstico</h3>
        {diagnostico && (
          <Button variant="secondary" onClick={descargarPdf}>
            Descargar PDF
          </Button>
        )}
      </div>
      <p className="diagnosticoFolio">
        <strong>Orden:</strong> {orden.folio}
      </p>
      <p className="diagnosticoFolio">
        <strong>Técnico asignado:</strong> {orden.tecnicoNombre || "Sin asignar"}
      </p>
      {orden.motivoIngreso && (
        <p className="diagnosticoFolio">
          <strong>Motivo de ingreso:</strong> {orden.motivoIngreso}
        </p>
      )}
      {diagnostico?.bloqueado && (
        <p className="diagnosticoBloqueado">
          Diagnóstico enviado a aprobación el{" "}
          {diagnostico.fechaEnvio
            ? new Date(diagnostico.fechaEnvio).toLocaleString()
            : "-"}
          .
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

        <div className="inputGroup">
          <label>Nivel de batería (%)</label>

          <input
            type="number"
            min="0"
            max="100"
            value={nivelBateria}
            onChange={(e) => setNivelBateria(e.target.value)}
            disabled={!puedeEditarAhora}
          />
        </div>

        {tipoDiagnostico === "profundo" && (
          <div className="inputGroup">
            <label>Costo</label>

            <input
              type="number"
              value={costoDiagnostico}
              onChange={(e) => setCostoDiagnostico(e.target.value)}
              disabled={!puedeEditarAhora}
            />
          </div>
        )}
      </div>

      <div className="checklistWrapper">
        <span className="fieldTitle">Checklist</span>

        {filas.map((fila, index) => (
          <div className="checklistFila" key={index}>
            <input
              value={fila.item}
              placeholder="Ítem"
              disabled={!puedeEditarAhora}
              onChange={(e) => actualizarFila(index, "item", e.target.value)}
            />

            <input
              value={fila.observacion}
              placeholder="Observación"
              disabled={!puedeEditarAhora}
              onChange={(e) =>
                actualizarFila(index, "observacion", e.target.value)
              }
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
