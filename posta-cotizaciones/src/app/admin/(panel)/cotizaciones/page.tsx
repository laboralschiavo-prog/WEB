import { createAdminClient } from '@/lib/supabase/server'
import CotizacionesTabla from '../../components/CotizacionesTabla'

export const revalidate = 0

const DIAS_ARCHIVO = Number(process.env.DIAS_ARCHIVADO ?? 30)

export default async function AdminCotizacionesPage({
  searchParams,
}: {
  searchParams: { archivados?: string }
}) {
  const supabase = createAdminClient()
  const verArchivados = searchParams?.archivados === '1'

  let query = supabase
    .from('cotizaciones')
    .select('id, cliente_id, estado, total_calculado, descuento_porcentaje, plazo_entrega_dias, creado_en, clientes(email, razon_social), cotizacion_items(id, cantidad, precio_mostrado, formato_entrega, formato_cantidad, productos(nombre)), cotizacion_notas(id, texto, creado_en)')
    .order('creado_en', { ascending: false })

  if (!verArchivados) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - DIAS_ARCHIVO)
    query = query.or(`estado.in.(pendiente,enviada),creado_en.gte.${cutoff.toISOString()}`) as any
  }

  const { data: cotizaciones } = await query

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Presupuestos</h1>
          {!verArchivados && (
            <p className="text-xs text-gray-400 mt-0.5">
              Mostrando activos y cerrados de los últimos {DIAS_ARCHIVO} días
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/admin/cotizaciones-export"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </a>
          <a
            href={verArchivados ? '/admin/cotizaciones' : '/admin/cotizaciones?archivados=1'}
            className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              verArchivados
                ? 'bg-gray-900 text-white border-gray-900'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {verArchivados ? 'Ocultar archivados' : 'Ver archivados'}
          </a>
        </div>
      </div>
      <CotizacionesTabla cotizaciones={(cotizaciones as any) ?? []} />
    </div>
  )
}

