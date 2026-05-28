import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import CatalogClient from './CatalogClient'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const [{ data: cliente }, { data: productos }, { data: promociones }, { data: config }, { data: plan }] = await Promise.all([
    supabase.from('clientes').select('id, subcategoria_id, subcategorias(pedido_plazo_dias, pedido_descuento)').eq('id', user!.id).single(),
    supabase.from('productos').select('id, nombre, descripcion, categoria, precio_base, stock, imagen_url, unidades_por_bulto, unidades_por_pallet, destacado, oferta_relamago, precio_oferta, nueva_linea').eq('activo', true).order('categoria').order('nombre'),
    supabase.from('promociones').select('*').eq('activa', true),
    admin.from('configuracion').select('clave, valor'),
    admin.from('plan_produccion').select('producto_id, fecha_estimada, cantidad_planificada').gte('fecha_estimada', new Date().toISOString().split('T')[0]).order('fecha_estimada', { ascending: true }),
  ])

  const cfg = Object.fromEntries((config ?? []).map(r => [r.clave, r.valor]))

  const subcategoriaId = cliente?.subcategoria_id ?? 'nuevo'
  const subcat = (cliente as any)?.subcategorias
  const pedidoPlazo    = Number(subcat?.pedido_plazo_dias ?? 0)
  const pedidoDescuento = Number(subcat?.pedido_descuento  ?? 0)

  const productosConPrecio = (productos ?? []).map(p => ({
    ...p,
    precioMostrado: (p.oferta_relamago && p.precio_oferta) ? p.precio_oferta : p.precio_base,
    margen: 0,
  }))

  const categorias = [...new Set(productosConPrecio.map(p => p.categoria).filter(Boolean))] as string[]

  // Próxima fecha de producción por producto (la más cercana futura)
  const planMap: Record<string, { fecha: string; cantidad: number }> = {}
  for (const entry of plan ?? []) {
    if (!planMap[entry.producto_id]) {
      planMap[entry.producto_id] = { fecha: entry.fecha_estimada, cantidad: entry.cantidad_planificada }
    }
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Catálogo de productos</h1>
      <CatalogClient
        productos={productosConPrecio}
        categorias={categorias}
        promociones={promociones ?? []}
        subcategoriaId={subcategoriaId}
        pedidoHabilitado={pedidoPlazo > 0}
        pedidoTexto={cfg['pedido_sin_stock_texto'] ?? ''}
        pedidoDescuento={pedidoDescuento}
        pedidoPlazo={pedidoPlazo}
        planProduccion={planMap}
      />
    </div>
  )
}
