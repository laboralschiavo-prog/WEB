'use client'

import { useState } from 'react'
import CotizacionCard from './CotizacionCard'

type Item = {
  id: string
  cantidad: number
  precio_mostrado: number
  formato_entrega: string | null
  formato_cantidad: number | null
  productos: { nombre: string } | null
}

type Presupuesto = {
  id: string
  estado: string
  total_calculado: number
  descuento_porcentaje: number
  plazo_entrega_dias: number
  creado_en: string
  cotizacion_items: Item[]
  cotizacion_notas: { id: string; texto: string; creado_en: string }[]
}

const ESTADOS_FILTRO = [
  { id: null,          label: 'Todos' },
  { id: 'pendiente',   label: 'Pendiente' },
  { id: 'enviada',     label: 'Enviada' },
  { id: 'concretada',  label: 'Concretada' },
  { id: 'cancelada',   label: 'Cancelada' },
]

export default function PresupuestosClient({ presupuestos }: { presupuestos: Presupuesto[] }) {
  const [filtroEstado, setFiltroEstado] = useState<string | null>(null)
  const [busquedaArticulo, setBusquedaArticulo] = useState('')
  const [filtroPlazo, setFiltroPlazo] = useState<'todos' | 'con_plazo' | 'sin_plazo'>('todos')

  const filtrados = presupuestos.filter(p => {
    if (filtroEstado && p.estado !== filtroEstado) return false

    if (busquedaArticulo.trim()) {
      const termino = busquedaArticulo.toLowerCase()
      const tieneArticulo = p.cotizacion_items.some(
        i => i.productos?.nombre?.toLowerCase().includes(termino)
      )
      if (!tieneArticulo) return false
    }

    if (filtroPlazo === 'con_plazo' && !(p.plazo_entrega_dias > 0)) return false
    if (filtroPlazo === 'sin_plazo' && p.plazo_entrega_dias > 0) return false

    return true
  })

  const hayFiltrosActivos = filtroEstado !== null || busquedaArticulo.trim() !== '' || filtroPlazo !== 'todos'

  return (
    <div>
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 space-y-3">
        {/* Estado */}
        <div className="flex flex-wrap gap-2">
          {ESTADOS_FILTRO.map(e => (
            <button key={String(e.id)} onClick={() => setFiltroEstado(e.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtroEstado === e.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>
              {e.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Búsqueda por artículo */}
          <div className="flex-1 min-w-48">
            <input
              type="text"
              value={busquedaArticulo}
              onChange={e => setBusquedaArticulo(e.target.value)}
              placeholder="Buscar por artículo..."
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            />
          </div>

          {/* Plazo de entrega */}
          <div className="flex gap-1">
            {[
              { id: 'todos' as const,     label: 'Todo' },
              { id: 'con_plazo' as const, label: 'Con plazo' },
              { id: 'sin_plazo' as const, label: 'Sin plazo' },
            ].map(f => (
              <button key={f.id} onClick={() => setFiltroPlazo(f.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
                  filtroPlazo === f.id
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {hayFiltrosActivos && (
          <button
            onClick={() => { setFiltroEstado(null); setBusquedaArticulo(''); setFiltroPlazo('todos') }}
            className="text-xs text-blue-600 hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {!filtrados.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          {hayFiltrosActivos
            ? 'No hay presupuestos que coincidan con los filtros.'
            : 'No tenés presupuestos aún. Andá al catálogo para crear uno.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(p => (
            <CotizacionCard key={p.id} cotizacion={p as any} />
          ))}
        </div>
      )}
    </div>
  )
}
