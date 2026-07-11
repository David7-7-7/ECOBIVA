import { perfilApi } from "../api/api";

export async function cambiarPassword(passwordActual, nuevaPassword) {

    const { data } = await perfilApi.cambiarPassword(

        passwordActual,

        nuevaPassword

    );

    return data;

}