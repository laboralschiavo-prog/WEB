-- 008_plan_produccion.sql

-- Tabla de plan de producción por producto
CREATE TABLE IF NOT EXISTS plan_produccion (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  producto_id      UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  fecha_estimada   DATE NOT NULL,
  cantidad_planificada INTEGER NOT NULL DEFAULT 0,
  notas            TEXT,
  creado_en        TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: cuando stock llega a 0, el producto se desactiva automáticamente
CREATE OR REPLACE FUNCTION auto_inactivar_sin_stock()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock = 0 THEN
    NEW.activo := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_inactivar ON productos;
CREATE TRIGGER trg_auto_inactivar
BEFORE INSERT OR UPDATE OF stock ON productos
FOR EACH ROW
EXECUTE FUNCTION auto_inactivar_sin_stock();

-- Retroactivo: inactivar productos que ya tienen stock = 0
UPDATE productos SET activo = false WHERE stock = 0 AND activo = true;
