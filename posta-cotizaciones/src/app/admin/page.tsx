import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

type PreviewItem = {
  cantidad: number
  formato: string
  producto_id: string
  productos: { nombre: string } | null
}

async function getPreviewStats() {
  const supabase = createAdminClient()
  const { data: _items } = await supabase
    .from('cotizacion_items')
    .select('cantidad, formato, producto_id, productos(nombre)')

  const allItems = (_items ?? []) as unknown as PreviewItem[]

  // Top 5 products
  const rotMap = new Map<string, { nombre: string; total: number }>()
  for (const it of allItems) {
    if (!it.productos) continue
    const prev = rotMap.get(it.producto_id) ?? { nombre: it.productos.nombre, total: 0 }
    rotMap.set(it.producto_id, { ...prev, total: prev.total + it.cantidad })
  }
  const topProductos = [...rotMap.values()].sort((a, b) => b.total - a.total).slice(0, 5)

  // Format distribution
  const fmtMap = new Map<string, number>()
  for (const it of allItems) {
    fmtMap.set(it.formato, (fmtMap.get(it.formato) ?? 0) + it.cantidad)
  }
  const formatos = [...fmtMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)
  const totalFmt = formatos.reduce((s, [, v]) => s + v, 0)

  return { topProductos, formatos, totalFmt }
}

async function getStats() {
  const supabase = createAdminClient()
  const [
    { count: clientesActivos },
    { count: solicitudesPendientes },
    { count: presupuestosActivos },
    { count: presupuestosNuevos },
    { count: totalProductos },
    { count: promocionesActivas },
  ] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'aprobado'),
    supabase.from('clientes').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('cotizaciones').select('id', { count: 'exact', head: true }).in('estado', ['pendiente', 'enviada']),
    supabase.from('cotizaciones').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    supabase.from('productos').select('id', { count: 'exact', head: true }).eq('activo', true),
    supabase.from('promociones').select('id', { count: 'exact', head: true }).eq('activa', true),
  ])
  return {
    clientesActivos: clientesActivos ?? 0,
    solicitudesPendientes: solicitudesPendientes ?? 0,
    presupuestosActivos: presupuestosActivos ?? 0,
    presupuestosNuevos: presupuestosNuevos ?? 0,
    totalProductos: totalProductos ?? 0,
    promocionesActivas: promocionesActivas ?? 0,
  }
}

export default async function AdminHomePage() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  const [stats, preview] = await Promise.all([getStats(), getPreviewStats()])
  const maxRot = preview.topProductos[0]?.total ?? 1
  const maxFmt = preview.formatos[0]?.[1] ?? 1

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider">Panel Admin</p>
          <p className="text-base font-semibold text-gray-900">POSTA SRL</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/admin/solicitudes"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Panel completo →
          </Link>
          <form action="/api/logout" method="POST">
            <button className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Título */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Resumen general</h1>
          <p className="text-sm text-gray-400 mt-1">Vista rápida del estado de la plataforma</p>
        </div>

        {/* Alerta solicitudes */}
        {stats.solicitudesPendientes > 0 && (
          <Link href="/admin/solicitudes"
            className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-8 hover:bg-amber-100 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 text-amber-500 shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-800">
                  {stats.solicitudesPendientes} solicitud{stats.solicitudesPendientes !== 1 ? 'es' : ''} pendiente{stats.solicitudesPendientes !== 1 ? 's' : ''} de aprobación
                </p>
                <p className="text-sm text-amber-600">Hay clientes esperando acceso a la plataforma</p>
              </div>
            </div>
            <svg className="w-5 h-5 text-amber-400 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </Link>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <StatCard href="/admin/clientes" label="Clientes activos" value={stats.clientesActivos} color="blue"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
          />
          <StatCard href="/admin/solicitudes" label="Solicitudes pendientes" value={stats.solicitudesPendientes}
            color={stats.solicitudesPendientes > 0 ? 'amber' : 'gray'}
            badge={stats.solicitudesPendientes > 0 ? 'Requiere acción' : undefined}
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />}
          />
          <StatCard href="/admin/cotizaciones" label="Presupuestos activos" value={stats.presupuestosActivos} color="purple"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
          />
          <StatCard href="/admin/cotizaciones" label="Por revisar" value={stats.presupuestosNuevos}
            color={stats.presupuestosNuevos > 0 ? 'red' : 'gray'}
            badge={stats.presupuestosNuevos > 0 ? 'Sin responder' : undefined}
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />}
          />
        </div>

        {/* Accesos rápidos */}
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Secciones</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionCard href="/admin/solicitudes" title="Solicitudes"
            description="Aprobar o rechazar nuevos clientes"
            count={stats.solicitudesPendientes} countLabel="pendientes" urgent={stats.solicitudesPendientes > 0}
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />}
          />
          <ActionCard href="/admin/cotizaciones" title="Presupuestos"
            description="Descuentos, plazos y seguimiento"
            count={stats.presupuestosActivos} countLabel="activos"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />}
          />
          <ActionCard href="/admin/clientes" title="Clientes"
            description="Datos, márgenes y categorías"
            count={stats.clientesActivos} countLabel="registrados"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />}
          />
          <ActionCard href="/admin/productos" title="Productos"
            description="Catálogo, stock e imágenes"
            count={stats.totalProductos} countLabel="activos"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />}
          />
          <ActionCard href="/admin/promociones" title="Promociones"
            description="Descuentos por volumen y formato"
            count={stats.promocionesActivas} countLabel="activas"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />}
          />
          <ActionCard href="/admin/configuracion" title="Subcategorías"
            description="Márgenes por segmento de cliente"
            icon={<path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />}
          />
        </div>

        {/* ── Estadísticas preview ── */}
        <div className="mt-12 pt-10 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Estadísticas de demanda</h2>
              <p className="text-sm text-gray-400 mt-0.5">Resumen basado en todos los presupuestos</p>
            </div>
            <Link href="/admin/estadisticas"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
              Ver completo →
            </Link>
          </div>

          {preview.topProductos.length === 0 ? (
            <p className="text-sm text-gray-400">No hay datos de presupuestos aún.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Productos más solicitados */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Productos más solicitados</p>
                <div className="space-y-3">
                  {preview.topProductos.map((p, i) => (
                    <div key={p.nombre} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm text-gray-700 w-40 truncate" title={p.nombre}>{p.nombre}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((p.total / maxRot) * 100)}%` }} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 w-8 text-right">{p.total}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Formato packaging */}
              <div className="bg-white rounded-xl border border-gray-200 p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Preferencia de formato</p>
                <div className="space-y-3">
                  {preview.formatos.map(([fmt, total]) => (
                    <div key={fmt} className="flex items-center gap-3">
                      <span className="text-sm text-gray-700 w-28 truncate capitalize">{fmt}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-violet-500 rounded-full" style={{ width: `${Math.round((total / maxFmt) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{preview.totalFmt > 0 ? Math.round((total / preview.totalFmt) * 100) : 0}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function StatCard({ href, label, value, color, badge, icon }: {
  href: string; label: string; value: number
  color: 'blue' | 'amber' | 'purple' | 'red' | 'gray'
  badge?: string; icon: React.ReactNode
}) {
  const styles = {
    blue:   { card: 'bg-blue-50 border-blue-200',     num: 'text-blue-700',   ico: 'text-blue-400' },
    amber:  { card: 'bg-amber-50 border-amber-200',   num: 'text-amber-700',  ico: 'text-amber-400' },
    purple: { card: 'bg-purple-50 border-purple-200', num: 'text-purple-700', ico: 'text-purple-400' },
    red:    { card: 'bg-red-50 border-red-200',       num: 'text-red-700',    ico: 'text-red-400' },
    gray:   { card: 'bg-white border-gray-200',       num: 'text-gray-700',   ico: 'text-gray-300' },
  }
  const s = styles[color]
  return (
    <Link href={href} className={`rounded-xl border p-5 hover:shadow-md transition-shadow ${s.card}`}>
      <svg className={`w-6 h-6 mb-3 ${s.ico}`} fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
        {icon}
      </svg>
      <p className={`text-3xl font-bold ${s.num}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
      {badge && (
        <span className="inline-block mt-2 text-xs font-medium text-white bg-red-500 rounded-full px-2 py-0.5">
          {badge}
        </span>
      )}
    </Link>
  )
}

function ActionCard({ href, title, description, count, countLabel, urgent, icon }: {
  href: string; title: string; description: string
  count?: number; countLabel?: string; urgent?: boolean; icon: React.ReactNode
}) {
  return (
    <Link href={href}
      className={`bg-white rounded-xl border p-5 hover:shadow-md transition-all group flex flex-col gap-3 ${urgent ? 'border-amber-300' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <svg className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
          {icon}
        </svg>
        {count !== undefined && count > 0 && (
          <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${urgent ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
            {count} {countLabel}
          </span>
        )}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{title}</p>
        <p className="text-sm text-gray-400 mt-0.5">{description}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all self-end" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
      </svg>
    </Link>
  )
}
