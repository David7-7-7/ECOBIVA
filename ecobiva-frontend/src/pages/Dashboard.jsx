import { useAuth } from '../context/AuthContext.jsx';

const CONTENIDO_POR_ROL = {
  Admin: {
    eyebrow: 'Administrador del sistema',
    titulo: 'Acceso total',
    tarjetas: [
      { label: 'Usuarios', valor: 'Gestión completa', href: '/usuarios' },
      { label: 'Permisos (RBAC)', valor: 'Matriz por rol', href: '/permisos' },
      { label: 'Auditoría', valor: 'Trazabilidad de acciones', href: '/auditoria' }
    ]
  },
  Tecnico: {
    eyebrow: 'Encargado de diagnóstico y reparación',
    titulo: 'Módulo de taller',
    tarjetas: [
      { label: 'Diagnósticos', valor: 'Próximamente (Parte 2)' },
      { label: 'Órdenes asignadas', valor: 'Próximamente (Parte 2/3)' },
      { label: 'Inventario / kardex', valor: 'Próximamente (Parte 2)' }
    ]
  },
  Asesor: {
    eyebrow: 'Encargado de atención al cliente',
    titulo: 'Órdenes de servicio',
    tarjetas: [
      { label: 'Órdenes de servicio', valor: 'Próximamente (Parte 3)' },
      { label: 'Clientes', valor: 'Próximamente (Parte 3)' },
      { label: 'Garantías', valor: 'Próximamente (Sprint 3)' }
    ]
  }
};

// Si el usuario tiene varios roles activos a la vez, se muestra un bloque
// por cada uno (en vez de forzar a elegir solo el "principal").
export default function Dashboard() {
  const { nombresRoles } = useAuth();
  const roles = nombresRoles.length > 0 ? nombresRoles : ['Asesor'];

  return (
    <div>
      {roles.map((rol) => {
        const contenido = CONTENIDO_POR_ROL[rol] || CONTENIDO_POR_ROL.Asesor;
        return (
          <div key={rol} style={{ marginBottom: 28 }}>
            <div className="page-header">
              <div className="eyebrow">{contenido.eyebrow}</div>
              <h2>{contenido.titulo}</h2>
            </div>

            <div className="grid">
              {contenido.tarjetas.map((t) => (
                <div className="card stat-card" key={t.label}>
                  <div className="label">{t.label}</div>
                  <div className="value" style={{ fontSize: 15 }}>{t.valor}</div>
                  {t.href && <a className="btn btn-secondary" style={{ marginTop: 10 }} href={t.href}>Abrir</a>}
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <div className="card">
        <p style={{ margin: 0, color: 'var(--color-muted)' }}>
          Este dashboard muestra un bloque por cada rol activo que tengas asignado.
          Los módulos marcados "Próximamente" corresponden a Partes 2 y 3 del proyecto
          (backend/API y frontend de esos compañeros de equipo).
        </p>
      </div>
    </div>
  );
}
