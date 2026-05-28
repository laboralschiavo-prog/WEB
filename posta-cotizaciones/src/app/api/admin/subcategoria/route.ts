import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest) {
  const supabase = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id, compras_requeridas, pedido_plazo_dias, pedido_descuento } = await req.json()

  const update: Record<string, unknown> = {}
  if (compras_requeridas !== undefined) update.compras_requeridas = compras_requeridas
  if (pedido_plazo_dias  !== undefined) update.pedido_plazo_dias  = pedido_plazo_dias
  if (pedido_descuento   !== undefined) update.pedido_descuento   = pedido_descuento

  const { error } = await supabase
    .from('subcategorias')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
