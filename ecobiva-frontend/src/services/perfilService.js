import { perfilApi } from "../api/api";

export async function cambiarPassword(passwordActual, nuevaPassword) {

    const { data } = await perfilApi.cambiarPassword(

        passwordActual,

        nuevaPassword

    );

    return data;

}

export async function obtenerMiPerfil() {
    const { data } = await perfilApi.miPerfil();
    return data;
}

export async function actualizarMiPerfil(telefono, correo) {
    const { data } = await perfilApi.actualizarMiPerfil(telefono, correo);
    return data;
}