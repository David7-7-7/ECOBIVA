-- Migración: agrega columna telefono a Empleado (nullable, no rompe datos existentes).
-- Úsala solo si tu BD ya existía antes de este cambio. Si vas a reimportar
-- schema.sql desde cero, no hace falta correr esto: ya está incluido ahí.
ALTER TABLE `Empleado`
  ADD COLUMN `telefono` varchar(20) DEFAULT NULL AFTER `documento`;
