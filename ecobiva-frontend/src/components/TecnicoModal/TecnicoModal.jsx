import "./TecnicoModal.css";

import Modal from "../Modal/Modal";
import TecnicoModal from "../../components/TecnicoModal/TecnicoModal";

const [abrirModal, setAbrirModal] = useState(false);

export default function TecnicoModal({ open, onClose }) {

    if (!open) return null;

    return (

        <Modal
            open={open}
            onClose={onClose}
            title="Nuevo Técnico"
        >

            <form className="tecnicoForm">

                <div className="formGrid">

                    <div>

                        <label>Documento</label>

                        <input type="text" />

                    </div>

                    <div>

                        <label>Nombre</label>

                        <input type="text" />

                    </div>

                    <div>

                        <label>Teléfono</label>

                        <input type="text" />

                    </div>

                    <div>

                        <label>Correo</label>

                        <input type="email" />

                    </div>

                    <div>

                        <label>Especialidad</label>

                        <select>

                            <option>Motor</option>

                            <option>Electricidad</option>

                            <option>Suspensión</option>

                            <option>Diagnóstico</option>

                        </select>

                    </div>

                    <div>

                        <label>Experiencia</label>

                        <input
                            type="text"
                            placeholder="Ej: 5 años"
                        />

                    </div>

                </div>

                <div className="modalActions">

                    <button
                        type="button"
                        className="btnCancelar"
                        onClick={onClose}
                    >

                        Cancelar

                    </button>

                    <button
                        type="submit"
                        className="btnGuardar"
                    >

                        Guardar

                    </button>

                </div>

            </form>

        </Modal>

    );

}