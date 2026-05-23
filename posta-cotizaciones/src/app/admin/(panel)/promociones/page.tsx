'use client'

import { useState, useEffect } from 'react'
import PromocionModal from '../../components/PromocionModal'

type Producto = { id: string; nombre: string }
type Subcategoria = { id: string; nombre: string }

type Promocion = {
  id: string
  producto_id: string
  nombre: string
  descripcion: string
  cantidad_minima: number
  formato_requerido: string | null
  descuento_porcentaje: number | null
  subcategoria_ids: string[] | null
  activa: boolean
}

export default function PromocionesPage() {
  const [promociones, setPromociones] = useState<Promocion[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [subcategorias, setSubcategorias] = useState<Subcategoria[]>([])
  const [selected, setSelected] = useState<Promocion | null | 'new'>(null)
  const [loading, setLoading] = useState(true)

  async function cargar() {
    setLoading(true)
    const [promRes, prodRes, subRes] = await Promise.all([
      fetch('/api/admin/promociones-list'),
      fetch('/api/admin/productos-list'),
      fetch('/api/admin/subcategorias-list'),
    ])
    const [prom, prod, sub] = await Promise.all([promRes.json(), prodRes.json(), subRes.json()])
    setPromociones(prom.data ?? [])
    setProductos(prod.data ?? [])
    setSubcategorias(sub.data ?? [])
    setLoading(false)
  }

  useEffect(() => { cargar() }, [])

  const nombreProducto = (id: string) => productos.find(p => p.id === id)?.nombre ?? '—'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Promociones</h1>
        <button onClick={() => setSelected('new')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + Nueva promoción
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 p-8 text-center">Cargando...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Producto', 'Nombre', 'Condición', 'Descuento', 'Estado'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {promociones.map(p => (
                <tr key={p.id} onClick={() => setSelected(p)} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3 text-gray-700 font-medium">{nombreProducto(p.producto_id)}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-400 line-clamp-1">{p.descripcion}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {p.cantidad_minima} uds.{p.formato_requerido ? ` · ${p.formato_requerido}` : ''}
                  </td>
                  <td className="px-4 py-3">
                    {p.descuento_porcentaje
                      ? <span className="text-green-700 font-medium">{p.descuento_porcentaje}%</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${p.activa ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                      {p.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!promociones.length && (
            <div className="p-8 text-center text-sm text-gray-500">No hay promociones. Creá la primera.</div>
          )}
        </div>
      )}

      {selected !== null && (
        <PromocionModal
          promocion={selected === 'new' ? null : selected}
          productos={productos}
          subcategorias={subcategorias}
          onClose={() => setSelected(null)}
          onSaved={() => { setSelected(null); cargar() }}
        />
      )}
    </div>
  )
}

