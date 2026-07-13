import "./NominaModal.css";

import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";

import {
  previsualizarNomina,
  generarNomina,
  editarNomina,
} from "../../services/nominaService";

const VACIO = {
  idEmpleado: "",
  periodoInicio: "",
  periodoFin: "",
  totalHoras: "",
  tarifaHoraAplicada: "",
};

export default function NominaModal({
  open,

  modo = "generar",

  nomina,

  empleados = [],

  onClose,

  onGuardado,
}) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [preview, setPreview] = useState(null);
  const [cargandoPreview, setCargandoPreview] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (modo === "editar" && nomina) {
      setForm({
        ...VACIO,
        totalHoras: nomina.totalHoras,
        tarifaHoraAplicada: nomina.tarifaHoraAplicada,
      });
    } else {
      setForm(VACIO);
    }

    setErrores({});
    setError("");
    setMensaje("");
    setPreview(null);
  }, [open, modo, nomina]);

  if (!open) return null;

  function validarGenerar() {
    const nuevo = {};

    if (!form.idEmpleado) nuevo.idEmpleado = "Seleccione un empleado.";
    if (!form.periodoInicio) nuevo.periodoInicio = "Ingrese la fecha inicial.";
    if (!form.periodoFin) nuevo.periodoFin = "Ingrese la fecha final.";

    if (
      form.periodoInicio &&
      form.periodoFin &&
      new Date(form.periodoInicio) > new Date(form.periodoFin)
    )
      nuevo.periodoFin = "La fecha final no puede ser menor que la inicial.";

    setErrores(nuevo);
    return Object.keys(nuevo).length === 0;
  }

  async function verPreview() {
    if (!validarGenerar()) return;

    setError("");
    setCargandoPreview(true);

    try {
      const respuesta = await previsualizarNomina({
        idEmpleado: form.idEmpleado,
        periodoInicio: form.periodoInicio,
        periodoFin: form.periodoFin,
      });

      setPreview(respuesta.data);
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "No se pudo calcular la vista previa.",
      );
    } finally {
      setCargandoPreview(false);
    }
  }

  async function confirmarGenerar() {
    setError("");
    setGuardando(true);

    try {
      await generarNomina({
        idEmpleado: form.idEmpleado,
        periodoInicio: form.periodoInicio,
        periodoFin: form.periodoFin,
      });

      onGuardado();
      onClose();
    } catch (err) {
      setError(err.response?.data?.mensaje || "No se pudo generar la nómina.");
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion(e) {
    e.preventDefault();

    const nuevo = {};

    if (form.totalHoras === "" || Number(form.totalHoras) < 0)
      nuevo.totalHoras = "Ingrese un número de horas válido.";

    if (form.tarifaHoraAplicada === "" || Number(form.tarifaHoraAplicada) < 0)
      nuevo.tarifaHoraAplicada = "Ingrese una tarifa válida.";

    setErrores(nuevo);

    if (Object.keys(nuevo).length > 0) return;

    setError("");
    setGuardando(true);

    try {
      await editarNomina(nomina.idNomina, {
        totalHoras: Number(form.totalHoras),
        tarifaHoraAplicada: Number(form.tarifaHoraAplicada),
      });

      onGuardado();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.mensaje || "No se pudo actualizar la nómina.",
      );
    } finally {
      setGuardando(false);
    }
  }

  const totalEditado =
    form.totalHoras !== "" && form.tarifaHoraAplicada !== ""
      ? Number(form.totalHoras) * Number(form.tarifaHoraAplicada)
      : null;

  return (
    <Modal
      open={open}
      title={modo === "editar" ? "Editar Nómina" : "Generar Nómina"}
      onClose={onClose}
      width="600px"
    >
      {error && <div className="alert alert-error">{error}</div>}
      {mensaje && <div className="alert alert-success">{mensaje}</div>}

      {modo === "generar" ? (
        <>
          <div className="inputGroup">
            <label>
              Empleado
              <span>*</span>
            </label>

            <select
              value={form.idEmpleado}
              onChange={(e) => {
                setForm({ ...form, idEmpleado: e.target.value });
                setPreview(null);
              }}
            >
              <option value="">Selecciona un empleado</option>
              {empleados.map((empleado) => (
                <option key={empleado.idEmpleado} value={empleado.idEmpleado}>
                  {empleado.nombre} — {empleado.documento}
                </option>
              ))}
            </select>

            {errores.idEmpleado && (
              <p className="inputError">{errores.idEmpleado}</p>
            )}
          </div>

          <Input
            label="Período Inicio"
            type="date"
            required
            value={form.periodoInicio}
            error={errores.periodoInicio}
            onChange={(e) => {
              setForm({ ...form, periodoInicio: e.target.value });
              setPreview(null);
            }}
          />

          <Input
            label="Período Fin"
            type="date"
            required
            value={form.periodoFin}
            error={errores.periodoFin}
            onChange={(e) => {
              setForm({ ...form, periodoFin: e.target.value });
              setPreview(null);
            }}
          />

          {preview && (
            <div className="nominaPreview">
              <h4>Vista Previa</h4>
              <p>
                <span>Total Horas:</span> {preview.totalHoras}
              </p>
              <p>
                <span>Tarifa Aplicada:</span> $
                {Number(preview.tarifaHoraAplicada).toLocaleString("es-CO")}
              </p>
              <p>
                <span>Total a Pagar:</span> $
                {Number(preview.totalPagar).toLocaleString("es-CO")}
              </p>
            </div>
          )}

          <div className="nominaModalFooter">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>

            <Button
              variant="warning"
              onClick={verPreview}
              disabled={cargandoPreview}
            >
              {cargandoPreview ? "Calculando..." : "Vista Previa"}
            </Button>

            <Button
              variant="primary"
              onClick={confirmarGenerar}
              disabled={!preview || guardando}
            >
              {guardando ? "Generando..." : "Generar Nómina"}
            </Button>
          </div>
        </>
      ) : (
        <form onSubmit={guardarEdicion}>
          <Input
            label="Total Horas"
            type="number"
            required
            value={form.totalHoras}
            error={errores.totalHoras}
            onChange={(e) => setForm({ ...form, totalHoras: e.target.value })}
          />

          <Input
            label="Tarifa por Hora Aplicada"
            type="number"
            required
            value={form.tarifaHoraAplicada}
            error={errores.tarifaHoraAplicada}
            onChange={(e) =>
              setForm({ ...form, tarifaHoraAplicada: e.target.value })
            }
          />

          {totalEditado !== null && (
            <div className="nominaPreview">
              <p>
                <span>Total a Pagar:</span> $
                {totalEditado.toLocaleString("es-CO")}
              </p>
            </div>
          )}

          <div className="nominaModalFooter">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>

            <Button type="submit" variant="primary" disabled={guardando}>
              {guardando ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
