'use client'

import { useState } from 'react'
import Link from 'next/link'
import ProductoModal from './ProductoModal'

const CATEGORIAS = ['Sillones', 'Reposeras', 'Mesas', 'Tendederos y Tablas']

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
  destacado: boolean
  oferta_relamago: boolean
  precio_oferta: number | null
  nueva_linea: boolean
}

export default function ProductosTabla({ productos }: { productos: Producto[] }) {
  const [modal, setModal] = useState<Producto | null | 'nuevo'>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('activo')

  const filtrados = productos.filter(p => {
    const q = busqueda.toLowerCase()
    if (q && !p.nombre.toLowerCase().includes(q) && !(p.descripcion ?? '').toLowerCase().includes(q)) return false
    if (filtroCategoria && p.categoria !== filtroCategoria) return false
    if (filtroEstado === 'activo' && !p.activo) return false
    if (filtroEstado === 'inactivo' && p.activo) return false
    return true
  })

  const hayFiltros = busqueda || filtroCategoria || filtroEstado

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        {/* Barra de búsqueda con filtros embebidos */}
        <div className="flex-1 flex items-center gap-0 bg-white border border-gray-300 rounded-lg overflow-hidden focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-300 transition-all">
          <div className="flex items-center pl-3 text-gray-400 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o descripción..."
            className="flex-1 px-3 py-2 text-sm outline-none bg-transparent"
          />
          {/* Separador */}
          <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
          {/* Filtro categoría */}
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 text-sm text-gray-600 bg-transparent outline-none cursor-pointer border-none appearance-none pr-7 bg-no-repeat"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: 'right 6px center' }}
          >
            <option value="">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Separador */}
          <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
          {/* Filtro estado */}
          <select
            value={filtroEstado}
            onChange={e => setFiltroEstado(e.target.value)}
            className="px-3 py-2 text-sm text-gray-600 bg-transparent outline-none cursor-pointer border-none appearance-none pr-7 bg-no-repeat"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: 'right 6px center' }}
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
          {/* Limpiar filtros */}
          {hayFiltros && (
            <>
              <div className="w-px h-6 bg-gray-200 flex-shrink-0" />
              <button
                onClick={() => { setBusqueda(''); setFiltroCategoria(''); setFiltroEstado('') }}
                className="px-3 py-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                title="Limpiar filtros"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </>
          )}
        </div>

        <Link href="/admin/plan-produccion"
          className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 transition-colors whitespace-nowrap flex-shrink-0">
          Plan de producción
        </Link>
        <button onClick={() => setModal('nuevo')}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 transition-colors whitespace-nowrap flex-shrink-0">
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
            {filtrados.map(p => (
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{p.nombre}</p>
                    <div className="flex gap-1">
                      {p.destacado && (
                        <span title="Destacado" className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      )}
                      {p.oferta_relamago && (
                        <span title="Oferta relámpago" className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      )}
                      {p.nueva_linea && (
                        <span title="Nueva línea" className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
                      )}
                    </div>
                  </div>
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
        {!filtrados.length && (
          <div className="p-8 text-center text-sm text-gray-500">
            {hayFiltros ? 'Sin resultados para los filtros aplicados.' : 'No hay productos cargados.'}
          </div>
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
