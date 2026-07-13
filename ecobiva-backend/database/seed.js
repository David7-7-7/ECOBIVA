require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

// =============================================================================
// SEED IDEMPOTENTE — se puede correr las veces que sea (npm run dev lo dispara
// una sola vez al arrancar) sin duplicar filas ni romper datos ya existentes.
// Usa "check antes de insertar" o INSERT IGNORE / ON DUPLICATE KEY en todo.
// =============================================================================

// -----------------------------------------------------------------------------
// OJO — nombre de roles: deben coincidir EXACTO con lo que compara el frontend
// (Sidebar.jsx / Dashboard.jsx usan "Tecnico" SIN tilde). Por eso aquí se siembra
// sin tilde, para no repetir el bug de Técnico != Tecnico.
// -----------------------------------------------------------------------------
const ROLES = [
  {
    nombreRol: "Admin",
    descripcion: "Administrador del sistema, acceso total",
  },
  { nombreRol: "Tecnico", descripcion: "Técnico de taller" },
  { nombreRol: "Asesor", descripcion: "Asesor de servicio" },
  {
    nombreRol: "Cliente",
    descripcion: "Cliente con acceso limitado al sistema",
  },
];

// Catálogo de preguntas de seguridad (se corrigieron tildes/typos del seed viejo
// y se agregó "escuela primaria" que pide el admin de prueba).
const PREGUNTAS = [
  "¿Cuál es el nombre de la ciudad donde naciste?",
  "¿Cuál es el nombre de tu mejor amigo de la infancia?",
  "¿Cuál es el nombre de tu primera mascota?",
  "¿Cuál es tu color favorito?",
  "¿Cuál es tu comida favorita?",
  "¿Cuál es el nombre de tu escuela primaria?",
];

// Catálogo mínimo de Permisos: hoy en día SOLO estas rutas usan verificarPermiso
// (todo lo demás en el backend usa verificarRol, no RolPermiso). Si más adelante
// migran otras rutas a verificarPermiso, hay que sumarlas aquí.
const PERMISOS = [
  {
    modulo: "permisos",
    accion: "leer",
    descripcion: "Ver la matriz de permisos por rol",
  },
  {
    modulo: "permisos",
    accion: "editar",
    descripcion: "Editar la matriz de permisos por rol",
  },
  {
    modulo: "auditoria",
    accion: "leer",
    descripcion: "Consultar el log de auditoría",
  },
  {
    modulo: "auditoria",
    accion: "exportar",
    descripcion: "Exportar el log de auditoría",
  },
];

// Usuarios de prueba (uno por rol), con sus 3 preguntas de seguridad obligatorias.
const USUARIOS_PRUEBA = [
  {
    nombreRol: "Admin",
    nombreEmpleado: "Administrador Raíz",
    documento: "900000001",
    cargoActual: "Administrador",
    tarifaHora: 0.0,
    correo: "admin@ecobiva.com",
    password: "Admin123*",
    preguntas: [
      {
        texto: "¿Cuál es el nombre de tu primera mascota?",
        respuesta: "Rocky",
      },
      {
        texto: "¿Cuál es el nombre de tu escuela primaria?",
        respuesta: "SanJose",
      },
      { texto: "¿Cuál es tu comida favorita?", respuesta: "Pizza" },
    ],
  },
  {
    nombreRol: "Tecnico",
    nombreEmpleado: "Técnico de Prueba",
    documento: "900000002",
    cargoActual: "Técnico Operativo",
    tarifaHora: 25.0,
    correo: "tecnico@ecobiva.com",
    password: "Tecnico123*",
    preguntas: [
      { texto: "¿Cuál es el nombre de tu primera mascota?", respuesta: "Max" },
      { texto: "¿Cuál es tu color favorito?", respuesta: "Rojo" },
      { texto: "¿Cuál es tu comida favorita?", respuesta: "Hamburguesa" },
    ],
  },
  {
    nombreRol: "Asesor",
    nombreEmpleado: "Asesor de Prueba",
    documento: "900000003",
    cargoActual: "Asesor de Servicio",
    tarifaHora: 18.0,
    correo: "asesor@ecobiva.com",
    password: "Asesor123*",
    preguntas: [
      {
        texto: "¿Cuál es el nombre de la ciudad donde naciste?",
        respuesta: "Bogotá",
      },
      { texto: "¿Cuál es tu color favorito?", respuesta: "Verde" },
      { texto: "¿Cuál es el nombre de tu primera mascota?", respuesta: "Luna" },
    ],
  },
  {
    // Nota: el rol "Cliente" del sistema de login (Usuario/Rol) es distinto de la
    // tabla de negocio `Cliente` (clientes del taller). Este usuario de prueba NO
    // crea una fila en la tabla `Cliente`, solo un login con ese rol. Si más
    // adelante quieren que un cliente real del taller también pueda loguearse,
    // eso requiere diseño aparte (vincular Usuario <-> Cliente).
    nombreRol: "Cliente",
    nombreEmpleado: "Cliente Demo",
    documento: "900000004",
    cargoActual: "Cliente Final",
    tarifaHora: 0.0,
    correo: "cliente@ecobiva.com",
    password: "Cliente123*",
    preguntas: [
      {
        texto: "¿Cuál es el nombre de tu mejor amigo de la infancia?",
        respuesta: "Pedro",
      },
      { texto: "¿Cuál es el nombre de tu primera mascota?", respuesta: "Toby" },
      { texto: "¿Cuál es tu comida favorita?", respuesta: "Sushi" },
    ],
  },
];

async function sembrarRoles(conn) {
  for (const r of ROLES) {
    await conn.execute(
      "INSERT IGNORE INTO Rol (nombreRol, descripcion) VALUES (?, ?)",
      [r.nombreRol, r.descripcion],
    );
  }
  console.log("✅ Roles verificados/insertados.");
}

async function sembrarPreguntas(conn) {
  for (const p of PREGUNTAS) {
    await conn.execute(
      "INSERT IGNORE INTO PreguntaSeguridad (textoPregunta) VALUES (?)",
      [p],
    );
  }
  console.log("✅ Catálogo de preguntas de seguridad sembrado.");
}

async function sembrarPermisosYMatriz(conn) {
  for (const p of PERMISOS) {
    await conn.execute(
      "INSERT IGNORE INTO Permiso (modulo, accion, descripcion) VALUES (?, ?, ?)",
      [p.modulo, p.accion, p.descripcion],
    );
  }

  const [roles] = await conn.execute("SELECT idRol, nombreRol FROM Rol");
  const [permisos] = await conn.execute(
    "SELECT idPermiso, modulo, accion FROM Permiso",
  );

  for (const rol of roles) {
    for (const permiso of permisos) {
      // Admin: acceso total. El resto: sin acceso a permisos/auditoría por defecto
      // (se puede ajustar luego desde la pantalla de Permisos sin tocar el seed).
      const permitido = rol.nombreRol === "Admin" ? 1 : 0;
      await conn.execute(
        `INSERT INTO RolPermiso (idRol, idPermiso, permitido)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE permitido = VALUES(permitido)`,
        [rol.idRol, permiso.idPermiso, permitido],
      );
    }
  }
  console.log(
    "✅ Catálogo de permisos y matriz RolPermiso sembrados (Admin = acceso total).",
  );
}

async function obtenerOCrearEmpleado(conn, datos) {
  const [existentes] = await conn.execute(
    "SELECT idEmpleado FROM Empleado WHERE documento = ?",
    [datos.documento],
  );
  if (existentes.length > 0) return existentes[0].idEmpleado;

  const [res] = await conn.execute(
    `INSERT INTO Empleado (nombre, documento, fechaIngreso, cargoActual, tarifaHora, estadoLaboral)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      datos.nombreEmpleado,
      datos.documento,
      new Date(),
      datos.cargoActual,
      datos.tarifaHora,
      true,
    ],
  );
  return res.insertId;
}

async function sembrarUsuarioDePrueba(conn, datos) {
  const [existentes] = await conn.execute(
    "SELECT idUsuario FROM Usuario WHERE correo = ?",
    [datos.correo],
  );
  if (existentes.length > 0) {
    console.log(
      `⚠️  ${datos.correo} ya existe, se omite (no se pisan contraseñas existentes).`,
    );
    return;
  }

  const idEmpleado = await obtenerOCrearEmpleado(conn, datos);

  const [rolRows] = await conn.execute(
    "SELECT idRol FROM Rol WHERE nombreRol = ?",
    [datos.nombreRol],
  );
  if (rolRows.length === 0) {
    throw new Error(
      `El rol "${datos.nombreRol}" no existe. ¿Corriste sembrarRoles() antes?`,
    );
  }
  const idRol = rolRows[0].idRol;

  const passwordHash = await bcrypt.hash(datos.password, 10);
  const [resUsuario] = await conn.execute(
    `INSERT INTO Usuario (correo, passwordHash, estado, idEmpleado)
     VALUES (?, ?, ?, ?)`,
    [datos.correo, passwordHash, true, idEmpleado],
  );
  const idUsuario = resUsuario.insertId;

  await conn.execute(
    `INSERT INTO UsuarioRol (idUsuario, idRol, fechaAsignacion, asignadoPor)
     VALUES (?, ?, NOW(), ?)`,
    [idUsuario, idRol, idUsuario],
  );

  for (const p of datos.preguntas) {
    const [preguntaRows] = await conn.execute(
      "SELECT idPregunta FROM PreguntaSeguridad WHERE textoPregunta = ?",
      [p.texto],
    );
    if (preguntaRows.length === 0) {
      throw new Error(
        `La pregunta "${p.texto}" no está en el catálogo (revisa el array PREGUNTAS).`,
      );
    }
    const respuestaHash = await bcrypt.hash(p.respuesta, 10);
    await conn.execute(
      `INSERT IGNORE INTO UsuarioPreguntaSeguridad (idUsuario, idPregunta, respuestaHash)
       VALUES (?, ?, ?)`,
      [idUsuario, preguntaRows[0].idPregunta, respuestaHash],
    );
  }

  console.log(
    `✅ Usuario de prueba creado: ${datos.correo} / ${datos.password} (rol: ${datos.nombreRol})`,
  );
}

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await connection.beginTransaction();
    console.log("🌱 Iniciando la siembra de datos (Seed) para Ecobiva...\n");

    await sembrarRoles(connection);
    await sembrarPreguntas(connection);
    await sembrarPermisosYMatriz(connection);

    for (const datos of USUARIOS_PRUEBA) {
      await sembrarUsuarioDePrueba(connection, datos);
    }

    await connection.commit();

    console.log("\n🚀 ¡Seed ejecutado con éxito!");
    console.log("   Usuarios de prueba disponibles:");
    for (const u of USUARIOS_PRUEBA) {
      console.log(
        `   - ${u.nombreRol.padEnd(8)} → ${u.correo} / ${u.password}`,
      );
    }
    console.log("");
  } catch (error) {
    await connection.rollback();
    console.error(
      "❌ Error crítico al ejecutar el seed. Transacción revertida:",
      error.message,
    );
    process.exitCode = 1;
  } finally {
    await connection.end();
  }
}

seed();
