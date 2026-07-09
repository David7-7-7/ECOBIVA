import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, cargando } = useAuth();
  const navigate = useNavigate();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function manejarSubmit(e) {
    e.preventDefault();
    setError('');
    const resultado = await login(correo, password);
    if (resultado.ok) {
      navigate('/dashboard');
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="tag">Acceso al sistema</div>
        <h1>Iniciar sesión</h1>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={manejarSubmit}>
          <div className="form-row">
            <label>Correo</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="admin@ecobiva.com"
              required
            />
          </div>
          <div className="form-row">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={cargando}>
            {cargando ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-links">
          <button onClick={() => navigate('/recuperar')}>¿Olvidaste tu contraseña?</button>
        </div>
      </div>
    </div>
  );
}
