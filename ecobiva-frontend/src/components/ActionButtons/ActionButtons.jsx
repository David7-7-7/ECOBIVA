import "./ActionButtons.css";

import { FaEye, FaEdit, FaTrash } from "react-icons/fa";

export default function ActionButtons({
  onView,

  onEdit,

  onDelete,
}) {
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
        <button className="accion eliminar" onClick={onDelete} title="Eliminar">
          <FaTrash />
        </button>
      )}
    </div>
  );
}
