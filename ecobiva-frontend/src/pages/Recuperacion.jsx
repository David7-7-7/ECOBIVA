import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/api';

// Flujo de 3 pasos, igual al que ya probaste por Postman:
//  1) GET /auth/preguntas-seguridad?correo=  -> trae las 3 preguntas del usuario
//  2) POST /auth/validar-preguntas { correo, respuestas } -> si acierta las 3, devuelve { token }
//  3) PUT /auth/reset-password/:token { nuevaPassword }
export default function Recuperacion() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [correo, setCorreo] = useState('');
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [token, setToken] = useState('');
  const [nuevaPassword, setnuevaPassword] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  async function buscarPreguntas(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { data } = await authApi.preguntasDeUsuario(correo);
      // Se asume que data es un arreglo [{ idPregunta, pregunta }, ...]
      setPreguntas(Array.isArray(data) ? data : data.preguntas || []);
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.error || 'No se encontraron preguntas para ese correo');
    } finally {
      setCargando(false);
    }
  }

  async function validarRespuestas(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const listaRespuestas = preguntas.map((p) => ({
        idPregunta: p.idPregunta,
        respuesta: respuestas[p.idPregunta] || ''
      }));
      const { data } = await authApi.validarPreguntas(correo, listaRespuestas);
      setToken(data.token);
      setPaso(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Las respuestas no coinciden, intenta de nuevo');
    } finally {
      setCargando(false);
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await authApi.resetPassword(token, nuevaPassword);
      setMensaje('Contraseña actualizada. Ya puedes iniciar sesión.');
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo actualizar la contraseña');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="tag">Recuperación de acceso</div>
        <h1>Recuperar contraseña</h1>
        <div className="step-indicator">Paso {paso} de 3</div>

        {error && <div className="alert alert-error">{error}</div>}
        {mensaje && <div className="alert alert-success">{mensaje}</div>}

        {paso === 1 && (
          <form onSubmit={buscarPreguntas}>
            <div className="form-row">
              <label>Correo de tu cuenta</label>
              <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={cargando}>
              Buscar mis preguntas
            </button>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={validarRespuestas}>
            {preguntas.map((p) => (
              <div className="form-row" key={p.idPregunta}>
                <label>{p.pregunta}</label>
                <input
                  type="text"
                  value={respuestas[p.idPregunta] || ''}
                  onChange={(e) => setRespuestas({ ...respuestas, [p.idPregunta]: e.target.value })}
                  required
                />
              </div>
            ))}
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={cargando}>
              Validar respuestas
            </button>
          </form>
        )}

        {paso === 3 && (
          <form onSubmit={cambiarPassword}>
            <div className="form-row">
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={nuevaPassword}
                onChange={(e) => setnuevaPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={cargando}>
              Guardar nueva contraseña
            </button>
          </form>
        )}

        <div className="auth-links">
          <button onClick={() => navigate('/login')}>Volver a iniciar sesión</button>
        </div>
      </div>
    </div>
  );
}
