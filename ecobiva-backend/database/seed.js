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

// =============================================================================
// DATOS DE NEGOCIO — poblar el resto de las tablas con datos de ejemplo
// coherentes entre sí (mismos clientes/vehículos/usuarios se reutilizan en
// todo el flujo: orden -> diagnóstico -> evidencia -> firma -> garantía).
// Todo idempotente: se busca por clave natural antes de insertar.
// =============================================================================

function fechaHace(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d;
}

async function obtenerIdUsuarioPorCorreo(conn, correo) {
  const [rows] = await conn.execute(
    "SELECT idUsuario FROM Usuario WHERE correo = ?",
    [correo],
  );
  if (rows.length === 0) {
    throw new Error(
      `No existe el usuario "${correo}". ¿Corrió sembrarUsuarioDePrueba antes?`,
    );
  }
  return rows[0].idUsuario;
}

async function obtenerIdEmpleadoPorDocumento(conn, documento) {
  const [rows] = await conn.execute(
    "SELECT idEmpleado FROM Empleado WHERE documento = ?",
    [documento],
  );
  if (rows.length === 0) {
    throw new Error(`No existe el empleado con documento "${documento}".`);
  }
  return rows[0].idEmpleado;
}

// -----------------------------------------------------------------------------
// Repuestos (catálogo). Algunos se siembran con stock por debajo del mínimo
// a propósito, para que AlertaStock tenga algo real que mostrar.
// -----------------------------------------------------------------------------
const REPUESTOS = [
  {
    nombre: "Pastillas de freno delanteras",
    categoria: "Frenos",
    precioUnitario: 45000,
    proveedor: "FrenosCol S.A.",
    stockActual: 3,
    stockMinimo: 5,
  },
  {
    nombre: "Filtro de aceite",
    categoria: "Mantenimiento",
    precioUnitario: 18000,
    proveedor: "MotoPartes Ltda",
    stockActual: 20,
    stockMinimo: 5,
  },
  {
    nombre: "Aceite motor sintético 5W-30 (1L)",
    categoria: "Lubricantes",
    precioUnitario: 35000,
    proveedor: "LubriMax",
    stockActual: 15,
    stockMinimo: 8,
  },
  {
    nombre: "Amortiguador delantero",
    categoria: "Suspensión",
    precioUnitario: 120000,
    proveedor: "SuspenCol",
    stockActual: 2,
    stockMinimo: 4,
  },
  {
    nombre: "Kit de cables y conectores eléctricos",
    categoria: "Eléctrico",
    precioUnitario: 25000,
    proveedor: "ElectroMoto",
    stockActual: 10,
    stockMinimo: 5,
  },
  {
    nombre: "Controlador de motor eléctrico",
    categoria: "Eléctrico",
    precioUnitario: 280000,
    proveedor: "EVParts",
    stockActual: 4,
    stockMinimo: 3,
  },
];

async function sembrarRepuestos(conn) {
  for (const r of REPUESTOS) {
    const [existente] = await conn.execute(
      "SELECT idRepuesto FROM Repuesto WHERE nombre = ?",
      [r.nombre],
    );
    if (existente.length > 0) continue;

    await conn.execute(
      `INSERT INTO Repuesto (nombre, categoria, precioUnitario, proveedor, stockActual, stockMinimo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        r.nombre,
        r.categoria,
        r.precioUnitario,
        r.proveedor,
        r.stockActual,
        r.stockMinimo,
      ],
    );
  }
  console.log("✅ Catálogo de repuestos sembrado.");
}

async function sembrarAlertasStock(conn) {
  const [bajos] = await conn.execute(
    "SELECT idRepuesto FROM Repuesto WHERE stockActual < stockMinimo",
  );

  for (const r of bajos) {
    const [existente] = await conn.execute(
      "SELECT idAlerta FROM AlertaStock WHERE idRepuesto = ? AND estadoGestion = 'pendiente'",
      [r.idRepuesto],
    );
    if (existente.length > 0) continue;

    await conn.execute(
      "INSERT INTO AlertaStock (estadoGestion, idRepuesto) VALUES ('pendiente', ?)",
      [r.idRepuesto],
    );
  }
  console.log("✅ Alertas de stock generadas para repuestos bajo el mínimo.");
}

// -----------------------------------------------------------------------------
// Clientes + Vehículos
// -----------------------------------------------------------------------------
const CLIENTES = [
  {
    nombre: "Juan Pérez",
    telefono: "3204567890",
    correo: "juan.perez@example.com",
    documento: "1012456789",
    preferenciaNotificacion: "WhatsApp",
    vehiculos: [
      {
        placa: "EVA123",
        marca: "EcoMoto",
        modelo: "X1",
        anio: 2023,
        serialMotor: "MTR-0001",
        tipoVehiculo: "Motocicleta Eléctrica",
        especificacionesBateria: "60V 20Ah",
      },
    ],
  },
  {
    nombre: "María Gómez",
    telefono: "3157894561",
    correo: "maria.gomez@example.com",
    documento: "1098765432",
    preferenciaNotificacion: "Correo",
    vehiculos: [
      {
        placa: "EVB456",
        marca: "EcoMoto",
        modelo: "X2 Pro",
        anio: 2024,
        serialMotor: "MTR-0002",
        tipoVehiculo: "Motocicleta Eléctrica",
        especificacionesBateria: "72V 30Ah",
      },
    ],
  },
  {
    nombre: "Carlos Ramírez",
    telefono: "3012345678",
    correo: "carlos.ramirez@example.com",
    documento: "1076543210",
    preferenciaNotificacion: "SMS",
    vehiculos: [
      {
        placa: "EVC789",
        marca: "Voltium",
        modelo: "Urban",
        anio: 2022,
        serialMotor: "MTR-0003",
        tipoVehiculo: "Motocicleta Eléctrica",
        especificacionesBateria: "60V 20Ah",
      },
      {
        placa: "EVC790",
        marca: "Voltium",
        modelo: "Cargo",
        anio: 2023,
        serialMotor: "MTR-0004",
        tipoVehiculo: "Motocicleta de Carga Eléctrica",
        especificacionesBateria: "72V 40Ah",
      },
    ],
  },
];

async function sembrarClientesYVehiculos(conn) {
  for (const c of CLIENTES) {
    let idCliente;
    const [existente] = await conn.execute(
      "SELECT idCliente FROM Cliente WHERE documento = ?",
      [c.documento],
    );

    if (existente.length > 0) {
      idCliente = existente[0].idCliente;
    } else {
      const [res] = await conn.execute(
        `INSERT INTO Cliente (nombre, telefono, correo, documento, preferenciaNotificacion, estado, puntosAcumulados)
         VALUES (?, ?, ?, ?, ?, 1, 0)`,
        [
          c.nombre,
          c.telefono,
          c.correo,
          c.documento,
          c.preferenciaNotificacion,
        ],
      );
      idCliente = res.insertId;
    }

    for (const v of c.vehiculos) {
      const [existeVehiculo] = await conn.execute(
        "SELECT idVehiculo FROM Vehiculo WHERE placa = ?",
        [v.placa],
      );
      if (existeVehiculo.length > 0) continue;

      await conn.execute(
        `INSERT INTO Vehiculo (placa, marca, modelo, anio, serialMotor, tipoVehiculo, especificacionesBateria, idCliente)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          v.placa,
          v.marca,
          v.modelo,
          v.anio,
          v.serialMotor,
          v.tipoVehiculo,
          v.especificacionesBateria,
          idCliente,
        ],
      );
    }
  }
  console.log("✅ Clientes y vehículos sembrados.");
}

// -----------------------------------------------------------------------------
// Baterías (Repuesto + Bateria). BAT-0002 queda instalada en el vehículo
// EVB456 para tener un ejemplo de batería "en uso" y no solo en bodega.
// -----------------------------------------------------------------------------
async function sembrarBaterias(conn) {
  const [vehiculoEVB456] = await conn.execute(
    "SELECT idVehiculo FROM Vehiculo WHERE placa = 'EVB456'",
  );
  const idVehiculoInstalada = vehiculoEVB456[0]?.idVehiculo || null;

  const BATERIAS = [
    {
      nombre: "Batería de Litio 60V 20Ah",
      categoria: "Batería",
      precioUnitario: 850000,
      proveedor: "PowerCell",
      stockActual: 6,
      stockMinimo: 2,
      serial: "BAT-0001",
      modeloCompatible: "EcoMoto X1",
      estado: "Nueva",
      voltajeFinal: null,
      amperajeFinal: null,
      idVehiculo: null,
    },
    {
      nombre: "Batería de Litio 72V 30Ah",
      categoria: "Batería",
      precioUnitario: 1200000,
      proveedor: "PowerCell",
      stockActual: 3,
      stockMinimo: 2,
      serial: "BAT-0002",
      modeloCompatible: "EcoMoto X2 Pro",
      estado: "Instalada",
      voltajeFinal: 71.5,
      amperajeFinal: 29.8,
      idVehiculo: idVehiculoInstalada,
    },
  ];

  for (const b of BATERIAS) {
    const [existente] = await conn.execute(
      "SELECT idRepuesto FROM Bateria WHERE serial = ?",
      [b.serial],
    );
    if (existente.length > 0) continue;

    const [res] = await conn.execute(
      `INSERT INTO Repuesto (nombre, categoria, precioUnitario, proveedor, stockActual, stockMinimo)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        b.nombre,
        b.categoria,
        b.precioUnitario,
        b.proveedor,
        b.stockActual,
        b.stockMinimo,
      ],
    );
    const idRepuesto = res.insertId;

    await conn.execute(
      `INSERT INTO Bateria (idRepuesto, serial, modeloCompatible, estado, voltajeFinal, amperajeFinal, idVehiculo)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        idRepuesto,
        b.serial,
        b.modeloCompatible,
        b.estado,
        b.voltajeFinal,
        b.amperajeFinal,
        b.idVehiculo,
      ],
    );
  }
  console.log("✅ Baterías sembradas (incluida una instalada en un vehículo).");
}

// -----------------------------------------------------------------------------
// Movimientos de Kardex de ejemplo (entradas de stock inicial + una salida).
// -----------------------------------------------------------------------------
async function sembrarKardex(conn) {
  const idAdmin = await obtenerIdUsuarioPorCorreo(conn, "admin@ecobiva.com");

  const [existente] = await conn.execute(
    "SELECT idMovimiento FROM MovimientoKardex LIMIT 1",
  );
  if (existente.length > 0) {
    console.log(
      "⚠️  Ya hay movimientos de Kardex, se omite la siembra inicial.",
    );
    return;
  }

  const [filtro] = await conn.execute(
    "SELECT idRepuesto FROM Repuesto WHERE nombre = 'Filtro de aceite'",
  );

  if (filtro.length > 0) {
    await conn.execute(
      `INSERT INTO MovimientoKardex (tipoMovimiento, cantidad, fecha, idRepuesto, idOrdenServicio, idUsuario)
       VALUES ('entrada', 20, ?, ?, NULL, ?)`,
      [fechaHace(20), filtro[0].idRepuesto, idAdmin],
    );
  }

  console.log("✅ Movimientos de Kardex de ejemplo sembrados.");
}

// -----------------------------------------------------------------------------
// PerfilTecnico + HistorialCargo del técnico de prueba.
// -----------------------------------------------------------------------------
async function sembrarPerfilTecnicoYHistorialCargo(conn) {
  const idEmpleadoTecnico = await obtenerIdEmpleadoPorDocumento(
    conn,
    "900000002",
  );
  const idAdmin = await obtenerIdUsuarioPorCorreo(conn, "admin@ecobiva.com");

  const [perfil] = await conn.execute(
    "SELECT idPerfilTecnico FROM PerfilTecnico WHERE idEmpleado = ?",
    [idEmpleadoTecnico],
  );
  if (perfil.length === 0) {
    await conn.execute(
      `INSERT INTO PerfilTecnico (idEmpleado, cargaActual, especialidad)
       VALUES (?, 2, 'Sistemas eléctricos y baterías')`,
      [idEmpleadoTecnico],
    );
  }

  const [historial] = await conn.execute(
    "SELECT idHistorial FROM HistorialCargo WHERE idEmpleado = ?",
    [idEmpleadoTecnico],
  );
  if (historial.length === 0) {
    await conn.execute(
      `INSERT INTO HistorialCargo (idEmpleado, cargoAnterior, cargoNuevo, fechaCambio, motivo, idUsuario)
       VALUES (?, 'Técnico Junior', 'Técnico Operativo', ?, 'Promoción por desempeño', ?)`,
      [idEmpleadoTecnico, fechaHace(90), idAdmin],
    );
  }

  console.log("✅ Perfil de técnico e historial de cargo sembrados.");
}

// -----------------------------------------------------------------------------
// Órdenes de servicio + flujo completo de taller (Parte 1 y adelanto de
// Parte 2: Diagnóstico, Evidencias, Firma y Garantía, para que el seed sirva
// de ejemplo de punta a punta aunque esos controllers todavía no existan).
// -----------------------------------------------------------------------------
async function crearOrdenSiNoExiste(conn, folio, datos) {
  const [existente] = await conn.execute(
    "SELECT idOrden FROM OrdenServicio WHERE folio = ?",
    [folio],
  );
  if (existente.length > 0)
    return { idOrden: existente[0].idOrden, creada: false };

  const [res] = await conn.execute(
    `INSERT INTO OrdenServicio
     (folio, fechaCreacion, estado, kilometrajeIngreso, nivelBateriaIngreso, idCliente, idVehiculo, idTecnico, idAsesor)
     VALUES (?, ?, 'recibido', ?, ?, ?, ?, ?, ?)`,
    [
      folio,
      datos.fechaCreacion,
      datos.kilometrajeIngreso ?? null,
      datos.nivelBateriaIngreso ?? null,
      datos.idCliente,
      datos.idVehiculo,
      datos.idTecnico ?? null,
      datos.idAsesor,
    ],
  );

  await conn.execute(
    `INSERT INTO HistorialEstado (estadoAnterior, estadoNuevo, fecha, usuarioId, motivo, idOrdenServicio)
     VALUES (NULL, 'recibido', ?, ?, 'Creación de la orden', ?)`,
    [datos.fechaCreacion, datos.idAsesor, res.insertId],
  );

  return { idOrden: res.insertId, creada: true };
}

async function avanzarEstado(
  conn,
  idOrden,
  estadoAnterior,
  estadoNuevo,
  fecha,
  idUsuario,
  motivo,
) {
  await conn.execute("UPDATE OrdenServicio SET estado = ? WHERE idOrden = ?", [
    estadoNuevo,
    idOrden,
  ]);
  await conn.execute(
    `INSERT INTO HistorialEstado (estadoAnterior, estadoNuevo, fecha, usuarioId, motivo, idOrdenServicio)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [estadoAnterior, estadoNuevo, fecha, idUsuario, motivo, idOrden],
  );
}

async function sembrarOrdenesYFlujoTaller(conn) {
  const idTecnico = await obtenerIdUsuarioPorCorreo(
    conn,
    "tecnico@ecobiva.com",
  );
  const idAsesor = await obtenerIdUsuarioPorCorreo(conn, "asesor@ecobiva.com");

  const [clienteJuan] = await conn.execute(
    "SELECT idCliente FROM Cliente WHERE documento = '1012456789'",
  );
  const [vehiculoJuan] = await conn.execute(
    "SELECT idVehiculo FROM Vehiculo WHERE placa = 'EVA123'",
  );
  const [clienteMaria] = await conn.execute(
    "SELECT idCliente FROM Cliente WHERE documento = '1098765432'",
  );
  const [vehiculoMaria] = await conn.execute(
    "SELECT idVehiculo FROM Vehiculo WHERE placa = 'EVB456'",
  );
  const [clienteCarlos] = await conn.execute(
    "SELECT idCliente FROM Cliente WHERE documento = '1076543210'",
  );
  const [vehiculoCarlos] = await conn.execute(
    "SELECT idVehiculo FROM Vehiculo WHERE placa = 'EVC789'",
  );

  // ---- Orden 1: flujo completo, entregada, con diagnóstico/firma/garantía ----
  const { idOrden: idOrden1, creada: creada1 } = await crearOrdenSiNoExiste(
    conn,
    "OT-000001",
    {
      fechaCreacion: fechaHace(15),
      kilometrajeIngreso: 1200,
      nivelBateriaIngreso: 45,
      idCliente: clienteJuan[0].idCliente,
      idVehiculo: vehiculoJuan[0].idVehiculo,
      idTecnico,
      idAsesor,
    },
  );

  if (creada1) {
    await avanzarEstado(
      conn,
      idOrden1,
      "recibido",
      "en_diagnostico",
      fechaHace(14),
      idTecnico,
      "Vehículo ingresado a taller",
    );
    await avanzarEstado(
      conn,
      idOrden1,
      "en_diagnostico",
      "pendiente_aprobacion",
      fechaHace(14),
      idTecnico,
      "Diagnóstico enviado a aprobación del cliente",
    );
    await avanzarEstado(
      conn,
      idOrden1,
      "pendiente_aprobacion",
      "aprobada",
      fechaHace(13),
      idAsesor,
      "Cliente aprueba la reparación propuesta",
    );
    await avanzarEstado(
      conn,
      idOrden1,
      "aprobada",
      "en_reparacion",
      fechaHace(13),
      idTecnico,
      "Inicia reparación",
    );
    await avanzarEstado(
      conn,
      idOrden1,
      "en_reparacion",
      "finalizada",
      fechaHace(13),
      idTecnico,
      "Servicio completado",
    );
    await avanzarEstado(
      conn,
      idOrden1,
      "finalizada",
      "entregada",
      fechaHace(12),
      idAsesor,
      "Entregado al cliente",
    );

    await conn.execute(
      `INSERT INTO Diagnostico (checklist, tipoDiagnostico, costoDiagnostico, subtotalManoObra, subtotalRepuestos, bloqueado, fechaEnvio, idOrdenServicio)
       VALUES (?, 'profundo', 40000, 60000, 125000, 1, ?, ?)`,
      [
        JSON.stringify({
          frenos: "desgastados, requieren cambio",
          aceite: "cambio realizado",
          bateria: "ok, sin novedad",
        }),
        fechaHace(14),
        idOrden1,
      ],
    );

    await conn.execute(
      `INSERT INTO Factura
       (idOrdenServicio, numeroFactura, tipo, subtotalManoObra, subtotalRepuestos, descuento, impuestos, total, metodoPago, pagoConfirmado, fechaPago, idUsuarioCreador)
       VALUES (?, 'FAC-000001', 'reparacion', 60000, 125000, 0, 0, 185000, 'Efectivo', 1, ?, ?)`,
      [idOrden1, fechaHace(12), idAsesor],
    );

    await conn.execute(
      `INSERT INTO FirmaDigital (imagenFirma, metodoCaptura, fechaCaptura, terminosAceptados, idOrden)
       VALUES (?, 'Táctil', ?, 1, ?)`,
      ["data:image/png;base64,SEED_PLACEHOLDER", fechaHace(12), idOrden1],
    );

    await conn.execute(
      `INSERT INTO OrdenGarantia (ordenOrigenId, estado, costoInterno, fechaApertura, notasSeguimiento)
       VALUES (?, 'abierta', NULL, ?, 'Cliente reporta leve ruido en el freno delantero luego de 2 semanas de uso')`,
      [idOrden1, fechaHace(2)],
    );

    await conn.execute(
      `INSERT INTO PuntoFidelidad (tipoMovimiento, puntos, fecha, porcentajeDescuentoAplicado, idCliente, idOrden)
       VALUES ('acumulacion', 185, ?, NULL, ?, ?)`,
      [fechaHace(12), clienteJuan[0].idCliente, idOrden1],
    );

    await conn.execute(
      "UPDATE Cliente SET puntosAcumulados = puntosAcumulados + 185 WHERE idCliente = ?",
      [clienteJuan[0].idCliente],
    );
  }

  // ---- Orden 2: en proceso, con diagnóstico abierto y evidencia de ingreso ----
  const { idOrden: idOrden2, creada: creada2 } = await crearOrdenSiNoExiste(
    conn,
    "OT-000002",
    {
      fechaCreacion: fechaHace(3),
      kilometrajeIngreso: 500,
      nivelBateriaIngreso: 60,
      idCliente: clienteMaria[0].idCliente,
      idVehiculo: vehiculoMaria[0].idVehiculo,
      idTecnico,
      idAsesor,
    },
  );

  if (creada2) {
    await avanzarEstado(
      conn,
      idOrden2,
      "recibido",
      "en_diagnostico",
      fechaHace(2),
      idTecnico,
      "Vehículo ingresado a taller",
    );

    await conn.execute(
      `INSERT INTO Diagnostico (checklist, tipoDiagnostico, costoDiagnostico, subtotalManoObra, subtotalRepuestos, bloqueado, fechaEnvio, idOrdenServicio)
       VALUES (?, 'superficial', 0, 40000, 0, 0, NULL, ?)`,
      [
        JSON.stringify({
          bateria: "revisar celdas por sospecha de descarga irregular",
          motor: "sin novedad",
        }),
        idOrden2,
      ],
    );

    const [evidencia] = await conn.execute(
      `INSERT INTO EvidenciaIngreso (observaciones, fechaRegistro, idVehiculo)
       VALUES ('Rayón leve en el guardabarros delantero, se deja constancia antes de intervenir.', ?, ?)`,
      [fechaHace(3), vehiculoMaria[0].idVehiculo],
    );

    await conn.execute(
      `INSERT INTO EvidenciaFoto (idEvidencia, url) VALUES (?, ?)`,
      [
        evidencia.insertId,
        "https://storage.ecobiva.com/evidencias/evb456-ingreso-1.jpg",
      ],
    );
  }

  // ---- Orden 3: recién abierta, sin técnico asignado todavía ----
  await crearOrdenSiNoExiste(conn, "OT-000003", {
    fechaCreacion: fechaHace(0),
    kilometrajeIngreso: 8300,
    nivelBateriaIngreso: 20,
    idCliente: clienteCarlos[0].idCliente,
    idVehiculo: vehiculoCarlos[0].idVehiculo,
    idTecnico: null,
    idAsesor,
  });

  console.log(
    "✅ Órdenes de servicio y flujo de taller (diagnóstico, evidencia, firma, garantía, puntos) sembrados.",
  );

  return { idOrden1, idOrden2 };
}

// -----------------------------------------------------------------------------
// Registro de horas + una nómina calculada a partir de ese registro.
// -----------------------------------------------------------------------------
async function sembrarRegistroHorasYNomina(conn, ordenes) {
  const idEmpleadoTecnico = await obtenerIdEmpleadoPorDocumento(
    conn,
    "900000002",
  );

  const [existente] = await conn.execute(
    "SELECT idRegistro FROM RegistroHoras WHERE idEmpleado = ?",
    [idEmpleadoTecnico],
  );

  if (existente.length === 0) {
    const registros = [
      { fecha: fechaHace(14), horas: 4, idOrden: ordenes?.idOrden1 || null },
      { fecha: fechaHace(13), horas: 3, idOrden: ordenes?.idOrden1 || null },
      { fecha: fechaHace(2), horas: 5, idOrden: ordenes?.idOrden2 || null },
      { fecha: fechaHace(1), horas: 6, idOrden: null },
    ];

    for (const r of registros) {
      await conn.execute(
        `INSERT INTO RegistroHoras (idEmpleado, fecha, horasTrabajadas, idOrdenServicio)
         VALUES (?, ?, ?, ?)`,
        [idEmpleadoTecnico, r.fecha, r.horas, r.idOrden],
      );
    }
  }

  const [tecnico] = await conn.execute(
    "SELECT tarifaHora FROM Empleado WHERE idEmpleado = ?",
    [idEmpleadoTecnico],
  );
  const tarifaHora = Number(tecnico[0].tarifaHora);

  const periodoInicio = fechaHace(14).toISOString().slice(0, 10);
  const periodoFin = fechaHace(0).toISOString().slice(0, 10);

  const [nominaExistente] = await conn.execute(
    "SELECT idNomina FROM Nomina WHERE idEmpleado = ? AND periodoInicio = ? AND periodoFin = ?",
    [idEmpleadoTecnico, periodoInicio, periodoFin],
  );

  if (nominaExistente.length === 0) {
    const [suma] = await conn.execute(
      "SELECT IFNULL(SUM(horasTrabajadas),0) AS totalHoras FROM RegistroHoras WHERE idEmpleado = ? AND fecha BETWEEN ? AND ?",
      [idEmpleadoTecnico, periodoInicio, periodoFin],
    );
    const totalHoras = Number(suma[0].totalHoras);
    const totalPagar = totalHoras * tarifaHora;

    await conn.execute(
      `INSERT INTO Nomina (idEmpleado, periodoInicio, periodoFin, totalHoras, tarifaHoraAplicada, totalPagar)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        idEmpleadoTecnico,
        periodoInicio,
        periodoFin,
        totalHoras,
        tarifaHora,
        totalPagar,
      ],
    );
  }

  console.log("✅ Registro de horas y nómina de ejemplo sembrados.");
}

// -----------------------------------------------------------------------------
// Términos de garantía (catálogo legal) y recordatorios preventivos.
// -----------------------------------------------------------------------------
const TERMINOS_GARANTIA = [
  {
    categoria: "Batería",
    textoLegal:
      "La batería cuenta con garantía de fábrica por defectos de manufactura, sujeta a uso adecuado y carga con cargador original.",
    plazoGarantiaDias: 365,
    version: "v1",
  },
  {
    categoria: "Mano de obra",
    textoLegal:
      "La mano de obra realizada en taller cuenta con garantía de 30 días sobre el servicio prestado; no cubre daños por mal uso posterior.",
    plazoGarantiaDias: 30,
    version: "v1",
  },
  {
    categoria: "Repuestos electrónicos",
    textoLegal:
      "Los repuestos electrónicos instalados cuentan con la garantía del proveedor, sujeta a las condiciones del fabricante.",
    plazoGarantiaDias: 90,
    version: "v1",
  },
];

async function sembrarTerminosGarantia(conn) {
  for (const t of TERMINOS_GARANTIA) {
    const [existente] = await conn.execute(
      "SELECT idTermino FROM TerminoGarantia WHERE categoria = ? AND version = ?",
      [t.categoria, t.version],
    );
    if (existente.length > 0) continue;

    await conn.execute(
      `INSERT INTO TerminoGarantia (categoria, textoLegal, plazoGarantiaDias, version, vigente)
       VALUES (?, ?, ?, ?, 1)`,
      [t.categoria, t.textoLegal, t.plazoGarantiaDias, t.version],
    );
  }
  console.log("✅ Términos de garantía sembrados.");
}

async function sembrarRecordatorios(conn) {
  const [clienteJuan] = await conn.execute(
    "SELECT idCliente FROM Cliente WHERE documento = '1012456789'",
  );
  const [vehiculoJuan] = await conn.execute(
    "SELECT idVehiculo FROM Vehiculo WHERE placa = 'EVA123'",
  );
  const [clienteCarlos] = await conn.execute(
    "SELECT idCliente FROM Cliente WHERE documento = '1076543210'",
  );
  const [vehiculoCarlos2] = await conn.execute(
    "SELECT idVehiculo FROM Vehiculo WHERE placa = 'EVC790'",
  );

  const [existente] = await conn.execute(
    "SELECT idRecordatorio FROM RecordatorioPreventivo LIMIT 1",
  );
  if (existente.length > 0) {
    console.log(
      "⚠️  Ya hay recordatorios preventivos, se omite la siembra inicial.",
    );
    return;
  }

  await conn.execute(
    `INSERT INTO RecordatorioPreventivo (canal, fechaEnvio, enviado, idCliente, idVehiculo)
     VALUES ('WhatsApp', ?, 1, ?, ?)`,
    [fechaHace(30), clienteJuan[0].idCliente, vehiculoJuan[0].idVehiculo],
  );

  const fechaFutura = new Date();
  fechaFutura.setDate(fechaFutura.getDate() + 15);

  await conn.execute(
    `INSERT INTO RecordatorioPreventivo (canal, fechaEnvio, enviado, idCliente, idVehiculo)
     VALUES ('SMS', ?, 0, ?, ?)`,
    [fechaFutura, clienteCarlos[0].idCliente, vehiculoCarlos2[0].idVehiculo],
  );

  console.log("✅ Recordatorios preventivos sembrados.");
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

    await sembrarRepuestos(connection);
    await sembrarAlertasStock(connection);
    await sembrarClientesYVehiculos(connection);
    await sembrarBaterias(connection);
    await sembrarKardex(connection);
    await sembrarPerfilTecnicoYHistorialCargo(connection);
    const ordenes = await sembrarOrdenesYFlujoTaller(connection);
    await sembrarRegistroHorasYNomina(connection, ordenes);
    await sembrarTerminosGarantia(connection);
    await sembrarRecordatorios(connection);

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
