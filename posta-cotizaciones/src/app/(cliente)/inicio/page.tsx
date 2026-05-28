import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function InicioPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  const [
    { data: cliente },
    { count: totalProductos },
    { count: totalSinStock },
    { data: presupuestos },
    { data: config },
  ] = await Promise.all([
    supabase.from('clientes').select('razon_social, email, subcategorias(pedido_plazo_dias)').eq('id', user.id).single(),
    admin.from('productos').select('*', { count: 'exact', head: true }).eq('activo', true).gt('stock', 0),
    admin.from('productos').select('*', { count: 'exact', head: true }).eq('activo', true).eq('stock', 0),
    supabase.from('cotizaciones').select('id, estado, creado_en').eq('cliente_id', user.id).in('estado', ['pendiente', 'enviada']).order('creado_en', { ascending: false }).limit(5),
    admin.from('configuracion').select('clave, valor'),
  ])

  const cfg = Object.fromEntries((config ?? []).map(r => [r.clave, r.valor]))
  const pedidoPlazo = Number((cliente as any)?.subcategorias?.pedido_plazo_dias ?? 0)
  const pedidoHabilitado = pedidoPlazo > 0
  const pedidoTexto = cfg['pedido_sin_stock_texto'] ?? ''
  const nombre = cliente?.razon_social ?? cliente?.email ?? 'Cliente'
  const presupuestosActivos = presupuestos?.length ?? 0

  const estadoLabel: Record<string, string> = {
    pendiente: 'Pendiente',
    enviada: 'Enviado',
    negociando: 'En negociación',
  }
  const estadoColor: Record<string, string> = {
    pendiente: 'bg-yellow-100 text-yellow-700',
    enviada: 'bg-blue-100 text-blue-700',
    negociando: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className="space-y-8">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Bienvenido, {nombre}</h1>
        <p className="text-sm text-gray-400 mt-1">Plataforma de presupuestos POSTA SRL</p>
      </div>

      {/* Cards de acceso rápido */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/dashboard"
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Catálogo de productos</span>
          </div>
          <p className="text-sm text-gray-500">
            {totalProductos ?? 0} {totalProductos === 1 ? 'producto disponible' : 'productos disponibles'}
          </p>
          <p className="text-xs text-blue-600 mt-2 group-hover:underline">Ir al catálogo →</p>
        </Link>

        <Link href="/cotizaciones"
          className="group bg-white rounded-xl border border-gray-200 p-5 hover:border-gray-300 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-medium text-gray-900">Mis presupuestos</span>
          </div>
          <p className="text-sm text-gray-500">
            {presupuestosActivos === 0
              ? 'Sin presupuestos activos'
              : `${presupuestosActivos} ${presupuestosActivos === 1 ? 'presupuesto activo' : 'presupuestos activos'}`}
          </p>
          <p className="text-xs text-gray-500 mt-2 group-hover:underline">Ver presupuestos →</p>
        </Link>
      </div>

      {/* Presupuestos recientes */}
      {presupuestos && presupuestos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">Presupuestos activos</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-gray-100">
                {presupuestos.map(p => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 text-gray-500 text-xs font-mono">#{p.id.slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${estadoColor[p.estado] ?? 'bg-gray-100 text-gray-500'}`}>
                        {estadoLabel[p.estado] ?? p.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs text-right">
                      {new Date(p.creado_en).toLocaleDateString('es-AR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Banner pedidos sin stock */}
      {pedidoHabilitado && (totalSinStock ?? 0) > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4 flex items-start gap-3">
          <svg className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-orange-800">Productos a pedido disponibles</p>
            <p className="text-xs text-orange-600 mt-0.5">{pedidoTexto}</p>
            <Link href="/dashboard" className="text-xs text-orange-700 underline mt-1 inline-block">
              Ver productos a pedido →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
