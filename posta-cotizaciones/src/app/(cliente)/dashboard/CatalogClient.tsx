'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatPrecio } from '@/lib/pricing'

type Producto = {
  id: string
  nombre: string
  descripcion: string | null
  categoria: string | null
  precio_base: number
  stock: number
  imagen_url: string | null
  unidades_por_bulto: number | null
  unidades_por_pallet: number | null
  precioMostrado: number
  margen: number
  destacado: boolean
  oferta_relamago: boolean
  precio_oferta: number | null
  nueva_linea: boolean
}

type CartItem = {
  _key: string
  producto: Producto
  cantidad: number
  formato: 'unidades' | 'bultos' | 'pallet'
  es_pedido: boolean
}

type Promocion = {
  id: string
  producto_id: string
  nombre: string
  descripcion: string
  cantidad_minima: number
  formato_requerido: string | null
  descuento_porcentaje: number | null
  subcategoria_ids: string[] | null
}

const FORMATOS = [
  { id: 'unidades' as const, label: 'Unidades' },
  { id: 'bultos'   as const, label: 'Bultos' },
  { id: 'pallet'   as const, label: 'Pallet' },
]

function newKey() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function CatalogClient({ productos, categorias, promociones, subcategoriaId, pedidoHabilitado, pedidoTexto, pedidoDescuento, pedidoPlazo, planProduccion }: {
  productos: Producto[]
  categorias: string[]
  promociones: Promocion[]
  subcategoriaId: string
  pedidoHabilitado: boolean
  pedidoTexto: string
  pedidoDescuento: number
  pedidoPlazo: number
  planProduccion: Record<string, { fecha: string; cantidad: number }>
}) {
  const [filtro, setFiltro] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [carritoOpen, setCarritoOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState<'destacados' | 'relamago' | 'nueva_linea' | null>(null)
  const [pedidoExpanded, setPedidoExpanded] = useState(false)
  const router = useRouter()

  const productosConStock = productos.filter(p => p.stock > 0)
  const productosSinStock = productos.filter(p => p.stock === 0)

  const destacados = productosConStock.filter(p => p.destacado)
  const relamago = productosConStock.filter(p => p.oferta_relamago)
  const nuevaLinea = productosConStock.filter(p => p.nueva_linea)
  const hayBanners = destacados.length > 0 || relamago.length > 0 || nuevaLinea.length > 0

  function toggleSeccion(s: 'destacados' | 'relamago' | 'nueva_linea') {
    setSeccionActiva(prev => prev === s ? null : s)
  }

  const filtrados = productosConStock.filter(p => {
    if (filtro && p.categoria !== filtro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!p.nombre.toLowerCase().includes(q) && !(p.descripcion ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const filtradosSinStock = productosSinStock.filter(p => {
    if (filtro && p.categoria !== filtro) return false
    if (busqueda) {
      const q = busqueda.toLowerCase()
      if (!p.nombre.toLowerCase().includes(q) && !(p.descripcion ?? '').toLowerCase().includes(q)) return false
    }
    return true
  })

  function totalUnidades(item: CartItem) {
    const uds = item.formato === 'bultos' ? (item.producto.unidades_por_bulto ?? 1)
              : item.formato === 'pallet' ? (item.producto.unidades_por_pallet ?? 1)
              : 1
    return item.cantidad * uds
  }

  function precioConDescuento(item: CartItem, promosAplicadas: Array<{ promo: Promocion; descuento: number }>) {
    if (item.es_pedido && pedidoDescuento > 0) {
      return item.producto.precioMostrado * (1 - pedidoDescuento / 100)
    }
    const promo = promosAplicadas.find(pa => pa.promo.producto_id === item.producto.id)
    if (!promo) return item.producto.precioMostrado
    return item.producto.precioMostrado * (1 - promo.descuento / 100)
  }

  function totalCarrito(promosAplicadas: Array<{ promo: Promocion; descuento: number }>) {
    return cart.reduce((acc, item) => acc + precioConDescuento(item, promosAplicadas) * totalUnidades(item), 0)
  }

  function agregarAlCarrito(producto: Producto) {
    setCart(prev => {
      const existeUnidades = prev.find(i => i.producto.id === producto.id && i.formato === 'unidades' && !i.es_pedido)
      if (existeUnidades) {
        return prev.map(i => i._key === existeUnidades._key ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, { _key: newKey(), producto, cantidad: 1, formato: 'unidades', es_pedido: false }]
    })
    setCarritoOpen(true)
  }

  function agregarPedido(producto: Producto) {
    setCart(prev => {
      const existe = prev.find(i => i.producto.id === producto.id && i.es_pedido)
      if (existe) {
        return prev.map(i => i._key === existe._key ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, { _key: newKey(), producto, cantidad: 1, formato: 'unidades', es_pedido: true }]
    })
    setCarritoOpen(true)
  }

  function cambiarCantidad(key: string, delta: number) {
    setCart(prev => prev
      .map(i => i._key === key ? { ...i, cantidad: Math.max(0, i.cantidad + delta) } : i)
      .filter(i => i.cantidad > 0)
    )
  }

  function cambiarFormato(key: string, formato: CartItem['formato']) {
    setCart(prev => {
      const item = prev.find(i => i._key === key)
      if (!item) return prev
      // Si ya existe una entrada con ese (producto, formato), fusionar cantidades
      const existing = prev.find(i => i._key !== key && i.producto.id === item.producto.id && i.formato === formato)
      if (existing) {
        return prev
          .map(i => i._key === existing._key ? { ...i, cantidad: i.cantidad + item.cantidad } : i)
          .filter(i => i._key !== key)
      }
      return prev.map(i => i._key === key ? { ...i, formato } : i)
    })
  }

  function eliminarItem(key: string) {
    setCart(prev => prev.filter(i => i._key !== key))
  }

  function aplicarSugerencia(promo: Promocion) {
    setCart(prev => {
      const items = prev.filter(i => i.producto.id === promo.producto_id)
      if (!items.length) return prev
      const producto = items[0].producto
      const totalUds = items.reduce((sum, i) => sum + totalUnidades(i), 0)
      const fmt = (promo.formato_requerido ?? 'unidades') as CartItem['formato']
      const udsPerFmt = fmt === 'bultos' ? (producto.unidades_por_bulto ?? 1)
                      : fmt === 'pallet' ? (producto.unidades_por_pallet ?? 1)
                      : 1
      const cantidadNecesaria = Math.ceil(Math.max(promo.cantidad_minima, totalUds) / udsPerFmt)
      const sinProducto = prev.filter(i => i.producto.id !== promo.producto_id)
      return [...sinProducto, { _key: newKey(), producto, cantidad: cantidadNecesaria, formato: fmt, es_pedido: false }]
    })
  }

  // Promos accesibles para este cliente (opt-in: debe estar en subcategoria_ids)
  function esAccesible(promo: Promocion) {
    return Array.isArray(promo.subcategoria_ids) && promo.subcategoria_ids.includes(subcategoriaId)
  }

  // Condición ya cumplida → descuento se aplica
  function condicionCumplida(promo: Promocion): boolean {
    const items = cart.filter(i => i.producto.id === promo.producto_id)
    if (!items.length) return false
    const totalUds = items.reduce((sum, i) => sum + totalUnidades(i), 0)
    if (promo.formato_requerido) {
      return items.some(i => i.formato === promo.formato_requerido) && totalUds >= promo.cantidad_minima
    }
    return totalUds >= promo.cantidad_minima
  }

  // Promos cuyo descuento ya está activo en el carrito
  function getPromosAplicadas(): Array<{ promo: Promocion; descuento: number }> {
    return promociones
      .filter(promo => esAccesible(promo) && promo.descuento_porcentaje && condicionCumplida(promo))
      .map(promo => ({ promo, descuento: promo.descuento_porcentaje! }))
  }

  // Promos que el cliente podría aprovechar pero aún no cumple la condición
  function getSugerencias(): Array<{ promo: Promocion; productoNombre: string }> {
    return promociones
      .filter(promo => {
        if (!esAccesible(promo)) return false
        if (condicionCumplida(promo)) return false  // ya aplicada
        const items = cart.filter(i => i.producto.id === promo.producto_id)
        if (!items.length) return false
        return true
      })
      .map(promo => ({
        promo,
        productoNombre: productos.find(p => p.id === promo.producto_id)?.nombre ?? promo.producto_id,
      }))
  }

  async function generarPresupuesto() {
    setLoading(true)

    // Expandir ítems que exceden stock: split en inmediato + pedido
    const itemsExpandidos = cart.flatMap(item => {
      const uds = totalUnidades(item)
      const excede = !item.es_pedido && uds > item.producto.stock && item.producto.stock > 0
      if (excede && pedidoHabilitado) {
        const stockUds = item.producto.stock
        const pedidoUds = uds - stockUds
        return [
          {
            producto_id: item.producto.id,
            cantidad: stockUds,
            precio_base_snapshot: item.producto.precio_base,
            margen_aplicado: 0,
            precio_mostrado: item.producto.precioMostrado,
            formato_entrega: 'unidades',
            formato_cantidad: null,
          },
          {
            producto_id: item.producto.id,
            cantidad: pedidoUds,
            precio_base_snapshot: item.producto.precio_base,
            margen_aplicado: pedidoDescuento > 0 ? -(pedidoDescuento) : 0,
            precio_mostrado: pedidoDescuento > 0
              ? item.producto.precioMostrado * (1 - pedidoDescuento / 100)
              : item.producto.precioMostrado,
            formato_entrega: 'pedido',
            formato_cantidad: null,
          },
        ]
      }
      const udsFormato = item.formato !== 'unidades'
        ? (item.formato === 'bultos' ? item.producto.unidades_por_bulto : item.producto.unidades_por_pallet)
        : null
      return [{
        producto_id: item.producto.id,
        cantidad: uds,
        precio_base_snapshot: item.producto.precio_base,
        margen_aplicado: item.es_pedido ? -(pedidoDescuento) : 0,
        precio_mostrado: item.es_pedido && pedidoDescuento > 0
          ? item.producto.precioMostrado * (1 - pedidoDescuento / 100)
          : item.producto.precioMostrado,
        formato_entrega: item.es_pedido ? 'pedido' : item.formato,
        formato_cantidad: udsFormato,
      }]
    })

    const hayPedidos = itemsExpandidos.some(i => i.formato_entrega === 'pedido')
    const notaPedido = hayPedidos && pedidoTexto
      ? `Incluye ítems a pedido (fabricación bajo encargo). ${pedidoTexto}`
      : undefined

    const res = await fetch('/api/cotizacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(notaPedido ? { nota_inicial: notaPedido } : {}),
        items: itemsExpandidos,
      }),
    })
    setLoading(false)
    if (res.status === 429) {
      setCarritoOpen(false)
      setLimiteAlcanzado(true)
      return
    }
    setCart([])
    setCarritoOpen(false)
    router.push('/cotizaciones')
  }

  const promosAplicadas = getPromosAplicadas()
  const sugerencias = getSugerencias()
  const totalItemsEnCarrito = cart.reduce((s, i) => s + i.cantidad, 0)
  const totalAhorro = cart.reduce((acc, item) => {
    if (item.es_pedido && pedidoDescuento > 0) {
      return acc + item.producto.precioMostrado * (pedidoDescuento / 100) * totalUnidades(item)
    }
    const promo = promosAplicadas.find(pa => pa.promo.producto_id === item.producto.id)
    if (!promo) return acc
    return acc + item.producto.precioMostrado * (promo.descuento / 100) * totalUnidades(item)
  }, 0)

  return (
    <div className="relative">

      {/* Overlay transparente — cierra sección activa al click afuera */}
      {seccionActiva && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSeccionActiva(null)}
        />
      )}

      {/* Banners promocionales */}
      {hayBanners && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Destacados */}
          <button
            onClick={() => toggleSeccion('destacados')}
            disabled={destacados.length === 0}
            className={`text-left rounded-xl border px-4 py-3 transition-all ${
              seccionActiva === 'destacados'
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : destacados.length > 0
                  ? 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                  : 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className={`w-4 h-4 ${seccionActiva === 'destacados' ? 'text-blue-200' : 'text-blue-500'}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className={`text-xs font-semibold uppercase tracking-wider ${seccionActiva === 'destacados' ? 'text-blue-100' : 'text-blue-600'}`}>
                Destacados
              </span>
            </div>
            <p className={`text-sm font-medium leading-tight ${seccionActiva === 'destacados' ? 'text-white' : 'text-gray-900'}`}>
              Productos destacados
            </p>
            <p className={`text-xs mt-0.5 ${seccionActiva === 'destacados' ? 'text-blue-200' : 'text-gray-400'}`}>
              {destacados.length} {destacados.length === 1 ? 'artículo' : 'artículos'} {seccionActiva === 'destacados' ? '▲' : '▼'}
            </p>
          </button>

          {/* Relámpago */}
          <button
            onClick={() => toggleSeccion('relamago')}
            disabled={relamago.length === 0}
            className={`text-left rounded-xl border px-4 py-3 transition-all ${
              seccionActiva === 'relamago'
                ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                : relamago.length > 0
                  ? 'bg-white border-gray-200 hover:border-amber-300 hover:shadow-sm'
                  : 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className={`w-4 h-4 ${seccionActiva === 'relamago' ? 'text-amber-100' : 'text-amber-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className={`text-xs font-semibold uppercase tracking-wider ${seccionActiva === 'relamago' ? 'text-amber-100' : 'text-amber-600'}`}>
                Oferta relámpago
              </span>
            </div>
            <p className={`text-sm font-medium leading-tight ${seccionActiva === 'relamago' ? 'text-white' : 'text-gray-900'}`}>
              Precios especiales
            </p>
            <p className={`text-xs mt-0.5 ${seccionActiva === 'relamago' ? 'text-amber-100' : 'text-gray-400'}`}>
              {relamago.length} {relamago.length === 1 ? 'oferta' : 'ofertas'} disponible{relamago.length !== 1 ? 's' : ''} {seccionActiva === 'relamago' ? '▲' : '▼'}
            </p>
          </button>

          {/* Nueva línea */}
          <button
            onClick={() => toggleSeccion('nueva_linea')}
            disabled={nuevaLinea.length === 0}
            className={`text-left rounded-xl border px-4 py-3 transition-all ${
              seccionActiva === 'nueva_linea'
                ? 'bg-purple-600 border-purple-600 text-white shadow-md'
                : nuevaLinea.length > 0
                  ? 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
                  : 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className={`w-4 h-4 ${seccionActiva === 'nueva_linea' ? 'text-purple-200' : 'text-purple-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
              <span className={`text-xs font-semibold uppercase tracking-wider ${seccionActiva === 'nueva_linea' ? 'text-purple-200' : 'text-purple-600'}`}>
                Novedad
              </span>
            </div>
            <p className={`text-sm font-medium leading-tight ${seccionActiva === 'nueva_linea' ? 'text-white' : 'text-gray-900'}`}>
              Conocé la nueva línea
            </p>
            <p className={`text-xs mt-0.5 ${seccionActiva === 'nueva_linea' ? 'text-purple-200' : 'text-gray-400'}`}>
              {nuevaLinea.length} {nuevaLinea.length === 1 ? 'producto' : 'productos'} nuevo{nuevaLinea.length !== 1 ? 's' : ''} {seccionActiva === 'nueva_linea' ? '▲' : '▼'}
            </p>
          </button>
        </div>
      )}

      {/* Sección expandida — Destacados */}
      {seccionActiva === 'destacados' && destacados.length > 0 && (
        <div className="relative z-20 bg-white rounded-xl border border-blue-200 overflow-hidden mb-5">
          <div className="bg-blue-50 px-4 py-2.5 border-b border-blue-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Productos destacados</p>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {destacados.map(producto => {
                const enCarrito = cart.some(i => i.producto.id === producto.id)
                return (
                  <tr key={producto.id} className="hover:bg-blue-50/40 align-middle">
                    <td className="px-3 py-3 w-14">
                      {producto.imagen_url
                        ? <img src={producto.imagen_url} alt={producto.nombre} className="w-11 h-11 object-cover rounded-lg border border-gray-200" />
                        : <div className="w-11 h-11 bg-gray-100 rounded-lg border border-gray-200" />}
                    </td>
                    <td className="px-4 py-3 flex-1">
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      {producto.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{producto.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-900 w-32">{formatPrecio(producto.precioMostrado)}</td>
                    <td className="px-4 py-3 text-right w-36">
                      <button onClick={() => agregarAlCarrito(producto)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${enCarrito ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                        {enCarrito ? '+ Agregar más' : '+ Agregar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sección expandida — Relámpago */}
      {seccionActiva === 'relamago' && relamago.length > 0 && (
        <div className="relative z-20 bg-white rounded-xl border border-amber-200 overflow-hidden mb-5">
          <div className="bg-amber-50 px-4 py-2.5 border-b border-amber-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Ofertas relámpago — precios especiales</p>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {relamago.map(producto => {
                const enCarrito = cart.some(i => i.producto.id === producto.id)
                const tieneOferta = producto.oferta_relamago && producto.precio_oferta
                return (
                  <tr key={producto.id} className="hover:bg-amber-50/40 align-middle">
                    <td className="px-3 py-3 w-14">
                      {producto.imagen_url
                        ? <img src={producto.imagen_url} alt={producto.nombre} className="w-11 h-11 object-cover rounded-lg border border-gray-200" />
                        : <div className="w-11 h-11 bg-gray-100 rounded-lg border border-gray-200" />}
                    </td>
                    <td className="px-4 py-3 flex-1">
                      <p className="font-medium text-gray-900">{producto.nombre}</p>
                      {producto.descripcion && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{producto.descripcion}</p>}
                    </td>
                    <td className="px-4 py-3 text-right w-40">
                      {tieneOferta ? (
                        <div>
                          <p className="text-xs text-gray-400 line-through">{formatPrecio(producto.precio_base)}</p>
                          <p className="font-semibold text-amber-700">{formatPrecio(producto.precioMostrado)}</p>
                        </div>
                      ) : (
                        <p className="font-semibold text-gray-900">{formatPrecio(producto.precioMostrado)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right w-36">
                      <button onClick={() => agregarAlCarrito(producto)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${enCarrito ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-amber-500 text-white hover:bg-amber-600'}`}>
                        {enCarrito ? '+ Agregar más' : '+ Agregar'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Sección expandida — Nueva línea (galería) */}
      {seccionActiva === 'nueva_linea' && nuevaLinea.length > 0 && (
        <div className="relative z-20 bg-white rounded-xl border border-purple-200 overflow-hidden mb-5">
          <div className="bg-purple-50 px-4 py-2.5 border-b border-purple-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Nueva línea — descubrí las novedades</p>
          </div>
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {nuevaLinea.map(producto => {
              const enCarrito = cart.some(i => i.producto.id === producto.id)
              return (
                <div key={producto.id} className="rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {producto.imagen_url ? (
                    <img src={producto.imagen_url} alt={producto.nombre}
                      className="w-full aspect-square object-cover" />
                  ) : (
                    <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                      <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="p-3">
                    <p className="font-medium text-gray-900 text-sm truncate" title={producto.nombre}>{producto.nombre}</p>
                    {producto.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{producto.descripcion}</p>
                    )}
                    <p className="text-sm font-semibold text-gray-900 mt-1.5">{formatPrecio(producto.precioMostrado)}</p>
                    {producto.stock > 0
                      ? <p className="text-xs text-green-600 mt-0.5">Stock: {producto.stock}</p>
                      : <p className="text-xs text-gray-400 mt-0.5">Sin stock</p>}
                    <button onClick={() => agregarAlCarrito(producto)}
                      className={`w-full mt-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        enCarrito ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}>
                      {enCarrito ? '✓ En carrito' : '+ Agregar'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Barra de búsqueda + filtro de categoría */}
      <div className="mb-6 space-y-3">
        <div className="flex items-center bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden focus-within:border-blue-300 focus-within:shadow-md transition-all">
          {/* Ícono búsqueda */}
          <div className="pl-4 text-gray-400 flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </div>
          {/* Input */}
          <input
            type="text"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar productos..."
            className="flex-1 px-3 py-3 text-sm text-gray-800 placeholder-gray-400 outline-none bg-transparent"
          />
          {/* Limpiar búsqueda */}
          {busqueda && (
            <button onClick={() => setBusqueda('')} className="px-2 text-gray-300 hover:text-gray-500 transition-colors flex-shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {/* Separador */}
          <div className="w-px h-6 bg-gray-200 flex-shrink-0 mx-1" />
          {/* Categoría */}
          <select
            value={filtro ?? ''}
            onChange={e => setFiltro(e.target.value || null)}
            className="px-3 py-3 text-sm text-gray-600 bg-transparent outline-none cursor-pointer border-none appearance-none pr-8 bg-no-repeat flex-shrink-0"
            style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")", backgroundPosition: 'right 8px center' }}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Resultado count — solo cuando hay filtro activo */}
        {(busqueda || filtro) && (
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              {filtrados.length} {filtrados.length === 1 ? 'producto' : 'productos'}
              {filtro && <span> en <span className="font-medium text-gray-700">{filtro}</span></span>}
              {busqueda && <span> para "<span className="font-medium text-gray-700">{busqueda}</span>"</span>}
            </p>
            <button
              onClick={() => { setBusqueda(''); setFiltro(null) }}
              className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
            >
              Limpiar
            </button>
          </div>
        )}
      </div>

      {/* Tabla de productos */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="w-16 px-3 py-3"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell w-24">Stock</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase w-32">Precio</th>
              <th className="w-36 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtrados.map(producto => {
              const enCarrito = cart.some(i => i.producto.id === producto.id)
              const cantidadEnCarrito = cart.filter(i => i.producto.id === producto.id).reduce((s, i) => s + i.cantidad, 0)
              return (
                <tr key={producto.id} className="hover:bg-gray-50 align-middle">
                  <td className="px-3 py-3 w-16">
                    {producto.imagen_url ? (
                      <img src={producto.imagen_url} alt={producto.nombre}
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm">{producto.nombre}</p>
                      {enCarrito && (
                        <span className="text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                          ✓ {cantidadEnCarrito} en carrito
                        </span>
                      )}
                    </div>
                    {producto.descripcion && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{producto.descripcion}</p>
                    )}
                    {producto.categoria && (
                      <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5 mt-0.5 inline-block">{producto.categoria}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell w-24">
                    <span className="text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                      Stock: {producto.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900 w-32">
                    {formatPrecio(producto.precioMostrado)}
                  </td>
                  <td className="px-4 py-3 text-right w-36">
                    <button onClick={() => agregarAlCarrito(producto)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                        enCarrito
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}>
                      {enCarrito ? '+ Agregar más' : '+ Agregar'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!filtrados.length && (
          <div className="p-8 text-center text-sm text-gray-500">No hay productos en esta categoría.</div>
        )}
      </div>

      {/* Sección A pedido (sin stock) */}
      {pedidoHabilitado && filtradosSinStock.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setPedidoExpanded(p => !p)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-orange-200 bg-orange-50 hover:bg-orange-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="text-sm font-medium text-orange-800">
                  Productos a pedido — {filtradosSinStock.length} {filtradosSinStock.length === 1 ? 'artículo' : 'artículos'}
                </span>
                {pedidoPlazo > 0 && (
                  <span className="ml-2 text-xs text-orange-600">· Plazo estimado: {pedidoPlazo} días</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {pedidoTexto && (
                <span className="text-xs text-orange-600 hidden sm:block max-w-xs truncate">{pedidoTexto}</span>
              )}
              <svg className={`w-4 h-4 text-orange-500 transition-transform ${pedidoExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {pedidoExpanded && (
            <div className="mt-1 bg-white rounded-xl border border-orange-200 overflow-hidden">
              {(pedidoTexto || pedidoPlazo > 0) && (
                <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-100 flex items-start gap-2">
                  <svg className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="space-y-0.5">
                    {pedidoTexto && <p className="text-xs text-orange-700">{pedidoTexto}</p>}
                    {pedidoPlazo > 0 && (
                      <p className="text-xs text-orange-600 font-medium">Plazo estimado de entrega: {pedidoPlazo} días.</p>
                    )}
                  </div>
                </div>
              )}
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {filtradosSinStock.map(producto => {
                    const enCarrito = cart.some(i => i.producto.id === producto.id && i.es_pedido)
                    const cantidadEnCarrito = cart.filter(i => i.producto.id === producto.id && i.es_pedido).reduce((s, i) => s + i.cantidad, 0)
                    const precioFinal = pedidoDescuento > 0
                      ? producto.precioMostrado * (1 - pedidoDescuento / 100)
                      : producto.precioMostrado
                    return (
                      <tr key={producto.id} className="hover:bg-orange-50/40 align-middle">
                        <td className="px-3 py-3 w-16">
                          {producto.imagen_url
                            ? <img src={producto.imagen_url} alt={producto.nombre} className="w-12 h-12 object-cover rounded-lg border border-gray-200" />
                            : <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200" />}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900 text-sm">{producto.nombre}</p>
                            <span className="text-xs text-orange-700 bg-orange-100 rounded-full px-2 py-0.5 whitespace-nowrap">A pedido</span>
                            {enCarrito && (
                              <span className="text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5 whitespace-nowrap">
                                ✓ {cantidadEnCarrito} en carrito
                              </span>
                            )}
                          </div>
                          {producto.descripcion && (
                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1 max-w-xs">{producto.descripcion}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right w-36">
                          {pedidoDescuento > 0 ? (
                            <div>
                              <p className="text-xs text-gray-400 line-through">{formatPrecio(producto.precioMostrado)}</p>
                              <p className="text-sm font-semibold text-orange-700">{formatPrecio(precioFinal)}</p>
                              <p className="text-xs text-orange-500">−{pedidoDescuento}%</p>
                            </div>
                          ) : (
                            <p className="text-sm font-semibold text-gray-900">{formatPrecio(producto.precioMostrado)}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right w-36">
                          <button
                            onClick={() => agregarPedido(producto)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                              enCarrito
                                ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                : 'bg-orange-500 text-white hover:bg-orange-600'
                            }`}
                          >
                            {enCarrito ? '+ Agregar más' : 'Pedir'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Botón flotante del carrito */}
      {cart.length > 0 && !carritoOpen && (
        <button onClick={() => setCarritoOpen(true)}
          className="fixed bottom-6 right-6 bg-gray-900 text-white rounded-full px-5 py-3 text-sm font-medium shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2 z-40">
          🛒 Carrito
          <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {totalItemsEnCarrito}
          </span>
        </button>
      )}

      {/* Modal límite de presupuestos */}
      {limiteAlcanzado && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl text-center">
            <div className="text-4xl mb-3">🛑</div>
            <h3 className="font-semibold text-gray-900 mb-2">Límite de presupuestos alcanzado</h3>
            <p className="text-sm text-gray-500 mb-5">
              Ya tenés un presupuesto activo. Para generar uno nuevo, esperá que un vendedor lo procese o comunicate con nosotros.
            </p>
            <div className="space-y-2">
              <a
                href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_VENDEDOR ?? '5491100000000'}?text=${encodeURIComponent('Hola, necesito ayuda con mis presupuestos en POSTA SRL.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-lg bg-green-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                Contactar a un vendedor
              </a>
              <button
                onClick={() => { setLimiteAlcanzado(false); router.push('/cotizaciones') }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Ver mis presupuestos
              </button>
              <button onClick={() => setLimiteAlcanzado(false)}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Panel del carrito — overlay cierra al hacer click afuera */}
      {carritoOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex justify-end"
          onClick={() => setCarritoOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md flex flex-col shadow-xl overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Carrito</h2>
              <button onClick={() => setCarritoOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>

            <div className="flex-1 overflow-auto px-5 py-4 space-y-4">
              {cart.map(item => {
                const udsFormato = item.formato === 'bultos' ? item.producto.unidades_por_bulto
                                 : item.formato === 'pallet' ? item.producto.unidades_por_pallet
                                 : null
                const totalUds = totalUnidades(item)
                const promoItem = !item.es_pedido
                  ? promosAplicadas.find(pa => pa.promo.producto_id === item.producto.id)
                  : undefined
                const descuentoPedido = item.es_pedido && pedidoDescuento > 0 ? pedidoDescuento : 0
                const precioUd = descuentoPedido > 0
                  ? item.producto.precioMostrado * (1 - descuentoPedido / 100)
                  : promoItem
                    ? item.producto.precioMostrado * (1 - promoItem.descuento / 100)
                    : item.producto.precioMostrado
                const subtotal = precioUd * totalUds

                return (
                  <div key={item._key} className={`border rounded-xl p-4 space-y-3 ${item.es_pedido ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      {item.producto.imagen_url
                        ? <img src={item.producto.imagen_url} className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                        : <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-medium text-gray-900 text-sm truncate">{item.producto.nombre}</p>
                          {item.es_pedido && (
                            <span className="text-xs text-orange-700 bg-orange-100 rounded-full px-1.5 py-0.5 whitespace-nowrap flex-shrink-0">A pedido</span>
                          )}
                        </div>
                        {(() => {
                          if (descuentoPedido > 0) {
                            const precioFinal = item.producto.precioMostrado * (1 - descuentoPedido / 100)
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-xs text-gray-400 line-through">{formatPrecio(item.producto.precioMostrado)} / ud.</span>
                                <span className="text-xs font-semibold text-orange-700 bg-orange-100 rounded-full px-1.5 py-0.5">-{descuentoPedido}%</span>
                                <span className="text-xs font-semibold text-orange-700">{formatPrecio(precioFinal)} / ud.</span>
                              </div>
                            )
                          }
                          if (promoItem) {
                            const precioFinal = item.producto.precioMostrado * (1 - promoItem.descuento / 100)
                            return (
                              <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                <span className="text-xs text-gray-400 line-through">{formatPrecio(item.producto.precioMostrado)} / ud.</span>
                                <span className="text-xs font-semibold text-green-700 bg-green-100 rounded-full px-1.5 py-0.5">-{promoItem.descuento}%</span>
                                <span className="text-xs font-semibold text-green-700">{formatPrecio(precioFinal)} / ud.</span>
                              </div>
                            )
                          }
                          return <p className="text-xs text-gray-500">{formatPrecio(item.producto.precioMostrado)} / ud.</p>
                        })()}
                      </div>
                      <button onClick={() => eliminarItem(item._key)}
                        className="text-gray-300 hover:text-red-500 text-lg leading-none flex-shrink-0">×</button>
                    </div>

                    {/* Formato — solo para items con stock */}
                    {!item.es_pedido && (
                      <div className="flex gap-1">
                        {FORMATOS.map(f => {
                          const uds = f.id === 'bultos' ? item.producto.unidades_por_bulto
                                    : f.id === 'pallet' ? item.producto.unidades_por_pallet
                                    : null
                          if (f.id !== 'unidades' && !uds) return null
                          return (
                            <button key={f.id} onClick={() => cambiarFormato(item._key, f.id)}
                              className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                                item.formato === f.id
                                  ? 'bg-gray-900 border-gray-900 text-white'
                                  : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                              }`}>
                              {f.label}
                              {uds && <span className="block text-[10px] opacity-70">{uds} uds.</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {/* Cantidad */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => cambiarCantidad(item._key, -1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">−</button>
                        <span className="w-8 text-center font-medium text-gray-900">{item.cantidad}</span>
                        <button onClick={() => cambiarCantidad(item._key, 1)}
                          className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50">+</button>
                        {udsFormato && (
                          <span className="text-xs text-gray-400">= {totalUds} uds.</span>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900 text-sm">{formatPrecio(subtotal)}</span>
                    </div>

                    {/* Aviso stock excedido */}
                    {!item.es_pedido && totalUds > item.producto.stock && item.producto.stock > 0 && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 space-y-2">
                        <div className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <div className="flex-1">
                            <p className="text-xs font-medium text-orange-800">
                              Solo {item.producto.stock} uds. en stock.{' '}
                              {pedidoHabilitado
                                ? `Las ${totalUds - item.producto.stock} uds. restantes irán a pedido al generar el presupuesto.`
                                : `Excedés el stock disponible en ${totalUds - item.producto.stock} uds.`
                              }
                            </p>
                            {pedidoHabilitado && planProduccion[item.producto.id] && (
                              <p className="text-xs text-orange-600 mt-0.5">
                                Próxima producción:{' '}
                                {new Date(planProduccion[item.producto.id].fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                                {' '}— {planProduccion[item.producto.id].cantidad.toLocaleString('es-AR')} uds. planificadas
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => setCart(prev => prev.map(i =>
                            i._key === item._key ? { ...i, cantidad: item.producto.stock, formato: 'unidades' } : i
                          ))}
                          className="w-full rounded-lg border border-orange-300 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-100 transition-colors"
                        >
                          Ajustar a {item.producto.stock} uds. disponibles
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Bloque de promociones / sugerencias */}
              {sugerencias.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                  <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">💡 Oportunidades de ahorro</p>
                  {sugerencias.map(({ promo, productoNombre }) => (
                    <div key={promo.id} className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-amber-900">{promo.nombre}</p>
                        <p className="text-xs text-amber-700 mt-0.5">{promo.descripcion}</p>
                        {promo.cantidad_minima > 1 && promo.formato_requerido && (
                          <p className="text-xs text-amber-600 mt-0.5">
                            Mínimo {promo.cantidad_minima} uds. en formato {promo.formato_requerido}
                          </p>
                        )}
                      </div>
                      {promo.formato_requerido && (
                        <button onClick={() => aplicarSugerencia(promo)}
                          className="w-full rounded-lg border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 transition-colors">
                          Aplicar sugerencia → {promo.formato_requerido}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-gray-200 space-y-3">
              {totalAhorro > 0 && (
                <div className="bg-green-50 rounded-lg px-3 py-2 space-y-1">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Subtotal</span>
                    <span className="line-through">{formatPrecio(totalCarrito([]))}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-700 font-medium">
                    <span>Descuentos por promo</span>
                    <span>− {formatPrecio(totalAhorro)}</span>
                  </div>
                </div>
              )}
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span>{formatPrecio(totalCarrito(promosAplicadas))}</span>
              </div>
              <button onClick={generarPresupuesto} disabled={loading}
                className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {loading ? 'Generando...' : 'Generar presupuesto'}
              </button>
              <button onClick={() => { setCart([]); setCarritoOpen(false) }}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Vaciar carrito
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
