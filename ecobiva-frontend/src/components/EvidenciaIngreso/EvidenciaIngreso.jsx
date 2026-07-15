import { useRef } from "react";
import "./EvidenciaIngreso.css";

export default function EvidenciaIngreso({
    observaciones,
    setObservaciones,
    fotos,
    setFotos
}) {

    const inputRef = useRef();

    const agregarFotos = (event) => {

        const archivos = Array.from(event.target.files);

        const nuevas = archivos.map((archivo) => ({

            archivo,

            preview: URL.createObjectURL(archivo)

        }));

        setFotos((prev) => [...prev, ...nuevas]);

        event.target.value = "";

    };

    const eliminarFoto = (indice) => {

        setFotos((prev)=>{

            URL.revokeObjectURL(prev[indice].preview);

            return prev.filter((_,i)=>i!==indice);

        });

    };

    return (

        <div className="evidenciaIngreso">

            <h3>Evidencia de ingreso</h3>

            <div className="inputGroup">

                <label>

                    Observaciones del ingreso

                </label>

                <textarea

                    rows={4}

                    value={observaciones}

                    onChange={(e)=>setObservaciones(e.target.value)}

                    placeholder="Describa golpes, rayones, accesorios, estado general del vehículo..."

                />

            </div>

            <div className="inputGroup">

                <label>

                    Fotografías

                </label>

                <input

                    ref={inputRef}

                    type="file"

                    accept="image/*"

                    multiple

                    onChange={agregarFotos}

                />

            </div>

            {

                fotos.length>0 && (

                    <div className="galeriaEvidencias">

                        {

                            fotos.map((foto,index)=>(

                                <div
                                    key={index}
                                    className="fotoPreview"
                                >

                                    <img

                                        src={foto.preview}

                                        alt="evidencia"

                                    />

                                    <button

                                        type="button"

                                        onClick={()=>eliminarFoto(index)}

                                    >

                                        ✕

                                    </button>

                                </div>

                            ))

                        }

                    </div>

                )

            }

        </div>

    );

}