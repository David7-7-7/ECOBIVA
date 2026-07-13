import { useEffect, useState } from "react";

import Modal from "../Modal/Modal";
import Button from "../Button/Button";
import Input from "../Input/Input";

import { obtenerCatalogoPreguntas } from "../../services/authService";

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
    { idPregunta: "", respuesta: "" },
    { idPregunta: "", respuesta: "" },
    { idPregunta: "", respuesta: "" },
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
  const [catalogoPreguntas, setCatalogoPreguntas] = useState([]);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!open) return;

    obtenerCatalogoPreguntas()
      .then(setCatalogoPreguntas)
      .catch(() => setCatalogoPreguntas([]));

    if (editando && usuario) {
      setForm({
        ...VACIO,
        correo: usuario.correo || "",
        nombreRol: Array.isArray(usuario.roles) ? usuario.roles[0] || "" : "",
      });
    } else {
      setForm(VACIO);
    }

    setError("");
  }, [open, usuario, editando]);

  if (!open) return null;

  function cambiarPregunta(index, campo, valor) {
    const preguntas = form.preguntas.map((p, i) =>
      i === index ? { ...p, [campo]: valor } : p,
    );
    setForm({ ...form, preguntas });
  }

  function preguntasDisponiblesPara(index) {
    const elegidasEnOtrosCampos = form.preguntas
      .filter((_, i) => i !== index)
      .map((p) => String(p.idPregunta))
      .filter(Boolean);

    return catalogoPreguntas.filter(
      (p) => !elegidasEnOtrosCampos.includes(String(p.idPregunta)),
    );
  }

  async function submit(e) {
    e.preventDefault();
    setError("");

    if (!editando) {
      const idsElegidos = form.preguntas.map((p) => p.idPregunta);
      const hayVacias = form.preguntas.some(
        (p) => !p.idPregunta || !p.respuesta.trim(),
      );
      const hayDuplicadas = new Set(idsElegidos).size !== idsElegidos.length;

      if (hayVacias) {
        setError("Debes elegir y responder las 3 preguntas de seguridad.");
        return;
      }
      if (hayDuplicadas) {
        setError("No puedes elegir la misma pregunta de seguridad dos veces.");
        return;
      }
    }

    setGuardando(true);
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo guardar el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal
      open={open}
      title={editando ? "Editar Usuario" : "Nuevo Usuario"}
      onClose={onClose}
    >
      {error && <div className="alert alert-error">{error}</div>}

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

        {!editando &&
          form.preguntas.map((pregunta, index) => (
            <div className="preguntaSeguridad" key={index}>
              <div className="inputGroup">
                <label>Pregunta de seguridad {index + 1}</label>

                <select
                  required
                  value={pregunta.idPregunta}
                  onChange={(e) =>
                    cambiarPregunta(index, "idPregunta", e.target.value)
                  }
                >
                  <option value="">Seleccione una pregunta...</option>

                  {preguntasDisponiblesPara(index).map((p) => (
                    <option key={p.idPregunta} value={p.idPregunta}>
                      {p.textoPregunta}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Respuesta"
                required
                value={pregunta.respuesta}
                onChange={(e) =>
                  cambiarPregunta(index, "respuesta", e.target.value)
                }
              />
            </div>
          ))}

        <div className="usuarioButtons">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>

          <Button type="submit" disabled={guardando}>
            {guardando
              ? "Guardando..."
              : editando
                ? "Guardar Cambios"
                : "Crear Usuario"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
