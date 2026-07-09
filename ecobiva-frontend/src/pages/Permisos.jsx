import { useEffect, useMemo, useState } from 'react';
import { permisosApi } from '../api/api';

export default function Permisos() {
  const [filas, setFilas] = useState([]); // filas planas del backend
  const [cambios, setCambios] = useState({}); // clave `${idRol}-${idPermiso}` -> permitido
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function cargar() {
    setError('');
    try {
      const { data } = await permisosApi.matriz();
      setFilas(data);
      setCambios({});
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar la matriz de permisos');
    }
  }

  useEffect(() => { cargar(); }, []);

  // Reorganiza las filas planas en: { modulo-accion: { idPermiso, roles: { idRol: permitido } } }
  const { permisosUnicos, rolesUnicos, tabla } = useMemo(() => {
    const permisosMap = new Map();
    const rolesMap = new Map();
    const tablaMap = new Map();

    for (const fila of filas) {
      permisosMap.set(fila.idPermiso, { idPermiso: fila.idPermiso, modulo: fila.modulo, accion: fila.accion });
      rolesMap.set(fila.idRol, { idRol: fila.idRol, nombreRol: fila.nombreRol });

      const clave = `${fila.idRol}-${fila.idPermiso}`;
      tablaMap.set(clave, fila.permitido === 1 || fila.permitido === true);
    }

    return {
      permisosUnicos: [...permisosMap.values()].sort((a, b) => a.modulo.localeCompare(b.modulo) || a.accion.localeCompare(b.accion)),
      rolesUnicos: [...rolesMap.values()].sort((a, b) => a.idRol - b.idRol),
      tabla: tablaMap
    };
  }, [filas]);

  function valorActual(idRol, idPermiso) {
    const clave = `${idRol}-${idPermiso}`;
    return clave in cambios ? cambios[clave] : !!tabla.get(clave);
  }

  function alternar(idRol, idPermiso) {
    const clave = `${idRol}-${idPermiso}`;
    setCambios({ ...cambios, [clave]: !valorActual(idRol, idPermiso) });
  }

  async function guardarCambios() {
    setGuardando(true);
    setError('');
    setMensaje('');
    try {
      const payload = Object.entries(cambios).map(([clave, permitido]) => {
        const [idRol, idPermiso] = clave.split('-').map(Number);
        return { idRol, idPermiso, permitido };
      });

      if (payload.length === 0) {
        setMensaje('No hay cambios por guardar');
        return;
      }

      await permisosApi.actualizar(payload);
      setMensaje(`${payload.length} permiso(s) actualizados`);
      cargar();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudieron guardar los cambios');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">RBAC</div>
        <h2>Matriz de permisos</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Acción</th>
                {rolesUnicos.map((r) => (
                  <th key={r.idRol} style={{ textAlign: 'center' }}>{r.nombreRol}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permisosUnicos.map((p) => (
                <tr key={p.idPermiso}>
                  <td>{p.modulo}</td>
                  <td>{p.accion}</td>
                  {rolesUnicos.map((r) => (
                    <td key={r.idRol} style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={valorActual(r.idRol, p.idPermiso)}
                        onChange={() => alternar(r.idRol, p.idPermiso)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={guardarCambios} disabled={guardando}>
            {guardando ? 'Guardando...' : `Guardar cambios (${Object.keys(cambios).length})`}
          </button>
          <button className="btn btn-secondary" onClick={cargar}>Descartar</button>
        </div>
      </div>
    </div>
  );
}
