import { useEffect, useState } from "react";
import { FaEdit, FaToggleOff, FaToggleOn } from "react-icons/fa";
import PageHeader from "../../components/PageHeader/PageHeader";
import { listarTerminosGarantia, crearTerminoGarantia, actualizarTerminoGarantia, cambiarVigenciaTermino } from "../../services/garantiaService";

const inicial = { categoria: "", textoLegal: "", plazoGarantiaDias: "", version: "" };

export default function TerminosGarantia() {
  const [terminos, setTerminos] = useState([]);
  const [form, setForm] = useState(inicial);
  const [editando, setEditando] = useState(null);
  const [error, setError] = useState("");
  const cargar = () => listarTerminosGarantia().then(setTerminos).catch((e) => setError(e.response?.data?.error || "No fue posible cargar los términos."));
  useEffect(() => { cargar(); }, []);
  const guardar = async () => { try { const datos = { ...form, plazoGarantiaDias: Number(form.plazoGarantiaDias || 0) }; if (editando) await actualizarTerminoGarantia(editando, datos); else await crearTerminoGarantia(datos); setForm(inicial); setEditando(null); cargar(); } catch (e) { setError(e.response?.data?.error || "No fue posible guardar."); } };

  return <><PageHeader title="Términos de garantía" subtitle="Textos legales por categoría de repuesto." />
    <div className="alertasStockCard"><h3>{editando ? "Editar término" : "Nuevo término"}</h3>{error && <p className="inputError">{error}</p>}<div className="detailGrid">
      <div className="inputGroup"><label>Categoría</label><input value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} /></div><div className="inputGroup"><label>Plazo (días)</label><input type="number" value={form.plazoGarantiaDias} onChange={(e) => setForm({ ...form, plazoGarantiaDias: e.target.value })} /></div><div className="inputGroup"><label>Versión</label><input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} /></div><div className="inputGroup"><label>Texto legal</label><textarea value={form.textoLegal} onChange={(e) => setForm({ ...form, textoLegal: e.target.value })} /></div></div><button className="btnCambiarEstado" onClick={guardar}>Guardar</button></div>
    <div className="alertasStockCard"><table><thead><tr><th>Categoría</th><th>Plazo</th><th>Versión</th><th>Vigencia</th><th>Acciones</th></tr></thead><tbody>{terminos.map((t) => <tr key={t.idTermino}><td>{t.categoria}</td><td>{t.plazoGarantiaDias} días</td><td>{t.version || "-"}</td><td>{t.vigente ? "Vigente" : "No vigente"}</td><td><div className="actionButtons"><button className="accion editar" title="Editar término" aria-label="Editar término" onClick={() => { setEditando(t.idTermino); setForm(t); }}><FaEdit /></button><button className="accion ver" title={t.vigente ? "Desactivar término" : "Activar término"} aria-label={t.vigente ? "Desactivar término" : "Activar término"} onClick={async () => { await cambiarVigenciaTermino(t.idTermino, !t.vigente); cargar(); }}>{t.vigente ? <FaToggleOn /> : <FaToggleOff />}</button></div></td></tr>)}</tbody></table></div></>;
}
