import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  return user?.email === process.env.ADMIN_EMAIL ? user : null
}

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('plan_produccion')
    .select('*')
    .order('fecha_estimada', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const supabase = createAdminClient()
  const { producto_id, fecha_estimada, cantidad_planificada, notas } = await req.json()
  const { data, error } = await supabase
    .from('plan_produccion')
    .insert({ producto_id, fecha_estimada, cantidad_planificada, notas: notas || null })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, entry: data })
}

export async function PATCH(req: NextRequest) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const supabase = createAdminClient()
  const { id, fecha_estimada, cantidad_planificada, notas } = await req.json()
  const { error } = await supabase
    .from('plan_produccion')
    .update({ fecha_estimada, cantidad_planificada, notas: notas || null })
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  if (!await verifyAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  const supabase = createAdminClient()
  const { id } = await req.json()
  const { error } = await supabase.from('plan_produccion').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
