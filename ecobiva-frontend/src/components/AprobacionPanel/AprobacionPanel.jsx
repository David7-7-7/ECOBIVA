import { useState } from "react";
import "./AprobacionPanel.css";

import Button from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import { registrarAprobacionOrden } from "../../services/ordenService";
import FirmaDigital from "../FirmaDigital/FirmaDigital";

// La aprobación del cliente hoy es remota: el asesor habla con el cliente
// por fuera del sistema (llamada/WhatsApp) y registra acá la respuesta.
export default function AprobacionPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();
  const puedeRegistrar = tieneAlgunRol(["Admin", "Asesor"]);
  const [notas, setNotas] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [capturandoFirma, setCapturandoFirma] = useState(false);

  const mostrarPanel =
    puedeRegistrar &&
    (orden.estado === "pendiente_aprobacion" || orden.estado === "rechazada");

  if (!mostrarPanel) return null;

  const registrar = async (datos) => {
    setEnviando(true);
    try {
      await registrarAprobacionOrden(orden.idOrden, { notas: notas || null, ...datos });
      setNotas("");
      setCapturandoFirma(false);
      if (onOrdenActualizada) await onOrdenActualizada();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error ||
          "No fue posible registrar la respuesta del cliente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="detailSection">
      <h3>Aprobación del cliente</h3>
      <p className="observaciones">
        {orden.estado === "rechazada"
          ? "El cliente había rechazado el diagnóstico. Si cambió de opinión, puedes marcarlo como aprobado."
          : "Registra acá la respuesta del cliente frente al diagnóstico (hoy se captura de forma remota, por llamada o WhatsApp fuera del sistema)."}
      </p>

      <div className="inputGroup">
        <label>Notas (opcional)</label>
        <input
          type="text"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas de la conversación con el cliente..."
        />
      </div>

      <div className="aprobacionAcciones">
        <button
          className="btnRechazar"
          onClick={() => registrar({ aprobado: false, metodoCaptura: "remoto_asesor", terminosAceptados: false })}
          disabled={enviando || orden.estado === "rechazada"}
        >
          Cliente rechaza
        </button>
        <Button
          variant="primary"
          onClick={() => setCapturandoFirma(true)}
          disabled={enviando}
        >
          Cliente aprueba
        </Button>
      </div>

      {capturandoFirma && (
        <FirmaDigital
          mostrarTerminos
          textoTerminos="Declaro que conozco y acepto el diagnóstico, los valores presentados y los términos del servicio."
          onCancel={() => setCapturandoFirma(false)}
          onFirmaCapturada={(firma) => registrar({ aprobado: true, ...firma })}
        />
      )}
    </section>
  );
}
