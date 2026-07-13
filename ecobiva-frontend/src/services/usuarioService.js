import { usuariosApi } from "../api/api";

export async function listarUsuarios() {
    const { data } = await usuariosApi.listar();
    return data;
}

export async function crearUsuario(payload) {
    const { data } = await usuariosApi.crear(payload);
    return data;
}

export async function editarUsuario(id, payload) {
    const { data } = await usuariosApi.editar(id, payload);
    return data;
}

export async function desactivarUsuario(id) {
    const { data } = await usuariosApi.desactivar(id);
    return data;
}

export async function activarUsuario(id) {
    const { data } = await usuariosApi.activar(id);
    return data;
}