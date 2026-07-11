import { createContext, useContext, useEffect, useState } from "react";

import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

    const [token, setToken] = useState(() =>
        localStorage.getItem("ecobiva_token")
    );

    const [usuario, setUsuario] = useState(() => {

        const guardado = localStorage.getItem("ecobiva_usuario");

        return guardado ? JSON.parse(guardado) : null;

    });

    const [cargando, setCargando] = useState(false);

    useEffect(() => {

        if (token) {

            localStorage.setItem(
                "ecobiva_token",
                token
            );

        } else {

            localStorage.removeItem(
                "ecobiva_token"
            );

        }

    }, [token]);

    useEffect(() => {

        if (usuario) {

            localStorage.setItem(
                "ecobiva_usuario",
                JSON.stringify(usuario)
            );

        } else {

            localStorage.removeItem(
                "ecobiva_usuario"
            );

        }

    }, [usuario]);

    async function login(correo, password) {

        setCargando(true);

        try {

            const data = await authService.login(
                correo,
                password
            );

            const nuevoUsuario = data.usuario || {

                idUsuario: data.idUsuario,

                correo: data.correo,

                roles: data.roles || []

            };

            setToken(data.token);

            setUsuario(nuevoUsuario);

            return {

                ok: true

            };

        } catch (err) {

            return {

                ok: false,

                mensaje:
                    err.response?.data?.error ||
                    "No se pudo iniciar sesión"

            };

        } finally {

            setCargando(false);

        }

    }

    function logout() {

        setToken(null);

        setUsuario(null);

    }

    const nombresRoles =

        (usuario?.roles || []).map(

            (rol) => rol.nombreRol

        );

    function tieneAlgunRol(rolesPermitidos) {

        return rolesPermitidos.some(

            (rol) => nombresRoles.includes(rol)

        );

    }

    const value = {

        token,

        usuario,

        cargando,

        login,

        logout,

        estaAutenticado: !!token,

        nombresRoles,

        tieneAlgunRol

    };

    return (

        <AuthContext.Provider value={value}>

            {children}

        </AuthContext.Provider>

    );

}

export function useAuth() {

    const contexto = useContext(AuthContext);

    if (!contexto) {

        throw new Error(

            "useAuth debe utilizarse dentro de AuthProvider"

        );

    }

    return contexto;

}