'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { Subcategoria } from '@/lib/supabase/types'
import { traducirError } from '@/lib/errors'

type Descuento = { id: string; descripcion: string; porcentaje: number; activo: boolean }

type Cliente = {
  id: string
  email: string
  razon_social: string | null
  cuit: string
  telefono: string | null
  direccion: string | null
  tipo_comercio: string
  subcategoria_id: string
  margen_personalizado: number | null
  total_compras: number
  estado: string
  aprobado_en: string | null
  creado_en: string
}

export default function ClienteModal({
  cliente,
  subcategorias,
  onClose,
}: {
  cliente: Cliente
  subcategorias: Subcategoria[]
  onClose: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: cliente.email,
    razon_social: cliente.razon_social ?? '',
    cuit: cliente.cuit,
    telefono: cliente.telefono ?? '',
    direccion: cliente.direccion ?? '',
    tipo_comercio: cliente.tipo_comercio,
    subcategoria_id: cliente.subcategoria_id,
  })

  // Descuentos del cliente
  const [descuentos, setDescuentos] = useState<Descuento[]>([])
  const [nuevoDesc, setNuevoDesc] = useState({ descripcion: '', porcentaje: '' })
  const [descLoading, setDescLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/cliente-descuentos?cliente_id=${cliente.id}`)
      .then(r => r.json())
      .then(d => setDescuentos(d.data ?? []))
  }, [cliente.id])

  async function agregarDescuento() {
    if (!nuevoDesc.descripcion || !nuevoDesc.porcentaje) return
    setDescLoading(true)
    const res = await fetch('/api/admin/cliente-descuentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cliente_id: cliente.id, descripcion: nuevoDesc.descripcion, porcentaje: Number(nuevoDesc.porcentaje) }),
    })
    const d = await res.json()
    if (d.data) { setDescuentos(prev => [...prev, d.data]); setNuevoDesc({ descripcion: '', porcentaje: '' }) }
    setDescLoading(false)
  }

  async function eliminarDescuento(id: string) {
    setDescLoading(true)
    await fetch('/api/admin/cliente-descuentos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDescuentos(prev => prev.filter(d => d.id !== id))
    setDescLoading(false)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/cliente', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: cliente.id,
        ...form,
        razon_social: form.razon_social || null,
        telefono: form.telefono || null,
        direccion: form.direccion || null,
        margen_personalizado: null,
      }),
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-auto">
      <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Detalle del cliente</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Razón social</label>
              <input name="razon_social" value={form.razon_social} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">CUIT</label>
              <input name="cuit" required value={form.cuit} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="telefono" value={form.telefono} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de comercio</label>
              <input name="tipo_comercio" required value={form.tipo_comercio} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
              <input name="direccion" value={form.direccion} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-700 mb-1">Categoría de cliente</label>
              <select name="subcategoria_id" value={form.subcategoria_id} onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                {subcategorias.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-1 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-500">Compras totales</p>
              <p className="text-sm font-medium text-gray-900">{cliente.total_compras}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Estado</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{cliente.estado}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Registrado</p>
              <p className="text-sm text-gray-700">{new Date(cliente.creado_en).toLocaleDateString('es-AR')}</p>
            </div>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading}
              className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {loading ? '...' : 'Guardar cambios'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>

        {/* Descuentos del cliente */}
        <div className="mt-5 pt-5 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
            Descuentos asignados
          </p>
          {descuentos.length > 0 ? (
            <div className="space-y-2 mb-3">
              {descuentos.map(d => (
                <div key={d.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <div>
                    <span className="text-sm text-gray-800">{d.descripcion}</span>
                    <span className="ml-2 text-xs font-semibold text-green-700 bg-green-100 rounded-full px-2 py-0.5">
                      {d.porcentaje}%
                    </span>
                  </div>
                  <button onClick={() => eliminarDescuento(d.id)} disabled={descLoading}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40">
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 mb-3">Sin descuentos asignados</p>
          )}
          <div className="flex gap-2">
            <input
              value={nuevoDesc.descripcion}
              onChange={e => setNuevoDesc(n => ({ ...n, descripcion: e.target.value }))}
              placeholder="Ej: Descuento fidelidad"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
            <input
              type="number" min={0} max={100}
              value={nuevoDesc.porcentaje}
              onChange={e => setNuevoDesc(n => ({ ...n, porcentaje: e.target.value }))}
              placeholder="%"
              className="w-16 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
            <button onClick={agregarDescuento} disabled={descLoading || !nuevoDesc.descripcion || !nuevoDesc.porcentaje}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40 transition-colors">
              + Agregar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
