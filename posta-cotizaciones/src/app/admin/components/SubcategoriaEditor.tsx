'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Subcategoria } from '@/lib/supabase/types'

type PromoResumen = {
  id: string
  nombre: string
  subcategoria_ids: string[] | null
  activa: boolean
}

export default function SubcategoriaEditor({
  subcategoria: s,
  promociones,
}: {
  subcategoria: Subcategoria
  promociones: PromoResumen[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [compras, setCompras] = useState(s.compras_requeridas.toString())
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [promoLoading, setPromoLoading] = useState<string | null>(null)

  const [promoSubcats, setPromoSubcats] = useState<Map<string, string[]>>(
    () => new Map(promociones.map(p => [p.id, p.subcategoria_ids ?? []]))
  )

  async function handleSave() {
    setLoading(true)
    await fetch('/api/admin/subcategoria', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: s.id, compras_requeridas: Number(compras) }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setLoading(false)
    router.refresh()
  }

  async function togglePromo(promoId: string) {
    setPromoLoading(promoId)
    const currentIds = promoSubcats.get(promoId) ?? []
    const estaAsignada = currentIds.includes(s.id)
    const newIds = estaAsignada
      ? currentIds.filter(id => id !== s.id)
      : [...currentIds, s.id]

    await fetch('/api/admin/promociones', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: promoId, subcategoria_ids: newIds }),
    })

    setPromoSubcats(prev => new Map(prev).set(promoId, newIds))
    setPromoLoading(null)
  }

  const badgeClass =
    s.id === 'vip'       ? 'bg-yellow-100 text-yellow-700' :
    s.id === 'premium'   ? 'bg-purple-100 text-purple-700' :
    s.id === 'frecuente' ? 'bg-blue-100 text-blue-700' :
    'bg-gray-100 text-gray-600'

  const asignadasCount = promociones.filter(p => (promoSubcats.get(p.id) ?? []).includes(s.id)).length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header clickeable */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium shrink-0 ${badgeClass}`}>
            {s.nombre}
          </span>
          {s.id !== 'vip' && (
            <span className="text-sm text-gray-400">
              Compras para ascender: <span className="font-medium text-gray-600">{s.compras_requeridas}</span>
            </span>
          )}
          {s.id === 'vip' && (
            <span className="text-sm text-gray-400 italic">Asignación manual</span>
          )}
          <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
            {asignadasCount} promo{asignadasCount !== 1 ? 's' : ''} asignada{asignadasCount !== 1 ? 's' : ''}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel expandido */}
      {open && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-5">
          {/* Compras para ascender */}
          {s.id !== 'vip' && (
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-600 whitespace-nowrap">Compras para ascender:</label>
              <input
                type="number" min="1" step="1"
                value={compras} onChange={e => setCompras(e.target.value)}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
              />
              <button onClick={handleSave} disabled={loading}
                className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors">
                {saved ? 'Guardado' : loading ? '...' : 'Guardar'}
              </button>
            </div>
          )}

          {/* Promociones asignadas */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Promociones exclusivas
              <span className="ml-2 font-normal text-gray-400 normal-case tracking-normal">
                — activá las que puede ver este segmento en el carrito
              </span>
            </p>
            {promociones.length === 0 ? (
              <p className="text-sm text-gray-400">No hay promociones creadas. Creá una desde la sección Promociones.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {promociones.map(promo => {
                  const asignada = (promoSubcats.get(promo.id) ?? []).includes(s.id)
                  return (
                    <button
                      key={promo.id}
                      onClick={() => togglePromo(promo.id)}
                      disabled={promoLoading === promo.id}
                      title={promo.activa ? undefined : 'Promoción inactiva'}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors disabled:opacity-40 ${
                        asignada
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                      } ${!promo.activa ? 'opacity-60' : ''}`}>
                      {promo.nombre}
                      {!promo.activa && <span className="ml-1">(inactiva)</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
