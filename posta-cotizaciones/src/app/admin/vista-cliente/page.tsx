import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CatalogClient from '@/app/(cliente)/dashboard/CatalogClient'

export const revalidate = 0

export default async function VistaClientePage() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  const supabase = createAdminClient()

  const [{ data: productos }, { data: promociones }, { data: config }] = await Promise.all([
    supabase
      .from('productos')
      .select('id, nombre, descripcion, categoria, precio_base, stock, imagen_url, unidades_por_bulto, unidades_por_pallet, destacado, oferta_relamago, precio_oferta, nueva_linea')
      .eq('activo', true)
      .order('categoria')
      .order('nombre'),
    supabase.from('promociones').select('*').eq('activa', true),
    supabase.from('configuracion').select('clave, valor'),
  ])
  const cfg = Object.fromEntries((config ?? []).map(r => [r.clave, r.valor]))

  const productosConPrecio = (productos ?? []).map(p => ({
    ...p,
    precioMostrado: (p.oferta_relamago && p.precio_oferta) ? p.precio_oferta : p.precio_base,
    margen: 0,
  }))

  const categorias = [...new Set(productosConPrecio.map(p => p.categoria).filter(Boolean))] as string[]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner admin */}
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-amber-800">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="font-medium">Vista previa del cliente</span>
          <span className="text-amber-600">— Estás viendo el catálogo tal como lo ven tus clientes</span>
        </div>
        <Link
          href="/admin"
          className="text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors flex items-center gap-1"
        >
          ← Volver al panel
        </Link>
      </div>

      {/* Header igual al del cliente */}
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">POSTA SRL</span>
            <nav className="flex gap-4 text-sm">
              <span className="text-gray-900 font-medium">Productos</span>
              <span className="text-gray-400">Mis cotizaciones</span>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400 text-xs italic">vista admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Catálogo de productos</h1>
        <CatalogClient
          productos={productosConPrecio}
          categorias={categorias}
          promociones={promociones ?? []}
          subcategoriaId="nuevo"
          pedidoHabilitado={false}
          pedidoTexto={cfg['pedido_sin_stock_texto'] ?? ''}
          pedidoDescuento={0}
          pedidoPlazo={0}
        />
      </main>
    </div>
  )
}
