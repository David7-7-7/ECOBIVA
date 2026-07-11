import "./EmptyState.css";
import { FaInbox } from "react-icons/fa";

export default function EmptyState({
  title = "No hay registros",
  message = "Todavía no existe información para mostrar.",
  button,
}) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">
        <FaInbox />
      </div>

      <h2>{title}</h2>

      <p>{message}</p>

      {button}
    </div>
  );
}
