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
}

type CartItem = {
  _key: string
  producto: Producto
  cantidad: number
  formato: 'unidades' | 'bultos' | 'pallet'
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

export default function CatalogClient({ productos, categorias, promociones, subcategoriaId }: {
  productos: Producto[]
  categorias: string[]
  promociones: Promocion[]
  subcategoriaId: string
}) {
  const [filtro, setFiltro] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [carritoOpen, setCarritoOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [limiteAlcanzado, setLimiteAlcanzado] = useState(false)
  const router = useRouter()

  const filtrados = filtro ? productos.filter(p => p.categoria === filtro) : productos

  function totalUnidades(item: CartItem) {
    const uds = item.formato === 'bultos' ? (item.producto.unidades_por_bulto ?? 1)
              : item.formato === 'pallet' ? (item.producto.unidades_por_pallet ?? 1)
              : 1
    return item.cantidad * uds
  }

  function precioConDescuento(item: CartItem, promosAplicadas: Array<{ promo: Promocion; descuento: number }>) {
    const promo = promosAplicadas.find(pa => pa.promo.producto_id === item.producto.id)
    if (!promo) return item.producto.precioMostrado
    return item.producto.precioMostrado * (1 - promo.descuento / 100)
  }

  function totalCarrito(promosAplicadas: Array<{ promo: Promocion; descuento: number }>) {
    return cart.reduce((acc, item) => acc + precioConDescuento(item, promosAplicadas) * totalUnidades(item), 0)
  }

  function agregarAlCarrito(producto: Producto) {
    setCart(prev => {
      const existeUnidades = prev.find(i => i.producto.id === producto.id && i.formato === 'unidades')
      if (existeUnidades) {
        return prev.map(i => i._key === existeUnidades._key ? { ...i, cantidad: i.cantidad + 1 } : i)
      }
      return [...prev, { _key: newKey(), producto, cantidad: 1, formato: 'unidades' }]
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
      return [...sinProducto, { _key: newKey(), producto, cantidad: cantidadNecesaria, formato: fmt }]
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
    const res = await fetch('/api/cotizacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(item => {
          const uds = totalUnidades(item)
          const udsFormato = item.formato !== 'unidades'
            ? (item.formato === 'bultos' ? item.producto.unidades_por_bulto : item.producto.unidades_por_pallet)
            : null
          return {
            producto_id: item.producto.id,
            cantidad: uds,
            precio_base_snapshot: item.producto.precio_base,
            margen_aplicado: 0,
            precio_mostrado: item.producto.precioMostrado,
            formato_entrega: item.formato,
            formato_cantidad: udsFormato,
          }
        }),
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
    const promo = promosAplicadas.find(pa => pa.promo.producto_id === item.producto.id)
    if (!promo) return acc
    return acc + item.producto.precioMostrado * (promo.descuento / 100) * totalUnidades(item)
  }, 0)

  return (
    <div className="relative">
      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button onClick={() => setFiltro(null)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !filtro ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}>
          Todos
        </button>
        {categorias.map(cat => (
          <button key={cat} onClick={() => setFiltro(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filtro === cat ? 'bg-gray-900 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}>
            {cat}
          </button>
        ))}
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
                    {producto.stock > 0
                      ? <span className="text-xs text-green-700 bg-green-100 rounded-full px-2 py-0.5">Stock: {producto.stock}</span>
                      : <span className="text-xs text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">Sin stock</span>
                    }
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
                const promoItem = promosAplicadas.find(pa => pa.promo.producto_id === item.producto.id)
                const precioUd = promoItem
                  ? item.producto.precioMostrado * (1 - promoItem.descuento / 100)
                  : item.producto.precioMostrado
                const subtotal = precioUd * totalUds

                return (
                  <div key={item._key} className="border border-gray-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      {item.producto.imagen_url
                        ? <img src={item.producto.imagen_url} className="w-12 h-12 object-cover rounded-lg border border-gray-200 flex-shrink-0" />
                        : <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex-shrink-0" />
                      }
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{item.producto.nombre}</p>
                        {(() => {
                          const promoItem = promosAplicadas.find(pa => pa.promo.producto_id === item.producto.id)
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

                    {/* Formato */}
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
