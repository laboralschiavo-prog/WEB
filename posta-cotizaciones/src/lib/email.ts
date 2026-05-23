import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY ?? 'dummy')
}
const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@postasrl.com.ar'

export async function sendApprovalEmail(to: string, razonSocial: string) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Tu cuenta en POSTA SRL fue aprobada',
    html: `
      <h2>¡Bienvenido a POSTA SRL!</h2>
      <p>Hola <strong>${razonSocial}</strong>,</p>
      <p>Tu solicitud de acceso fue aprobada. Ya podés ingresar a la plataforma de cotizaciones.</p>
      <p><a href="${process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app') ?? '#'}/login">Ingresar ahora</a></p>
    `,
  })
}

export async function sendRejectionEmail(to: string, razonSocial: string, motivo: string) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Actualización sobre tu solicitud en POSTA SRL',
    html: `
      <h2>Solicitud no aprobada</h2>
      <p>Hola <strong>${razonSocial}</strong>,</p>
      <p>Lamentablemente no pudimos aprobar tu solicitud de acceso.</p>
      ${motivo ? `<p><strong>Motivo:</strong> ${motivo}</p>` : ''}
      <p>Si tenés dudas, podés contactarnos por WhatsApp al <strong>11 7181-9710</strong>.</p>
    `,
  })
}

export async function notifyPresupuestoCancelado(
  to: string,
  razonSocial: string,
  motivo: string,
  total: number
) {
  const resend = getResend()
  const totalFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(total)
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Presupuesto cancelado — POSTA SRL',
    html: `
      <h2>Tu presupuesto fue cancelado</h2>
      <p>Hola <strong>${razonSocial}</strong>,</p>
      <p>Te informamos que tu presupuesto por <strong>${totalFmt}</strong> fue cancelado por nuestro equipo.</p>
      <p><strong>Motivo:</strong> ${motivo}</p>
      <p>Si tenés dudas podés contactarnos por WhatsApp al <strong>11 7181-9710</strong> o generar un nuevo presupuesto desde la plataforma.</p>
    `,
  })
}

export async function notifyAdminNewLead(adminEmail: string, cliente: {
  razon_social: string | null
  email: string
  cuit: string
  tipo_comercio: string
}) {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Nuevo lead pendiente: ${cliente.razon_social ?? cliente.email}`,
    html: `
      <h2>Nuevo registro pendiente de aprobación</h2>
      <ul>
        <li><strong>Razón social:</strong> ${cliente.razon_social ?? '—'}</li>
        <li><strong>Email:</strong> ${cliente.email}</li>
        <li><strong>CUIT:</strong> ${cliente.cuit}</li>
        <li><strong>Tipo de comercio:</strong> ${cliente.tipo_comercio}</li>
      </ul>
      <p>Ingresá al panel de administración para aprobarlo o rechazarlo.</p>
    `,
  })
}
