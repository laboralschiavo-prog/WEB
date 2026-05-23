import { createAdminClient } from '@/lib/supabase/server'
import ApproveButton from '../../components/ApproveButton'
import RejectButton from '../../components/RejectButton'

export const revalidate = 0

export default async function AdminSolicitudesPage() {
  const supabase = createAdminClient()

  const { data: pendientes } = await supabase
    .from('clientes')
    .select('*')
    .eq('estado', 'pendiente')
    .order('creado_en', { ascending: true })

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Solicitudes pendientes</h1>

      {!pendientes?.length ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
          No hay solicitudes pendientes.
        </div>
      ) : (
        <div className="space-y-3">
          {pendientes.map(cliente => (
            <div key={cliente.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="font-medium text-gray-900">{cliente.razon_social ?? cliente.email}</p>
                  <p className="text-sm text-gray-500">
                    CUIT: {cliente.cuit} · {cliente.tipo_comercio}
                  </p>
                  <p className="text-sm text-gray-500">{cliente.email} · {cliente.telefono}</p>
                  {cliente.direccion && (
                    <p className="text-sm text-gray-400">{cliente.direccion}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Registrado: {new Date(cliente.creado_en).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <ApproveButton clienteId={cliente.id} email={cliente.email} razonSocial={cliente.razon_social ?? cliente.email} />
                  <RejectButton clienteId={cliente.id} email={cliente.email} razonSocial={cliente.razon_social ?? cliente.email} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

