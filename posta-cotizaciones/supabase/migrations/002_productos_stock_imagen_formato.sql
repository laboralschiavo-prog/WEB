-- Agregar imagen y stock a productos
ALTER TABLE productos ADD COLUMN IF NOT EXISTS imagen_url text;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS stock int NOT NULL DEFAULT 0;

-- Agregar formato de entrega por ítem de cotización
ALTER TABLE cotizacion_items ADD COLUMN IF NOT EXISTS formato_entrega text;   -- pallet | bultos | unidades
ALTER TABLE cotizacion_items ADD COLUMN IF NOT EXISTS formato_cantidad numeric; -- cantidad por unidad de formato (ej: 12 unidades por bulto)

-- Bucket público para imágenes de productos
INSERT INTO storage.buckets (id, name, public) VALUES ('productos', 'productos', true)
  ON CONFLICT DO NOTHING;

-- Cualquier usuario autenticado puede subir imágenes (la verificación de admin se hace en el server component)
CREATE POLICY "auth_upload_productos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'productos');

CREATE POLICY "auth_update_productos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'productos');

CREATE POLICY "public_read_productos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'productos');
