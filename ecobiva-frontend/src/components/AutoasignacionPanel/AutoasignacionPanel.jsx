import { useState } from "react";

import Button from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import {
  autoasignarOrden,
  autoasignarReparacionOrden,
} from "../../services/ordenService";

// Permite que un técnico autenticado se autoasigne una orden que está en
// cola de espera. Cubre las dos colas que existen en el flujo:
// - "pendiente_asignacion": cola de diagnóstico (sin cupo al crearla).
// - "pendiente_asignacion_reparacion": cola de reparación (aprobada por el
//   cliente, pero sin técnico con cupo disponible en ese momento).
// Todas las reglas (cupo, estado activo, cambio automático de estado,
// registro en HistorialEstado) las valida y aplica el Backend; acá solo se
// dispara la acción correspondiente según el estado actual de la orden.
export default function AutoasignacionPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();
  const esTecnico = tieneAlgunRol(["Tecnico"]);
  const [enviando, setEnviando] = useState(false);

  const esColaDiagnostico = orden.estado === "pendiente_asignacion";
  const esColaReparacion = orden.estado === "pendiente_asignacion_reparacion";

  const mostrarPanel = esTecnico && (esColaDiagnostico || esColaReparacion);

  if (!mostrarPanel) return null;

  const autoasignarme = async () => {
    setEnviando(true);
    try {
      if (esColaReparacion) {
        await autoasignarReparacionOrden(orden.idOrden);
      } else {
        await autoasignarOrden(orden.idOrden);
      }
      if (onOrdenActualizada) await onOrdenActualizada();
    } catch (error) {
      console.error(error);
      alert(
        error?.response?.data?.error ||
          "No fue posible autoasignarte esta orden.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="detailSection">
      <h3>Autoasignación</h3>
      <p className="observaciones">
        {esColaReparacion
          ? 'Esta orden ya fue aprobada por el cliente y está en cola de espera para reparación, sin técnico asignado. Si tienes cupo disponible, puedes autoasignártela: pasará automáticamente al estado "En Reparación".'
          : 'Esta orden está en cola de espera, sin técnico asignado. Si tienes cupo disponible, puedes autoasignártela: pasará automáticamente al estado "Recibido".'}
      </p>
      <Button variant="primary" onClick={autoasignarme} disabled={enviando}>
        Autoasignarme esta orden
      </Button>
    </section>
  );
}
