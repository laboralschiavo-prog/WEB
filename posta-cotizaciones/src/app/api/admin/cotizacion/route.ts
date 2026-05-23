import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { notifyPresupuestoCancelado } from '@/lib/email'

export async function PATCH(req: NextRequest) {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id, estado, descuento_porcentaje, plazo_entrega_dias, motivo_cancelacion } = await req.json()

  // Cancelación requiere motivo obligatorio
  if (estado === 'cancelada' && !motivo_cancelacion?.trim()) {
    return NextResponse.json({ error: 'El motivo de cancelación es obligatorio.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    estado,
    actualizado_en: new Date().toISOString(),
  }
  if (descuento_porcentaje !== undefined) updateData.descuento_porcentaje = descuento_porcentaje
  if (plazo_entrega_dias !== undefined) updateData.plazo_entrega_dias = plazo_entrega_dias

  const { error } = await supabase.from('cotizaciones').update(updateData).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Si se cancela: insertar nota con motivo + enviar email al cliente
  if (estado === 'cancelada' && motivo_cancelacion) {
    await supabase.from('cotizacion_notas').insert({
      cotizacion_id: id,
      texto: `Cancelación: ${motivo_cancelacion.trim()}`,
    })

    try {
      const { data: cot } = await supabase
        .from('cotizaciones')
        .select('total_calculado, descuento_porcentaje, clientes(email, razon_social)')
        .eq('id', id)
        .single()

      if (cot) {
        const cliente = (cot.clientes as unknown) as { email: string; razon_social: string | null } | null
        if (cliente?.email) {
          const montoFinal = cot.total_calculado * (1 - (cot.descuento_porcentaje ?? 0) / 100)
          await notifyPresupuestoCancelado(
            cliente.email,
            cliente.razon_social ?? cliente.email,
            motivo_cancelacion.trim(),
            montoFinal
          )
        }
      }
    } catch (e) {
      console.error('Error enviando email de cancelación:', e)
    }
  }

  // Si se concreta: registrar compra para trigger de ascenso
  if (estado === 'concretada') {
    const { data: cot } = await supabase
      .from('cotizaciones')
      .select('cliente_id, total_calculado, descuento_porcentaje')
      .eq('id', id)
      .single()

    if (cot) {
      const montoFinal = cot.total_calculado * (1 - (cot.descuento_porcentaje ?? 0) / 100)
      await supabase.from('compras').insert({
        cliente_id: cot.cliente_id,
        cotizacion_id: id,
        monto_total: montoFinal,
      })
    }
  }

  return NextResponse.json({ ok: true })
}
