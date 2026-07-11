import { authApi } from "../api/api";

export async function login(correo, password) {
    const { data } = await authApi.login(correo, password);
    return data;
}

export async function obtenerPreguntas(correo) {
    const { data } = await authApi.preguntasDeUsuario(correo);
    return data;
}

export async function validarPreguntas(correo, respuestas) {
    const { data } = await authApi.validarPreguntas(
        correo,
        respuestas
    );

    return data;
}

export async function resetPassword(token, nuevaPassword) {
    const { data } = await authApi.resetPassword(
        token,
        nuevaPassword
    );

    return data;
}

export async function obtenerCatalogoPreguntas() {
    const { data } = await authApi.catalogoPreguntas();
    return data;
}

export async function configurarPreguntas(payload) {
    const { data } = await authApi.configurarPreguntas(payload);
    return data;
}