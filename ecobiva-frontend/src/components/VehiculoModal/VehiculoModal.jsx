import "./VehiculoModal.css";

import { useEffect, useState } from "react";

import Button from "../Button/Button";
import Input from "../Input/Input";
import { obtenerClientes } from "../../services/clienteService";

export default function VehiculoModal({
  open,
  vehiculoEditar,
  onClose,
  onSave,
}) {
  const [vehiculo, setVehiculo] = useState({
    placa: "",
    marca: "",
    modelo: "",
    anio: "",
    color: "",
    kilometraje: "",
    tipoVehiculo: "",
    idCliente: "",
  });

  const [clientes, setClientes] = useState([]);
  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!open) return;

    const cargarClientes = async () => {
      try {
        const data = await obtenerClientes();
        setClientes(data);
      } catch (error) {
        console.error(error);
      }
    };

    cargarClientes();

    if (vehiculoEditar) {
      setVehiculo({
        placa: vehiculoEditar.placa || "",
        marca: vehiculoEditar.marca || "",
        modelo: vehiculoEditar.modelo || "",
        anio: vehiculoEditar.anio || "",
        color: vehiculoEditar.color || "",
        kilometraje: vehiculoEditar.kilometraje || "",
        tipoVehiculo: vehiculoEditar.tipoVehiculo || "",
        idCliente: vehiculoEditar.idCliente || "",
      });

      setErrores({});
      return;
    }

    setVehiculo({
      placa: "",
      marca: "",
      modelo: "",
      anio: "",
      color: "",
      kilometraje: "",
      tipoVehiculo: "",
      idCliente: "",
    });

    setErrores({});
  }, [open, vehiculoEditar]);

  if (!open) return null;

  const validar = async () => {
    const nuevo = {};

    if (!vehiculo.placa.trim()) {
      nuevo.placa = "Ingrese la placa.";
    }

    if (!vehiculo.marca.trim()) {
      nuevo.marca = "Ingrese la marca.";
    }

    if (!vehiculo.modelo.trim()) {
      nuevo.modelo = "Ingrese el modelo.";
    }

    if (!vehiculo.idCliente) {
      nuevo.idCliente = "Seleccione un cliente.";
    }

    setErrores(nuevo);

    if (Object.keys(nuevo).length > 0) return;

    if (onSave) {
      await onSave(vehiculo);
    }

    onClose();
  };

  return (
    <div className="modalOverlay">
      <div className="vehiculoModal">
        <div className="vehiculoHeader">
          <h2>{vehiculoEditar ? "Editar Vehículo" : "Registrar Vehículo"}</h2>
        </div>

        <div className="vehiculoBody">
          <Input
            label="Placa"
            required
            value={vehiculo.placa}
            error={errores.placa}
            onChange={(e) =>
              setVehiculo({
                ...vehiculo,
                placa: e.target.value,
              })
            }
          />

          <Input
            label="Marca"
            required
            value={vehiculo.marca}
            error={errores.marca}
            onChange={(e) =>
              setVehiculo({
                ...vehiculo,
                marca: e.target.value,
              })
            }
          />

          <Input
            label="Modelo"
            required
            value={vehiculo.modelo}
            error={errores.modelo}
            onChange={(e) =>
              setVehiculo({
                ...vehiculo,
                modelo: e.target.value,
              })
            }
          />

          <Input
            label="Año"
            type="number"
            value={vehiculo.anio}
            onChange={(e) =>
              setVehiculo({
                ...vehiculo,
                anio: e.target.value,
              })
            }
          />

          <Input
            label="Color"
            value={vehiculo.color}
            onChange={(e) =>
              setVehiculo({
                ...vehiculo,
                color: e.target.value,
              })
            }
          />

          <Input
            label="Kilometraje"
            type="number"
            value={vehiculo.kilometraje}
            onChange={(e) =>
              setVehiculo({
                ...vehiculo,
                kilometraje: e.target.value,
              })
            }
          />

          <Input
            label="Tipo de Vehículo"
            value={vehiculo.tipoVehiculo}
            onChange={(e) =>
              setVehiculo({
                ...vehiculo,
                tipoVehiculo: e.target.value,
              })
            }
          />

          <div className="inputGroup">
            <label>
              Cliente <span>*</span>
            </label>

            <select
              value={vehiculo.idCliente}
              onChange={(e) =>
                setVehiculo({
                  ...vehiculo,
                  idCliente: Number(e.target.value),
                })
              }
            >
              <option value="">Seleccione un cliente</option>

              {clientes.map((cliente) => (
                <option key={cliente.idCliente} value={cliente.idCliente}>
                  {cliente.nombre} ({cliente.documento})
                </option>
              ))}
            </select>

            {errores.idCliente && (
              <p className="inputError">{errores.idCliente}</p>
            )}
          </div>
        </div>

        <div className="vehiculoFooter">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button variant="primary" onClick={validar}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
