import "./EmpleadoModal.css";

import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";

import {
  crearEmpleado,
  editarEmpleado,
} from "../../services/empleadoService";

const VACIO = {
  nombre: "",
  documento: "",
  fechaIngreso: "",
  cargoActual: "",
  tarifaHora: "",
};

export default function EmpleadoModal({
  open,

  empleado,

  editando,

  onClose,

  onGuardado,
}) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (editando && empleado) {
      setForm({
        nombre: empleado.nombre || "",
        documento: empleado.documento || "",
        fechaIngreso: empleado.fechaIngreso
          ? String(empleado.fechaIngreso).slice(0, 10)
          : "",
        cargoActual: empleado.cargoActual || "",
        tarifaHora: empleado.tarifaHora ?? "",
      });
    } else {
      setForm(VACIO);
    }

    setErrores({});
    setError("");
  }, [open, editando, empleado]);

  if (!open) return null;

  function validar() {
    const nuevo = {};

    if (!form.nombre.trim()) nuevo.nombre = "El nombre es obligatorio.";
    if (!form.documento.trim())
      nuevo.documento = "El documento es obligatorio.";
    if (!form.fechaIngreso)
      nuevo.fechaIngreso = "La fecha de ingreso es obligatoria.";
    if (!form.cargoActual.trim())
      nuevo.cargoActual = "El cargo es obligatorio.";

    if (form.tarifaHora === "" || Number(form.tarifaHora) <= 0)
      nuevo.tarifaHora = "Ingrese una tarifa por hora válida.";

    setErrores(nuevo);
    return Object.keys(nuevo).length === 0;
  }

  async function guardar(e) {
    e.preventDefault();

    if (!validar()) return;

    setError("");
    setGuardando(true);

    const payload = {
      nombre: form.nombre.trim(),
      documento: form.documento.trim(),
      fechaIngreso: form.fechaIngreso,
      cargoActual: form.cargoActual.trim(),
      tarifaHora: Number(form.tarifaHora),
    };

    try {
      if (editando) {
        await editarEmpleado(empleado.idEmpleado, payload);
      } else {
        await crearEmpleado(payload);
      }

      onGuardado();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "No se pudo guardar el empleado.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={editando ? "Editar Empleado" : "Nuevo Empleado"}
      onClose={onClose}
    >
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={guardar}>
        <Input
          label="Nombre"
          required
          value={form.nombre}
          error={errores.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        <Input
          label="Documento"
          required
          value={form.documento}
          error={errores.documento}
          onChange={(e) => setForm({ ...form, documento: e.target.value })}
        />

        <Input
          label="Fecha de Ingreso"
          type="date"
          required
          value={form.fechaIngreso}
          error={errores.fechaIngreso}
          onChange={(e) =>
            setForm({ ...form, fechaIngreso: e.target.value })
          }
        />

        <Input
          label="Cargo"
          required
          value={form.cargoActual}
          error={errores.cargoActual}
          onChange={(e) => setForm({ ...form, cargoActual: e.target.value })}
        />

        <Input
          label="Tarifa por Hora"
          type="number"
          required
          value={form.tarifaHora}
          error={errores.tarifaHora}
          onChange={(e) => setForm({ ...form, tarifaHora: e.target.value })}
        />

        <div className="empleadoModalFooter">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" disabled={guardando}>
            {guardando
              ? "Guardando..."
              : editando
                ? "Guardar Cambios"
                : "Crear Empleado"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
