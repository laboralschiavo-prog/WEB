import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  return user?.email === process.env.ADMIN_EMAIL ? user : null
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { nombre, descripcion, precio_base, categoria, activo, stock, imagen_url, unidades_por_bulto, unidades_por_pallet, destacado, oferta_relamago, precio_oferta, nueva_linea } = await req.json()
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('productos')
    .insert({ nombre, descripcion, precio_base, categoria, activo: activo ?? true, stock: stock ?? 0, imagen_url: imagen_url ?? null, unidades_por_bulto: unidades_por_bulto ?? null, unidades_por_pallet: unidades_por_pallet ?? null, destacado: destacado ?? false, oferta_relamago: oferta_relamago ?? false, precio_oferta: precio_oferta ?? null, nueva_linea: nueva_linea ?? false })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, producto: data })
}

export async function PATCH(req: NextRequest) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id, nombre, descripcion, precio_base, categoria, activo, stock, imagen_url, unidades_por_bulto, unidades_por_pallet, destacado, oferta_relamago, precio_oferta, nueva_linea } = await req.json()
  const supabase = createAdminClient()
  const { error } = await supabase
    .from('productos')
    .update({ nombre, descripcion, precio_base, categoria, activo, stock, imagen_url, unidades_por_bulto, unidades_por_pallet, destacado, oferta_relamago, precio_oferta, nueva_linea })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await req.json()
  const supabase = createAdminClient()

  // Si tiene cotizaciones asociadas, solo desactiva
  const { count } = await supabase
    .from('cotizacion_items')
    .select('*', { count: 'exact', head: true })
    .eq('producto_id', id)

  if (count && count > 0) {
    const { error } = await supabase.from('productos').update({ activo: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, desactivado: true })
  }

  const { error } = await supabase.from('productos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, eliminado: true })
}
