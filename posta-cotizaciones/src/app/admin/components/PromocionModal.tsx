'use client'

import { useState } from 'react'
import { traducirError } from '@/lib/errors'

type Producto = { id: string; nombre: string }
type Subcategoria = { id: string; nombre: string }

type Promocion = {
  id: string
  producto_id: string
  nombre: string
  descripcion: string
  cantidad_minima: number
  formato_requerido: string | null
  descuento_porcentaje: number | null
  subcategoria_ids: string[] | null
  activa: boolean
}

export default function PromocionModal({
  promocion,
  productos,
  subcategorias,
  onClose,
  onSaved,
}: {
  promocion: Promocion | null
  productos: Producto[]
  subcategorias: Subcategoria[]
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    producto_id: promocion?.producto_id ?? '',
    nombre: promocion?.nombre ?? '',
    descripcion: promocion?.descripcion ?? '',
    cantidad_minima: promocion?.cantidad_minima ?? 1,
    formato_requerido: promocion?.formato_requerido ?? '',
    descuento_porcentaje: promocion?.descuento_porcentaje ?? '',
    subcategoria_ids: (promocion?.subcategoria_ids ?? []) as string[],
    activa: promocion?.activa ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(f => ({
      ...f,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked
             : type === 'number' ? Number(value)
             : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const payload = {
      ...form,
      descuento_porcentaje: form.descuento_porcentaje === '' ? null : Number(form.descuento_porcentaje),
      formato_requerido: form.formato_requerido || null,
      subcategoria_ids: form.subcategoria_ids,
      ...(promocion ? { id: promocion.id } : {}),
    }

    const res = await fetch('/api/admin/promociones', {
      method: promocion ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const data = await res.json()
    if (!res.ok) { setError(traducirError(data.error)); setLoading(false); return }
    setLoading(false)
    onSaved()
  }

  async function handleEliminar() {
    if (!promocion || !confirm('¿Eliminar esta promoción?')) return
    setLoading(true)
    await fetch('/api/admin/promociones', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promocion.id }),
    })
    setLoading(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{promocion ? 'Editar promoción' : 'Nueva promoción'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Producto</label>
            <select name="producto_id" required value={form.producto_id} onChange={handle}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
              <option value="">Seleccioná un producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre de la promoción</label>
            <input name="nombre" required value={form.nombre} onChange={handle}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Ej: Descuento por volumen en bulto" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción (visible al cliente)</label>
            <textarea name="descripcion" required value={form.descripcion} onChange={handle} rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none"
              placeholder="Ej: Comprando 10 unidades en formato bulto obtenés un 10% de descuento" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Cantidad mínima (uds.)</label>
              <input name="cantidad_minima" type="number" min={1} required value={form.cantidad_minima} onChange={handle}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Formato requerido</label>
              <select name="formato_requerido" value={form.formato_requerido} onChange={handle}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">Cualquiera</option>
                <option value="bultos">Bultos</option>
                <option value="pallet">Pallet</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descuento (% — informativo)</label>
            <input name="descuento_porcentaje" type="number" min={0} max={100} value={form.descuento_porcentaje} onChange={handle}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Opcional" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Visible para categorías
              <span className="ml-1 text-gray-400 font-normal">(sin selección = ningún cliente la ve)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {subcategorias.map(s => {
                const selected = form.subcategoria_ids.includes(s.id)
                return (
                  <button key={s.id} type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      subcategoria_ids: selected
                        ? f.subcategoria_ids.filter(id => id !== s.id)
                        : [...f.subcategoria_ids, s.id],
                    }))}
                    className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                      selected ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}>
                    {s.nombre}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input name="activa" type="checkbox" checked={form.activa as boolean}
              onChange={e => setForm(f => ({ ...f, activa: e.target.checked }))}
              className="rounded" id="activa" />
            <label htmlFor="activa" className="text-sm text-gray-700">Promoción activa</label>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? 'Guardando...' : (promocion ? 'Guardar cambios' : 'Crear promoción')}
            </button>
            {promocion && (
              <button type="button" onClick={handleEliminar} disabled={loading}
                className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
                Eliminar
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
