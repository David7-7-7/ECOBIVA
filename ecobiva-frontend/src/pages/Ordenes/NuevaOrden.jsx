import "./NuevaOrden.css";

import MainLayout from "../../layouts/MainLayout";

import { FaSave, FaArrowLeft } from "react-icons/fa";

export default function NuevaOrden() {
  return (
    <MainLayout>
      <div className="ordenTop">
        <div>
          <h1>Nueva Orden de Servicio</h1>

          <p>Registrar una nueva orden de trabajo.</p>
        </div>
      </div>

      <form className="ordenForm">
        <div className="cardOrden">
          <h2>Información del Cliente</h2>

          <div className="grid2">
            <div>
              <label>Cliente</label>

              <select>
                <option>Seleccione...</option>
              </select>
            </div>

            <div>
              <label>Documento</label>

              <input type="text" placeholder="Documento" />
            </div>

            <div>
              <label>Teléfono</label>

              <input type="text" placeholder="Teléfono" />
            </div>

            <div>
              <label>Correo</label>

              <input type="email" placeholder="Correo" />
            </div>
          </div>
        </div>

        <div className="cardOrden">
          <h2>Información del Vehículo</h2>

          <div className="grid2">
            <div>
              <label>Vehículo</label>

              <select>
                <option>Seleccione...</option>
              </select>
            </div>

            <div>
              <label>Placa</label>

              <input type="text" placeholder="ABC123" />
            </div>

            <div>
              <label>Marca</label>

              <input type="text" />
            </div>

            <div>
              <label>Modelo</label>

              <input type="text" />
            </div>

            <div>
              <label>Kilometraje</label>

              <input type="number" />
            </div>

            <div>
              <label>Color</label>

              <input type="text" />
            </div>
          </div>
        </div>

        <div className="cardOrden">
          <h2>Información de la Orden</h2>

          <div className="grid2">
            <div>
              <label>Tecnico</label>

              <select>
                <option>Seleccione...</option>
              </select>
            </div>

            <div>
              <label>Prioridad</label>

              <select>
                <option>Baja</option>

                <option>Media</option>

                <option>Alta</option>
              </select>
            </div>

            <div>
              <label>Estado</label>

              <select>
                <option>Pendiente</option>

                <option>En proceso</option>

                <option>Finalizada</option>
              </select>
            </div>

            <div>
              <label>Fecha</label>

              <input type="date" />
            </div>
          </div>
        </div>

        <div className="cardOrden">
          <h2>Diagnóstico</h2>

          <textarea rows="5" placeholder="Ingrese el diagnóstico..." />
        </div>

        <div className="cardOrden">
          <h2>Observaciones</h2>

          <textarea rows="5" placeholder="Observaciones..." />
        </div>

        <div className="botonesOrden">
          <button type="button" className="btnCancelar">
            <FaArrowLeft />
            Cancelar
          </button>

          <button type="submit" className="btnGuardar">
            <FaSave />
            Guardar Orden
          </button>
        </div>
      </form>
    </MainLayout>
  );
}
