-- =============================================================================
-- Migración Tier 2: Diagnóstico con aprobación + Factura separada de la orden
-- =============================================================================
-- Pensada para correr UNA VEZ contra tu BD existente (no borra nada, no
-- reimporta el schema). Es segura de re-correr en el sentido de que si algo
-- falla a la mitad, revisa manualmente qué quedó aplicado antes de reintentar
-- (los ALTER con columnas que ya existen fallarán, eso es normal).
--
-- Qué hace, en orden:
--   1. Agrega tipoDiagnostico/costoDiagnostico a Diagnostico (para el caso
--      "diagnóstico profundo se cobra aunque el cliente no apruebe").
--   2. Crea la tabla Factura.
--   3. Si OrdenServicio ya tenía alguna orden con totalFactura/pagoConfirmado/
--      metodoPago con datos reales, los migra a una Factura antes de borrar
--      esas columnas (no se pierde nada).
--   4. Elimina totalFactura, pagoConfirmado y metodoPago de OrdenServicio
--      (ahora viven en Factura).
--
-- La columna `estado` de OrdenServicio es varchar(50) libre (no ENUM), así
-- que los nuevos estados del flujo (recibido, en_diagnostico,
-- pendiente_aprobacion, aprobada, rechazada, en_reparacion, finalizada,
-- entregada, cancelada) NO requieren ALTER — los valida el backend en JS.
-- =============================================================================

-- 1. Diagnostico: tipo (superficial/profundo) y costo del diagnóstico en sí.
--    Si es 'superficial' el diagnóstico es gratis (costoDiagnostico se deja en 0).
--    Si es 'profundo', el asesor pone el costo y ese es el monto que se cobra
--    si el cliente rechaza la reparación (ver Factura tipo='diagnostico').
ALTER TABLE `Diagnostico`
  ADD COLUMN `tipoDiagnostico` ENUM('superficial','profundo') NOT NULL DEFAULT 'superficial' AFTER `idOrdenServicio`,
  ADD COLUMN `costoDiagnostico` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `tipoDiagnostico`;

-- 2. Factura: se genera o bien al final de una reparación aprobada
--    (tipo='reparacion'), o cuando el cliente rechaza un diagnóstico
--    profundo que sí tenía costo (tipo='diagnostico').
CREATE TABLE `Factura` (
  `idFactura` int NOT NULL AUTO_INCREMENT,
  `idOrdenServicio` int NOT NULL,
  `numeroFactura` varchar(50) NOT NULL,
  `tipo` ENUM('diagnostico','reparacion') NOT NULL DEFAULT 'reparacion',
  `fechaEmision` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `subtotalManoObra` decimal(10,2) NOT NULL DEFAULT '0.00',
  `subtotalRepuestos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descuento` decimal(10,2) NOT NULL DEFAULT '0.00',
  `impuestos` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL DEFAULT '0.00',
  `metodoPago` varchar(50) DEFAULT NULL,
  `pagoConfirmado` tinyint(1) NOT NULL DEFAULT '0',
  `fechaPago` datetime DEFAULT NULL,
  `idUsuarioCreador` int DEFAULT NULL,
  PRIMARY KEY (`idFactura`),
  UNIQUE KEY `numeroFactura` (`numeroFactura`),
  -- Compuesta (no solo idOrdenServicio): una orden puede llegar a tener
  -- HASTA DOS facturas -> una de tipo 'diagnostico' (si el cliente rechazó
  -- un diagnóstico profundo) y, si luego cambia de opinión y repara, una de
  -- tipo 'reparacion'. Lo que no puede pasar es tener dos del mismo tipo.
  UNIQUE KEY `uq_orden_tipo` (`idOrdenServicio`, `tipo`),
  KEY `idUsuarioCreador` (`idUsuarioCreador`),
  CONSTRAINT `Factura_ibfk_1` FOREIGN KEY (`idOrdenServicio`) REFERENCES `OrdenServicio` (`idOrden`),
  CONSTRAINT `Factura_ibfk_2` FOREIGN KEY (`idUsuarioCreador`) REFERENCES `Usuario` (`idUsuario`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;

-- 3. Rescatar datos existentes de OrdenServicio antes de borrar columnas.
--    Solo inserta si alguna orden realmente tiene algo distinto de los
--    valores por defecto (el frontend nunca llenó esto, pero por si acaso
--    hay datos de pruebas manuales).
INSERT INTO Factura
  (idOrdenServicio, numeroFactura, tipo, subtotalManoObra, subtotalRepuestos, total, metodoPago, pagoConfirmado)
SELECT
  idOrden,
  CONCAT('FAC-LEGACY-', LPAD(idOrden, 6, '0')),
  'reparacion',
  0,
  0,
  COALESCE(totalFactura, 0),
  metodoPago,
  pagoConfirmado
FROM OrdenServicio
WHERE totalFactura IS NOT NULL OR pagoConfirmado = 1 OR metodoPago IS NOT NULL;

-- 4. Ahora sí, esas 3 columnas quedan obsoletas en OrdenServicio.
ALTER TABLE `OrdenServicio`
  DROP COLUMN `totalFactura`,
  DROP COLUMN `pagoConfirmado`,
  DROP COLUMN `metodoPago`;