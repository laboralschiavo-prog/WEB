import { createAdminClient } from '@/lib/supabase/server'
import AddVipForm from '../../components/AddVipForm'
import ClientesTabla from '../../components/ClientesTabla'

export const revalidate = 0

export default async function AdminClientesPage() {
  const supabase = createAdminClient()

  const { data: clientes } = await supabase
    .from('clientes')
    .select('*, subcategorias(nombre, margen_porcentaje)')
    .eq('estado', 'aprobado')
    .order('creado_en', { ascending: false })

  const { data: subcategorias } = await supabase
    .from('subcategorias')
    .select('*')
    .order('orden')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Clientes aprobados</h1>
        <AddVipForm subcategorias={subcategorias ?? []} />
      </div>
      <ClientesTabla clientes={(clientes as any) ?? []} subcategorias={subcategorias ?? []} />
    </div>
  )
}

