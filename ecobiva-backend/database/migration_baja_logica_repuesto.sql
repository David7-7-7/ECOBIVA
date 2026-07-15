-- Conserva el historial de kardex, diagnósticos y alertas cuando un repuesto
-- deja de estar disponible en el inventario.
ALTER TABLE Repuesto
  ADD COLUMN activo TINYINT(1) NOT NULL DEFAULT 1 AFTER stockMinimo;
