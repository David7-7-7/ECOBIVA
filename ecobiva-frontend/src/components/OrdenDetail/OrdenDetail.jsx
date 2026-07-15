import { useState } from "react";
import "./OrdenDetail.css";

import DataField from "../DataField/DataField";
import StatusBadge from "../StatusBadge/StatusBadge";
import AprobacionPanel from "../AprobacionPanel/AprobacionPanel";
import FacturaPanel from "../FacturaPanel/FacturaPanel";
import AutoasignacionPanel from "../AutoasignacionPanel/AutoasignacionPanel";
import EvidenciasOrden from "../EvidenciaIngreso/EvidenciasOrden";
import GarantiaPanel from "../GarantiaPanel/GarantiaPanel";
import { useAuth } from "../../context/AuthContext";

export const ESTADO_LABELS = {
  pendiente_asignacion: "Pendiente de Asignación",
  recibido: "Recibido",
  en_diagnostico: "En Diagnóstico",
  pendiente_aprobacion: "Pendiente Aprobación",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
  pendiente_asignacion_reparacion: "Pendiente de Asignación (Reparación)",
  en_reparacion: "En Reparación",
  finalizada: "Finalizada",
  entregada: "Entregada",
  cancelada: "Cancelada",
};

export const ESTADO_VARIANT = {
  pendiente_asignacion: "badgeStock",
  recibido: "badgeDefault",
  en_diagnostico: "badgeProceso",
  pendiente_aprobacion: "badgeStock",
  aprobada: "badgeActivo",
  rechazada: "badgeInactivo",
  pendiente_asignacion_reparacion: "badgeStock",
  en_reparacion: "badgeProceso",
  finalizada: "badgeFinalizado",
  entregada: "badgeActivo",
  cancelada: "badgeInactivo",
};

// Transiciones que se pueden disparar manualmente desde este panel vía
// PATCH /ordenes/:id/estado (Admin/Tecnico). Las transiciones
// pendiente_aprobacion -> aprobada/rechazada y rechazada -> aprobada NO se
// exponen acá: esas se registran desde el panel de "Aprobación del cliente"
// para mantener la trazabilidad de que fue el asesor quien la capturó.
// pendiente_asignacion -> en_diagnostico TAMPOCO se expone acá: ese cambio
// de estado no es un cambio de estado "manual" en sentido estricto, sino un
// efecto secundario de asignar un técnico a la orden (ver
// ordenDao.actualizar). Permitir "en_diagnostico" en este dropdown dejaría
// marcar la orden como en diagnóstico sin técnico asignado, rompiendo DEC-007.
// "recibido" solo queda acá por compatibilidad con órdenes históricas que ya
// estaban en ese estado; ninguna orden nueva llega a él.
const TRANSICIONES_MANUALES = {
  pendiente_asignacion: ["cancelada"],
  recibido: ["en_diagnostico", "cancelada"],
  en_diagnostico: ["cancelada"],
  pendiente_aprobacion: ["cancelada"],
  rechazada: ["cancelada"],
  aprobada: ["en_reparacion", "cancelada"],
  en_reparacion: ["finalizada", "cancelada"],
  finalizada: ["entregada"],
  entregada: [],
  cancelada: [],
};

export default function OrdenDetail({
  orden,
  onCambiarEstado,
  onOrdenActualizada,
}) {
  const { tieneAlgunRol } = useAuth();
  const [estadoDestino, setEstadoDestino] = useState("");
  const [motivo, setMotivo] = useState("");

  if (!orden) return null;

  const puedeCambiarEstado = tieneAlgunRol(["Admin", "Tecnico"]);
  const transicionesDisponibles = TRANSICIONES_MANUALES[orden.estado] || [];
  const historial = orden.historialEstado || [];

  const aplicarCambio = async () => {
    if (!estadoDestino || !onCambiarEstado) return;
    await onCambiarEstado(orden.idOrden, estadoDestino, motivo);
    setEstadoDestino("");
    setMotivo("");
  };

  return (
    <>
      <section className="detailSection">
        <h3>Información General</h3>
        <div className="detailGrid">
          <DataField label="Folio" value={orden.folio} />
          <DataField label="Cliente" value={orden.clienteNombre} />
          <DataField
            label="Vehículo"
            value={`${orden.vehiculoPlaca || ""} ${orden.vehiculoMarca || ""} ${orden.vehiculoModelo || ""}`.trim()}
          />
          <DataField label="Asesor" value={orden.asesorNombre || "-"} />
          <DataField
            label="Tecnico"
            value={orden.tecnicoNombre || "Sin asignar"}
          />
        </div>
        <div className="detailGrid">
          <DataField
            label="Motivo de ingreso"
            value={orden.motivoIngreso || "-"}
          />
        </div>
        {orden.estado === "pendiente_asignacion" && (
          <p className="observaciones">
            Esta orden está en cola de espera: aún no hay técnicos con cupo
            disponible. Se asignará automáticamente en cuanto uno quede libre, o
            puede asignarse manualmente editando la orden.
          </p>
        )}
      </section>

      <section className="detailSection">
        <h3>Proceso</h3>
        <div className="detailGrid">
          <DataField
            label="Fecha de creación"
            value={
              orden.fechaCreacion
                ? new Date(orden.fechaCreacion).toLocaleString()
                : "-"
            }
          />
          <DataField
            label="Kilometraje ingreso"
            value={orden.kilometrajeIngreso ?? "-"}
          />

          <div>
            <span className="fieldTitle">Estado</span>
            <StatusBadge
              status={ESTADO_LABELS[orden.estado] || orden.estado}
              variant={ESTADO_VARIANT[orden.estado]}
            />
          </div>
        </div>
      </section>

      {puedeCambiarEstado &&
        onCambiarEstado &&
        transicionesDisponibles.length > 0 && (
          <section className="detailSection">
            <h3>Cambiar estado</h3>
            <div className="detailGrid">
              <div className="inputGroup">
                <label>Nuevo estado</label>
                <select
                  value={estadoDestino}
                  onChange={(e) => setEstadoDestino(e.target.value)}
                >
                  <option value="">Seleccione...</option>
                  {transicionesDisponibles.map((estado) => (
                    <option key={estado} value={estado}>
                      {ESTADO_LABELS[estado]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="inputGroup">
                <label>Motivo (opcional)</label>
                <input
                  type="text"
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Motivo del cambio..."
                />
              </div>
            </div>
            <button
              className="btnCambiarEstado"
              onClick={aplicarCambio}
              disabled={!estadoDestino}
            >
              Aplicar cambio de estado
            </button>
          </section>
        )}

      <AutoasignacionPanel
        orden={orden}
        onOrdenActualizada={onOrdenActualizada}
      />

      <AprobacionPanel orden={orden} onOrdenActualizada={onOrdenActualizada} />

      <EvidenciasOrden idOrden={orden.idOrden} />
      <GarantiaPanel orden={orden} />

      <FacturaPanel orden={orden} onOrdenActualizada={onOrdenActualizada} />

      <section className="detailSection">
        <h3>Historial de Estado</h3>
        {historial.length === 0 ? (
          <p className="observaciones">Sin movimientos registrados.</p>
        ) : (
          <ul className="historialEstadoList">
            {historial.map((h) => (
              <li key={h.idHistorial}>
                <strong>
                  {h.estadoAnterior && h.estadoAnterior !== h.estadoNuevo
                    ? `${ESTADO_LABELS[h.estadoAnterior] || h.estadoAnterior} → `
                    : ""}
                  {ESTADO_LABELS[h.estadoNuevo] || h.estadoNuevo}
                </strong>
                <span>
                  {" "}
                  — {h.usuarioNombre || "Usuario"} —{" "}
                  {new Date(h.fecha).toLocaleString()}
                </span>
                {h.motivo && <p className="historialMotivo">{h.motivo}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
