'use client'

import { useState } from 'react'
import ProductoModal from './ProductoModal'

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
  creado_en: string
}

export default function ProductosTabla({ productos }: { productos: Producto[] }) {
  const [modal, setModal] = useState<Producto | null | 'nuevo'>(null)

  return (
    <>
      <div className="flex justify-end mb-4">
        <button onClick={() => setModal('nuevo')}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
          + Nuevo producto
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['', 'Nombre', 'Categoría', 'Precio base', 'Stock', 'Estado'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {productos.map(p => (
              <tr key={p.id}
                onClick={() => setModal(p)}
                className="hover:bg-gray-50 cursor-pointer">
                <td className="px-3 py-2 w-12">
                  {p.imagen_url
                    ? <img src={p.imagen_url} alt={p.nombre} className="w-10 h-10 object-cover rounded-lg border border-gray-200" />
                    : <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-lg">📦</div>
                  }
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{p.nombre}</p>
                  {p.descripcion && <p className="text-xs text-gray-400 mt-0.5">{p.descripcion}</p>}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.categoria ?? '—'}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">
                  ${p.precio_base.toLocaleString('es-AR')}
                </td>
                <td className="px-4 py-3 text-gray-500">{p.stock}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.activo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!productos.length && (
          <div className="p-8 text-center text-sm text-gray-500">No hay productos cargados.</div>
        )}
      </div>

      {modal !== null && (
        <ProductoModal
          producto={modal === 'nuevo' ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
