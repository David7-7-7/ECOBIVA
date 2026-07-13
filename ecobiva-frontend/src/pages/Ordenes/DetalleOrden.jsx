import "./DetalleOrden.css";

import MainLayout from "../../layouts/MainLayout";

import { FaArrowLeft, FaPrint, FaEdit } from "react-icons/fa";

export default function DetalleOrden() {
  return (
    <MainLayout>
      <div className="detalleHeader">
        <div>
          <h1>Orden #0001</h1>

          <p>Detalle completo de la Orden de Servicio.</p>
        </div>

        <div className="accionesHeader">
          <button className="btnSecundario">
            <FaArrowLeft />
            Volver
          </button>

          <button className="btnEditar">
            <FaEdit />
            Editar
          </button>

          <button className="btnImprimir">
            <FaPrint />
            Imprimir
          </button>
        </div>
      </div>

      <div className="detalleGrid">
        <div className="detalleCard">
          <h2>Información del Cliente</h2>

          <p>
            <strong>Nombre:</strong> Juan Pérez
          </p>

          <p>
            <strong>Documento:</strong> 1012456789
          </p>

          <p>
            <strong>Teléfono:</strong> 3204567890
          </p>

          <p>
            <strong>Correo:</strong> juan@email.com
          </p>
        </div>

        <div className="detalleCard">
          <h2>Información del Vehículo</h2>

          <p>
            <strong>Placa:</strong> ABC123
          </p>

          <p>
            <strong>Marca:</strong> Mazda
          </p>

          <p>
            <strong>Modelo:</strong> CX-5
          </p>

          <p>
            <strong>Color:</strong> Blanco
          </p>

          <p>
            <strong>Kilometraje:</strong> 85.200 Km
          </p>
        </div>

        <div className="detalleCard">
          <h2>Información de la Orden</h2>

          <p>
            <strong>Tecnico:</strong> Carlos Ramírez
          </p>

          <p>
            <strong>Estado:</strong> En Proceso
          </p>

          <p>
            <strong>Prioridad:</strong> Alta
          </p>

          <p>
            <strong>Fecha:</strong> 09/07/2026
          </p>
        </div>

        <div className="detalleCard">
          <h2>Diagnóstico</h2>

          <p>
            El vehículo presenta desgaste en las pastillas de freno delanteras y
            requiere cambio de aceite del motor.
          </p>
        </div>

        <div className="detalleCard">
          <h2>Servicios Realizados</h2>

          <ul>
            <li>Cambio de aceite.</li>

            <li>Revisión de suspensión.</li>

            <li>Cambio de pastillas de freno.</li>

            <li>Balanceo.</li>
          </ul>
        </div>

        <div className="detalleCard">
          <h2>Observaciones</h2>

          <p>Se recomienda realizar alineación en el próximo mantenimiento.</p>
        </div>
      </div>
    </MainLayout>
  );
}
