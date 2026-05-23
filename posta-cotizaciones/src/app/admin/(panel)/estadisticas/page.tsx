import { createAdminClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 0

type ItemRow = {
  cantidad: number
  formato: string
  producto_id: string
  productos: { nombre: string; categoria: string | null } | null
  cotizacion_id: string
  cotizaciones: { estado: string; creado_en: string } | null
}

type CotizacionRow = {
  id: string
  estado: string
  creado_en: string
  cliente_id: string
}

type ClienteRow = {
  id: string
  razon_social: string
  tipo_comercio: string | null
  total_compras: number | null
}

async function getEstadisticas() {
  const supabase = createAdminClient()
  const now = Date.now()
  const hace6m = new Date(now - 180 * 86400000).toISOString()

  const [res1, res2, res3] = await Promise.all([
    supabase
      .from('cotizacion_items')
      .select('cantidad, formato, producto_id, productos(nombre, categoria), cotizacion_id, cotizaciones(estado, creado_en)'),
    supabase
      .from('cotizaciones')
      .select('id, estado, creado_en, cliente_id')
      .gte('creado_en', hace6m),
    supabase
      .from('clientes')
      .select('id, razon_social, tipo_comercio, total_compras')
      .eq('estado', 'aprobado'),
  ])

  const allItems = (res1.data ?? []) as unknown as ItemRow[]
  const allCot = (res2.data ?? []) as unknown as CotizacionRow[]
  const allClientes = (res3.data ?? []) as unknown as ClienteRow[]

  // ── Alta rotación ──────────────────────────────────────────────────────────
  const rotMap = new Map<string, { nombre: string; categoria: string; total: number }>()
  for (const it of allItems) {
    if (!it.productos) continue
    const prev = rotMap.get(it.producto_id) ?? {
      nombre: it.productos.nombre,
      categoria: it.productos.categoria ?? 'Sin categoría',
      total: 0,
    }
    rotMap.set(it.producto_id, { ...prev, total: prev.total + it.cantidad })
  }
  const altaRotacion = [...rotMap.values()].sort((a, b) => b.total - a.total).slice(0, 12)

  // ── Formato packaging ──────────────────────────────────────────────────────
  const fmtMap = new Map<string, number>()
  for (const it of allItems) {
    fmtMap.set(it.formato, (fmtMap.get(it.formato) ?? 0) + it.cantidad)
  }
  const formatos = [...fmtMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([fmt, total]) => ({ fmt, total }))

  // ── Aceleración (últimos 30d vs 30d anteriores) ────────────────────────────
  const hace30 = now - 30 * 86400000
  const hace60 = now - 60 * 86400000
  const accelMap = new Map<string, { nombre: string; reciente: number; anterior: number }>()
  for (const it of allItems) {
    if (!it.cotizaciones || !it.productos) continue
    const ts = new Date(it.cotizaciones.creado_en).getTime()
    const prev = accelMap.get(it.producto_id) ?? { nombre: it.productos.nombre, reciente: 0, anterior: 0 }
    if (ts >= hace30) prev.reciente += it.cantidad
    else if (ts >= hace60) prev.anterior += it.cantidad
    accelMap.set(it.producto_id, prev)
  }
  const acelerando = [...accelMap.values()]
    .filter(p => p.reciente > 0 || p.anterior > 0)
    .map(p => ({
      ...p,
      cambio: p.anterior === 0 ? (p.reciente > 0 ? 100 : 0) : Math.round(((p.reciente - p.anterior) / p.anterior) * 100),
    }))
    .sort((a, b) => b.cambio - a.cambio)
    .slice(0, 10)

  // ── Tendencia mensual (últimos 6 meses) ────────────────────────────────────
  const meses: { label: string; total: number; concretadas: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const yr = d.getFullYear()
    const mo = d.getMonth()
    const label = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })
    const mes = allCot.filter(c => {
      const cd = new Date(c.creado_en)
      return cd.getFullYear() === yr && cd.getMonth() === mo
    })
    meses.push({ label, total: mes.length, concretadas: mes.filter(c => c.estado === 'concretada').length })
  }

  // ── Conversión (todos los estados) ────────────────────────────────────────
  const { data: _todosLosEstados } = await supabase.from('cotizaciones').select('estado')
  const todosLosEstados = (_todosLosEstados ?? []) as unknown as { estado: string }[]
  const estados: Record<string, number> = { pendiente: 0, enviada: 0, concretada: 0, cancelada: 0 }
  for (const c of todosLosEstados ?? []) {
    if (c.estado in estados) estados[c.estado]++
  }
  const totalCot = Object.values(estados).reduce((s, v) => s + v, 0)

  // ── Tipo de comercio ───────────────────────────────────────────────────────
  const tipoMap = new Map<string, number>()
  for (const cl of allClientes) {
    const t = cl.tipo_comercio ?? 'Sin especificar'
    tipoMap.set(t, (tipoMap.get(t) ?? 0) + 1)
  }
  const tiposComercio = [...tipoMap.entries()].sort((a, b) => b[1] - a[1]).map(([tipo, total]) => ({ tipo, total }))

  // ── Top clientes ───────────────────────────────────────────────────────────
  const topClientes = [...allClientes]
    .sort((a, b) => (b.total_compras ?? 0) - (a.total_compras ?? 0))
    .slice(0, 10)

  return { altaRotacion, formatos, acelerando, meses, estados, totalCot, tiposComercio, topClientes }
}

function pct(val: number, max: number) {
  if (max === 0) return 0
  return Math.round((val / max) * 100)
}

function Bar({ value, max, color = 'bg-blue-500' }: { value: number; max: number; color?: string }) {
  return (
    <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct(value, max)}%` }} />
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-5">{title}</h2>
      {children}
    </div>
  )
}

export default async function EstadisticasPage() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) redirect('/dashboard')

  const { altaRotacion, formatos, acelerando, meses, estados, totalCot, tiposComercio, topClientes } = await getEstadisticas()

  const maxRotacion = altaRotacion[0]?.total ?? 1
  const maxFormato = formatos[0]?.total ?? 1
  const maxMes = Math.max(...meses.map(m => m.total), 1)
  const maxCliente = topClientes[0]?.total_compras ?? 1
  const maxTipo = tiposComercio[0]?.total ?? 1

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Estadísticas de demanda</h1>
          <p className="text-sm text-gray-400 mt-1">Análisis basado en todos los presupuestos registrados</p>
        </div>
        <Link href="/admin" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Volver al inicio
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Alta rotación */}
        <SectionCard title="Productos más solicitados">
          {altaRotacion.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {altaRotacion.map((p, i) => (
                <div key={p.nombre} className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                  <span className="text-sm text-gray-700 w-44 truncate" title={p.nombre}>{p.nombre}</span>
                  <Bar value={p.total} max={maxRotacion} color="bg-blue-500" />
                  <span className="text-sm font-semibold text-gray-800 w-10 text-right">{p.total}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Formato packaging */}
        <SectionCard title="Preferencia de formato / packaging">
          {formatos.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {formatos.map(({ fmt, total }) => (
                <div key={fmt} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-32 truncate capitalize">{fmt}</span>
                  <Bar value={total} max={maxFormato} color="bg-violet-500" />
                  <span className="text-sm font-semibold text-gray-800 w-10 text-right">{total}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">
                    {pct(total, formatos.reduce((s, f) => s + f.total, 0))}%
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Tendencia mensual */}
        <SectionCard title="Tendencia mensual (últimos 6 meses)">
          {meses.every(m => m.total === 0) ? (
            <p className="text-sm text-gray-400">Sin datos en este período</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {meses.map(m => (
                <div key={m.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                    <div className="w-full relative">
                      <div
                        className="w-full bg-blue-100 rounded-t"
                        style={{ height: `${pct(m.total, maxMes) * 0.96}px`, minHeight: m.total > 0 ? '4px' : '0' }}
                      />
                      {m.concretadas > 0 && (
                        <div
                          className="absolute bottom-0 w-full bg-blue-500 rounded-t"
                          style={{ height: `${pct(m.concretadas, maxMes) * 0.96}px`, minHeight: '2px' }}
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 capitalize">{m.label}</span>
                  <span className="text-xs font-semibold text-gray-600">{m.total}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-blue-100 inline-block" /> Total
            </span>
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" /> Concretadas
            </span>
          </div>
        </SectionCard>

        {/* Conversión */}
        <SectionCard title="Conversión de presupuestos">
          {totalCot === 0 ? (
            <p className="text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {([
                { key: 'concretada', label: 'Concretado', color: 'bg-green-500' },
                { key: 'enviada', label: 'Enviado / en negociación', color: 'bg-blue-400' },
                { key: 'pendiente', label: 'Pendiente de revisión', color: 'bg-amber-400' },
                { key: 'cancelada', label: 'Cancelado', color: 'bg-red-400' },
              ] as const).map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-44">{label}</span>
                  <Bar value={estados[key]} max={totalCot} color={color} />
                  <span className="text-sm font-semibold text-gray-800 w-8 text-right">{estados[key]}</span>
                  <span className="text-xs text-gray-400 w-10 text-right">{pct(estados[key], totalCot)}%</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Productos acelerando */}
        <SectionCard title="Productos en alza (últimos 30 días vs período anterior)">
          {acelerando.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos suficientes para comparar períodos</p>
          ) : (
            <div className="space-y-2">
              {acelerando.slice(0, 8).map(p => (
                <div key={p.nombre} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-sm text-gray-700 truncate flex-1 mr-4" title={p.nombre}>{p.nombre}</span>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400">{p.anterior} → {p.reciente}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      p.cambio > 0 ? 'bg-green-100 text-green-700' :
                      p.cambio < 0 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {p.cambio > 0 ? '+' : ''}{p.cambio}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Tipo de comercio */}
        <SectionCard title="Clientes por tipo de comercio">
          {tiposComercio.length === 0 ? (
            <p className="text-sm text-gray-400">Sin datos aún</p>
          ) : (
            <div className="space-y-3">
              {tiposComercio.map(({ tipo, total }) => (
                <div key={tipo} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 w-40 truncate capitalize">{tipo}</span>
                  <Bar value={total} max={maxTipo} color="bg-teal-500" />
                  <span className="text-sm font-semibold text-gray-800 w-6 text-right">{total}</span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Top clientes */}
        <div className="lg:col-span-2">
          <SectionCard title="Top clientes por volumen de compras">
            {topClientes.length === 0 ? (
              <p className="text-sm text-gray-400">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {topClientes.map((cl, i) => (
                  <div key={cl.id} className="flex items-center gap-3">
                    <span className="text-xs text-gray-400 w-5 text-right">{i + 1}</span>
                    <span className="text-sm text-gray-700 w-56 truncate">{cl.razon_social}</span>
                    <span className="text-xs text-gray-400 w-32 truncate capitalize">{cl.tipo_comercio ?? '—'}</span>
                    <Bar value={cl.total_compras ?? 0} max={maxCliente} color="bg-indigo-500" />
                    <span className="text-sm font-semibold text-gray-800 w-24 text-right">
                      ${(cl.total_compras ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

      </div>
    </div>
  )
}
