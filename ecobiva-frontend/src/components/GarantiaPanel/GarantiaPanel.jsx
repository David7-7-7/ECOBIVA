import { useEffect, useState } from "react";
import { crearOrdenGarantia, obtenerGarantiasPorOrden, actualizarGarantia, cambiarEstadoGarantia } from "../../services/garantiaService";

export default function GarantiaPanel({ orden }) {
  const [garantias, setGarantias] = useState([]); const [notas, setNotas] = useState(""); const [error, setError] = useState("");
  const cargar = () => obtenerGarantiasPorOrden(orden.idOrden).then(setGarantias).catch((e) => setError(e.response?.data?.error || "No fue posible consultar garantías."));
  useEffect(() => { cargar(); }, [orden.idOrden]);
  const abrir = async () => { try { await crearOrdenGarantia({ ordenOrigenId: orden.idOrden, notasSeguimiento: notas }); setNotas(""); cargar(); } catch(e) { setError(e.response?.data?.error || "No fue posible abrir la garantía."); } };
  if (orden.estado !== "entregada" && garantias.length === 0) return null;
  return <section className="detailSection"><h3>Garantías</h3>{error && <p className="inputError">{error}</p>}
    {orden.estado === "entregada" && <div className="inputGroup"><label>Notas de apertura</label><input value={notas} onChange={(e)=>setNotas(e.target.value)} /><button className="btnCambiarEstado" onClick={abrir}>Abrir garantía</button></div>}
    {garantias.map((g) => <div key={g.idOrdenGarantia} className="ordenModalInfo"><strong>Garantía #{g.idOrdenGarantia}: {g.estado}</strong><p>{g.notasSeguimiento || "Sin notas."}</p>{g.estado === "abierta" && <button className="btnCambiarEstado" onClick={async()=>{await cambiarEstadoGarantia(g.idOrdenGarantia,"cerrada"); cargar();}}>Cerrar garantía</button>}</div>)}
  </section>;
}
