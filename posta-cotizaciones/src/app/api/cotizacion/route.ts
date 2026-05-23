import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notifyAdminNewLead } from '@/lib/email'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { items, notas } = await req.json() as {
    items: Array<{
      producto_id: string
      cantidad: number
      precio_base_snapshot: number
      margen_aplicado: number
      precio_mostrado: number
    }>
    notas?: string
  }

  if (!items?.length) return NextResponse.json({ error: 'Sin items' }, { status: 400 })

  // Límite de presupuestos activos por cliente
  const LIMITE = Number(process.env.MAX_PRESUPUESTOS_ACTIVOS ?? 1)
  const adminClient = createAdminClient()
  const { count } = await adminClient
    .from('cotizaciones')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', user.id)
    .in('estado', ['pendiente', 'enviada'])

  if ((count ?? 0) >= LIMITE) {
    return NextResponse.json({ error: 'limite_alcanzado', limite: LIMITE }, { status: 429 })
  }

  const total = items.reduce((acc, i) => acc + i.precio_mostrado * i.cantidad, 0)

  const { data: cotizacion, error: cotizacionError } = await supabase
    .from('cotizaciones')
    .insert({ cliente_id: user.id, estado: 'pendiente', total_calculado: total, notas: notas ?? null })
    .select()
    .single()

  if (cotizacionError || !cotizacion) {
    return NextResponse.json({ error: cotizacionError?.message }, { status: 500 })
  }

  const { error: itemsError } = await adminClient.from('cotizacion_items').insert(
    items.map(i => ({ ...i, cotizacion_id: cotizacion.id }))
  )

  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Notificar al vendedor
  try {
    const { data: cliente } = await supabase
      .from('clientes')
      .select('razon_social, email, cuit, tipo_comercio')
      .eq('id', user.id)
      .single()

    if (cliente && process.env.ADMIN_EMAIL) {
      await notifyAdminNewLead(process.env.ADMIN_EMAIL, {
        ...cliente,
        razon_social: `[COTIZACIÓN] ${cliente.razon_social ?? cliente.email} — ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)}`,
      })
    }
  } catch (e) {
    console.error('Error notificando cotización:', e)
  }

  return NextResponse.json({ id: cotizacion.id })
}
