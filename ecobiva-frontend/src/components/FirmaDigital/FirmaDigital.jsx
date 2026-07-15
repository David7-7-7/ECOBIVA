import { useRef, useState } from "react";
import "./FirmaDigital.css";

export default function FirmaDigital({
  onFirmaCapturada,
  onCancel,
  mostrarTerminos,
  textoTerminos
}) {
  const canvasRef = useRef(null);
  const [firmado, setFirmado] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [terminosAceptados, setTerminosAceptados] = useState(false);

  const iniciarDibujo = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    const ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const dibujar = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext("2d");
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const detenerDibujo = () => {
    setIsDrawing(false);
    setFirmado(true);
  };

  const limpiar = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setFirmado(false);
  };

  const enviar = () => {
    if (!firmado) {
      alert("Por favor, dibuja tu firma antes de continuar");
      return;
    }

    if (mostrarTerminos && !terminosAceptados) {
      alert("Debes aceptar los términos de garantía");
      return;
    }

    const canvas = canvasRef.current;
    const imagenFirma = canvas.toDataURL("image/png");

    onFirmaCapturada({
      imagenFirma,
      metodoCaptura: "canvas_cliente",
      terminosAceptados
    });
  };

  return (
    <div className="firmaDigitalModal">
      <div className="firmaDigitalContainer">
        <h2>Captura de firma digital</h2>

        <p className="instrucciones">
          Dibuja tu firma en el recuadro a continuación
        </p>

        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="firmaCanvas"
          onMouseDown={iniciarDibujo}
          onMouseMove={dibujar}
          onMouseUp={detenerDibujo}
          onMouseLeave={detenerDibujo}
        />

        <div className="botonesLimpiar">
          <button
            className="btnLimpiar"
            onClick={limpiar}
            disabled={!firmado}
          >
            Limpiar
          </button>
        </div>

        {mostrarTerminos && (
          <div className="terminosGarantia">
            <div className="contenidoTerminos">
              {textoTerminos && (
                <div className="textoLegal">
                  {textoTerminos}
                </div>
              )}
            </div>

            <div className="checkboxTerminos">
              <input
                type="checkbox"
                id="aceptoTerminos"
                checked={terminosAceptados}
                onChange={(e) => setTerminosAceptados(e.target.checked)}
              />
              <label htmlFor="aceptoTerminos">
                Acepto los términos y condiciones de garantía
              </label>
            </div>
          </div>
        )}

        <div className="botonesAccion">
          <button
            className="btnCancelar"
            onClick={onCancel}
          >
            Cancelar
          </button>
          <button
            className="btnEnviar"
            onClick={enviar}
            disabled={!firmado || (mostrarTerminos && !terminosAceptados)}
          >
            Enviar firma
          </button>
        </div>
      </div>
    </div>
  );
}
