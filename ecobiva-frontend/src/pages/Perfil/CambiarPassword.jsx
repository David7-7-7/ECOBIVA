import { useState } from 'react';
import { perfilApi } from "../../api/api";

export default function CambiarPassword() {
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setnuevaPassword] = useState('');
  const [passwordConfirmar, setPasswordConfirmar] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (nuevaPassword !== passwordConfirmar) {
      setError('La confirmación no coincide con la nueva contraseña');
      return;
    }

    setCargando(true);
    try {
      await perfilApi.cambiarPassword(passwordActual, nuevaPassword);
      setMensaje('Contraseña actualizada correctamente');
      setPasswordActual('');
      setnuevaPassword('');
      setPasswordConfirmar('');
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo cambiar la contraseña');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="eyebrow">Mi perfil</div>
        <h2>Cambiar contraseña</h2>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      <div className="card" style={{ maxWidth: 380 }}>
        <form onSubmit={manejarSubmit}>
          <div className="form-row">
            <label>Contraseña actual</label>
            <input type="password" value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Nueva contraseña</label>
            <input type="password" value={nuevaPassword} onChange={(e) => setnuevaPassword(e.target.value)} required />
          </div>
          <div className="form-row">
            <label>Confirmar nueva contraseña</label>
            <input type="password" value={passwordConfirmar} onChange={(e) => setPasswordConfirmar(e.target.value)} required />
          </div>
          <button className="btn btn-primary" disabled={cargando}>
            {cargando ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
