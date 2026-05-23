'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrecio } from '@/lib/pricing'

const FORMATOS = [
  { id: 'unidades', label: 'Unidades' },
  { id: 'bultos', label: 'Bultos' },
  { id: 'pallet', label: 'Pallet' },
]

interface Props {
  producto: { id: string; nombre: string; precio_base: number }
  margen: number
  precioMostrado: number
  stock: number
  unidades_por_bulto: number | null
  unidades_por_pallet: number | null
}

export default function CotizarButton({ producto, margen, precioMostrado, stock, unidades_por_bulto, unidades_por_pallet }: Props) {
  const [cantidad, setCantidad] = useState(1)
  const [formato, setFormato] = useState('unidades')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const udsFormato = formato === 'bultos' ? (unidades_por_bulto ?? null) : formato === 'pallet' ? (unidades_por_pallet ?? null) : null
  const totalUnidades = udsFormato ? cantidad * udsFormato : cantidad
  const subtotal = precioMostrado * totalUnidades

  async function handleCotizar() {
    setLoading(true)
    await fetch('/api/cotizacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{
          producto_id: producto.id,
          cantidad: totalUnidades,
          precio_base_snapshot: producto.precio_base,
          margen_aplicado: margen,
          precio_mostrado: precioMostrado,
          formato_entrega: formato,
          formato_cantidad: udsFormato,
        }],
      }),
    })
    setOpen(false)
    router.push('/cotizaciones')
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
        Cotizar
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-1">{producto.nombre}</h3>
            <p className="text-sm text-gray-500 mb-4">Precio unitario: {formatPrecio(precioMostrado)}</p>

            {/* Cantidad */}
            <div className="flex items-center gap-3 mb-4">
              <label className="text-sm font-medium text-gray-700">Cantidad:</label>
              <div className="flex items-center gap-2">
                <button onClick={() => setCantidad(q => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                <span className="w-8 text-center font-medium text-gray-900">{cantidad}</span>
                <button onClick={() => setCantidad(q => stock > 0 ? Math.min(stock, q + 1) : q + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
              </div>
              {stock > 0 && (
                <span className="text-xs text-gray-400">Stock: {stock}</span>
              )}
            </div>

            {/* Formato de entrega */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Formato de entrega:</label>
              <div className="flex gap-2">
                {FORMATOS.map(f => {
                  const uds = f.id === 'bultos' ? unidades_por_bulto : f.id === 'pallet' ? unidades_por_pallet : null
                  return (
                    <button key={f.id} type="button"
                      onClick={() => setFormato(f.id)}
                      className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                        formato === f.id
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      }`}>
                      {f.label}
                      {uds && <span className="block text-[10px] opacity-70">{uds} uds.</span>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">
                  {udsFormato ? `${cantidad} ${formato} × ${udsFormato} uds. =` : 'Subtotal:'}
                </span>
                <span className="font-semibold text-gray-900">{formatPrecio(subtotal)}</span>
              </div>
              {udsFormato && (
                <p className="text-xs text-gray-400 mt-1">{totalUnidades} unidades totales</p>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={handleCotizar} disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? '...' : 'Generar cotización'}
              </button>
              <button onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
