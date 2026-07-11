import { permisosApi } from "../api/api";

export async function obtenerMisPermisos() {

    const { data } = await permisosApi.mios();

    return data;

}

export async function obtenerMatrizPermisos() {

    const { data } = await permisosApi.matriz();

    return data;

}

export async function obtenerCatalogoPermisos() {

    const { data } = await permisosApi.catalogo();

    return data;

}

export async function actualizarPermisos(cambios) {

    const { data } = await permisosApi.actualizar(cambios);

    return data;

}