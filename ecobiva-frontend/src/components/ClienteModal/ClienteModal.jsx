import "./ClienteModal.css";

import { useEffect, useState } from "react";

import Button from "../Button/Button";

import Input from "../Input/Input";

export default function ClienteModal({

    open,

    clienteEditar,

    onClose,

    onSave

}){

    const [cliente,setCliente]=useState({

        nombre:"",

        documento:"",

        correo:"",

        telefono:"",

        direccion:"",

        preferenciaNotificacion:"Correo"

    });

    const [errores,setErrores]=useState({});

    useEffect(() => {
        if (!open) return;

        if (clienteEditar) {
            setCliente({
                nombre: clienteEditar.nombre || "",
                documento: clienteEditar.documento || "",
                correo: clienteEditar.correo || "",
                telefono: clienteEditar.telefono || "",
                direccion: clienteEditar.direccion || "",
                preferenciaNotificacion: clienteEditar.preferenciaNotificacion || "Correo"
            });
            setErrores({});
            return;
        }

        setCliente({
            nombre:"",
            documento:"",
            correo:"",
            telefono:"",
            direccion:"",
            preferenciaNotificacion:"Correo"
        });
        setErrores({});
    }, [open, clienteEditar]);

    if(!open) return null;

    const validar=async ()=>{

        let nuevo={};

        if(cliente.nombre.trim()==="")
            nuevo.nombre="Ingrese el nombre.";

        if(cliente.documento.trim()==="")
            nuevo.documento="Ingrese el documento.";

        if(cliente.telefono.trim()==="")
            nuevo.telefono="Ingrese el teléfono.";

        if(cliente.correo.trim()==="")
            nuevo.correo="Ingrese el correo.";
        else if(
            !/\S+@\S+\.\S+/.test(cliente.correo)
        )
            nuevo.correo="Correo inválido.";

        setErrores(nuevo);

        if (Object.keys(nuevo).length > 0) return;

        if (onSave) {
            await onSave(cliente);
        }

        onClose();
    }

    return(

        <div className="modalOverlay">

            <div className="clienteModal">

                <div className="modalHeader">

                    <h2>

                        {clienteEditar ? "Editar Cliente" : "Registrar Cliente"}

                    </h2>

                </div>

                <div className="modalBody">

                    <Input

                        label="Nombre Completo"

                        required

                        value={cliente.nombre}

                        error={errores.nombre}

                        onChange={(e)=>

                            setCliente({

                                ...cliente,

                                nombre:e.target.value

                            })

                        }

                    />

                    <Input

                        label="Documento"

                        required

                        value={cliente.documento}

                        error={errores.documento}

                        onChange={(e)=>

                            setCliente({

                                ...cliente,

                                documento:e.target.value

                            })

                        }

                    />

                    <Input

                        label="Correo"

                        required

                        value={cliente.correo}

                        error={errores.correo}

                        onChange={(e)=>

                            setCliente({

                                ...cliente,

                                correo:e.target.value

                            })

                        }

                    />

                    <Input

                        label="Teléfono"

                        required

                        value={cliente.telefono}

                        error={errores.telefono}

                        onChange={(e)=>

                            setCliente({

                                ...cliente,

                                telefono:e.target.value

                            })

                        }

                    />

                    <Input

                        label="Dirección"

                        value={cliente.direccion}

                        onChange={(e)=>

                            setCliente({

                                ...cliente,

                                direccion:e.target.value

                            })

                        }

                    />

                    <Input
                        label="Preferencia de notificación"
                        value={cliente.preferenciaNotificacion}
                        onChange={(e) =>
                            setCliente({
                                ...cliente,
                                preferenciaNotificacion: e.target.value
                            })
                        }
                    />

                </div>

                <div className="modalFooter">

                    <Button

                        variant="secondary"

                        onClick={onClose}

                    >

                        Cancelar

                    </Button>

                    <Button

                        variant="primary"

                        onClick={validar}

                    >

                        Guardar

                    </Button>

                </div>

            </div>

        </div>

    )

}