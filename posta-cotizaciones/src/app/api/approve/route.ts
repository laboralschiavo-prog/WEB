import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendApprovalEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  const { clienteId, email, razonSocial } = await req.json()

  const userClient = await createClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('clientes')
    .update({ estado: 'aprobado', aprobado_por: user.id, aprobado_en: new Date().toISOString() })
    .eq('id', clienteId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  try {
    await sendApprovalEmail(email, razonSocial)
  } catch (e) {
    console.error('Error enviando email de aprobación:', e)
  }

  return NextResponse.json({ ok: true })
}
