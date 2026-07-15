import { useEffect, useState } from "react";
import { obtenerEvidenciasPorOrden } from "../../services/evidenciaService";
import "./EvidenciaIngreso.css";

export default function EvidenciasOrden({ idOrden }) {
  const [evidencias, setEvidencias] = useState([]);

  useEffect(() => {
    obtenerEvidenciasPorOrden(idOrden).then(setEvidencias).catch(console.error);
  }, [idOrden]);

  return (
    <section className="detailSection">
      <h3>Evidencia de ingreso</h3>
      {evidencias.length === 0 ? <p className="observaciones">Sin evidencias registradas.</p> : evidencias.map((evidencia) => (
        <div key={evidencia.idEvidencia} className="evidenciaIngreso">
          <p>{evidencia.observaciones || "Sin observaciones."}</p>
          <div className="galeriaEvidencias">
            {(evidencia.fotos || []).map((foto) => (
              <a key={foto.idFoto} href={`http://localhost:3000/uploads/evidencias/${foto.url}`} target="_blank" rel="noreferrer" className="fotoPreview">
                <img src={`http://localhost:3000/uploads/evidencias/${foto.url}`} alt="Evidencia de ingreso" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}
