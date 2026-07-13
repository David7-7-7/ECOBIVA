import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";
import { obtenerClientes, obtenerCliente } from "../../services/clienteService";
import "./OrdenModal.css";

const ESTADOS = ["Pendiente", "En Taller", "Finalizado", "Entregado"];
const PRIORIDADES = ["Baja", "Media", "Alta"];

const estadoValue = (value) => value || "Pendiente";
const prioridadValue = (value) => value || "Media";

const inicializarOrden = () => ({
  clienteId: "",
  vehiculoId: "",
  cliente: "",
  vehiculo: "",
  placa: "",
  marca: "",
  modelo: "",
  tecnico: "",
  servicio: "",
  fecha: "",
  entrega: "",
  estado: "Pendiente",
  prioridad: "Media",
  total: "",
  observaciones: "",
});

export default function OrdenModal({ open, ordenEditar, onClose, onSave }) {
  const [orden, setOrden] = useState(inicializarOrden());
  const [errores, setErrores] = useState({});
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  const clienteSeleccionado = clientes.find((cliente) => String(cliente.idCliente) === String(orden.clienteId));

  useEffect(() => {
    if (!open) return;
    cargarClientes();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (ordenEditar) {
      setOrden({
        clienteId: ordenEditar.clienteId || "",
        vehiculoId: ordenEditar.vehiculoId || "",
        cliente: ordenEditar.cliente || "",
        vehiculo: ordenEditar.vehiculo || "",
        placa: ordenEditar.placa || "",
        marca: ordenEditar.marca || "",
        modelo: ordenEditar.modelo || "",
        tecnico: ordenEditar.tecnico || "",
        servicio: ordenEditar.servicio || "",
        fecha: ordenEditar.fecha || "",
        entrega: ordenEditar.entrega || "",
        estado: estadoValue(ordenEditar.estado),
        prioridad: prioridadValue(ordenEditar.prioridad),
        total: ordenEditar.total || "",
        observaciones: ordenEditar.observaciones || "",
      });

      if (ordenEditar.clienteId) {
        cargarClienteYVehiculos(ordenEditar.clienteId, ordenEditar.vehiculoId);
      }
      return;
    }

    setOrden(inicializarOrden());
    setVehiculos([]);
    setErrores({});
  }, [open, ordenEditar]);

  const cargarClientes = async () => {
    try {
      const data = await obtenerClientes();
      setClientes(data || []);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los clientes.");
    }
  };

  const cargarClienteYVehiculos = async (idCliente, vehiculoId = "") => {
    if (!idCliente) {
      setVehiculos([]);
      return;
    }

    try {
      const cliente = await obtenerCliente(idCliente);
      const listaVehiculos = cliente.vehiculos || [];
      setVehiculos(listaVehiculos);
      setOrden((prev) => ({
        ...prev,
        cliente: cliente.nombre || prev.cliente,
        clienteId: idCliente,
      }));

      if (vehiculoId) {
        const vehiculo = listaVehiculos.find(
          (item) => String(item.idVehiculo || item.id) === String(vehiculoId)
        );
        if (vehiculo) {
          setVehiculos(listaVehiculos);
          setOrden((prev) => ({
            ...prev,
            vehiculoId,
            vehiculo: `${vehiculo.marca || ""} ${vehiculo.modelo || ""}`.trim() || vehiculo.placa || "",
            placa: vehiculo.placa || "",
            marca: vehiculo.marca || "",
            modelo: vehiculo.modelo || "",
          }));
        }
      }
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los vehículos del cliente.");
    }
  };

  const seleccionarCliente = async (clienteId) => {
    if (!clienteId) {
      setOrden((prev) => ({
        ...prev,
        clienteId: "",
        cliente: "",
        vehiculoId: "",
        vehiculo: "",
        placa: "",
        marca: "",
        modelo: "",
      }));
      setVehiculos([]);
      return;
    }

    await cargarClienteYVehiculos(clienteId);
    setOrden((prev) => ({
      ...prev,
      clienteId,
      vehiculoId: "",
      vehiculo: "",
      placa: "",
      marca: "",
      modelo: "",
    }));
  };

  const seleccionarVehiculo = (vehiculoId) => {
    const vehiculo = vehiculos.find(
      (item) => String(item.idVehiculo || item.id) === String(vehiculoId)
    );
    if (!vehiculo) {
      setOrden((prev) => ({
        ...prev,
        vehiculoId: "",
        vehiculo: "",
        placa: "",
        marca: "",
        modelo: "",
      }));
      return;
    }

    setOrden((prev) => ({
      ...prev,
      vehiculoId,
      vehiculo: `${vehiculo.marca || ""} ${vehiculo.modelo || ""}`.trim() || vehiculo.placa || "",
      placa: vehiculo.placa || "",
      marca: vehiculo.marca || "",
      modelo: vehiculo.modelo || "",
    }));
  };

  if (!open) return null;

  const validar = async () => {
    const nuevo = {};

    if (!orden.clienteId) nuevo.cliente = "Seleccione el cliente.";
    if (!orden.vehiculoId) nuevo.vehiculo = "Seleccione el vehículo.";
    if (!orden.placa.trim()) nuevo.placa = "No se encontró la placa del vehículo.";
    if (!orden.tecnico.trim()) nuevo.tecnico = "Ingrese el técnico.";
    if (!orden.servicio.trim()) nuevo.servicio = "Ingrese el servicio.";
    if (!orden.fecha.trim()) nuevo.fecha = "Ingrese la fecha.";
    if (!orden.total.toString().trim()) nuevo.total = "Ingrese el valor total.";

    setErrores(nuevo);

    if (Object.keys(nuevo).length > 0) return;

    await onSave(orden);
    onClose();
  };

  return (
    <Modal
      open={open}
      title={ordenEditar ? "Editar Orden" : "Nueva Orden"}
      onClose={onClose}
      width="760px"
    >
      <div className="ordenModalBody">
        {ordenEditar && (
          <div className="ordenModalId">
            Orden: <strong>{ordenEditar.id || ordenEditar.idOrden || "-"}</strong>
          </div>
        )}

        <div className="ordenModalGrid">
          <div className="inputGroup">
            <label>Cliente</label>
            <select
              value={orden.clienteId}
              onChange={(e) => seleccionarCliente(e.target.value)}
            >
              <option value="">Seleccione...</option>
              {clientes.map((cliente) => (
                <option key={cliente.idCliente} value={cliente.idCliente}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
            {errores.cliente && <p className="inputError">{errores.cliente}</p>}
          </div>

          <div className="inputGroup">
            <label>Vehículo</label>
            <select
              value={orden.vehiculoId}
              onChange={(e) => seleccionarVehiculo(e.target.value)}
              disabled={!orden.clienteId || vehiculos.length === 0}
            >
              <option value="">Seleccione...</option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.idVehiculo || vehiculo.id} value={vehiculo.idVehiculo || vehiculo.id}>
                  {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                </option>
              ))}
            </select>
            {errores.vehiculo && <p className="inputError">{errores.vehiculo}</p>}
          </div>

          <div className="ordenModalInfo">
            <p>
              <strong>Documento:</strong> {clienteSeleccionado?.documento || "-"}
            </p>
            <p>
              <strong>Teléfono:</strong> {clienteSeleccionado?.telefono || "-"}
            </p>
            <p>
              <strong>Correo:</strong> {clienteSeleccionado?.correo || "-"}
            </p>
          </div>

          <Input
            label="Técnico"
            required
            value={orden.tecnico}
            error={errores.tecnico}
            onChange={(e) => setOrden({ ...orden, tecnico: e.target.value })}
          />

          <Input
            label="Servicio"
            required
            value={orden.servicio}
            error={errores.servicio}
            onChange={(e) => setOrden({ ...orden, servicio: e.target.value })}
          />

          <div className="inputGroup">
            <label>Estado</label>
            <select
              value={orden.estado}
              onChange={(e) => setOrden({ ...orden, estado: e.target.value })}
            >
              {ESTADOS.map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
          </div>

          <div className="inputGroup">
            <label>Prioridad</label>
            <select
              value={orden.prioridad}
              onChange={(e) => setOrden({ ...orden, prioridad: e.target.value })}
            >
              {PRIORIDADES.map((prioridad) => (
                <option key={prioridad} value={prioridad}>
                  {prioridad}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Fecha"
            type="date"
            required
            value={orden.fecha}
            error={errores.fecha}
            onChange={(e) => setOrden({ ...orden, fecha: e.target.value })}
          />

          <Input
            label="Entrega"
            type="date"
            value={orden.entrega}
            onChange={(e) => setOrden({ ...orden, entrega: e.target.value })}
          />

          <Input
            label="Total"
            type="number"
            required
            value={orden.total}
            error={errores.total}
            onChange={(e) => setOrden({ ...orden, total: e.target.value })}
          />

          <div className="ordenModalFull">
            <label>Observaciones</label>
            <textarea
              value={orden.observaciones}
              onChange={(e) => setOrden({ ...orden, observaciones: e.target.value })}
              placeholder="Observaciones..."
            />
          </div>

          <div className="ordenModalInfo">
            <p>
              <strong>Placa:</strong> {orden.placa || "-"}
            </p>
            <p>
              <strong>Marca:</strong> {orden.marca || "-"}
            </p>
            <p>
              <strong>Modelo:</strong> {orden.modelo || "-"}
            </p>
          </div>
        </div>

        <div className="ordenModalFooter">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={validar}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
