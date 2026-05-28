'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { traducirError } from '@/lib/errors'

type Props = {
  habilitado: boolean
  texto: string
  descuento: number
}

export default function PedidoSinStockConfig({ habilitado, texto, descuento }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({ habilitado, texto, descuento: String(descuento) })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setLoading(true)
    setError('')
    setSaved(false)
    const res = await fetch('/api/admin/configuracion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pedido_sin_stock_habilitado: String(form.habilitado),
        pedido_sin_stock_texto: form.texto,
        pedido_sin_stock_descuento: form.descuento,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setError(traducirError(data.error))
    } else {
      setSaved(true)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-900">Pedidos sin stock</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Permite que los clientes soliciten productos sin stock para fabricación a pedido
          </p>
        </div>
        <button
          type="button"
          onClick={() => setForm(f => ({ ...f, habilitado: !f.habilitado }))}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.habilitado ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.habilitado ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {form.habilitado && (
        <div className="space-y-3 pt-1 border-t border-gray-100">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Texto de ventaja comercial
            </label>
            <input
              type="text"
              value={form.texto}
              onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
              placeholder="Ej: 10% de descuento por pedido anticipado"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Este texto se muestra al cliente junto a los productos a pedido.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Descuento aplicado (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={form.descuento}
                onChange={e => setForm(f => ({ ...f, descuento: e.target.value }))}
                className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <span className="text-sm text-gray-500">% sobre el precio base</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Si es 0, no se aplica descuento automático.</p>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-600 bg-red-50 rounded p-2">{error}</p>}
      {saved && <p className="text-xs text-green-600 bg-green-50 rounded p-2">Configuración guardada.</p>}

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={loading}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
