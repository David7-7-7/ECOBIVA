import { useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader/PageHeader";
import { atenderAlertaStock, listarAlertasStock } from "../../services/alertaStockService";
import "./AlertasStock.css";

export default function AlertasStock() {
  const [estado, setEstado] = useState("pendiente");
  const [alertas, setAlertas] = useState([]);
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      setAlertas(await listarAlertasStock(estado));
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible cargar las alertas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, [estado]);

  const atender = async (id) => {
    try {
      await atenderAlertaStock(id);
      await cargar();
    } catch (err) {
      setError(err.response?.data?.error || "No fue posible atender la alerta.");
    }
  };

  return (
    <>
      <PageHeader title="Alertas de stock" subtitle="Repuestos que alcanzaron o quedaron por debajo de su mínimo." />
      <div className="alertasStockCard">
        <div className="alertasToolbar">
          <label>Estado</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="pendiente">Pendientes</option>
            <option value="atendida">Atendidas</option>
          </select>
        </div>
        {error && <p className="inputError">{error}</p>}
        {cargando ? <p>Cargando alertas...</p> : (
          <table>
            <thead><tr><th>Fecha</th><th>Repuesto</th><th>Stock</th><th>Mínimo</th><th>Estado</th><th>Acción</th></tr></thead>
            <tbody>
              {alertas.length === 0 ? <tr><td colSpan="6">No hay alertas {estado}s.</td></tr> : alertas.map((alerta) => (
                <tr key={alerta.idAlerta}>
                  <td>{new Date(alerta.fechaGeneracion).toLocaleString("es-CO")}</td>
                  <td>{alerta.repuestoNombre}</td><td>{alerta.stockActual}</td><td>{alerta.stockMinimo}</td>
                  <td>{alerta.estadoGestion}</td>
                  <td>{alerta.estadoGestion === "pendiente" && <button className="btnAtender" onClick={() => atender(alerta.idAlerta)}>Marcar atendida</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
