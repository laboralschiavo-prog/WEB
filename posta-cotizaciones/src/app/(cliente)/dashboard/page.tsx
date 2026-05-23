import { createClient } from '@/lib/supabase/server'
import CatalogClient from './CatalogClient'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: cliente }, { data: productos }, { data: promociones }] = await Promise.all([
    supabase.from('clientes').select('id, subcategoria_id').eq('id', user!.id).single(),
    supabase.from('productos').select('id, nombre, descripcion, categoria, precio_base, stock, imagen_url, unidades_por_bulto, unidades_por_pallet').eq('activo', true).order('categoria').order('nombre'),
    supabase.from('promociones').select('*').eq('activa', true),
  ])

  const subcategoriaId = cliente?.subcategoria_id ?? 'nuevo'

  const productosConPrecio = (productos ?? []).map(p => ({
    ...p,
    precioMostrado: p.precio_base,
    margen: 0,
  }))

  const categorias = [...new Set(productosConPrecio.map(p => p.categoria).filter(Boolean))] as string[]

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Catálogo de productos</h1>
      <CatalogClient
        productos={productosConPrecio}
        categorias={categorias}
        promociones={promociones ?? []}
        subcategoriaId={subcategoriaId}
      />
    </div>
  )
}
