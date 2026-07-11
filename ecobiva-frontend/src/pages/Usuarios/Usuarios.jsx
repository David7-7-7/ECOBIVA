import { useEffect, useState } from 'react';
import { usuariosApi, rolesApi } from '../../api/api';

const VACIO = { idUsuario: null, correo: '', password: '', idRol: '' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [editando, setEditando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  async function cargarTodo() {
    setCargando(true);
    setError('');
    try {
      const [resUsuarios, resRoles] = await Promise.all([usuariosApi.listar(), rolesApi.listar()]);
      setUsuarios(resUsuarios.data);
      setRoles(resRoles.data);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cargar la lista de usuarios');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarTodo(); }, []);

  function editar(usuario) {
    setEditando(true);
    setForm({ idUsuario: usuario.idUsuario, correo: usuario.correo, password: '', idRol: usuario.idRol });
    setMensaje('');
  }

  function nuevo() {
    setEditando(false);
    setForm(VACIO);
    setMensaje('');
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    try {
      if (editando) {
        await usuariosApi.editar(form.idUsuario, { correo: form.correo, idRol: form.idRol });
        setMensaje('Usuario actualizado');
      } else {
        await usuariosApi.crear({ correo: form.correo, password: form.password, idRol: form.idRol });
        setMensaje('Usuario creado');
      }
      nuevo();
      cargarTodo();
    } catch (err) {
      setError(err.response?.data?.error || 'Error guardando el usuario');
    }
  }

  async function desactivar(idUsuario) {
    if (!confirm('¿Desactivar este usuario?')) return;
    try {
      await usuariosApi.desactivar(idUsuario);
      cargarTodo();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo desactivar el usuario');
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Módulo de seguridad</div>
        <h2>Usuarios</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>{editando ? 'Editar usuario' : 'Crear usuario'}</h3>
        <form onSubmit={guardar}>
          <div className="grid">
            <div className="form-row">
              <label>Correo</label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                required
              />
            </div>
            {!editando && (
              <div className="form-row">
                <label>Contraseña inicial</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
            )}
            <div className="form-row">
              <label>Rol</label>
              <select value={form.idRol} onChange={(e) => setForm({ ...form, idRol: e.target.value })} required>
                <option value="">Selecciona un rol</option>
                {roles.map((r) => (
                  <option key={r.idRol} value={r.idRol}>{r.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn btn-primary" type="submit">
              {editando ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            {editando && (
              <button className="btn btn-secondary" type="button" onClick={nuevo}>Cancelar</button>
            )}
          </div>
        </form>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Listado</h3>
        {cargando ? (
          <p>Cargando...</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Correo</th>
                <th>Rol</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.idUsuario}>
                  <td>{u.correo}</td>
                  {/* Soporta ambas formas: array de roles activos (modelo real N:M)
                      o un solo idRol/nombreRol plano, según devuelva tu endpoint real */}
                  <td>{Array.isArray(u.roles) ? u.roles.map((r) => r.nombreRol).join(', ') : (u.nombreRol || u.idRol)}</td>
                  <td>{u.estado === false || u.estado === 0 ? 'Inactivo' : 'Activo'}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-secondary" onClick={() => editar(u)}>Editar</button>
                    <button className="btn btn-danger" onClick={() => desactivar(u.idUsuario)}>Desactivar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
