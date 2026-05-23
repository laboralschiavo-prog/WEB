import Link from 'next/link'

// Solo disponible en desarrollo — muestra la UI del admin con datos de ejemplo
if (process.env.NODE_ENV === 'production') {
  throw new Error('dev-preview no disponible en producción')
}

const CLIENTES_DEMO = [
  { id: '1', razon_social: 'Ferretería El Tornillo S.R.L.', email: 'compras@eltornillo.com', cuit: '30712345678', tipo_comercio: 'Ferretería mayorista', telefono: '11 4567-8901', direccion: 'Av. Rivadavia 4520, CABA', creado_en: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', razon_social: 'Bazar Milenium', email: 'milenium@gmail.com', cuit: '20345678901', tipo_comercio: 'Bazar y regalería', telefono: '351 456-7890', direccion: 'Calle 9 de Julio 123, Córdoba', creado_en: new Date(Date.now() - 7200000).toISOString() },
  { id: '3', razon_social: null, email: 'distribuidora.norte@outlook.com', cuit: '30987654321', tipo_comercio: 'Distribuidora de artículos del hogar', telefono: null, direccion: null, creado_en: new Date(Date.now() - 1800000).toISOString() },
]

const CLIENTES_APROBADOS = [
  { id: '4', razon_social: 'Mueblería Centro S.A.', email: 'ventas@muebleriacentro.com', cuit: '30111222333', tipo_comercio: 'Mueblería', subcategoria_id: 'premium', margen_personalizado: null, total_compras: 22, subcategorias: { nombre: 'Cliente Premium', margen_porcentaje: 0.15 } },
  { id: '5', razon_social: 'Distribuidora Río de la Plata', email: 'riodelaplata@empresa.com', cuit: '30444555666', tipo_comercio: 'Distribuidora mayorista', subcategoria_id: 'vip', margen_personalizado: 0.08, total_compras: 47, subcategorias: { nombre: 'Cliente VIP', margen_porcentaje: 0.10 } },
  { id: '6', razon_social: 'Bazar La Esquina', email: 'laesquina@hotmail.com', cuit: '20789012345', tipo_comercio: 'Bazar', subcategoria_id: 'frecuente', margen_personalizado: null, total_compras: 8, subcategorias: { nombre: 'Cliente Frecuente', margen_porcentaje: 0.25 } },
  { id: '7', razon_social: 'Ferretería Nuevo Mundo', email: 'nuevomundo@gmail.com', cuit: '27234567890', tipo_comercio: 'Ferretería', subcategoria_id: 'nuevo', margen_personalizado: null, total_compras: 2, subcategorias: { nombre: 'Cliente Nuevo', margen_porcentaje: 0.40 } },
]

const SUBCATEGORIAS = [
  { id: 'nuevo',     nombre: 'Cliente Nuevo',     margen_porcentaje: 0.40, compras_requeridas: 5 },
  { id: 'frecuente', nombre: 'Cliente Frecuente', margen_porcentaje: 0.25, compras_requeridas: 15 },
  { id: 'premium',   nombre: 'Cliente Premium',   margen_porcentaje: 0.15, compras_requeridas: 30 },
  { id: 'vip',       nombre: 'Cliente VIP',       margen_porcentaje: 0.10, compras_requeridas: 0 },
]

type Tab = 'solicitudes' | 'clientes' | 'configuracion'

export default function DevPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  return <DevPreviewContent searchParamsPromise={searchParams} />
}

async function DevPreviewContent({ searchParamsPromise }: { searchParamsPromise: Promise<{ tab?: string }> }) {
  const params = await searchParamsPromise
  const tab = (params.tab ?? 'solicitudes') as Tab

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-900 text-white flex flex-col py-6">
        <div className="px-4 mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Panel Admin</p>
          <p className="text-sm font-semibold mt-1">POSTA SRL</p>
          <span className="inline-block mt-2 rounded-full bg-yellow-500/20 text-yellow-400 text-xs px-2 py-0.5">
            Vista previa
          </span>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          {[
            { id: 'solicitudes', label: 'Solicitudes' },
            { id: 'clientes', label: 'Clientes' },
            { id: 'configuracion', label: 'Subcategorías' },
          ].map(item => (
            <Link
              key={item.id}
              href={`/admin/dev-preview?tab=${item.id}`}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                tab === item.id
                  ? 'bg-gray-700 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-4 mt-4 text-xs text-gray-500">
          laboral.schiavo@gmail.com
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto bg-gray-50 p-8">
        {tab === 'solicitudes' && <SolicitudesTab />}
        {tab === 'clientes' && <ClientesTab />}
        {tab === 'configuracion' && <ConfiguracionTab />}
      </main>
    </div>
  )
}

function SolicitudesTab() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Solicitudes pendientes</h1>
        <span className="rounded-full bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5">
          {CLIENTES_DEMO.length} pendientes
        </span>
      </div>
      <div className="space-y-3">
        {CLIENTES_DEMO.map(cliente => (
          <div key={cliente.id} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="font-medium text-gray-900">{cliente.razon_social ?? cliente.email}</p>
                <p className="text-sm text-gray-500">
                  CUIT: {cliente.cuit} · {cliente.tipo_comercio}
                </p>
                <p className="text-sm text-gray-500">
                  {cliente.email}{cliente.telefono ? ` · ${cliente.telefono}` : ''}
                </p>
                {cliente.direccion && <p className="text-sm text-gray-400">{cliente.direccion}</p>}
                <p className="text-xs text-gray-400">
                  Registrado: {new Date(cliente.creado_en).toLocaleString('es-AR')}
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                  Aprobar
                </button>
                <button className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                  Rechazar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function ClientesTab() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clientes aprobados</h1>
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
          + Agregar cliente VIP
        </button>
      </div>
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
            {CLIENTES_APROBADOS.map(c => {
              const margen = c.margen_personalizado ?? c.subcategorias.margen_porcentaje
              return (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{c.razon_social}</td>
                  <td className="px-4 py-3 text-gray-500">{c.cuit}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.subcategoria_id === 'vip'      ? 'bg-yellow-100 text-yellow-700' :
                      c.subcategoria_id === 'premium'  ? 'bg-purple-100 text-purple-700' :
                      c.subcategoria_id === 'frecuente'? 'bg-blue-100 text-blue-700' :
                                                         'bg-gray-100 text-gray-600'
                    }`}>
                      {c.subcategorias.nombre}
                      {c.margen_personalizado !== null && ' (custom)'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{c.total_compras}</td>
                  <td className="px-4 py-3 text-gray-500">+{(margen * 100).toFixed(0)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ConfiguracionTab() {
  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-2">Configuración de subcategorías</h1>
      <p className="text-sm text-gray-500 mb-6">
        Definí el margen de precio y las compras necesarias para ascender en cada nivel.
      </p>
      <div className="space-y-3">
        {SUBCATEGORIAS.map(s => (
          <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-6">
            <div className="w-36">
              <span className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                s.id === 'vip'      ? 'bg-yellow-100 text-yellow-700' :
                s.id === 'premium' ? 'bg-purple-100 text-purple-700' :
                s.id === 'frecuente'? 'bg-blue-100 text-blue-700' :
                                      'bg-gray-100 text-gray-600'
              }`}>
                {s.nombre}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600 whitespace-nowrap">Margen:</label>
              <input
                type="number" defaultValue={(s.margen_porcentaje * 100).toFixed(0)}
                className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
              />
              <span className="text-sm text-gray-500">%</span>
            </div>
            {s.id !== 'vip' && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Compras para ascender:</label>
                <input
                  type="number" defaultValue={s.compras_requeridas}
                  className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-center"
                />
              </div>
            )}
            {s.id === 'vip' && (
              <p className="text-sm text-gray-400 italic">Asignación manual únicamente</p>
            )}
            <div className="ml-auto">
              <button className="rounded-lg bg-gray-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 transition-colors">
                Guardar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-blue-50 border border-blue-200 p-4">
        <p className="text-sm font-medium text-blue-800 mb-1">Cómo funciona el ascenso automático</p>
        <p className="text-sm text-blue-700">
          Cuando un cliente concreta una compra, el sistema incrementa su contador y verifica si alcanzó
          el umbral de la siguiente subcategoría. El cambio es automático vía trigger en PostgreSQL.
          VIP solo se asigna manualmente desde esta pantalla.
        </p>
      </div>
    </div>
  )
}
