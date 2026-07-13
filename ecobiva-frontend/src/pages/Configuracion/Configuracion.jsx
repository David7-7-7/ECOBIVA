import "./Configuracion.css";

import { useEffect, useState } from "react";
import { FaUserCog, FaBuilding, FaLock, FaPalette, FaCog, FaSave } from "react-icons/fa";

import PageHeader from "../../components/PageHeader/PageHeader";
import {
  obtenerMiPerfil,
  actualizarMiPerfil,
  cambiarPassword,
} from "../../services/perfilService";
import { useAuth } from "../../context/AuthContext";

export default function Configuracion() {
  // BUGFIX (correo/JWT desactualizado tras cambiarlo desde Configuración):
  // si el correo cambió, el backend reemite token + usuario nuevos (ver
  // perfilController.actualizarMiPerfil). Los sincronizamos acá mismo para
  // no depender de un siguiente login.
  const { sincronizarSesion } = useAuth();
  // ---------- Información del usuario (nombre/cargo readOnly, correo/telefono editables) ----------
  const [perfil, setPerfil] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    cargo: "",
  });

  const [cargando, setCargando] = useState(false);
  const [guardandoInfo, setGuardandoInfo] = useState(false);
  const [errorInfo, setErrorInfo] = useState("");
  const [mensajeInfo, setMensajeInfo] = useState("");

  // ---------- Cambiar contraseña ----------
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [passwordConfirmar, setPasswordConfirmar] = useState("");
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [errorPassword, setErrorPassword] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");

  async function cargar() {
    setCargando(true);
    setErrorInfo("");

    try {
      const data = await obtenerMiPerfil();
      setPerfil(data);
    } catch (err) {
      setErrorInfo(
        err.response?.data?.error || "No se pudo cargar tu información."
      );
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function guardarInfo() {
    setGuardandoInfo(true);
    setErrorInfo("");
    setMensajeInfo("");

    try {
      const respuesta = await actualizarMiPerfil(perfil.telefono, perfil.correo);

      // Si el correo cambió, el backend manda token/usuario nuevos: los
      // sincronizamos para que el JWT y el localStorage queden al día sin
      // esperar al próximo login.
      if (respuesta?.token) {
        sincronizarSesion(respuesta.token, respuesta.usuario);
      }

      setMensajeInfo("Cambios guardados correctamente.");
    } catch (err) {
      setErrorInfo(
        err.response?.data?.error || "No se pudieron guardar los cambios."
      );
    } finally {
      setGuardandoInfo(false);
    }
  }

  async function guardarPassword(e) {
    e.preventDefault();
    setErrorPassword("");
    setMensajePassword("");

    if (nuevaPassword !== passwordConfirmar) {
      setErrorPassword("La confirmación no coincide con la nueva contraseña");
      return;
    }

    setGuardandoPassword(true);
    try {
      await cambiarPassword(passwordActual, nuevaPassword);
      setMensajePassword("Contraseña actualizada correctamente.");
      setPasswordActual("");
      setNuevaPassword("");
      setPasswordConfirmar("");
    } catch (err) {
      setErrorPassword(
        err.response?.data?.error || "No se pudo cambiar la contraseña."
      );
    } finally {
      setGuardandoPassword(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Configuración"
        subtitle="Configuración general del sistema."
      />

      <div className="configContainer">
        <div className="configMenu">
          <button type="button">
            <FaUserCog />
            Perfil
          </button>
          <button type="button">
            <FaBuilding />
            Empresa
          </button>
          <button type="button">
            <FaLock />
            Seguridad
          </button>
          <button type="button">
            <FaPalette />
            Apariencia
          </button>
          <button type="button">
            <FaCog />
            Preferencias
          </button>
        </div>

        <div className="configContent">
          {/* ---------- Información del Usuario ---------- */}
          {errorInfo && <div className="alert alert-error">{errorInfo}</div>}
          {mensajeInfo && (
            <div className="alert alert-success">{mensajeInfo}</div>
          )}

          <div className="configCard">
            <h2>Información del Usuario</h2>

            {cargando ? (
              <p>Cargando...</p>
            ) : (
              <div className="grid2">
                <div>
                  <label>Nombre</label>
                  <input type="text" value={perfil.nombre} readOnly />
                </div>

                <div>
                  <label>Correo</label>
                  <input
                    type="email"
                    value={perfil.correo}
                    onChange={(e) =>
                      setPerfil({ ...perfil, correo: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label>Teléfono</label>
                  <input
                    type="text"
                    value={perfil.telefono}
                    onChange={(e) =>
                      setPerfil({ ...perfil, telefono: e.target.value })
                    }
                    maxLength={20}
                  />
                </div>

                <div>
                  <label>Cargo</label>
                  <input type="text" value={perfil.cargo} readOnly />
                </div>
              </div>
            )}
          </div>

          <div className="configFooter">
            <button
              className="guardarConfig"
              onClick={guardarInfo}
              disabled={cargando || guardandoInfo}
            >
              <FaSave />
              {guardandoInfo ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>

          {/* ---------- Cambiar Contraseña ---------- */}
          {errorPassword && (
            <div className="alert alert-error">{errorPassword}</div>
          )}
          {mensajePassword && (
            <div className="alert alert-success">{mensajePassword}</div>
          )}

          <form onSubmit={guardarPassword}>
            <div className="configCard">
              <h2>Cambiar Contraseña</h2>

              <div className="grid2">
                <div>
                  <label>Contraseña Actual</label>
                  <input
                    type="password"
                    value={passwordActual}
                    onChange={(e) => setPasswordActual(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Nueva Contraseña</label>
                  <input
                    type="password"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Confirmar Nueva Contraseña</label>
                  <input
                    type="password"
                    value={passwordConfirmar}
                    onChange={(e) => setPasswordConfirmar(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="configFooter">
              <button className="guardarConfig" disabled={guardandoPassword}>
                <FaSave />
                {guardandoPassword ? "Guardando..." : "Guardar Contraseña"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
