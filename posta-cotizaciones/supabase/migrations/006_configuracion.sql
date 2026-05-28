-- 006_configuracion.sql
-- Tabla de configuración general de la plataforma (clave/valor)

CREATE TABLE IF NOT EXISTS configuracion (
  clave TEXT PRIMARY KEY,
  valor TEXT NOT NULL
);

INSERT INTO configuracion (clave, valor) VALUES
  ('pedido_sin_stock_habilitado', 'false'),
  ('pedido_sin_stock_texto',      'Pedido anticipado — consultá las condiciones especiales con tu vendedor.'),
  ('pedido_sin_stock_descuento',  '0')
ON CONFLICT (clave) DO NOTHING;
