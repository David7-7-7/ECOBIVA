import { useState } from "react";

import Button from "../Button/Button";
import { useAuth } from "../../context/AuthContext";
import { autoasignarOrden } from "../../services/ordenService";

// Permite que un técnico autenticado se autoasigne una orden que está en
// cola de espera (pendiente_asignacion, sin cupo disponible al momento de
// crearla). Todas las reglas (cupo, estado activo, cambio automático a
// "recibido", registro en HistorialEstado) las valida y aplica el Backend
// (ver DEC-002/003/006/007); acá solo se dispara la acción.
export default function AutoasignacionPanel({ orden, onOrdenActualizada }) {
  const { tieneAlgunRol } = useAuth();
  const esTecnico = tieneAlgunRol(["Tecnico"]);
  const [enviando, setEnviando] = useState(false);

  const mostrarPanel = esTecnico && orden.estado === "pendiente_asignacion";

  if (!mostrarPanel) return null;

  const autoasignarme = async () => {
    setEnviando(true);
    try {
      await autoasignarOrden(orden.idOrden);
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
        Esta orden está en cola de espera, sin técnico asignado. Si tienes
        cupo disponible, puedes autoasignártela: pasará automáticamente al
        estado "Recibido".
      </p>
      <Button variant="primary" onClick={autoasignarme} disabled={enviando}>
        Autoasignarme esta orden
      </Button>
    </section>
  );
}
