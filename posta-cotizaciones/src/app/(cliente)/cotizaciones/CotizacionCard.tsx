'use client'

import { useState } from 'react'
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

type Cotizacion = {
  id: string
  estado: string
  total_calculado: number
  descuento_porcentaje: number
  plazo_entrega_dias: number
  creado_en: string
  cotizacion_items: Item[]
  cotizacion_notas: Nota[]
}

const ESTADO_LABELS: Record<string, { label: string; class: string }> = {
  pendiente:  { label: 'Pendiente',  class: 'bg-yellow-100 text-yellow-700' },
  enviada:    { label: 'Enviada',    class: 'bg-blue-100 text-blue-700' },
  concretada: { label: 'Concretada', class: 'bg-green-100 text-green-700' },
  cancelada:  { label: 'Cancelada',  class: 'bg-gray-100 text-gray-500' },
}

export default function CotizacionCard({ cotizacion }: { cotizacion: Cotizacion }) {
  const [open, setOpen] = useState(false)
  const badge = ESTADO_LABELS[cotizacion.estado] ?? { label: cotizacion.estado, class: 'bg-gray-100 text-gray-500' }

  const descuento = cotizacion.descuento_porcentaje ?? 0
  const totalFinal = cotizacion.total_calculado * (1 - descuento / 100)
  const notas = cotizacion.cotizacion_notas ?? []

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div>
          <p className="text-xs text-gray-400">{new Date(cotizacion.creado_en).toLocaleString('es-AR')}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="font-semibold text-gray-900">{formatPrecio(totalFinal)}</p>
            {descuento > 0 && (
              <span className="text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5">−{descuento}%</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-gray-500">{cotizacion.cotizacion_items.length} producto{cotizacion.cotizacion_items.length !== 1 ? 's' : ''}</p>
            {notas.length > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-0.5">💬 {notas.length}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.class}`}>
            {badge.label}
          </span>
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Detalle */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">

          {/* Items */}
          <div className="space-y-2">
            {cotizacion.cotizacion_items.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700">
                  {item.productos?.nombre ?? '—'}
                  <span className="text-gray-400 ml-1">× {item.cantidad}</span>
                  {item.formato_entrega && item.formato_entrega !== 'unidades' && (
                    <span className="text-xs text-gray-400 ml-1">
                      · {item.formato_entrega}{item.formato_cantidad ? ` (${item.formato_cantidad} uds.)` : ''}
                    </span>
                  )}
                </span>
                <span className="font-medium text-gray-900">
                  {formatPrecio(item.precio_mostrado * item.cantidad)}
                </span>
              </div>
            ))}
            <div className="border-t border-gray-100 pt-2 space-y-1">
              {descuento > 0 && (
                <>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Subtotal</span>
                    <span className="line-through">{formatPrecio(cotizacion.total_calculado)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-green-700 font-medium">
                    <span>Descuento {descuento}%</span>
                    <span>− {formatPrecio(cotizacion.total_calculado * descuento / 100)}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-gray-700">Total</span>
                <span className="text-gray-900">{formatPrecio(totalFinal)}</span>
              </div>
            </div>
          </div>

          {/* Plazo de entrega */}
          {(cotizacion.plazo_entrega_dias ?? 0) > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              🗓 Plazo estimado de entrega: <span className="font-medium text-gray-700">{cotizacion.plazo_entrega_dias} días</span>
            </div>
          )}

          {/* Notas / comentarios del admin */}
          {notas.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Mensajes de POSTA SRL</p>
              {notas.map(n => (
                <div key={n.id} className="bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-xs text-gray-400 mb-0.5">{new Date(n.creado_en).toLocaleString('es-AR')}</p>
                  <p className="text-sm text-blue-800">{n.texto}</p>
                </div>
              ))}
            </div>
          )}

          {/* Cancelar → WhatsApp */}
          {cotizacion.estado === 'pendiente' && (
            <div className="pt-1">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_VENDEDOR ?? '5491100000000'}?text=${encodeURIComponent(`Hola, quisiera cancelar mi presupuesto. ID: ${cotizacion.id}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                Solicitar cancelación por WhatsApp
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
