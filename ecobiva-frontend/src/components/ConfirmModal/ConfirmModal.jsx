import "./ConfirmModal.css";

import { FaExclamationTriangle } from "react-icons/fa";

export default function ConfirmModal({

    open,

    title,

    message,

    onClose,

    onConfirm

}) {

    if (!open) return null;

    return (

        <div className="confirmOverlay">

            <div className="confirmModal">

                <div className="confirmIcon">

                    <FaExclamationTriangle />

                </div>

                <h2>{title}</h2>

                <p>{message}</p>

                <div className="confirmButtons">

                    <button
                        className="btnCancelar"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>

                    <button
                        className="btnEliminar"
                        onClick={onConfirm}
                    >
                        Eliminar
                    </button>

                </div>

            </div>

        </div>

    );

}