import "./Modal.css";
import { FaTimes } from "react-icons/fa";

export default function Modal({
  open,
  title,
  children,
  onClose,
  width = "550px",
}) {
  if (!open) return null;

  return (
    <div className="modalOverlay" onClick={onClose}>
      <div
        className="modalContainer"
        style={{ maxWidth: width }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modalHeader">
          <h2>{title}</h2>

          <button className="modalClose" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
