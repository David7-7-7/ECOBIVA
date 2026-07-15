import "./TecnicoModal.css";

import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";

import { editarTecnico } from "../../services/tecnicoService";

const VACIO = {
  nombre: "",
  documento: "",
  fechaIngreso: "",
  tarifaHora: "",
  especialidad: "",
  capacidadMaxima: "",
};

export default function TecnicoModal({
  open,
  tecnico,
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

    if (editando && tecnico) {
      setForm({
        nombre: tecnico.nombre || "",
        documento: tecnico.documento || "",
        fechaIngreso: tecnico.fechaIngreso
          ? String(tecnico.fechaIngreso).slice(0, 10)
          : "",
        tarifaHora: tecnico.tarifaHora ?? "",
        especialidad: tecnico.especialidad || "",
        capacidadMaxima: tecnico.capacidadMaxima ?? "",
      });
    } else {
      setForm(VACIO);
    }

    setErrores({});
    setError("");
  }, [open, editando, tecnico]);

  if (!open) return null;

  function validar() {
    const nuevo = {};

    if (!form.nombre.trim()) nuevo.nombre = "El nombre es obligatorio.";
    if (!form.documento.trim())
      nuevo.documento = "El documento es obligatorio.";

    if (!editando && !form.fechaIngreso)
      nuevo.fechaIngreso = "La fecha de ingreso es obligatoria.";

    if (form.tarifaHora === "" || Number(form.tarifaHora) < 0)
      nuevo.tarifaHora = "Ingrese una tarifa por hora válida.";

    if (editando) {
      const capacidad = Number(form.capacidadMaxima);
      if (
        form.capacidadMaxima === "" ||
        !Number.isInteger(capacidad) ||
        capacidad < 1
      ) {
        nuevo.capacidadMaxima =
          "Ingrese una capacidad máxima entera y mayor o igual a 1.";
      } else if (
        tecnico?.cargaActual != null &&
        capacidad < tecnico.cargaActual
      ) {
        nuevo.capacidadMaxima = `No puede ser menor que la carga actual (${tecnico.cargaActual}).`;
      }
    }

    setErrores(nuevo);
    return Object.keys(nuevo).length === 0;
  }

  async function guardar(e) {
    e.preventDefault();

    if (!validar()) return;

    setError("");
    setGuardando(true);

    try {
      // El alta de técnicos se hace desde Usuarios (rol Técnico) o desde
      // Empleados > crear-usuario; este modal solo edita técnicos existentes.
      await editarTecnico(tecnico.idEmpleado, {
        nombre: form.nombre.trim(),
        documento: form.documento.trim(),
        tarifaHora: Number(form.tarifaHora),
        especialidad: form.especialidad.trim() || null,
        capacidadMaxima: Number(form.capacidadMaxima),
      });

      onGuardado();
      onClose();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo guardar el técnico.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={editando ? "Editar Técnico" : "Nuevo Técnico"}
      onClose={onClose}
    >
      {error && <div className="alert alert-error">{error}</div>}

      <form className="tecnicoForm" onSubmit={guardar}>
        <div className="formGrid">
          <Input
            label="Documento"
            required
            value={form.documento}
            error={errores.documento}
            onChange={(e) => setForm({ ...form, documento: e.target.value })}
          />

          <Input
            label="Nombre"
            required
            value={form.nombre}
            error={errores.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />

          {!editando && (
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
          )}

          <Input
            label="Tarifa por Hora"
            type="number"
            required
            value={form.tarifaHora}
            error={errores.tarifaHora}
            onChange={(e) => setForm({ ...form, tarifaHora: e.target.value })}
          />

          <Input
            label="Especialidad"
            value={form.especialidad}
            onChange={(e) => setForm({ ...form, especialidad: e.target.value })}
          />

          {editando && (
            <Input
              label={`Capacidad Máxima${
                tecnico?.cargaActual != null
                  ? ` (carga actual: ${tecnico.cargaActual})`
                  : ""
              }`}
              type="number"
              required
              value={form.capacidadMaxima}
              error={errores.capacidadMaxima}
              onChange={(e) =>
                setForm({ ...form, capacidadMaxima: e.target.value })
              }
            />
          )}
        </div>

        <div className="tecnicoModalFooter">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" variant="primary" disabled={guardando}>
            {guardando
              ? "Guardando..."
              : editando
                ? "Guardar Cambios"
                : "Crear Técnico"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
