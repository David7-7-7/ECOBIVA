import "./Dashboard.css";

import { useAuth } from "../../context/AuthContext";

const CONTENIDO_POR_ROL = {
  Admin: {
    eyebrow: "Administrador del sistema",

    titulo: "Acceso total",

    tarjetas: [
      {
        label: "Usuarios",
        valor: "Gestión completa",
        href: "/usuarios",
      },

      {
        label: "Permisos",
        valor: "RBAC",
      },

      {
        label: "Auditoría",
        valor: "Logs",
      },
    ],
  },

  Tecnico: {
    eyebrow: "Tecnico",

    titulo: "Módulo Taller",

    tarjetas: [
      {
        label: "Órdenes",
        valor: "Próximamente",
      },
    ],
  },

  Asesor: {
    eyebrow: "Asesor",

    titulo: "Atención",

    tarjetas: [
      {
        label: "Clientes",
        valor: "Próximamente",
      },
    ],
  },
};

export default function Dashboard() {
  const { nombresRoles } = useAuth();

  const roles = nombresRoles.length ? nombresRoles : ["Asesor"];

  return (
    <>
      {roles.map((rol) => {
        const contenido = CONTENIDO_POR_ROL[rol] ?? CONTENIDO_POR_ROL.Asesor;

        return (
          <div key={rol} style={{ marginBottom: 30 }}>
            <div className="page-header">
              <div className="eyebrow">{contenido.eyebrow}</div>

              <h2>{contenido.titulo}</h2>
            </div>

            <div className="grid">
              {contenido.tarjetas.map((card) => (
                <div key={card.label} className="card stat-card">
                  <div className="label">{card.label}</div>

                  <div className="value">{card.valor}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
