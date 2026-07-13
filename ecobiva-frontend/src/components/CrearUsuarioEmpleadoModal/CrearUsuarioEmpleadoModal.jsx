import "./CrearUsuarioEmpleadoModal.css";

import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";

import { crearUsuarioDeEmpleado } from "../../services/empleadoService";

const VACIO = { correo: "", password: "", idRol: "" };

export default function CrearUsuarioEmpleadoModal({
  open,

  empleado,

  roles = [],

  onClose,

  onGuardado,
}) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;

    setForm(VACIO);
    setErrores({});
    setError("");
  }, [open, empleado]);

  if (!open) return null;

  function validar() {
    const nuevo = {};

    if (!form.correo.trim()) nuevo.correo = "El correo es obligatorio.";
    if (!form.password || form.password.length < 6)
      nuevo.password = "La contraseña debe tener al menos 6 caracteres.";
    if (!form.idRol) nuevo.idRol = "Seleccione un rol.";

    setErrores(nuevo);
    return Object.keys(nuevo).length === 0;
  }

  async function guardar(e) {
    e.preventDefault();

    if (!validar()) return;

    setError("");
    setGuardando(true);

    try {
      await crearUsuarioDeEmpleado(empleado.idEmpleado, {
        correo: form.correo.trim(),
        password: form.password,
        idRol: form.idRol,
      });

      onGuardado();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "No se pudo crear el usuario.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={`Crear Usuario para ${empleado?.nombre || ""}`}
      onClose={onClose}
    >
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={guardar}>
        <Input
          label="Correo"
          type="email"
          required
          value={form.correo}
          error={errores.correo}
          onChange={(e) => setForm({ ...form, correo: e.target.value })}
        />

        <Input
          label="Contraseña"
          type="password"
          required
          value={form.password}
          error={errores.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <div className="inputGroup">
          <label>
            Rol
            <span>*</span>
          </label>

          <select
            value={form.idRol}
            onChange={(e) => setForm({ ...form, idRol: e.target.value })}
          >
            <option value="">Selecciona un rol</option>

            {roles.map((rol) => (
              <option key={rol.idRol} value={rol.idRol}>
                {rol.nombreRol}
              </option>
            ))}
          </select>

          {errores.idRol && <p className="inputError">{errores.idRol}</p>}
        </div>

        <div className="crearUsuarioModalFooter">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" disabled={guardando}>
            {guardando ? "Creando..." : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
