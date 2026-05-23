import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return new NextResponse('No autorizado', { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: cotizaciones, error } = await supabase
    .from('cotizaciones')
    .select('id, estado, total_calculado, descuento_porcentaje, plazo_entrega_dias, creado_en, clientes(email, razon_social), cotizacion_items(cantidad, precio_mostrado, formato_entrega, productos(nombre))')
    .order('creado_en', { ascending: false })

  if (error) return new NextResponse('Error al obtener datos', { status: 500 })

  const rows: string[][] = [
    ['ID', 'Razón Social', 'Email', 'Estado', 'Fecha', 'Artículos', 'Subtotal', 'Descuento %', 'Total Final', 'Plazo (días)'],
  ]

  for (const c of (cotizaciones ?? []) as any[]) {
    const subtotal: number = c.total_calculado ?? 0
    const descuento: number = c.descuento_porcentaje ?? 0
    const total = subtotal * (1 - descuento / 100)
    const articulos = (c.cotizacion_items ?? [])
      .map((it: any) => {
        const fmt = it.formato_entrega && it.formato_entrega !== 'unidades' ? ` (${it.formato_entrega})` : ''
        return `${it.productos?.nombre ?? '?'} ×${it.cantidad}${fmt}`
      })
      .join(' | ')

    rows.push([
      c.id,
      c.clientes?.razon_social ?? c.clientes?.email ?? '—',
      c.clientes?.email ?? '—',
      c.estado,
      new Date(c.creado_en).toLocaleDateString('es-AR'),
      articulos,
      subtotal.toFixed(2),
      descuento.toString(),
      total.toFixed(2),
      String(c.plazo_entrega_dias ?? 45),
    ])
  }

  const csv = '﻿' + rows
    .map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')

  const fecha = new Date().toISOString().split('T')[0]
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="presupuestos-${fecha}.csv"`,
    },
  })
}
