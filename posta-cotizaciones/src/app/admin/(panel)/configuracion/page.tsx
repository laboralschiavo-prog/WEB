import { createAdminClient } from '@/lib/supabase/server'
import SubcategoriaEditor from '../../components/SubcategoriaEditor'
import PedidoSinStockConfig from '../../components/PedidoSinStockConfig'

export const revalidate = 0

export default async function AdminConfiguracionPage() {
  const supabase = createAdminClient()

  const [{ data: subcategorias }, { data: promociones }, { data: config }] = await Promise.all([
    supabase.from('subcategorias').select('*').order('orden'),
    supabase.from('promociones').select('id, nombre, subcategoria_ids, activa').order('nombre'),
    supabase.from('configuracion').select('clave, valor'),
  ])

  const cfg = Object.fromEntries((config ?? []).map(r => [r.clave, r.valor]))

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Configuración de categorías</h1>
        <p className="text-sm text-gray-500 mb-6">
          Definí cuántas compras se necesitan para ascender de categoría y qué promociones exclusivas puede ver cada una.
        </p>
        <div className="space-y-3">
          {subcategorias?.map(s => (
            <SubcategoriaEditor
              key={s.id}
              subcategoria={s}
              promociones={(promociones ?? []) as any}
            />
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Pedidos sin stock</h2>
        <p className="text-sm text-gray-500 mb-4">
          Configurá si los clientes pueden solicitar productos sin stock y qué ventaja comercial se les ofrece.
        </p>
        <PedidoSinStockConfig
          habilitado={cfg['pedido_sin_stock_habilitado'] === 'true'}
          texto={cfg['pedido_sin_stock_texto'] ?? ''}
          descuento={Number(cfg['pedido_sin_stock_descuento'] ?? 0)}
        />
      </div>
    </div>
  )
}
