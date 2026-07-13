CREATE DATABASE `ecobiva_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

CREATE DATABASE `ecobiva_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */
/*!80016 DEFAULT ENCRYPTION='N' */;

CREATE TABLE `AlertaStock` (
  `idAlerta` int NOT NULL AUTO_INCREMENT,
  `fechaGeneracion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estadoGestion` varchar(50) NOT NULL DEFAULT 'pendiente',
  `idRepuesto` int NOT NULL,
  PRIMARY KEY (`idAlerta`),
  KEY `idRepuesto` (`idRepuesto`),
  CONSTRAINT `AlertaStock_ibfk_1` FOREIGN KEY (`idRepuesto`) REFERENCES `Repuesto` (`idRepuesto`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Bateria` (
  `idRepuesto` int NOT NULL,
  `serial` varchar(100) NOT NULL,
  `modeloCompatible` varchar(100) DEFAULT NULL,
  `estado` varchar(50) DEFAULT NULL,
  `voltajeFinal` float DEFAULT NULL,
  `amperajeFinal` float DEFAULT NULL,
  `idVehiculo` int DEFAULT NULL,
  PRIMARY KEY (`idRepuesto`),
  UNIQUE KEY `serial` (`serial`),
  KEY `idVehiculo` (`idVehiculo`),
  CONSTRAINT `Bateria_ibfk_1` FOREIGN KEY (`idRepuesto`) REFERENCES `Repuesto` (`idRepuesto`),
  CONSTRAINT `Bateria_ibfk_2` FOREIGN KEY (`idVehiculo`) REFERENCES `Vehiculo` (`idVehiculo`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Cliente` (
  `idCliente` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `documento` varchar(50) NOT NULL,
  `preferenciaNotificacion` varchar(50) DEFAULT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `puntosAcumulados` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`idCliente`),
  UNIQUE KEY `documento` (`documento`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Diagnostico` (
  `idDiagnostico` int NOT NULL AUTO_INCREMENT,
  `checklist` json DEFAULT NULL,
  `subtotalManoObra` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `subtotalRepuestos` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `bloqueado` tinyint(1) NOT NULL DEFAULT '0',
  `fechaEnvio` datetime DEFAULT NULL,
  `idOrdenServicio` int NOT NULL,
  PRIMARY KEY (`idDiagnostico`),
  UNIQUE KEY `idOrdenServicio` (`idOrdenServicio`),
  CONSTRAINT `Diagnostico_ibfk_1` FOREIGN KEY (`idOrdenServicio`) REFERENCES `OrdenServicio` (`idOrden`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Empleado` (
  `idEmpleado` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `documento` varchar(30) NOT NULL,
  `fechaIngreso` date NOT NULL,
  `cargoActual` varchar(100) NOT NULL,
  `tarifaHora` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `estadoLaboral` tinyint(1) NOT NULL DEFAULT '1',
  `fechaRetiro` date DEFAULT NULL,
  PRIMARY KEY (`idEmpleado`),
  UNIQUE KEY `documento` (`documento`),
  KEY `idx_empleado_estado` (`estadoLaboral`),
  KEY `idx_empleado_nombre` (`nombre`),
  CONSTRAINT `CHK_TARIFA_POSITIVA` CHECK ((`tarifaHora` >= 0))
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `EvidenciaFoto` (
  `idFoto` int NOT NULL AUTO_INCREMENT,
  `idEvidencia` int NOT NULL,
  `url` varchar(255) NOT NULL,
  PRIMARY KEY (`idFoto`),
  KEY `idEvidencia` (`idEvidencia`),
  CONSTRAINT `EvidenciaFoto_ibfk_1` FOREIGN KEY (`idEvidencia`) REFERENCES `EvidenciaIngreso` (`idEvidencia`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `EvidenciaIngreso` (
  `idEvidencia` int NOT NULL AUTO_INCREMENT,
  `observaciones` text,
  `fechaRegistro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idVehiculo` int NOT NULL,
  PRIMARY KEY (`idEvidencia`),
  KEY `idVehiculo` (`idVehiculo`),
  CONSTRAINT `EvidenciaIngreso_ibfk_1` FOREIGN KEY (`idVehiculo`) REFERENCES `Vehiculo` (`idVehiculo`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `FirmaDigital` (
  `idFirma` int NOT NULL AUTO_INCREMENT,
  `imagenFirma` longtext,
  `metodoCaptura` varchar(50) DEFAULT NULL,
  `fechaCaptura` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `terminosAceptados` tinyint(1) NOT NULL DEFAULT '0',
  `idOrden` int NOT NULL,
  PRIMARY KEY (`idFirma`),
  KEY `idOrden` (`idOrden`),
  CONSTRAINT `FirmaDigital_ibfk_1` FOREIGN KEY (`idOrden`) REFERENCES `OrdenServicio` (`idOrden`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `HistorialCargo` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `idEmpleado` int NOT NULL,
  `cargoAnterior` varchar(100) DEFAULT NULL,
  `cargoNuevo` varchar(100) DEFAULT NULL,
  `fechaCambio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `motivo` varchar(255) DEFAULT NULL,
  `idUsuario` int DEFAULT NULL,
  PRIMARY KEY (`idHistorial`),
  KEY `idEmpleado` (`idEmpleado`),
  KEY `FK_HistorialCargo_Usuario` (`idUsuario`),
  CONSTRAINT `FK_HistorialCargo_Usuario` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `HistorialCargo_ibfk_1` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleado` (`idEmpleado`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `HistorialEstado` (
  `idHistorial` int NOT NULL AUTO_INCREMENT,
  `estadoAnterior` varchar(50) DEFAULT NULL,
  `estadoNuevo` varchar(50) NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `usuarioId` int NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `idOrdenServicio` int NOT NULL,
  PRIMARY KEY (`idHistorial`),
  KEY `usuarioId` (`usuarioId`),
  KEY `idOrdenServicio` (`idOrdenServicio`),
  CONSTRAINT `HistorialEstado_ibfk_1` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `HistorialEstado_ibfk_2` FOREIGN KEY (`idOrdenServicio`) REFERENCES `OrdenServicio` (`idOrden`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `LogAuditoria` (
  `idLog` int NOT NULL AUTO_INCREMENT,
  `accion` varchar(100) NOT NULL,
  `modulo` varchar(100) NOT NULL,
  `fechaHora` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `detalle` varchar(500) DEFAULT NULL,
  `ipOrigen` varchar(45) DEFAULT NULL,
  `idUsuario` int DEFAULT NULL,
  PRIMARY KEY (`idLog`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `LogAuditoria_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB AUTO_INCREMENT = 37 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `MovimientoKardex` (
  `idMovimiento` int NOT NULL AUTO_INCREMENT,
  `tipoMovimiento` varchar(20) NOT NULL,
  `cantidad` int NOT NULL,
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idRepuesto` int NOT NULL,
  `idOrdenServicio` int DEFAULT NULL,
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idMovimiento`),
  KEY `idRepuesto` (`idRepuesto`),
  KEY `idOrdenServicio` (`idOrdenServicio`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `MovimientoKardex_ibfk_1` FOREIGN KEY (`idRepuesto`) REFERENCES `Repuesto` (`idRepuesto`),
  CONSTRAINT `MovimientoKardex_ibfk_2` FOREIGN KEY (`idOrdenServicio`) REFERENCES `OrdenServicio` (`idOrden`),
  CONSTRAINT `MovimientoKardex_ibfk_3` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Nomina` (
  `idNomina` int NOT NULL AUTO_INCREMENT,
  `idEmpleado` int NOT NULL,
  `periodoInicio` date NOT NULL,
  `periodoFin` date NOT NULL,
  `totalHoras` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `tarifaHoraAplicada` decimal(10, 2) NOT NULL,
  `totalPagar` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `fechaGeneracion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idNomina`),
  UNIQUE KEY `UK_NOMINA_PERIODO` (`idEmpleado`,
`periodoInicio`,
`periodoFin`),
  KEY `idEmpleado` (`idEmpleado`),
  CONSTRAINT `Nomina_ibfk_1` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleado` (`idEmpleado`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `OrdenGarantia` (
  `idOrdenGarantia` int NOT NULL AUTO_INCREMENT,
  `ordenOrigenId` int NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'abierta',
  `costoInterno` decimal(10, 2) DEFAULT NULL,
  `fechaApertura` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notasSeguimiento` text,
  PRIMARY KEY (`idOrdenGarantia`),
  KEY `ordenOrigenId` (`ordenOrigenId`),
  CONSTRAINT `OrdenGarantia_ibfk_1` FOREIGN KEY (`ordenOrigenId`) REFERENCES `OrdenServicio` (`idOrden`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `OrdenServicio` (
  `idOrden` int NOT NULL AUTO_INCREMENT,
  `folio` varchar(50) NOT NULL,
  `fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` varchar(50) NOT NULL DEFAULT 'abierta',
  `kilometrajeIngreso` int DEFAULT NULL,
  `nivelBateriaIngreso` int DEFAULT NULL,
  `metodoPago` varchar(50) DEFAULT NULL,
  `totalFactura` decimal(10, 2) DEFAULT NULL,
  `pagoConfirmado` tinyint(1) NOT NULL DEFAULT '0',
  `idCliente` int NOT NULL,
  `idVehiculo` int NOT NULL,
  `idTecnico` int DEFAULT NULL,
  `idAsesor` int DEFAULT NULL,
  PRIMARY KEY (`idOrden`),
  UNIQUE KEY `folio` (`folio`),
  KEY `idCliente` (`idCliente`),
  KEY `idVehiculo` (`idVehiculo`),
  KEY `idTecnico` (`idTecnico`),
  KEY `idAsesor` (`idAsesor`),
  CONSTRAINT `OrdenServicio_ibfk_1` FOREIGN KEY (`idCliente`) REFERENCES `Cliente` (`idCliente`),
  CONSTRAINT `OrdenServicio_ibfk_2` FOREIGN KEY (`idVehiculo`) REFERENCES `Vehiculo` (`idVehiculo`),
  CONSTRAINT `OrdenServicio_ibfk_3` FOREIGN KEY (`idTecnico`) REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `OrdenServicio_ibfk_4` FOREIGN KEY (`idAsesor`) REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `PerfilTecnico` (
  `idPerfilTecnico` int NOT NULL AUTO_INCREMENT,
  `idEmpleado` int NOT NULL,
  `cargaActual` int NOT NULL DEFAULT '0',
  `especialidad` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idPerfilTecnico`),
  UNIQUE KEY `idEmpleado` (`idEmpleado`),
  CONSTRAINT `PerfilTecnico_ibfk_1` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleado` (`idEmpleado`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Permiso` (
  `idPermiso` int NOT NULL AUTO_INCREMENT,
  `modulo` varchar(50) NOT NULL,
  `accion` varchar(30) NOT NULL,
  `descripcion` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`idPermiso`),
  UNIQUE KEY `uq_modulo_accion` (`modulo`,
`accion`)
) ENGINE = InnoDB AUTO_INCREMENT = 17 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `PreguntaSeguridad` (
  `idPregunta` int NOT NULL AUTO_INCREMENT,
  `textoPregunta` varchar(255) NOT NULL,
  PRIMARY KEY (`idPregunta`),
  UNIQUE KEY `textoPregunta` (`textoPregunta`)
) ENGINE = InnoDB AUTO_INCREMENT = 7 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `PuntoFidelidad` (
  `idMovimiento` int NOT NULL AUTO_INCREMENT,
  `tipoMovimiento` varchar(50) NOT NULL,
  `puntos` int NOT NULL DEFAULT '0',
  `fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `porcentajeDescuentoAplicado` decimal(5, 2) DEFAULT NULL,
  `idCliente` int NOT NULL,
  `idOrden` int DEFAULT NULL,
  PRIMARY KEY (`idMovimiento`),
  KEY `idCliente` (`idCliente`),
  KEY `idOrden` (`idOrden`),
  CONSTRAINT `PuntoFidelidad_ibfk_1` FOREIGN KEY (`idCliente`) REFERENCES `Cliente` (`idCliente`),
  CONSTRAINT `PuntoFidelidad_ibfk_2` FOREIGN KEY (`idOrden`) REFERENCES `OrdenServicio` (`idOrden`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `RecordatorioPreventivo` (
  `idRecordatorio` int NOT NULL AUTO_INCREMENT,
  `canal` varchar(50) DEFAULT NULL,
  `fechaEnvio` datetime NOT NULL,
  `enviado` tinyint(1) NOT NULL DEFAULT '0',
  `idCliente` int NOT NULL,
  `idVehiculo` int NOT NULL,
  PRIMARY KEY (`idRecordatorio`),
  KEY `idCliente` (`idCliente`),
  KEY `idVehiculo` (`idVehiculo`),
  CONSTRAINT `RecordatorioPreventivo_ibfk_1` FOREIGN KEY (`idCliente`) REFERENCES `Cliente` (`idCliente`),
  CONSTRAINT `RecordatorioPreventivo_ibfk_2` FOREIGN KEY (`idVehiculo`) REFERENCES `Vehiculo` (`idVehiculo`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `RegistroHoras` (
  `idRegistro` int NOT NULL AUTO_INCREMENT,
  `idEmpleado` int NOT NULL,
  `fecha` date NOT NULL,
  `horasTrabajadas` decimal(10, 2) NOT NULL,
  `idOrdenServicio` int DEFAULT NULL,
  PRIMARY KEY (`idRegistro`),
  KEY `idEmpleado` (`idEmpleado`),
  KEY `idOrdenServicio` (`idOrdenServicio`),
  CONSTRAINT `RegistroHoras_ibfk_1` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleado` (`idEmpleado`),
  CONSTRAINT `RegistroHoras_ibfk_2` FOREIGN KEY (`idOrdenServicio`) REFERENCES `OrdenServicio` (`idOrden`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Repuesto` (
  `idRepuesto` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `categoria` varchar(100) DEFAULT NULL,
  `precioUnitario` decimal(10, 2) NOT NULL DEFAULT '0.00',
  `proveedor` varchar(100) DEFAULT NULL,
  `stockActual` int NOT NULL DEFAULT '0',
  `stockMinimo` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`idRepuesto`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Rol` (
  `idRol` int NOT NULL AUTO_INCREMENT,
  `nombreRol` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`idRol`),
  UNIQUE KEY `nombreRol` (`nombreRol`)
) ENGINE = InnoDB AUTO_INCREMENT = 5 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `RolPermiso` (
  `idRol` int NOT NULL,
  `idPermiso` int NOT NULL,
  `permitido` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idRol`,
`idPermiso`),
  KEY `idPermiso` (`idPermiso`),
  CONSTRAINT `RolPermiso_ibfk_1` FOREIGN KEY (`idRol`) REFERENCES `Rol` (`idRol`) ON
DELETE
    CASCADE,
    CONSTRAINT `RolPermiso_ibfk_2` FOREIGN KEY (`idPermiso`) REFERENCES `Permiso` (`idPermiso`) ON
    DELETE
        CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `TerminoGarantia` (
  `idTermino` int NOT NULL AUTO_INCREMENT,
  `categoria` varchar(100) NOT NULL,
  `textoLegal` text,
  `plazoGarantiaDias` int NOT NULL DEFAULT '0',
  `version` varchar(20) DEFAULT NULL,
  `vigente` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idTermino`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `TokenRecuperacion` (
  `idToken` int NOT NULL AUTO_INCREMENT,
  `token` varchar(255) NOT NULL,
  `fechaGeneracion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaExpiracion` datetime NOT NULL,
  `usado` tinyint(1) NOT NULL DEFAULT '0',
  `idUsuario` int NOT NULL,
  PRIMARY KEY (`idToken`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `TokenRecuperacion_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Usuario` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `correo` varchar(150) NOT NULL,
  `passwordHash` varchar(255) NOT NULL,
  `estado` tinyint(1) NOT NULL DEFAULT '1',
  `ultimoAcceso` datetime DEFAULT NULL,
  `idEmpleado` int NOT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `correo` (`correo`),
  KEY `idEmpleado` (`idEmpleado`),
  CONSTRAINT `Usuario_ibfk_1` FOREIGN KEY (`idEmpleado`) REFERENCES `Empleado` (`idEmpleado`)
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `UsuarioPreguntaSeguridad` (
  `idUsuarioPregunta` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `idPregunta` int NOT NULL,
  `respuestaHash` varchar(255) NOT NULL,
  PRIMARY KEY (`idUsuarioPregunta`),
  UNIQUE KEY `unico_usuario_pregunta` (`idUsuario`,
`idPregunta`),
  KEY `idPregunta` (`idPregunta`),
  CONSTRAINT `UsuarioPreguntaSeguridad_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `UsuarioPreguntaSeguridad_ibfk_2` FOREIGN KEY (`idPregunta`) REFERENCES `PreguntaSeguridad` (`idPregunta`)
) ENGINE = InnoDB AUTO_INCREMENT = 20 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `UsuarioRol` (
  `idUsuarioRol` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `idRol` int NOT NULL,
  `fechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fechaFin` datetime DEFAULT NULL,
  `asignadoPor` int NOT NULL,
  PRIMARY KEY (`idUsuarioRol`),
  KEY `idUsuario` (`idUsuario`),
  KEY `idRol` (`idRol`),
  KEY `asignadoPor` (`asignadoPor`),
  CONSTRAINT `UsuarioRol_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `Usuario` (`idUsuario`),
  CONSTRAINT `UsuarioRol_ibfk_2` FOREIGN KEY (`idRol`) REFERENCES `Rol` (`idRol`),
  CONSTRAINT `UsuarioRol_ibfk_3` FOREIGN KEY (`asignadoPor`) REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE `Vehiculo` (
  `idVehiculo` int NOT NULL AUTO_INCREMENT,
  `placa` varchar(20) NOT NULL,
  `marca` varchar(50) DEFAULT NULL,
  `modelo` varchar(50) DEFAULT NULL,
  `anio` int DEFAULT NULL,
  `serialMotor` varchar(100) DEFAULT NULL,
  `tipoVehiculo` varchar(50) DEFAULT NULL,
  `especificacionesBateria` varchar(255) DEFAULT NULL,
  `idCliente` int NOT NULL,
  PRIMARY KEY (`idVehiculo`),
  UNIQUE KEY `placa` (`placa`),
  KEY `idCliente` (`idCliente`),
  CONSTRAINT `Vehiculo_ibfk_1` FOREIGN KEY (`idCliente`) REFERENCES `Cliente` (`idCliente`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
