import "../../styles/auth.css";
import "../../styles/buttons.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import * as authService from "../../services/authService";

export default function Recuperacion() {
  const navigate = useNavigate();

  const [paso, setPaso] = useState(1);

  const [correo, setCorreo] = useState("");

  const [preguntas, setPreguntas] = useState([]);

  const [respuestas, setRespuestas] = useState({});

  const [token, setToken] = useState("");

  const [nuevaPassword, setNuevaPassword] = useState("");

  const [mostrarPassword, setMostrarPassword] = useState(false);

  const [error, setError] = useState("");

  const [mensaje, setMensaje] = useState("");

  const [cargando, setCargando] = useState(false);

  async function buscarPreguntas(e) {
    e.preventDefault();

    setError("");

    setCargando(true);

    try {
      const data = await authService.obtenerPreguntas(correo);

      setPreguntas(data);

      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.error || "No se encontraron preguntas");
    } finally {
      setCargando(false);
    }
  }

  async function validarRespuestas(e) {
    e.preventDefault();

    setError("");

    setCargando(true);

    try {
      const lista = preguntas.map((pregunta) => ({
        idPregunta: pregunta.idPregunta,

        respuesta: respuestas[pregunta.idPregunta] || "",
      }));

      const data = await authService.validarPreguntas(
        correo,

        lista,
      );

      setToken(data.token);

      setPaso(3);
    } catch (err) {
      setError(err.response?.data?.error || "Las respuestas son incorrectas");
    } finally {
      setCargando(false);
    }
  }

  async function guardarNuevaPassword(e) {
    e.preventDefault();

    setError("");

    setMensaje("");

    setCargando(true);

    try {
      await authService.resetPassword(
        token,

        nuevaPassword,
      );

      setMensaje("Contraseña actualizada correctamente.");

      setTimeout(() => {
        navigate("/login");
      }, 1800);
    } catch (err) {
      setError(
        err.response?.data?.error || "No fue posible cambiar la contraseña",
      );
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <div className="logo-circle">E</div>

          <h1>ECOBIVA</h1>

          <span>Recuperación de contraseña</span>
        </div>

        <div className="step-bar">
          <div
            className="step-progress"
            style={{
              width: `${(paso / 3) * 100}%`,
            }}
          />
        </div>

        <p className="step-text">Paso {paso} de 3</p>

        {error && <div className="alert-error">{error}</div>}

        {mensaje && <div className="alert-success">{mensaje}</div>}

        {paso === 1 && (
          <form className="form-auth" onSubmit={buscarPreguntas}>
            <label>Correo electrónico</label>

            <input
              type="email"
              placeholder="Ingresa tu correo"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />

            <button className="auth-button" disabled={cargando}>
              {cargando ? "Buscando..." : "Continuar"}
            </button>
          </form>
        )}

        {paso === 2 && (
          <form className="form-auth" onSubmit={validarRespuestas}>
            {preguntas.map((pregunta) => (
              <div className="question-card" key={pregunta.idPregunta}>
                <p className="question-title">{pregunta.textoPregunta}</p>

                <input
                  type="text"
                  placeholder="Escribe tu respuesta"
                  value={respuestas[pregunta.idPregunta] || ""}
                  onChange={(e) =>
                    setRespuestas({
                      ...respuestas,

                      [pregunta.idPregunta]: e.target.value,
                    })
                  }
                  required
                />
              </div>
            ))}

            <button className="auth-button" disabled={cargando}>
              {cargando ? "Validando..." : "Validar respuestas"}
            </button>
          </form>
        )}

        {paso === 3 && (
          <form className="form-auth" onSubmit={guardarNuevaPassword}>
            <label>Nueva contraseña</label>

            <div className="password-box">
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="Nueva contraseña"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                required
              />

              <span
                className="toggle-password"
                onClick={() => setMostrarPassword(!mostrarPassword)}
              >
                {mostrarPassword ? "🙈" : "👁"}
              </span>
            </div>

            <button className="auth-button" disabled={cargando}>
              {cargando ? "Guardando..." : "Cambiar contraseña"}
            </button>
          </form>
        )}

        <button className="link-button" onClick={() => navigate("/login")}>
          ← Volver al inicio de sesión
        </button>
      </div>
    </div>
  );
}
