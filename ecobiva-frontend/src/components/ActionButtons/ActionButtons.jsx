import "./ActionButtons.css";

import { FaEye, FaEdit, FaTrash, FaUndoAlt } from "react-icons/fa";

export default function ActionButtons({ onView, onEdit, onDelete, onRestore }) {
  return (
    <div className="actionButtons">
      {onView && (
        <button className="accion ver" onClick={onView} title="Ver">
          <FaEye />
        </button>
      )}

      {onEdit && (
        <button className="accion editar" onClick={onEdit} title="Editar">
          <FaEdit />
        </button>
      )}

      {onDelete && (
        <button
          className="accion eliminar"
          onClick={onDelete}
          title="Desactivar"
        >
          <FaTrash />
        </button>
      )}

      {onRestore && (
        <button
          className="accion restaurar"
          onClick={onRestore}
          title="Reactivar"
        >
          <FaUndoAlt />
        </button>
      )}
    </div>
  );
}
