'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Subcategoria } from '@/lib/supabase/types'

export default function AddVipForm({ subcategorias }: { subcategorias: Subcategoria[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '', razon_social: '', cuit: '',
    telefono: '', tipo_comercio: '', direccion: '',
    subcategoria_id: 'vip', margen_personalizado: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/crear-vip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        margen_personalizado: form.margen_personalizado ? Number(form.margen_personalizado) / 100 : null,
        cuit: form.cuit.replace(/\D/g, ''),
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Error al crear el cliente.')
    } else {
      setOpen(false)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
        + Agregar cliente VIP
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-8 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-md shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-4">Nuevo cliente VIP</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Razón social</label>
                  <input name="razon_social" required value={form.razon_social} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">CUIT</label>
                  <input name="cuit" required value={form.cuit} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tipo de comercio</label>
                  <input name="tipo_comercio" required value={form.tipo_comercio} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Dirección</label>
                  <input name="direccion" value={form.direccion} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input name="email" type="email" required value={form.email} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Contraseña inicial</label>
                  <input name="password" type="password" required minLength={8} value={form.password} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subcategoría</label>
                  <select name="subcategoria_id" value={form.subcategoria_id} onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                    {subcategorias.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Margen custom (%)</label>
                  <input name="margen_personalizado" type="number" min="0" max="100" step="1"
                    value={form.margen_personalizado} onChange={handleChange}
                    placeholder="Ej: 12 (opcional)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>

              {error && <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>}

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                  {loading ? '...' : 'Crear cliente'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
