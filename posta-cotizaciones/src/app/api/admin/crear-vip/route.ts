import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { email, password, razon_social, cuit, telefono, tipo_comercio, direccion, subcategoria_id, margen_personalizado } = await req.json()

  // Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return NextResponse.json({ error: authError?.message ?? 'Error creando usuario.' }, { status: 400 })
  }

  const { error: clienteError } = await supabase.from('clientes').insert({
    id: authData.user.id,
    email,
    razon_social,
    cuit,
    telefono: telefono || null,
    tipo_comercio,
    direccion: direccion || null,
    subcategoria_id,
    margen_personalizado: margen_personalizado ?? null,
    estado: 'aprobado',
    aprobado_por: user.id,
    aprobado_en: new Date().toISOString(),
  })

  if (clienteError) {
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: clienteError.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
