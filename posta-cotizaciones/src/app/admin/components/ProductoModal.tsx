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
              <input name="categoria" value={form.categoria} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
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
