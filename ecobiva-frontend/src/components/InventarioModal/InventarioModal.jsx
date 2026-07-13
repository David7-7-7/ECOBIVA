import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import Input from "../Input/Input";
import "./InventarioModal.css";

const REPUESTO_INICIAL = {
  nombre: "",
  categoria: "",
  precioUnitario: "",
  proveedor: "",
  stockActual: "",
  stockMinimo: "",
  estado: "",
};

const BATERIA_INICIAL = {
  nombre: "",
  serial: "",
  modeloCompatible: "",
  voltajeFinal: "",
  amperajeFinal: "",
  idVehiculo: "",
  stockActual: "",
  precioUnitario: "",
  estado: "",
};

export default function InventarioModal({ open, modo, productoEditar, onClose, onSave }) {
  const [form, setForm] = useState(modo === "baterias" ? BATERIA_INICIAL : REPUESTO_INICIAL);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!open) return;

    if (modo === "baterias") {
      if (productoEditar) {
        setForm({
          nombre: productoEditar.nombre || "",
          serial: productoEditar.serial || "",
          modeloCompatible: productoEditar.modeloCompatible || "",
          voltajeFinal: productoEditar.voltajeFinal || "",
          amperajeFinal: productoEditar.amperajeFinal || "",
          idVehiculo: productoEditar.idVehiculo || "",
          stockActual: productoEditar.stockActual || "",
          precioUnitario: productoEditar.precioUnitario || "",
          estado: productoEditar.estado || "",
        });
      } else {
        setForm(BATERIA_INICIAL);
      }
    } else {
      if (productoEditar) {
        setForm({
          nombre: productoEditar.nombre || "",
          categoria: productoEditar.categoria || "",
          precioUnitario: productoEditar.precioUnitario || "",
          proveedor: productoEditar.proveedor || "",
          stockActual: productoEditar.stockActual || "",
          stockMinimo: productoEditar.stockMinimo || "",
          estado: productoEditar.estado || "",
        });
      } else {
        setForm(REPUESTO_INICIAL);
      }
    }

    setErrores({});
  }, [open, modo, productoEditar]);

  if (!open) return null;

  const validar = async () => {
    const nuevosErrores = {};

    if (!form.nombre.trim()) nuevosErrores.nombre = "Ingrese el nombre.";
    if (!form.precioUnitario.toString().trim()) nuevosErrores.precioUnitario = "Ingrese el precio.";
    if (!form.stockActual.toString().trim()) nuevosErrores.stockActual = "Ingrese el stock.";

    if (modo === "repuestos") {
      if (!form.categoria.trim()) nuevosErrores.categoria = "Ingrese la categoría.";
      if (!form.proveedor.trim()) nuevosErrores.proveedor = "Ingrese el proveedor.";
      if (!form.stockMinimo.toString().trim()) nuevosErrores.stockMinimo = "Ingrese el stock mínimo.";
    } else {
      if (!form.serial.trim()) nuevosErrores.serial = "Ingrese el serial.";
      if (!form.modeloCompatible.trim()) nuevosErrores.modeloCompatible = "Ingrese el modelo.";
      if (!form.voltajeFinal.toString().trim()) nuevosErrores.voltajeFinal = "Ingrese el voltaje.";
      if (!form.amperajeFinal.toString().trim()) nuevosErrores.amperajeFinal = "Ingrese el amperaje.";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    if (onSave) {
      await onSave({
        ...form,
        precioUnitario: Number(form.precioUnitario),
        stockActual: Number(form.stockActual),
        stockMinimo: modo === "repuestos" ? Number(form.stockMinimo) : undefined,
        voltajeFinal: modo === "baterias" ? Number(form.voltajeFinal) : undefined,
        amperajeFinal: modo === "baterias" ? Number(form.amperajeFinal) : undefined,
      });
    }

    onClose();
  };

  return (
    <Modal
      open={open}
      title={modo === "baterias" ? (productoEditar ? "Editar Batería" : "Registrar Batería") : (productoEditar ? "Editar Repuesto" : "Registrar Repuesto")}
      onClose={onClose}
      width="600px"
    >
      <div className="inventarioModalBody">
        <Input
          label="Nombre"
          required
          value={form.nombre}
          error={errores.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        />

        {modo === "repuestos" ? (
          <>
            <Input
              label="Categoría"
              required
              value={form.categoria}
              error={errores.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            />
            <Input
              label="Proveedor"
              required
              value={form.proveedor}
              error={errores.proveedor}
              onChange={(e) => setForm({ ...form, proveedor: e.target.value })}
            />
            <Input
              label="Stock mínimo"
              type="number"
              required
              value={form.stockMinimo}
              error={errores.stockMinimo}
              onChange={(e) => setForm({ ...form, stockMinimo: e.target.value })}
            />
          </>
        ) : (
          <>
            <Input
              label="Serial"
              required
              value={form.serial}
              error={errores.serial}
              onChange={(e) => setForm({ ...form, serial: e.target.value })}
            />
            <Input
              label="Modelo compatible"
              required
              value={form.modeloCompatible}
              error={errores.modeloCompatible}
              onChange={(e) => setForm({ ...form, modeloCompatible: e.target.value })}
            />
            <Input
              label="Voltaje"
              type="number"
              required
              value={form.voltajeFinal}
              error={errores.voltajeFinal}
              onChange={(e) => setForm({ ...form, voltajeFinal: e.target.value })}
            />
            <Input
              label="Amperaje"
              type="number"
              required
              value={form.amperajeFinal}
              error={errores.amperajeFinal}
              onChange={(e) => setForm({ ...form, amperajeFinal: e.target.value })}
            />
            <Input
              label="ID Vehículo"
              value={form.idVehiculo}
              onChange={(e) => setForm({ ...form, idVehiculo: e.target.value })}
            />
          </>
        )}

        <Input
          label="Precio Unitario"
          type="number"
          required
          value={form.precioUnitario}
          error={errores.precioUnitario}
          onChange={(e) => setForm({ ...form, precioUnitario: e.target.value })}
        />

        <Input
          label="Stock Actual"
          type="number"
          required
          value={form.stockActual}
          error={errores.stockActual}
          onChange={(e) => setForm({ ...form, stockActual: e.target.value })}
        />

        <Input
          label="Estado"
          value={form.estado}
          onChange={(e) => setForm({ ...form, estado: e.target.value })}
        />

        <div className="inventarioModalFooter">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button onClick={validar} type="button">
            {productoEditar ? "Guardar" : "Crear"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
