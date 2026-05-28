import { createAdminClient } from '@/lib/supabase/server'
import PlanProduccionTabla from '../../components/PlanProduccionTabla'

export const revalidate = 0

export default async function PlanProduccionPage() {
  const supabase = createAdminClient()

  const [{ data: productos }, { data: plan }] = await Promise.all([
    supabase
      .from('productos')
      .select('id, nombre, descripcion, categoria, stock, activo, imagen_url')
      .order('stock', { ascending: true })
      .order('nombre', { ascending: true }),
    supabase
      .from('plan_produccion')
      .select('*')
      .order('fecha_estimada', { ascending: true }),
  ])

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Plan de producción</h1>
        <p className="text-sm text-gray-400 mt-1">
          Programá fechas de producción por producto. Esta información se muestra al cliente cuando pide un artículo sin stock.
        </p>
      </div>
      <PlanProduccionTabla
        productos={productos ?? []}
        plan={plan ?? []}
      />
    </div>
  )
}
