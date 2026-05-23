'use client'

import { useState } from 'react'
import type { Subcategoria } from '@/lib/supabase/types'
import ClienteModal from './ClienteModal'

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
  subcategorias?: { nombre: string; margen_porcentaje: number } | null
}

export default function ClientesTabla({
  clientes,
  subcategorias,
}: {
  clientes: Cliente[]
  subcategorias: Subcategoria[]
}) {
  const [selected, setSelected] = useState<Cliente | null>(null)

  const subcatMap: Record<string, string> = {}
  subcategorias.forEach(s => { subcatMap[s.id] = s.nombre })

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Razón social', 'CUIT', 'Email', 'Subcategoría', 'Compras', 'Margen'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.map(c => {
              const margen = c.margen_personalizado ?? c.subcategorias?.margen_porcentaje ?? null
              return (
                <tr key={c.id}
                  onClick={() => setSelected(c)}
                  className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.razon_social ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.cuit}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.subcategoria_id === 'vip' ? 'bg-yellow-100 text-yellow-700' :
                      c.subcategoria_id === 'premium' ? 'bg-purple-100 text-purple-700' :
                      c.subcategoria_id === 'frecuente' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {subcatMap[c.subcategoria_id] ?? c.subcategoria_id}
                      {c.margen_personalizado !== null && ' (custom)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.total_compras}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {margen !== null ? `+${(margen * 100).toFixed(0)}%` : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!clientes.length && (
          <div className="p-8 text-center text-sm text-gray-500">No hay clientes aún.</div>
        )}
      </div>

      {selected && (
        <ClienteModal
          cliente={selected}
          subcategorias={subcategorias}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
