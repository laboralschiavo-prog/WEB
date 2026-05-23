import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const authRoutes = ['/login', '/registro', '/pendiente']
  const isAuthRoute = authRoutes.some(r => pathname.startsWith(r))
  const isAdminRoute = pathname.startsWith('/admin')
  const isApiRoute = pathname.startsWith('/api')

  if (isApiRoute) return supabaseResponse

  // Dev preview bypass — solo en desarrollo
  if (pathname.startsWith('/admin/dev-preview') && process.env.NODE_ENV !== 'production') {
    return supabaseResponse
  }

  if (!user && !isAuthRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user) {
    const isAdmin = user.email === process.env.ADMIN_EMAIL

    // Admin: acceso libre a /admin, redirigir a /admin si intenta ir a auth routes
    if (isAdmin) {
      if (isAuthRoute) return NextResponse.redirect(new URL('/admin', request.url))
      if (!isAdminRoute && !isApiRoute && pathname !== '/admin/dev-preview') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return supabaseResponse
    }

    // No-admin intentando entrar a /admin
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    const { data: cliente } = await supabase
      .from('clientes')
      .select('estado, subcategoria_id')
      .eq('id', user.id)
      .single()

    if (cliente) {
      if (cliente.estado === 'pendiente' && pathname !== '/pendiente') {
        return NextResponse.redirect(new URL('/pendiente', request.url))
      }
      if (cliente.estado === 'rechazado' && !isAuthRoute) {
        return NextResponse.redirect(new URL('/login?rechazado=1', request.url))
      }
    }

    if (isAuthRoute && pathname !== '/pendiente') {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
