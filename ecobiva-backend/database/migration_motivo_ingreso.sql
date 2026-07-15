-- =============================================================================
-- Migración: Motivo de ingreso + nivel de batería capturado en Diagnóstico
-- =============================================================================
-- Pensada para correr UNA VEZ contra tu BD existente. No borra nada.
--
-- Qué hace, en orden:
--   1. Agrega `motivoIngreso` a OrdenServicio (decisión 3.1 de la bitácora:
--      "el cliente indica por qué trae el vehículo, ej. 'la moto no
--      enciende'". Es NULL-able porque las órdenes ya existentes no lo
--      tienen y no hay forma de reconstruirlo retroactivamente).
--   2. Agrega `nivelBateria` a Diagnostico (decisión 3.2 de la bitácora: el
--      nivel de batería ya NO se pide al cliente al crear la orden, lo mide
--      el técnico durante el diagnóstico con sus propias herramientas).
--      OrdenServicio.nivelBateriaIngreso NO se elimina en esta migración
--      para no perder el histórico de órdenes ya creadas con ese dato; el
--      backend y el frontend simplemente dejan de pedirlo/llenarlo al crear.
-- =============================================================================

ALTER TABLE `OrdenServicio`
  ADD COLUMN `motivoIngreso` VARCHAR(500) NULL AFTER `nivelBateriaIngreso`;

ALTER TABLE `Diagnostico`
  ADD COLUMN `nivelBateria` INT NULL AFTER `tipoDiagnostico`;
