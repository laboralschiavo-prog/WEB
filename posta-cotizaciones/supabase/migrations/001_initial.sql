-- Subcategorías con márgenes configurables
CREATE TABLE subcategorias (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  margen_porcentaje numeric NOT NULL DEFAULT 0.40,
  compras_requeridas int NOT NULL DEFAULT 5,
  orden int NOT NULL DEFAULT 0
);

INSERT INTO subcategorias (id, nombre, margen_porcentaje, compras_requeridas, orden) VALUES
  ('nuevo',     'Cliente Nuevo',     0.40, 5,  1),
  ('frecuente', 'Cliente Frecuente', 0.25, 15, 2),
  ('premium',   'Cliente Premium',   0.15, 30, 3),
  ('vip',       'Cliente VIP',       0.10, 0,  4);

-- Clientes (extiende auth.users de Supabase)
CREATE TABLE clientes (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email text NOT NULL,
  telefono text,
  cuit text UNIQUE NOT NULL,
  tipo_comercio text NOT NULL,
  direccion text,
  razon_social text,
  subcategoria_id text NOT NULL REFERENCES subcategorias DEFAULT 'nuevo',
  margen_personalizado numeric,          -- solo para VIP manuales
  total_compras int NOT NULL DEFAULT 0,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | aprobado | rechazado
  motivo_rechazo text,
  aprobado_por uuid REFERENCES auth.users,
  aprobado_en timestamptz,
  creado_en timestamptz DEFAULT now()
);

-- Productos
CREATE TABLE productos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre text NOT NULL,
  descripcion text,
  precio_base numeric NOT NULL,          -- confidencial, nunca se expone al cliente
  categoria text,
  activo boolean NOT NULL DEFAULT true,
  creado_en timestamptz DEFAULT now()
);

-- Cotizaciones
CREATE TABLE cotizaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes ON DELETE CASCADE,
  estado text NOT NULL DEFAULT 'pendiente', -- pendiente | enviada | negociando | concretada | cancelada
  total_calculado numeric NOT NULL DEFAULT 0,
  notas text,
  creado_en timestamptz DEFAULT now(),
  actualizado_en timestamptz DEFAULT now()
);

-- Ítems de cotización
CREATE TABLE cotizacion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cotizacion_id uuid NOT NULL REFERENCES cotizaciones ON DELETE CASCADE,
  producto_id uuid NOT NULL REFERENCES productos,
  cantidad int NOT NULL DEFAULT 1,
  precio_base_snapshot numeric NOT NULL,     -- precio al momento de cotizar
  margen_aplicado numeric NOT NULL,
  precio_mostrado numeric NOT NULL,          -- precio_base × (1 + margen)
  precio_negociado numeric                   -- si el vendedor negoció
);

-- Compras concretadas (para tracking de ascenso de subcategoría)
CREATE TABLE compras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes ON DELETE CASCADE,
  cotizacion_id uuid REFERENCES cotizaciones,
  monto_total numeric NOT NULL,
  creado_en timestamptz DEFAULT now()
);

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE clientes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizaciones     ENABLE ROW LEVEL SECURITY;
ALTER TABLE cotizacion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE compras          ENABLE ROW LEVEL SECURITY;

-- Clientes: cada uno solo ve su propio registro
CREATE POLICY "cliente_ve_propio"
  ON clientes FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "cliente_actualiza_propio"
  ON clientes FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Productos: clientes aprobados ven nombre/descripción/precio_mostrado (NO precio_base)
-- precio_base se calcula en el servidor, nunca sale al cliente via RLS
CREATE POLICY "clientes_ven_productos_activos"
  ON productos FOR SELECT TO authenticated
  USING (activo = true);

-- Cotizaciones: cada cliente solo ve las suyas
CREATE POLICY "cliente_ve_sus_cotizaciones"
  ON cotizaciones FOR SELECT TO authenticated
  USING (cliente_id = auth.uid());

CREATE POLICY "cliente_crea_cotizacion"
  ON cotizaciones FOR INSERT TO authenticated
  WITH CHECK (cliente_id = auth.uid());

-- Items de cotización
CREATE POLICY "cliente_ve_sus_items"
  ON cotizacion_items FOR SELECT TO authenticated
  USING (
    cotizacion_id IN (SELECT id FROM cotizaciones WHERE cliente_id = auth.uid())
  );

-- Compras
CREATE POLICY "cliente_ve_sus_compras"
  ON compras FOR SELECT TO authenticated
  USING (cliente_id = auth.uid());

-- ─── FUNCIÓN: ascenso automático de subcategoría ──────────────────────────────

CREATE OR REPLACE FUNCTION revisar_ascenso_subcategoria()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_compras int;
  v_subcategoria text;
  v_siguiente text;
  v_compras_req int;
BEGIN
  SELECT total_compras, subcategoria_id
    INTO v_compras, v_subcategoria
    FROM clientes WHERE id = NEW.cliente_id;

  -- Buscar la siguiente subcategoría (mayor orden) que el cliente aún no alcanzó
  SELECT s.id, s.compras_requeridas
    INTO v_siguiente, v_compras_req
    FROM subcategorias s
   WHERE s.orden > (SELECT orden FROM subcategorias WHERE id = v_subcategoria)
     AND s.id != 'vip'                  -- VIP solo se asigna manualmente
   ORDER BY s.orden
   LIMIT 1;

  IF v_siguiente IS NOT NULL AND v_compras >= v_compras_req THEN
    UPDATE clientes
       SET subcategoria_id = v_siguiente
     WHERE id = NEW.cliente_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_ascenso_subcategoria
  AFTER INSERT ON compras
  FOR EACH ROW EXECUTE FUNCTION revisar_ascenso_subcategoria();

-- Actualizar total_compras al insertar compra
CREATE OR REPLACE FUNCTION incrementar_compras()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE clientes SET total_compras = total_compras + 1 WHERE id = NEW.cliente_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_incrementar_compras
  AFTER INSERT ON compras
  FOR EACH ROW EXECUTE FUNCTION incrementar_compras();
