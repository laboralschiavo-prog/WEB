import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, password, telefono, cuit, razon_social, tipo_comercio, direccion } = await req.json()

  const supabase = createAdminClient()

  // Crear usuario en Auth usando el admin client (sin requerir confirmación de email)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Error al crear la cuenta.'
    // Email duplicado
    if (authError?.message?.includes('already been registered') || authError?.message?.includes('already exists')) {
      return NextResponse.json({ error: 'Ese email ya está registrado.' }, { status: 409 })
    }
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { error: clienteError } = await supabase.from('clientes').insert({
    id: authData.user.id,
    email,
    telefono: telefono || null,
    cuit,
    razon_social,
    tipo_comercio,
    direccion: direccion || null,
    subcategoria_id: 'nuevo',
    estado: 'pendiente',
  })

  if (clienteError) {
    // Si falla el insert, borramos el usuario auth para no dejar registros huérfanos
    await supabase.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Error al guardar tus datos. El CUIT puede estar ya registrado.' }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
