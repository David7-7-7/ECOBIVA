import { useEffect, useState } from "react";
import Modal from "../Modal/Modal";
import Input from "../Input/Input";
import Button from "../Button/Button";
import { obtenerClientes, obtenerCliente } from "../../services/clienteService";
import { listarUsuarios } from "../../services/usuarioService";
import { listarTecnicos } from "../../services/tecnicoService";
import EvidenciaIngreso from "../EvidenciaIngreso/EvidenciaIngreso";
import "./OrdenModal.css";

const inicializarOrden = () => ({
  idCliente: "",
  idVehiculo: "",
  idTecnico: "",
  idAsesor: "",
  kilometrajeIngreso: "",
  motivoIngreso: "",
});

export default function OrdenModal({ open, ordenEditar, onClose, onSave }) {
  const [orden, setOrden] = useState(inicializarOrden());
  const [errores, setErrores] = useState({});
  const [clientes, setClientes] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [asesores, setAsesores] = useState([]);
  const [observacionesIngreso, setObservacionesIngreso] = useState("");
  const [fotosIngreso, setFotosIngreso] = useState([]);

  const clienteSeleccionado = clientes.find(
    (cliente) => String(cliente.idCliente) === String(orden.idCliente),
  );

  useEffect(() => {
    if (!open) return;
    cargarClientes();
    cargarUsuarios();
    cargarTecnicos();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (ordenEditar) {
      setOrden({
        idCliente: ordenEditar.idCliente || "",
        idVehiculo: ordenEditar.idVehiculo || "",
        idTecnico: ordenEditar.idTecnico || "",
        idAsesor: ordenEditar.idAsesor || "",
        kilometrajeIngreso: ordenEditar.kilometrajeIngreso ?? "",
        motivoIngreso: ordenEditar.motivoIngreso ?? "",
      });

      if (ordenEditar.idCliente) {
        cargarVehiculosDeCliente(ordenEditar.idCliente);
      }
      setErrores({});
      setObservacionesIngreso("");
      setFotosIngreso([]);
      return;
    }

    setOrden(inicializarOrden());
    setVehiculos([]);
    setErrores({});
    setObservacionesIngreso("");
    setFotosIngreso([]);
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

  const cargarUsuarios = async () => {
    try {
      const data = await listarUsuarios();
      const usuarios = data || [];
      setAsesores(usuarios.filter((u) => (u.roles || []).includes("Asesor")));
    } catch (error) {
      console.error(error);
      // No bloqueamos el formulario si no se pudo cargar la lista de usuarios;
      // simplemente el select de asesor quedará vacío.
    }
  };

  const cargarTecnicos = async () => {
    try {
      const data = await listarTecnicos();
      const tecnicosData = data || [];
      // Solo técnicos activos y con cuenta de usuario (Orden.idTecnico
      // referencia Usuario.idUsuario, así que sin cuenta no se pueden asignar).
      setTecnicos(
        tecnicosData.filter(
          (t) => Number(t.estadoLaboral) === 1 && t.idUsuario,
        ),
      );
    } catch (error) {
      console.error(error);
      // No bloqueamos el formulario si no se pudo cargar la lista de técnicos;
      // simplemente el select de técnico quedará vacío.
    }
  };

  const cargarVehiculosDeCliente = async (idCliente) => {
    if (!idCliente) {
      setVehiculos([]);
      return;
    }

    try {
      const cliente = await obtenerCliente(idCliente);
      setVehiculos(cliente.vehiculos || []);
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los vehículos del cliente.");
    }
  };

  const seleccionarCliente = async (idCliente) => {
    setOrden((prev) => ({ ...prev, idCliente, idVehiculo: "" }));
    await cargarVehiculosDeCliente(idCliente);
  };

  if (!open) return null;

  const validar = async () => {
    const nuevo = {};

    if (!orden.idCliente) nuevo.idCliente = "Seleccione el cliente.";
    if (!orden.idVehiculo) nuevo.idVehiculo = "Seleccione el vehículo.";
    if (!orden.idAsesor) nuevo.idAsesor = "Seleccione el asesor responsable.";
    if (!orden.motivoIngreso.trim())
      nuevo.motivoIngreso = "Indique el motivo de ingreso.";

    setErrores(nuevo);

    if (Object.keys(nuevo).length > 0) return;

    const payload = {
      idCliente: Number(orden.idCliente),
      idVehiculo: Number(orden.idVehiculo),
      idTecnico: orden.idTecnico ? Number(orden.idTecnico) : null,
      idAsesor: Number(orden.idAsesor),
      kilometrajeIngreso:
        orden.kilometrajeIngreso === ""
          ? null
          : Number(orden.kilometrajeIngreso),
      motivoIngreso: orden.motivoIngreso.trim(),
    };

    await onSave({
      orden: payload,
      evidencia: {
        observaciones: observacionesIngreso,
        fotos: fotosIngreso,
      },
    });
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
            Orden: <strong>{ordenEditar.folio || "-"}</strong>
          </div>
        )}

        <div className="ordenModalGrid">
          <div className="inputGroup">
            <label>
              Cliente <span>*</span>
            </label>
            <select
              value={orden.idCliente}
              onChange={(e) => seleccionarCliente(e.target.value)}
            >
              <option value="">Seleccione...</option>
              {clientes.map((cliente) => (
                <option key={cliente.idCliente} value={cliente.idCliente}>
                  {cliente.nombre}
                </option>
              ))}
            </select>
            {errores.idCliente && (
              <p className="inputError">{errores.idCliente}</p>
            )}
          </div>

          <div className="inputGroup">
            <label>
              Vehículo <span>*</span>
            </label>
            <select
              value={orden.idVehiculo}
              onChange={(e) =>
                setOrden({ ...orden, idVehiculo: e.target.value })
              }
              disabled={!orden.idCliente || vehiculos.length === 0}
            >
              <option value="">Seleccione...</option>
              {vehiculos.map((vehiculo) => (
                <option key={vehiculo.idVehiculo} value={vehiculo.idVehiculo}>
                  {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                </option>
              ))}
            </select>
            {errores.idVehiculo && (
              <p className="inputError">{errores.idVehiculo}</p>
            )}
          </div>

          <div className="ordenModalInfo">
            <p>
              <strong>Documento:</strong>{" "}
              {clienteSeleccionado?.documento || "-"}
            </p>
            <p>
              <strong>Teléfono:</strong> {clienteSeleccionado?.telefono || "-"}
            </p>
            <p>
              <strong>Correo:</strong> {clienteSeleccionado?.correo || "-"}
            </p>
          </div>

          <div className="inputGroup">
            <label>
              Asesor <span>*</span>
            </label>
            <select
              value={orden.idAsesor}
              onChange={(e) => setOrden({ ...orden, idAsesor: e.target.value })}
            >
              <option value="">Seleccione...</option>
              {asesores.map((usuario) => (
                <option key={usuario.idUsuario} value={usuario.idUsuario}>
                  {usuario.nombreEmpleado || usuario.correo}
                </option>
              ))}
            </select>
            {errores.idAsesor && (
              <p className="inputError">{errores.idAsesor}</p>
            )}
          </div>

          <div className="inputGroup">
            <label>Tecnico asignado</label>
            <select
              value={orden.idTecnico}
              onChange={(e) =>
                setOrden({ ...orden, idTecnico: e.target.value })
              }
            >
              <option value="">Sin asignar</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.idUsuario} value={tecnico.idUsuario}>
                  {tecnico.nombre} — Carga: {tecnico.cargaActual}/
                  {tecnico.capacidadMaxima}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Kilometraje de ingreso"
            type="number"
            value={orden.kilometrajeIngreso}
            onChange={(e) =>
              setOrden({ ...orden, kilometrajeIngreso: e.target.value })
            }
          />

          <div className="inputGroup ordenModalFull">
            <label>
              Motivo de ingreso <span>*</span>
            </label>
            <textarea
              rows={3}
              placeholder='Ej: "La moto no enciende."'
              value={orden.motivoIngreso}
              onChange={(e) =>
                setOrden({ ...orden, motivoIngreso: e.target.value })
              }
            />
            {errores.motivoIngreso && (
              <p className="inputError">{errores.motivoIngreso}</p>
            )}
          </div>
        </div>

        <EvidenciaIngreso
          observaciones={observacionesIngreso}
          setObservaciones={setObservacionesIngreso}
          fotos={fotosIngreso}
          setFotos={setFotosIngreso}
        />

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
