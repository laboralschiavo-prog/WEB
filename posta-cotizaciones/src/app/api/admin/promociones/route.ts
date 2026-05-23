import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function checkAdmin() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  return user?.email === process.env.ADMIN_EMAIL ? user : null
}

export async function POST(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { producto_id, nombre, descripcion, cantidad_minima, formato_requerido, descuento_porcentaje, subcategoria_ids } = await req.json()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('promociones')
    .insert({ producto_id, nombre, descripcion, cantidad_minima, formato_requerido: formato_requerido || null, descuento_porcentaje: descuento_porcentaje || null, subcategoria_ids: subcategoria_ids ?? [], activa: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, ...fields } = await req.json()
  const supabase = createAdminClient()

  const { error } = await supabase.from('promociones').update(fields).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!await checkAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await req.json()
  const supabase = createAdminClient()

  const { error } = await supabase.from('promociones').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
