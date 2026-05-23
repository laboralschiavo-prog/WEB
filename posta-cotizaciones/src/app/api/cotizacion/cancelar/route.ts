import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await req.json()

  // Solo puede cancelar sus propias cotizaciones pendientes
  const { error } = await supabase
    .from('cotizaciones')
    .update({ estado: 'cancelada', actualizado_en: new Date().toISOString() })
    .eq('id', id)
    .eq('cliente_id', user.id)
    .eq('estado', 'pendiente')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
