-- =====================================================================
-- ECOBIVA - Parte 1: Seguridad, Base de Datos y Arquitectura
-- Schema alineado al Diagrama de Clases del informe (punto 5,
-- consolidado DC1 + DC2 + Csprint3)
-- =====================================================================

-- =========================
-- TABLA EMPLEADO
-- Entidad base del dominio de RRHH, independiente de Usuario.
-- Un Empleado puede o no tener cuenta de acceso (Usuario).
-- =========================
CREATE TABLE Empleado (
  idEmpleado INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  documento VARCHAR(30) NOT NULL UNIQUE,
  fechaIngreso DATE NOT NULL,
  cargoActual VARCHAR(100) NOT NULL,
  tarifaHora DECIMAL(10,2) NOT NULL DEFAULT 0,
  estadoLaboral BOOLEAN NOT NULL DEFAULT TRUE
);

-- =========================
-- TABLA ROL
-- Catálogo de roles del sistema.
-- =========================
CREATE TABLE Rol (
  idRol INT AUTO_INCREMENT PRIMARY KEY,
  nombreRol VARCHAR(50) NOT NULL UNIQUE,
  descripcion VARCHAR(255)
);

-- =========================
-- TABLA USUARIO
-- Cuenta de acceso al sistema. Ya NO tiene idRol directo:
-- las capacidades se determinan dinámicamente vía UsuarioRol.
-- =========================
CREATE TABLE Usuario (
  idUsuario INT AUTO_INCREMENT PRIMARY KEY,
  correo VARCHAR(150) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NOT NULL,
  estado BOOLEAN NOT NULL DEFAULT TRUE,
  ultimoAcceso DATETIME NULL,
  idEmpleado INT NOT NULL,
  FOREIGN KEY (idEmpleado) REFERENCES Empleado(idEmpleado)
);

-- =========================
-- TABLA USUARIORROL (entidad asociativa *..*)
-- Registra qué rol(es) tiene activo cada usuario y desde cuándo.
-- Al reasignar un rol no se sobrescribe: se cierra el registro
-- anterior con fechaFin y se crea uno nuevo (historial completo).
-- =========================
CREATE TABLE UsuarioRol (
  idUsuarioRol INT AUTO_INCREMENT PRIMARY KEY,
  idUsuario INT NOT NULL,
  idRol INT NOT NULL,
  fechaAsignacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaFin DATETIME NULL,
  asignadoPor INT NOT NULL,
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario),
  FOREIGN KEY (idRol) REFERENCES Rol(idRol),
  FOREIGN KEY (asignadoPor) REFERENCES Usuario(idUsuario)
);

-- =========================
-- TABLA PERFILTECNICO
-- Ya NO hereda de Usuario. Se asocia a Empleado (1..1), porque la
-- capacidad técnica es un atributo laboral, no un tipo fijo de cuenta.
-- =========================
CREATE TABLE PerfilTecnico (
  idPerfilTecnico INT AUTO_INCREMENT PRIMARY KEY,
  idEmpleado INT NOT NULL UNIQUE,
  cargaActual INT NOT NULL DEFAULT 0,
  especialidad VARCHAR(100),
  FOREIGN KEY (idEmpleado) REFERENCES Empleado(idEmpleado)
);

-- =========================
-- TABLA TOKENRECUPERACION
-- Ciclo de vida del token de recuperación de contraseña
-- (vigencia 30 minutos según el informe).
-- =========================
CREATE TABLE TokenRecuperacion (
  idToken INT AUTO_INCREMENT PRIMARY KEY,
  token VARCHAR(255) NOT NULL,
  fechaGeneracion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fechaExpiracion DATETIME NOT NULL,
  usado BOOLEAN NOT NULL DEFAULT FALSE,
  idUsuario INT NOT NULL,
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

-- =========================
-- TABLA LOGAUDITORIA
-- Registro inmutable de acciones críticas. Relación real a Usuario
-- (ya no es un campo de texto plano).
-- =========================
CREATE TABLE LogAuditoria (
  idLog INT AUTO_INCREMENT PRIMARY KEY,
  accion VARCHAR(100) NOT NULL,
  modulo VARCHAR(100) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  detalle VARCHAR(500),
  idUsuario INT NOT NULL,
  FOREIGN KEY (idUsuario) REFERENCES Usuario(idUsuario)
);

-- =========================
-- TABLA PERMISO
-- Matriz Rol-Módulo: qué acciones están autorizadas.
-- =========================
CREATE TABLE Permiso (
  idPermiso INT AUTO_INCREMENT PRIMARY KEY,
  idRol INT NOT NULL,
  modulo VARCHAR(100) NOT NULL,
  verAutorizado BOOLEAN NOT NULL DEFAULT FALSE,
  crearAutorizado BOOLEAN NOT NULL DEFAULT FALSE,
  editarAutorizado BOOLEAN NOT NULL DEFAULT FALSE,
  eliminarAutorizado BOOLEAN NOT NULL DEFAULT FALSE,
  FOREIGN KEY (idRol) REFERENCES Rol(idRol)
);

-- =====================================================================
-- DATOS SEMILLA
-- =====================================================================

-- Roles base
INSERT INTO Rol (nombreRol, descripcion) VALUES
('Admin', 'Administrador del sistema con acceso total'),
('Tecnico', 'Encargado de diagnóstico y reparación de vehículos'),
('Asesor', 'Encargado de atención al cliente y órdenes de servicio');

-- Empleado de prueba (necesario porque Usuario depende de Empleado)
INSERT INTO Empleado (nombre, documento, fechaIngreso, cargoActual, tarifaHora, estadoLaboral) VALUES
('Administrador Prueba', '0000000000', CURDATE(), 'Administrador', 0, TRUE);

-- Nota: el Usuario admin de prueba y su UsuarioRol se insertan desde
-- Node (seed.js), porque el passwordHash debe generarse con bcrypt,
-- no puede ir en texto plano ni un hash fijo en SQL.

-- ============================================================
-- ECOBIVA - Parte 1
-- Script CORREGIDO tras comparar contra CodigoActual.sql real.
-- Ejecutar en DBeaver con "File -> Open File" (no copiar/pegar)
--
-- NOTA: LogAuditoria y Permiso YA existen en tu BD con la forma correcta
-- (fechaHora, ipOrigen, idUsuario nullable; Permiso con modulo/accion).
-- Este script NO las toca. Solo falta la tabla intermedia RolPermiso.
-- ============================================================

-- --------------------------------------------------------
-- 1. Matriz Rol <-> Permiso (many-to-many) — única tabla que falta
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS RolPermiso (
    idRol         INT NOT NULL,
    idPermiso     INT NOT NULL,
    permitido     BOOLEAN NOT NULL DEFAULT TRUE,
    PRIMARY KEY (idRol, idPermiso),
    FOREIGN KEY (idRol) REFERENCES Rol(idRol) ON DELETE CASCADE,
    FOREIGN KEY (idPermiso) REFERENCES Permiso(idPermiso) ON DELETE CASCADE
);

-- --------------------------------------------------------
-- 2. (Opcional / verificación) Catálogo de permisos.
--    Tu tabla Permiso ya tiene 16 filas (AUTO_INCREMENT=17), que coinciden
--    con este catálogo. Este INSERT IGNORE es solo un seguro por si falta
--    alguno; no duplica nada gracias a la UNIQUE KEY (modulo, accion).
-- --------------------------------------------------------
INSERT IGNORE INTO Permiso (modulo, accion, descripcion) VALUES
('usuarios',   'crear',    'Crear usuarios del sistema'),
('usuarios',   'leer',     'Consultar usuarios'),
('usuarios',   'editar',   'Editar usuarios'),
('usuarios',   'eliminar', 'Desactivar usuarios'),
('roles',      'leer',     'Consultar roles'),
('permisos',   'leer',     'Ver matriz de permisos'),
('permisos',   'editar',   'Editar matriz de permisos'),
('auditoria',  'leer',     'Consultar log de auditoría'),
('auditoria',  'exportar', 'Exportar log de auditoría'),
('ordenes',    'crear',    'Crear órdenes de servicio'),
('ordenes',    'leer',     'Consultar órdenes de servicio'),
('ordenes',    'editar',   'Editar órdenes de servicio'),
('diagnostico','crear',    'Registrar diagnósticos'),
('diagnostico','editar',   'Editar diagnósticos y reparaciones'),
('inventario', 'leer',     'Consultar inventario/kardex'),
('inventario', 'editar',   'Editar movimientos de inventario');

-- --------------------------------------------------------
-- 3. Seed: asignación inicial de permisos por rol.
--    Usamos subconsultas por `nombreRol` en vez de ids fijos, porque no
--    sabemos con certeza si Admin/Tecnico/Asesor son 1/2/3 en tu tabla Rol.
--    AJUSTA los strings 'Admin', 'Tecnico', 'Asesor' si en tu tabla Rol
--    los nombres están escritos distinto (ej. con tilde, mayúsculas, etc).
-- --------------------------------------------------------

-- Verifica primero cómo están escritos tus roles:
-- SELECT idRol, nombreRol FROM Rol;

-- Admin: acceso total a todo el catálogo
INSERT IGNORE INTO RolPermiso (idRol, idPermiso, permitido)
SELECT (SELECT idRol FROM Rol WHERE nombreRol = 'Admin'), idPermiso, TRUE
FROM Permiso
WHERE (SELECT idRol FROM Rol WHERE nombreRol = 'Admin') IS NOT NULL;

-- Tecnico: diagnóstico/reparación + lectura de órdenes e inventario
INSERT IGNORE INTO RolPermiso (idRol, idPermiso, permitido)
SELECT (SELECT idRol FROM Rol WHERE nombreRol = 'Tecnico'), idPermiso, TRUE
FROM Permiso
WHERE ((modulo = 'diagnostico')
    OR (modulo = 'ordenes' AND accion = 'leer')
    OR (modulo = 'inventario'))
  AND (SELECT idRol FROM Rol WHERE nombreRol = 'Tecnico') IS NOT NULL;

-- Asesor: atención al cliente y órdenes de servicio
INSERT IGNORE INTO RolPermiso (idRol, idPermiso, permitido)
SELECT (SELECT idRol FROM Rol WHERE nombreRol = 'Asesor'), idPermiso, TRUE
FROM Permiso
WHERE (modulo = 'ordenes' OR (modulo = 'inventario' AND accion = 'leer'))
  AND (SELECT idRol FROM Rol WHERE nombreRol = 'Asesor') IS NOT NULL;

-- --------------------------------------------------------
-- 4. Verificación final: ver la matriz recién creada
-- --------------------------------------------------------
-- SELECT r.nombreRol, p.modulo, p.accion, rp.permitido
-- FROM RolPermiso rp
-- JOIN Rol r ON r.idRol = rp.idRol
-- JOIN Permiso p ON p.idPermiso = rp.idPermiso
-- ORDER BY r.nombreRol, p.modulo, p.accion;
