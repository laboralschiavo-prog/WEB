-- Secciones especiales del catálogo
ALTER TABLE productos ADD COLUMN IF NOT EXISTS destacado boolean NOT NULL DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS oferta_relamago boolean NOT NULL DEFAULT false;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_oferta numeric;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS nueva_linea boolean NOT NULL DEFAULT false;
