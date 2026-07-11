import "../../styles/auth.css";

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();

  const { login, cargando } = useAuth();

  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);

  async function iniciarSesion(e) {
    e.preventDefault();

    setError("");

    const resultado = await login(correo, password);

    if (resultado.ok) {
      navigate("/dashboard");
    } else {
      setError(resultado.mensaje);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="logo-container">
          <div className="logo-circle">E</div>

          <h1>ECOBIVA</h1>

          <span>Sistema de Gestión Automotriz</span>
        </div>

        {error && (
          <div
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "15px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        <form className="form-auth" onSubmit={iniciarSesion}>
          <label>Correo electrónico</label>

          <input
            type="email"
            placeholder="Ingrese su correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />

          <label>Contraseña</label>

          <div className="password-box">
            <input
              type={mostrarPassword ? "text" : "password"}
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              className="toggle-password"
              onClick={() => setMostrarPassword(!mostrarPassword)}
            >
              {mostrarPassword ? "🙈" : "👁"}
            </span>
          </div>

          <button type="submit" disabled={cargando}>
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>

          <button
            type="button"
            className="link-button"
            onClick={() => navigate("/recuperar")}
          >
            ¿Olvidaste tu contraseña?
          </button>
        </form>
      </div>
    </div>
  );
}
