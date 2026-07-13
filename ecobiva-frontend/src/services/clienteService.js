import api from "../api/api";

// Obtener todos
export const obtenerClientes = async () => {

    const { data } = await api.get("/clientes");

    return data;

};

// Obtener uno
export const obtenerCliente = async (id) => {

    const { data } = await api.get(`/clientes/${id}`);

    return data;

};

// Crear
export const crearCliente = async (cliente) => {

    const { data } = await api.post("/clientes", cliente);

    return data;

};

// Actualizar
export const actualizarCliente = async (id, cliente) => {

    const { data } = await api.put(`/clientes/${id}`, cliente);

    return data;

};

// Eliminar permanentemente
export const eliminarCliente = async (id) => {

    const { data } = await api.delete(`/clientes/${id}`);

    return data;

};