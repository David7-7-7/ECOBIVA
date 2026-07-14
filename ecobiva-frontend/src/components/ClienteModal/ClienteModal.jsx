import "./ClienteModal.css";

import { useEffect, useState } from "react";

import Button from "../Button/Button";
import Input from "../Input/Input";

export default function ClienteModal({ open, clienteEditar, onClose, onSave }) {
  const [cliente, setCliente] = useState({
    tipoDocumento: "CC",
    nombre: "",
    documento: "",
    correo: "",
    telefono: "",
    ciudad: "",
    direccion: "",
    tipoComunicacion: "Correo",
  });

  const [errores, setErrores] = useState({});

  useEffect(() => {
    if (!open) return;

    if (clienteEditar) {
      setCliente({
        tipoDocumento: clienteEditar.tipoDocumento || "CC",
        nombre: clienteEditar.nombre || "",
        documento: clienteEditar.documento || "",
        correo: clienteEditar.correo || "",
        telefono: clienteEditar.telefono || "",
        ciudad: clienteEditar.ciudad || "",
        direccion: clienteEditar.direccion || "",
        tipoComunicacion: clienteEditar.tipoComunicacion || "Correo",
      });

      setErrores({});
      return;
    }

    setCliente({
      tipoDocumento: "CC",
      nombre: "",
      documento: "",
      correo: "",
      telefono: "",
      ciudad: "",
      direccion: "",
      tipoComunicacion: "Correo",
    });

    setErrores({});
  }, [open, clienteEditar]);

  if (!open) return null;

  const validar = async () => {
    const nuevo = {};

    if (cliente.nombre.trim() === "") nuevo.nombre = "Ingrese el nombre.";

    if (cliente.documento.trim() === "")
      nuevo.documento = "Ingrese el documento.";

    if (cliente.telefono.trim() === "") nuevo.telefono = "Ingrese el teléfono.";

    if (cliente.correo.trim() === "") nuevo.correo = "Ingrese el correo.";
    else if (!/\S+@\S+\.\S+/.test(cliente.correo))
      nuevo.correo = "Correo inválido.";

    if (cliente.ciudad.trim() === "") nuevo.ciudad = "Ingrese la ciudad.";

    if (cliente.direccion.trim() === "")
      nuevo.direccion = "Ingrese la dirección.";

    setErrores(nuevo);

    if (Object.keys(nuevo).length > 0) return;

    await onSave(cliente);

    onClose();
  };

  return (
    <div className="modalOverlay">
      <div className="clienteModal">
        <div className="modalHeader">
          <h2>{clienteEditar ? "Editar Cliente" : "Registrar Cliente"}</h2>
        </div>

        <div className="modalBody">
          <label>Tipo de documento</label>

          <select
            value={cliente.tipoDocumento}
            onChange={(e) =>
              setCliente({
                ...cliente,
                tipoDocumento: e.target.value,
              })
            }
          >
            <option value="CC">Cédula de ciudadanía</option>
            <option value="CE">Cédula de extranjería</option>
            <option value="TI">Tarjeta de identidad</option>
            <option value="NIT">NIT</option>
            <option value="PAS">Pasaporte</option>
          </select>

          <Input
            label="Documento"
            required
            value={cliente.documento}
            error={errores.documento}
            onChange={(e) =>
              setCliente({
                ...cliente,
                documento: e.target.value,
              })
            }
          />

          <Input
            label="Nombre Completo"
            required
            value={cliente.nombre}
            error={errores.nombre}
            onChange={(e) =>
              setCliente({
                ...cliente,
                nombre: e.target.value,
              })
            }
          />

          <Input
            label="Correo"
            required
            value={cliente.correo}
            error={errores.correo}
            onChange={(e) =>
              setCliente({
                ...cliente,
                correo: e.target.value,
              })
            }
          />

          <Input
            label="Teléfono"
            required
            value={cliente.telefono}
            error={errores.telefono}
            onChange={(e) =>
              setCliente({
                ...cliente,
                telefono: e.target.value,
              })
            }
          />

          <Input
            label="Ciudad"
            value={cliente.ciudad}
            error={errores.ciudad}
            onChange={(e) =>
              setCliente({
                ...cliente,
                ciudad: e.target.value,
              })
            }
          />

          <Input
            label="Dirección"
            value={cliente.direccion}
            error={errores.direccion}
            onChange={(e) =>
              setCliente({
                ...cliente,
                direccion: e.target.value,
              })
            }
          />

          <label>Tipo de comunicación</label>

          <select
            value={cliente.tipoComunicacion}
            onChange={(e) =>
              setCliente({
                ...cliente,
                tipoComunicacion: e.target.value,
              })
            }
          >
            <option value="Correo">Correo electrónico</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Llamada">Llamada</option>
          </select>
        </div>

        <div className="modalFooter">
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
