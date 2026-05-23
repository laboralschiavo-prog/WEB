import { createAdminClient } from '@/lib/supabase/server'
import SubcategoriaEditor from '../../components/SubcategoriaEditor'

export const revalidate = 0

export default async function AdminConfiguracionPage() {
  const supabase = createAdminClient()

  const [{ data: subcategorias }, { data: promociones }] = await Promise.all([
    supabase.from('subcategorias').select('*').order('orden'),
    supabase.from('promociones').select('id, nombre, subcategoria_ids, activa').order('nombre'),
  ])

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Configuración de categorías</h1>
      <p className="text-sm text-gray-500 mb-6">
        Definí cuántas compras se necesitan para ascender de categoría y qué promociones exclusivas puede ver cada una.
      </p>
      <div className="space-y-3">
        {subcategorias?.map(s => (
          <SubcategoriaEditor
            key={s.id}
            subcategoria={s}
            promociones={(promociones ?? []) as any}
          />
        ))}
      </div>
    </div>
  )
}
