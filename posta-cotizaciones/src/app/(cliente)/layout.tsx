import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*, subcategorias(nombre, margen_porcentaje)')
    .eq('id', user.id)
    .single()

  if (!cliente || cliente.estado !== 'aprobado') redirect('/pendiente')

  const margen = cliente.margen_personalizado ?? (cliente as any).subcategorias?.margen_porcentaje ?? 0
  const subcatNombre = (cliente as any).subcategorias?.nombre ?? cliente.subcategoria_id

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-gray-900">POSTA SRL</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">Productos</Link>
              <Link href="/cotizaciones" className="text-gray-600 hover:text-gray-900 transition-colors">Mis cotizaciones</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{cliente.razon_social ?? cliente.email}</span>
            <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
              {subcatNombre}
            </span>
            <form action="/api/logout" method="POST">
              <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  )
}
