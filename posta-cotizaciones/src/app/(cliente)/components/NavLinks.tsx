'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavLinks() {
  const pathname = usePathname()

  const links = [
    { href: '/inicio', label: 'Inicio' },
    { href: '/dashboard', label: 'Productos' },
    { href: '/cotizaciones', label: 'Presupuestos' },
  ]

  return (
    <nav className="flex gap-1">
      {links.map(({ href, label }) => {
        const active = pathname === href || (href !== '/inicio' && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              active
                ? 'bg-gray-100 text-gray-900'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
