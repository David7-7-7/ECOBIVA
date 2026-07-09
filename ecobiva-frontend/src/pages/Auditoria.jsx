import { useEffect, useState } from 'react';
import { auditoriaApi } from '../api/api';

export default function Auditoria() {
  const [filtros, setFiltros] = useState({ modulo: '', desde: '', hasta: '' });
  const [registros, setRegistros] = useState([]);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function consultar(e) {
    if (e) e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const params = {};
      if (filtros.modulo) params.modulo = filtros.modulo;
      if (filtros.desde) params.desde = filtros.desde;
      if (filtros.hasta) params.hasta = filtros.hasta;

      const { data } = await auditoriaApi.consultar(params);
      setRegistros(data.rows);
      setTotal(data.total);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo consultar el log de auditoría');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { consultar(); }, []);

  function exportar() {
    const params = {};
    if (filtros.modulo) params.modulo = filtros.modulo;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;
    window.open(auditoriaApi.exportarUrl(params), '_blank');
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Trazabilidad</div>
        <h2>Log de auditoría</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form onSubmit={consultar} className="grid">
          <div className="form-row">
            <label>Módulo</label>
            <input
              type="text"
              placeholder="usuarios, permisos, perfil..."
              value={filtros.modulo}
              onChange={(e) => setFiltros({ ...filtros, modulo: e.target.value })}
            />
          </div>
          <div className="form-row">
            <label>Desde</label>
            <input type="date" value={filtros.desde} onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })} />
          </div>
          <div className="form-row">
            <label>Hasta</label>
            <input type="date" value={filtros.hasta} onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
            <button className="btn btn-primary" type="submit">Filtrar</button>
            <button className="btn btn-secondary" type="button" onClick={exportar}>Exportar CSV</button>
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{total} registro(s)</h3>
        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Detalle</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {registros.map((r) => (
                <tr key={r.idLog}>
                  <td>{new Date(r.fechaHora).toLocaleString('es-CO')}</td>
                  <td>{r.correoUsuario || '—'}</td>
                  <td>{r.modulo}</td>
                  <td>{r.accion}</td>
                  <td>{r.detalle}</td>
                  <td>{r.ipOrigen}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
