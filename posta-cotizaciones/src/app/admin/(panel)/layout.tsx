import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-gray-900 text-white flex flex-col py-6 shrink-0">
        <div className="px-4 mb-8">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Panel Admin</p>
          <p className="text-sm font-semibold mt-1">POSTA SRL</p>
        </div>
        <nav className="flex-1 px-2 space-y-1">
          <NavLink href="/admin" label="Inicio" />
          <div className="my-2 border-t border-gray-700" />
          <NavLink href="/admin/solicitudes" label="Solicitudes" />
          <NavLink href="/admin/cotizaciones" label="Presupuestos" />
          <NavLink href="/admin/clientes" label="Clientes" />
          <NavLink href="/admin/productos" label="Productos" />
          <NavLink href="/admin/promociones" label="Promociones" />
          <NavLink href="/admin/configuracion" label="Subcategorías" />
          <div className="my-2 border-t border-gray-700" />
          <NavLink href="/admin/estadisticas" label="Estadísticas" />
        </nav>
        <div className="px-4 mt-4">
          <form action="/api/logout" method="POST">
            <button className="text-xs text-gray-400 hover:text-white transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}
      className="block rounded-md px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors">
      {label}
    </Link>
  )
}
