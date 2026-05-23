import { createAdminClient } from '@/lib/supabase/server'
import ProductosTabla from '../../components/ProductosTabla'

export const revalidate = 0

export default async function AdminProductosPage() {
  const supabase = createAdminClient()

  const { data: productos } = await supabase
    .from('productos')
    .select('*')
    .order('categoria', { ascending: true })
    .order('nombre', { ascending: true })

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Productos</h1>
      <ProductosTabla productos={productos ?? []} />
    </div>
  )
}

