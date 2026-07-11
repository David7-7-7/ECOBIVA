import { useEffect, useState } from "react";
import { FaSearch, FaFileCsv, FaHistory } from "react-icons/fa";
import { auditoriaApi } from "../../api/api";

export default function Auditoria() {
  const [filtros, setFiltros] = useState({
    modulo: "",
    desde: "",
    hasta: "",
  });

  const [registros, setRegistros] = useState([]);

  const [total, setTotal] = useState(0);

  const [error, setError] = useState("");

  const [cargando, setCargando] = useState(false);

  async function consultar(e) {
    if (e) e.preventDefault();

    setError("");

    setCargando(true);

    try {
      const params = {};

      if (filtros.modulo) params.modulo = filtros.modulo;

      if (filtros.desde) params.desde = filtros.desde;

      if (filtros.hasta) params.hasta = filtros.hasta;

      const { data } = await auditoriaApi.consultar(params);

      setRegistros(data.rows);

      setTotal(data.total);
    } catch (err) {
      setError(
        err.response?.data?.error || "No fue posible consultar la auditoría",
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    consultar();
  }, []);

  function exportar() {
    const params = {};

    if (filtros.modulo) params.modulo = filtros.modulo;

    if (filtros.desde) params.desde = filtros.desde;

    if (filtros.hasta) params.hasta = filtros.hasta;

    window.open(auditoriaApi.exportarUrl(params), "_blank");
  }

  return (
    <>
      <div className="page-header">
        <div className="eyebrow">Seguridad</div>

        <h2>Log de Auditoría</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <form className="grid" onSubmit={consultar}>
          <div className="form-row">
            <label>Módulo</label>

            <input
              type="text"
              placeholder="Usuarios, Inventario..."
              value={filtros.modulo}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  modulo: e.target.value,
                })
              }
            />
          </div>

          <div className="form-row">
            <label>Desde</label>

            <input
              type="date"
              value={filtros.desde}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  desde: e.target.value,
                })
              }
            />
          </div>

          <div className="form-row">
            <label>Hasta</label>

            <input
              type="date"
              value={filtros.hasta}
              onChange={(e) =>
                setFiltros({
                  ...filtros,
                  hasta: e.target.value,
                })
              }
            />
          </div>

          <div className="actions">
            <button className="btn btn-primary">
              <FaSearch />
              Buscar
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={exportar}
            >
              <FaFileCsv />
              Exportar
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="stats">
          <div>
            <span>Registros encontrados</span>

            <br />

            <strong>{total}</strong>
          </div>

          <FaHistory size={45} color="#2563eb" />
        </div>

        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <div className="table-responsive">
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
                {registros.map((registro) => (
                  <tr key={registro.idLog}>
                    <td>
                      {new Date(registro.fechaHora).toLocaleString("es-CO")}
                    </td>

                    <td>{registro.correoUsuario || "-"}</td>

                    <td>
                      <span className="badge badge-blue">
                        {registro.modulo}
                      </span>
                    </td>

                    <td>{registro.accion}</td>

                    <td>{registro.detalle}</td>

                    <td>{registro.ipOrigen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
