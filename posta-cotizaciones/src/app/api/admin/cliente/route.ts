import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id, email, razon_social, cuit, telefono, direccion, tipo_comercio, subcategoria_id, margen_personalizado } = await req.json()

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('clientes')
    .update({ email, razon_social, cuit, telefono, direccion, tipo_comercio, subcategoria_id, margen_personalizado })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
