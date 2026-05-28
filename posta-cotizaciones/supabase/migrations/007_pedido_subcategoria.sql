-- 007_pedido_subcategoria.sql
-- Agrega configuración de pedidos sin stock por categoría de cliente
-- pedido_plazo_dias = 0 → categoría no puede pedir sin stock
-- pedido_plazo_dias > 0 → puede pedir, con ese plazo estimado en días
-- pedido_descuento   → % de descuento que se aplica en esos pedidos

ALTER TABLE subcategorias
  ADD COLUMN IF NOT EXISTS pedido_plazo_dias integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pedido_descuento  numeric  NOT NULL DEFAULT 0;
