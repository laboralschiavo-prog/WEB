'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { traducirError } from '@/lib/errors'

type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  precio_base: number
  categoria: string | null
  activo: boolean
  stock: number
  imagen_url: string | null
  unidades_por_bulto: number | null
  unidades_por_pallet: number | null
  destacado: boolean
  oferta_relamago: boolean
  precio_oferta: number | null
  nueva_linea: boolean
}

export default function ProductoModal({
  producto,
  onClose,
}: {
  producto: Producto | null
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    nombre: producto?.nombre ?? '',
    descripcion: producto?.descripcion ?? '',
    precio_base: producto?.precio_base ? String(producto.precio_base) : '',
    categoria: producto?.categoria ?? '',
    activo: producto?.activo ?? true,
    stock: producto?.stock ? String(producto.stock) : '0',
    imagen_url: producto?.imagen_url ?? '',
    unidades_por_bulto: producto?.unidades_por_bulto ? String(producto.unidades_por_bulto) : '',
    unidades_por_pallet: producto?.unidades_por_pallet ? String(producto.unidades_por_pallet) : '',
    destacado: producto?.destacado ?? false,
    oferta_relamago: producto?.oferta_relamago ?? false,
    precio_oferta: producto?.precio_oferta ? String(producto.precio_oferta) : '',
    nueva_linea: producto?.nueva_linea ?? false,
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value }))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const fd = new FormData()
    fd.append('file', file)

    const res = await fetch('/api/admin/upload-imagen', { method: 'POST', body: fd })
    const data = await res.json()

    if (!res.ok) {
      setError('Error al subir imagen: ' + traducirError(data.error))
    } else {
      setForm(f => ({ ...f, imagen_url: data.url }))
    }
    setUploading(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const body = {
      ...(producto ? { id: producto.id } : {}),
      nombre: form.nombre,
      descripcion: form.descripcion || null,
      precio_base: Number(form.precio_base),
      categoria: form.categoria || null,
      activo: form.activo,
      stock: Number(form.stock),
      imagen_url: form.imagen_url || null,
      unidades_por_bulto: form.unidades_por_bulto ? Number(form.unidades_por_bulto) : null,
      unidades_por_pallet: form.unidades_por_pallet ? Number(form.unidades_por_pallet) : null,
      destacado: form.destacado,
      oferta_relamago: form.oferta_relamago,
      precio_oferta: form.oferta_relamago && form.precio_oferta ? Number(form.precio_oferta) : null,
      nueva_linea: form.nueva_linea,
    }

    const res = await fetch('/api/admin/productos', {
      method: producto ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(traducirError(data.error))
    } else {
      onClose()
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete() {
    if (!producto) return
    if (!confirm('¿Eliminar este producto? Si tiene cotizaciones asociadas, se desactivará.')) return
    setLoading(true)

    const res = await fetch('/api/admin/productos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: producto.id }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(traducirError(data.error))
      setLoading(false)
    } else {
      onClose()
      router.refresh()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{producto ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">

          {/* Imagen */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Imagen</label>
            <div className="flex items-center gap-3">
              {form.imagen_url && (
                <img src={form.imagen_url} alt="preview" className="w-16 h-16 object-cover rounded-lg border border-gray-200" />
              )}
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors">
                {uploading ? 'Subiendo...' : form.imagen_url ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              {form.imagen_url && (
                <button type="button" onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                  className="text-xs text-red-500 hover:text-red-700">Quitar</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nombre</label>
            <input name="nombre" required value={form.nombre} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Precio base ($)</label>
              <input name="precio_base" type="number" required min="0" step="0.01" value={form.precio_base} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Stock disponible</label>
              <input name="stock" type="number" required min="0" step="1" value={form.stock} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría</label>
              <select name="categoria" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white">
                <option value="">Sin categoría</option>
                <option value="Sillones">Sillones</option>
                <option value="Reposeras">Reposeras</option>
                <option value="Mesas">Mesas</option>
                <option value="Tendederos y Tablas">Tendederos y Tablas</option>
              </select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange}
                  className="rounded border-gray-300" />
                <span className="text-sm text-gray-700">Activo</span>
              </label>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Uds. por bulto</label>
              <input name="unidades_por_bulto" type="number" min="1" step="1"
                value={form.unidades_por_bulto} onChange={handleChange}
                placeholder="Ej: 12"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Uds. por pallet</label>
              <input name="unidades_por_pallet" type="number" min="1" step="1"
                value={form.unidades_por_pallet} onChange={handleChange}
                placeholder="Ej: 120"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descripción</label>
            <textarea name="descripcion" rows={2} value={form.descripcion} onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm resize-none" />
          </div>

          {/* Secciones especiales */}
          <div className="border border-gray-200 rounded-lg p-3 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Secciones del catálogo</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-sm text-gray-700">Producto destacado</span>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, destacado: !f.destacado }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.destacado ? 'bg-blue-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.destacado ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="text-sm text-gray-700">Oferta relámpago</span>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, oferta_relamago: !f.oferta_relamago, precio_oferta: f.oferta_relamago ? '' : f.precio_oferta }))}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.oferta_relamago ? 'bg-amber-500' : 'bg-gray-300'}`}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.oferta_relamago ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {form.oferta_relamago && (
                <div className="flex items-center gap-2 pl-6">
                  <label className="text-xs text-gray-500 whitespace-nowrap">Precio oferta ($)</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.precio_oferta}
                    onChange={e => setForm(f => ({ ...f, precio_oferta: e.target.value }))}
                    placeholder={form.precio_base || 'precio especial'}
                    className="flex-1 rounded-lg border border-amber-300 px-3 py-1.5 text-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span className="text-sm text-gray-700">Nueva línea</span>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, nueva_linea: !f.nueva_linea }))}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.nueva_linea ? 'bg-purple-600' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${form.nueva_linea ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading || uploading}
              className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {loading ? '...' : producto ? 'Guardar cambios' : 'Crear producto'}
            </button>
            {producto && (
              <button type="button" onClick={handleDelete} disabled={loading}
                className="rounded-lg border border-red-300 px-3 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors">
                Eliminar
              </button>
            )}
            <button type="button" onClick={onClose}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
