import "./VehiculoModal.css";

import { useState } from "react";

import Button from "../Button/Button";
import Input from "../Input/Input";

export default function VehiculoModal({ open, onClose }) {

    const [vehiculo, setVehiculo] = useState({

        placa: "",
        marca: "",
        modelo: "",
        anio: "",
        color: "",
        kilometraje: "",
        propietario: ""

    });

    const [errores, setErrores] = useState({});

    if (!open) return null;

    const validar = () => {

        let nuevo = {};

        if (vehiculo.placa === "")
            nuevo.placa = "Ingrese la placa.";

        if (vehiculo.marca === "")
            nuevo.marca = "Ingrese la marca.";

        if (vehiculo.modelo === "")
            nuevo.modelo = "Ingrese el modelo.";

        if (vehiculo.propietario === "")
            nuevo.propietario = "Seleccione un propietario.";

        setErrores(nuevo);

    };

    return (

        <div className="modalOverlay">

            <div className="vehiculoModal">

                <div className="vehiculoHeader">

                    <h2>Registrar Vehículo</h2>

                </div>

                <div className="vehiculoBody">

                    <Input
                        label="Placa"
                        required
                        value={vehiculo.placa}
                        error={errores.placa}
                        onChange={(e) =>
                            setVehiculo({
                                ...vehiculo,
                                placa: e.target.value
                            })
                        }
                    />

                    <Input
                        label="Marca"
                        required
                        value={vehiculo.marca}
                        error={errores.marca}
                        onChange={(e) =>
                            setVehiculo({
                                ...vehiculo,
                                marca: e.target.value
                            })
                        }
                    />

                    <Input
                        label="Modelo"
                        required
                        value={vehiculo.modelo}
                        error={errores.modelo}
                        onChange={(e) =>
                            setVehiculo({
                                ...vehiculo,
                                modelo: e.target.value
                            })
                        }
                    />

                    <Input
                        label="Año"
                        value={vehiculo.anio}
                        onChange={(e) =>
                            setVehiculo({
                                ...vehiculo,
                                anio: e.target.value
                            })
                        }
                    />

                    <Input
                        label="Color"
                        value={vehiculo.color}
                        onChange={(e) =>
                            setVehiculo({
                                ...vehiculo,
                                color: e.target.value
                            })
                        }
                    />

                    <Input
                        label="Kilometraje"
                        value={vehiculo.kilometraje}
                        onChange={(e) =>
                            setVehiculo({
                                ...vehiculo,
                                kilometraje: e.target.value
                            })
                        }
                    />

                    <Input
                        label="Propietario"
                        required
                        value={vehiculo.propietario}
                        error={errores.propietario}
                        onChange={(e) =>
                            setVehiculo({
                                ...vehiculo,
                                propietario: e.target.value
                            })
                        }
                    />

                </div>

                <div className="vehiculoFooter">

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

    );

}