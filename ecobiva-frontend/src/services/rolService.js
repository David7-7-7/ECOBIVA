import { rolesApi } from "../api/api";

export async function listarRoles() {

    const { data } = await rolesApi.listar();

    return data;

}