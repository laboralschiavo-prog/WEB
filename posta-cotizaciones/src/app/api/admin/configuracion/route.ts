import { createAdminClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from('configuracion').select('clave, valor')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const config = Object.fromEntries((data ?? []).map(r => [r.clave, r.valor]))
  return NextResponse.json(config)
}

export async function PATCH(req: Request) {
  const supabase = createAdminClient()
  const body: Record<string, string> = await req.json()
  const entries = Object.entries(body)
  if (!entries.length) return NextResponse.json({ error: 'Sin datos' }, { status: 400 })

  const upserts = entries.map(([clave, valor]) => ({ clave, valor }))
  const { error } = await supabase.from('configuracion').upsert(upserts, { onConflict: 'clave' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
