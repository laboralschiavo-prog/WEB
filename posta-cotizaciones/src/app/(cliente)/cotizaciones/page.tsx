import { createClient } from '@/lib/supabase/server'
import PresupuestosClient from './PresupuestosClient'

export const revalidate = 0

const DIAS_ARCHIVO = Number(process.env.DIAS_ARCHIVADO ?? 30)

export default async function CotizacionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DIAS_ARCHIVO)

  // Mostrar: presupuestos activos + cancelados/concretados de los últimos DIAS_ARCHIVO días
  const { data: cotizaciones } = await supabase
    .from('cotizaciones')
    .select('id, estado, total_calculado, descuento_porcentaje, plazo_entrega_dias, creado_en, cotizacion_items(id, cantidad, precio_mostrado, formato_entrega, formato_cantidad, productos(nombre)), cotizacion_notas(id, texto, creado_en)')
    .eq('cliente_id', user!.id)
    .or(`estado.in.(pendiente,enviada),creado_en.gte.${cutoff.toISOString()}`)
    .order('creado_en', { ascending: false })

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Mis presupuestos</h1>
      <PresupuestosClient presupuestos={(cotizaciones as any) ?? []} />
    </div>
  )
}
