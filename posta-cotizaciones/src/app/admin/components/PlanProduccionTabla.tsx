'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  stock: number
  activo: boolean
  imagen_url: string | null
}

type PlanEntry = {
  id: string
  producto_id: string
  fecha_estimada: string
  cantidad_planificada: number
  notas: string | null
}

type FormEntry = {
  fecha_estimada: string
  cantidad_planificada: string
  notas: string
}

const emptyForm: FormEntry = { fecha_estimada: '', cantidad_planificada: '', notas: '' }

export default function PlanProduccionTabla({
  productos,
  plan,
}: {
  productos: Producto[]
  plan: PlanEntry[]
}) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adding, setAdding] = useState<string | null>(null)
  const [form, setForm] = useState<FormEntry>(emptyForm)
  const [editing, setEditing] = useState<PlanEntry | null>(null)
  const [editForm, setEditForm] = useState<FormEntry>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [filtroPlan, setFiltroPlan] = useState<'todos' | 'sin_stock'>('sin_stock')
  const [busqueda, setBusqueda] = useState('')

  const productosFiltrados = productos.filter(p => {
    if (filtroPlan === 'sin_stock' && p.stock > 0) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!p.nombre.toLowerCase().includes(q) && !(p.descripcion ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  function entriesFor(productoId: string) {
    return plan.filter(e => e.producto_id === productoId)
  }

  function proximaFecha(productoId: string) {
    const entries = entriesFor(productoId).filter(e => e.fecha_estimada >= new Date().toISOString().split('T')[0])
    return entries[0] ?? null
  }

  async function handleAdd(productoId: string) {
    if (!form.fecha_estimada || !form.cantidad_planificada) return
    setLoading(true)
    await fetch('/api/admin/plan-produccion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto_id: productoId,
        fecha_estimada: form.fecha_estimada,
        cantidad_planificada: Number(form.cantidad_planificada),
        notas: form.notas || null,
      }),
    })
    setAdding(null)
    setForm(emptyForm)
    setLoading(false)
    router.refresh()
  }

  async function handleEdit() {
    if (!editing || !editForm.fecha_estimada || !editForm.cantidad_planificada) return
    setLoading(true)
    await fetch('/api/admin/plan-produccion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editing.id,
        fecha_estimada: editForm.fecha_estimada,
        cantidad_planificada: Number(editForm.cantidad_planificada),
        notas: editForm.notas || null,
      }),
    })
    setEditing(null)
    setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta entrada del plan?')) return
    await fetch('/api/admin/plan-produccion', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    router.refresh()
  }

  function formatFecha(iso: string) {
    return new Date(iso + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setFiltroPlan('sin_stock')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${filtroPlan === 'sin_stock' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Sin stock
          </button>
          <button
            onClick={() => setFiltroPlan('todos')}
            className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-200 ${filtroPlan === 'todos' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
          >
            Todos
          </button>
        </div>
        <input
          type="text"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar producto..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {productosFiltrados.map(producto => {
          const entries = entriesFor(producto.id)
          const proxima = proximaFecha(producto.id)
          const isOpen = expanded === producto.id
          const isAdding = adding === producto.id

          return (
            <div key={producto.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              {/* Header del producto */}
              <div className="flex items-center gap-3 px-4 py-3">
                {producto.imagen_url
                  ? <img src={producto.imagen_url} alt={producto.nombre} className="w-10 h-10 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                  : <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{producto.nombre}</p>
                    {producto.stock === 0
                      ? <span className="text-xs bg-red-100 text-red-600 rounded-full px-2 py-0.5">Sin stock</span>
                      : <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5">Stock: {producto.stock}</span>
                    }
                    {!producto.activo && <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">Inactivo</span>}
                  </div>
                  {proxima && (
                    <p className="text-xs text-orange-600 mt-0.5">
                      Próxima entrega: <strong>{formatFecha(proxima.fecha_estimada)}</strong> — {proxima.cantidad_planificada.toLocaleString('es-AR')} uds.
                    </p>
                  )}
                  {entries.length === 0 && (
                    <p className="text-xs text-gray-400 mt-0.5">Sin entradas en el plan</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => { setAdding(isAdding ? null : producto.id); setForm(emptyForm) }}
                    className="rounded-lg border border-orange-300 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 transition-colors"
                  >
                    + Agregar
                  </button>
                  {entries.length > 0 && (
                    <button
                      onClick={() => setExpanded(isOpen ? null : producto.id)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                    >
                      {isOpen ? 'Ocultar' : `Ver ${entries.length}`}
                    </button>
                  )}
                </div>
              </div>

              {/* Formulario agregar */}
              {isAdding && (
                <div className="border-t border-orange-100 bg-orange-50/40 px-4 py-3 flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Fecha estimada</label>
                    <input type="date" value={form.fecha_estimada} onChange={e => setForm(f => ({ ...f, fecha_estimada: e.target.value }))}
                      className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Cantidad (uds.)</label>
                    <input type="number" min="1" value={form.cantidad_planificada} onChange={e => setForm(f => ({ ...f, cantidad_planificada: e.target.value }))}
                      className="w-28 rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <div className="flex-1 min-w-32">
                    <label className="block text-xs text-gray-600 mb-1">Notas (opcional)</label>
                    <input type="text" value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                      placeholder="Ej: lote verano"
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm" />
                  </div>
                  <button onClick={() => handleAdd(producto.id)} disabled={loading || !form.fecha_estimada || !form.cantidad_planificada}
                    className="rounded-lg bg-orange-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-50 transition-colors">
                    Guardar
                  </button>
                  <button onClick={() => { setAdding(null); setForm(emptyForm) }}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                    Cancelar
                  </button>
                </div>
              )}

              {/* Entradas del plan */}
              {isOpen && entries.length > 0 && (
                <div className="border-t border-gray-100">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Fecha estimada</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Cantidad</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-400 uppercase">Notas</th>
                        <th className="px-4 py-2 w-24"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {entries.map(entry => (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          {editing?.id === entry.id ? (
                            <>
                              <td className="px-4 py-2">
                                <input type="date" value={editForm.fecha_estimada} onChange={e => setEditForm(f => ({ ...f, fecha_estimada: e.target.value }))}
                                  className="rounded border border-gray-300 px-2 py-1 text-sm" />
                              </td>
                              <td className="px-4 py-2">
                                <input type="number" min="1" value={editForm.cantidad_planificada} onChange={e => setEditForm(f => ({ ...f, cantidad_planificada: e.target.value }))}
                                  className="w-24 rounded border border-gray-300 px-2 py-1 text-sm" />
                              </td>
                              <td className="px-4 py-2">
                                <input type="text" value={editForm.notas} onChange={e => setEditForm(f => ({ ...f, notas: e.target.value }))}
                                  className="w-full rounded border border-gray-300 px-2 py-1 text-sm" />
                              </td>
                              <td className="px-4 py-2 flex gap-1">
                                <button onClick={handleEdit} disabled={loading} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Guardar</button>
                                <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 ml-1">×</button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-4 py-2 font-medium text-gray-900">{formatFecha(entry.fecha_estimada)}</td>
                              <td className="px-4 py-2 text-gray-700">{entry.cantidad_planificada.toLocaleString('es-AR')} uds.</td>
                              <td className="px-4 py-2 text-gray-400 text-xs">{entry.notas ?? '—'}</td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2 justify-end">
                                  <button onClick={() => { setEditing(entry); setEditForm({ fecha_estimada: entry.fecha_estimada, cantidad_planificada: String(entry.cantidad_planificada), notas: entry.notas ?? '' }) }}
                                    className="text-xs text-gray-400 hover:text-gray-700 transition-colors">Editar</button>
                                  <button onClick={() => handleDelete(entry.id)}
                                    className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )
        })}

        {productosFiltrados.length === 0 && (
          <div className="p-8 text-center text-sm text-gray-400">
            {filtroPlan === 'sin_stock' ? 'No hay productos sin stock.' : 'No hay productos.'}
          </div>
        )}
      </div>
    </div>
  )
}
