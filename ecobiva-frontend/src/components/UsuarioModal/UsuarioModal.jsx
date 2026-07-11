import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import Input from "../Input/Input";

import "./UsuarioModal.css";

const VACIO = {
  nombre: "",
  documento: "",
  correo: "",
  password: "",
  nombreRol: "",
  cargoActual: "",
  tarifaHora: "",
  preguntas: [
    { idPregunta: 1, respuesta: "" },
    { idPregunta: 2, respuesta: "" },
    { idPregunta: 4, respuesta: "" },
  ],
};

export default function UsuarioModal({
  open,
  onClose,
  onSave,
  roles = [],
  usuario,
  editando,
}) {
  const [form, setForm] = useState(VACIO);

  useEffect(() => {
    if (editando && usuario) {
      setForm({
        ...VACIO,
        correo: usuario.correo || "",
        nombreRol: usuario.roles?.[0] || "",
      });
    } else {
      setForm(VACIO);
    }
  }, [usuario, editando]);

  function cambiarPregunta(index, valor) {
    const preguntas = [...form.preguntas];
    preguntas[index].respuesta = valor;

    setForm({
      ...form,
      preguntas,
    });
  }

  function submit(e) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <Modal
      open={open}
      title={editando ? "Editar Usuario" : "Nuevo Usuario"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="usuarioForm">
        {!editando && (
          <>
            <Input
              label="Nombre"
              required
              value={form.nombre}
              onChange={(e) =>
                setForm({
                  ...form,
                  nombre: e.target.value,
                })
              }
            />

            <Input
              label="Documento"
              required
              value={form.documento}
              onChange={(e) =>
                setForm({
                  ...form,
                  documento: e.target.value,
                })
              }
            />
          </>
        )}

        <Input
          label="Correo"
          type="email"
          required
          value={form.correo}
          onChange={(e) =>
            setForm({
              ...form,
              correo: e.target.value,
            })
          }
        />

        {!editando && (
          <>
            <Input
              label="Contraseña"
              type="password"
              required
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
            />

            <Input
              label="Cargo"
              value={form.cargoActual}
              onChange={(e) =>
                setForm({
                  ...form,
                  cargoActual: e.target.value,
                })
              }
            />

            <Input
              label="Tarifa por hora"
              type="number"
              value={form.tarifaHora}
              onChange={(e) =>
                setForm({
                  ...form,
                  tarifaHora: Number(e.target.value),
                })
              }
            />
          </>
        )}

        <div className="inputGroup">
          <label>Rol</label>

          <select
            required
            value={form.nombreRol}
            onChange={(e) =>
              setForm({
                ...form,
                nombreRol: e.target.value,
              })
            }
          >
            <option value="">Seleccione...</option>

            {roles.map((rol) => (
              <option key={rol.idRol} value={rol.nombreRol}>
                {rol.nombreRol}
              </option>
            ))}
          </select>
        </div>

        {!editando && (
          <>
            <Input
              label="Pregunta de seguridad 1"
              required
              value={form.preguntas[0].respuesta}
              onChange={(e) => cambiarPregunta(0, e.target.value)}
            />

            <Input
              label="Pregunta de seguridad 2"
              required
              value={form.preguntas[1].respuesta}
              onChange={(e) => cambiarPregunta(1, e.target.value)}
            />

            <Input
              label="Pregunta de seguridad 3"
              required
              value={form.preguntas[2].respuesta}
              onChange={(e) => cambiarPregunta(2, e.target.value)}
            />
          </>
        )}

        <div className="usuarioButtons">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit">
            {editando ? "Guardar Cambios" : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
