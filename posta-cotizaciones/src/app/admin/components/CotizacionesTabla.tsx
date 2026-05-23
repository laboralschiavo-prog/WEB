'use client'

import { useState, useMemo, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrecio } from '@/lib/pricing'

type Item = {
  id: string
  cantidad: number
  precio_mostrado: number
  formato_entrega: string | null
  formato_cantidad: number | null
  productos: { nombre: string } | null
}

type Nota = {
  id: string
  texto: string
  creado_en: string
}

type Presupuesto = {
  id: string
  cliente_id: string
  estado: string
  total_calculado: number
  descuento_porcentaje: number
  plazo_entrega_dias: number
  creado_en: string
  clientes: { email: string; razon_social: string | null } | null
  cotizacion_items: Item[]
  cotizacion_notas: Nota[]
}

const ESTADOS = [
  { id: 'pendiente',  label: 'Pendiente',  class: 'bg-yellow-100 text-yellow-700' },
  { id: 'enviada',    label: 'Enviada',    class: 'bg-blue-100 text-blue-700' },
  { id: 'concretada', label: 'Concretada', class: 'bg-green-100 text-green-700' },
  { id: 'cancelada',  label: 'Cancelada',  class: 'bg-gray-100 text-gray-500' },
]

function badge(estado: string) {
  return ESTADOS.find(e => e.id === estado) ?? { label: estado, class: 'bg-gray-100 text-gray-500' }
}

function totalFinal(total: number, descuento: number) {
  return total * (1 - (descuento ?? 0) / 100)
}

export default function CotizacionesTabla({ cotizaciones }: { cotizaciones: Presupuesto[] }) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Presupuesto | null>(null)
  const [notas, setNotas] = useState<Nota[]>([])
  const [nuevaNota, setNuevaNota] = useState('')
  const [descuento, setDescuento] = useState(0)
  const [plazo, setPlazo] = useState(45)
  const [loading, setLoading] = useState(false)
  const [notaSaved, setNotaSaved] = useState(false)
  const [datosSaved, setDatosSaved] = useState(false)
  // Cancelación
  const [cancelando, setCancelando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [clienteDescuentos, setClienteDescuentos] = useState<{ id: string; descripcion: string; porcentaje: number }[]>([])
  const router = useRouter()

  // Agrupar por cliente
  const grupos = useMemo(() => {
    const map = new Map<string, { cliente: Presupuesto['clientes']; items: Presupuesto[] }>()
    for (const c of cotizaciones) {
      const key = c.cliente_id
      if (!map.has(key)) map.set(key, { cliente: c.clientes, items: [] })
      map.get(key)!.items.push(c)
    }
    return Array.from(map.entries())
  }, [cotizaciones])

  function toggleGroup(clienteId: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      next.has(clienteId) ? next.delete(clienteId) : next.add(clienteId)
      return next
    })
  }

  function openModal(c: Presupuesto) {
    setSelected(c)
    setNotas(c.cotizacion_notas ?? [])
    setDescuento(c.descuento_porcentaje ?? 0)
    setPlazo(c.plazo_entrega_dias ?? 45)
    setNuevaNota('')
    setCancelando(false)
    setMotivo('')
    setClienteDescuentos([])
    fetch(`/api/admin/cliente-descuentos?cliente_id=${c.cliente_id}`)
      .then(r => r.json())
      .then(d => setClienteDescuentos(d.data ?? []))
  }

  async function cambiarEstado(estado: string, motivoCancelacion?: string) {
    if (!selected) return
    setLoading(true)
    const res = await fetch('/api/admin/cotizacion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selected.id,
        estado,
        descuento_porcentaje: descuento,
        plazo_entrega_dias: plazo,
        ...(motivoCancelacion ? { motivo_cancelacion: motivoCancelacion } : {}),
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      alert(data.error ?? 'Error al cambiar estado')
      setLoading(false)
      return
    }
    setSelected(null)
    setCancelando(false)
    setMotivo('')
    setLoading(false)
    router.refresh()
  }

  async function guardarDatos() {
    if (!selected) return
    setLoading(true)
    await fetch('/api/admin/cotizacion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selected.id, estado: selected.estado, descuento_porcentaje: descuento, plazo_entrega_dias: plazo }),
    })
    setLoading(false)
    setDatosSaved(true)
    setTimeout(() => setDatosSaved(false), 2000)
    router.refresh()
  }

  async function agregarNota() {
    if (!selected || !nuevaNota.trim()) return
    setLoading(true)
    const res = await fetch('/api/admin/cotizacion/nota', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cotizacion_id: selected.id, texto: nuevaNota.trim() }),
    })
    const data = await res.json()
    if (data.nota) {
      setNotas(prev => [...prev, data.nota])
      setNuevaNota('')
      setNotaSaved(true)
      setTimeout(() => setNotaSaved(false), 2000)
    }
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {grupos.map(([clienteId, grupo]) => {
              const multi = grupo.items.length > 1
              const expanded = expandedGroups.has(clienteId)
              const totalGrupo = grupo.items.reduce((s, p) => s + totalFinal(p.total_calculado, p.descuento_porcentaje), 0)

              if (multi) {
                return (
                  <Fragment key={`group-${clienteId}`}>
                    {/* Fila agrupadora */}
                    <tr
                      key={`group-${clienteId}`}
                      onClick={() => toggleGroup(clienteId)}
                      className="bg-gray-50 hover:bg-gray-100 cursor-pointer border-b border-gray-200"
                    >
                      <td className="px-4 py-3" colSpan={2}>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-xs">{expanded ? '▼' : '▶'}</span>
                          <div>
                            <p className="font-semibold text-gray-900">{grupo.cliente?.razon_social ?? grupo.cliente?.email ?? '—'}</p>
                            <p className="text-xs text-gray-400">{grupo.cliente?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">{formatPrecio(totalGrupo)}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-500 bg-gray-200 rounded-full px-2 py-0.5">
                          {grupo.items.length} presupuestos
                        </span>
                      </td>
                      <td></td>
                    </tr>
                    {/* Filas hijas */}
                    {expanded && grupo.items.map(c => {
                      const b = badge(c.estado)
                      const notaCount = c.cotizacion_notas?.length ?? 0
                      const total = totalFinal(c.total_calculado, c.descuento_porcentaje)
                      return (
                        <tr key={`child-${c.id}`} onClick={() => openModal(c)} className="hover:bg-blue-50 cursor-pointer bg-white">
                          <td className="px-4 py-2.5 pl-10 text-gray-500 text-xs">{new Date(c.creado_en).toLocaleDateString('es-AR')}</td>
                          <td className="px-4 py-2.5 text-gray-500 text-xs">{c.cotizacion_items.length} productos</td>
                          <td className="px-4 py-2.5">
                            <p className="font-medium text-gray-900 text-sm">{formatPrecio(total)}</p>
                            {(c.descuento_porcentaje ?? 0) > 0 && (
                              <p className="text-xs text-gray-400 line-through">{formatPrecio(c.total_calculado)}</p>
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.class}`}>{b.label}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            {notaCount > 0 && <span className="text-xs text-gray-400">💬 {notaCount}</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              }

              // Cliente con un solo presupuesto — fila normal
              const c = grupo.items[0]
              const b = badge(c.estado)
              const notaCount = c.cotizacion_notas?.length ?? 0
              const total = totalFinal(c.total_calculado, c.descuento_porcentaje)
              return (
                <tr key={c.id} onClick={() => openModal(c)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{c.clientes?.razon_social ?? c.clientes?.email ?? '—'}</p>
                    <p className="text-xs text-gray-400">{c.clientes?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.creado_en).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{formatPrecio(total)}</p>
                    {(c.descuento_porcentaje ?? 0) > 0 && (
                      <p className="text-xs text-gray-400 line-through">{formatPrecio(c.total_calculado)}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${b.class}`}>{b.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {notaCount > 0 && <span className="text-xs text-gray-400">💬 {notaCount}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!cotizaciones.length && (
          <div className="p-8 text-center text-sm text-gray-500">No hay presupuestos aún.</div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">{selected.clientes?.razon_social ?? selected.clientes?.email}</h3>
                <p className="text-xs text-gray-400">{new Date(selected.creado_en).toLocaleString('es-AR')}</p>
              </div>
              <button onClick={() => { setSelected(null); setCancelando(false) }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            {/* Items */}
            <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-2">
              {selected.cotizacion_items.map(item => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    {item.productos?.nombre} × {item.cantidad}
                    {item.formato_entrega && item.formato_entrega !== 'unidades' && (
                      <span className="text-xs text-gray-400 ml-1">
                        ({item.formato_entrega}{item.formato_cantidad ? ` · ${item.formato_cantidad} uds.` : ''})
                      </span>
                    )}
                  </span>
                  <span className="font-medium text-gray-900">{formatPrecio(item.precio_mostrado * item.cantidad)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 pt-2 space-y-1">
                {(descuento ?? 0) > 0 ? (
                  <>
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Subtotal</span><span className="line-through">{formatPrecio(selected.total_calculado)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-green-700 font-medium">
                      <span>Descuento {descuento}%</span>
                      <span>− {formatPrecio(selected.total_calculado * descuento / 100)}</span>
                    </div>
                  </>
                ) : null}
                <div className="flex justify-between font-semibold text-sm">
                  <span>Total</span>
                  <span>{formatPrecio(totalFinal(selected.total_calculado, descuento))}</span>
                </div>
              </div>
            </div>

            {/* Descuento y plazo */}
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Descuento (%)</label>
                <input type="number" min={0} max={100} value={descuento}
                  onChange={e => setDescuento(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Plazo de entrega (días)</label>
                <input type="number" min={1} value={plazo}
                  onChange={e => setPlazo(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm" />
              </div>
            </div>
            {clienteDescuentos.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-gray-400 mb-1.5">Descuentos del cliente — click para aplicar:</p>
                <div className="flex flex-wrap gap-1.5">
                  {clienteDescuentos.map(d => (
                    <button key={d.id} onClick={() => setDescuento(d.porcentaje)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium border transition-colors ${
                        descuento === d.porcentaje
                          ? 'bg-green-600 text-white border-green-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {d.descripcion} · {d.porcentaje}%
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4 flex justify-end">
              <button onClick={guardarDatos} disabled={loading}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {datosSaved ? '✓ Guardado' : 'Guardar cambios'}
              </button>
            </div>

            {/* Notas */}
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-700 mb-2">
                Comentarios {notas.length > 0 && <span className="text-gray-400">({notas.length})</span>}
              </p>
              {notas.length > 0 && (
                <div className="space-y-2 mb-3 max-h-36 overflow-y-auto">
                  {notas.map(n => (
                    <div key={n.id} className={`rounded-lg px-3 py-2 ${n.texto.startsWith('Cancelación:') ? 'bg-red-50' : 'bg-blue-50'}`}>
                      <p className="text-xs text-gray-400 mb-0.5">{new Date(n.creado_en).toLocaleString('es-AR')}</p>
                      <p className="text-sm text-gray-800">{n.texto}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <textarea rows={2} value={nuevaNota} onChange={e => setNuevaNota(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
                  placeholder="Agregar comentario al cliente..." />
                <button onClick={agregarNota} disabled={loading || !nuevaNota.trim()}
                  className="self-end rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap">
                  {notaSaved ? '✓' : 'Agregar'}
                </button>
              </div>
            </div>

            {/* Cambiar estado / Cancelación */}
            {cancelando ? (
              <div className="border border-red-200 rounded-xl p-4 bg-red-50 space-y-3">
                <p className="text-sm font-medium text-red-800">Motivo de cancelación <span className="text-red-500">*</span></p>
                <textarea rows={3} value={motivo} onChange={e => setMotivo(e.target.value)}
                  className="w-full rounded-lg border border-red-300 px-3 py-2 text-sm resize-none"
                  placeholder="Indicá el motivo. El cliente recibirá esta información por email." />
                <div className="flex gap-2">
                  <button
                    onClick={() => cambiarEstado('cancelada', motivo)}
                    disabled={loading || !motivo.trim()}
                    className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                    {loading ? 'Procesando...' : 'Confirmar cancelación'}
                  </button>
                  <button onClick={() => setCancelando(false)} disabled={loading}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Volver
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Cambiar estado:</p>
                <div className="flex flex-wrap gap-2">
                  {ESTADOS.filter(e => e.id !== selected.estado && e.id !== 'cancelada').map(e => (
                    <button key={e.id} onClick={() => cambiarEstado(e.id)} disabled={loading}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-50 ${
                        e.id === 'concretada'
                          ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {e.id === 'concretada' ? '✓ Marcar concretada' : e.label}
                    </button>
                  ))}
                  {selected.estado !== 'cancelada' && selected.estado !== 'concretada' && (
                    <button onClick={() => setCancelando(true)} disabled={loading}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                      Cancelar presupuesto
                    </button>
                  )}
                </div>
                {selected.estado !== 'concretada' && (
                  <p className="text-xs text-gray-400 mt-2">
                    Al marcar como "Concretada" se registra la compra y se actualiza el nivel del cliente.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
