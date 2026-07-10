import "./ClienteModal.css";

import { useState } from "react";

import Button from "../Button/Button";

import Input from "../Input/Input";

export default function ClienteModal({

    open,

    onClose

}){

    const [cliente,setCliente]=useState({

        nombre:"",

        documento:"",

        correo:"",

        telefono:"",

        direccion:""

    });

    const [errores,setErrores]=useState({});

    if(!open) return null;

    const validar=()=>{

        let nuevo={};

        if(cliente.nombre==="")

            nuevo.nombre="Ingrese el nombre.";

        if(cliente.documento==="")

            nuevo.documento="Ingrese el documento.";

        if(cliente.telefono==="")

            nuevo.telefono="Ingrese el teléfono.";

        if(cliente.correo==="")

            nuevo.correo="Ingrese el correo.";

        else if(

            !/\S+@\S+\.\S+/.test(cliente.correo)

        )

            nuevo.correo="Correo inválido.";

        setErrores(nuevo);

    }

    return(

        <div className="modalOverlay">

            <div className="clienteModal">

                <div className="modalHeader">

                    <h2>

                        Registrar Cliente

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