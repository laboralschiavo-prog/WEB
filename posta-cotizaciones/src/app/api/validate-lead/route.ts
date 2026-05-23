import { NextRequest, NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

export async function POST(req: NextRequest) {
  const { cuit, tipo_comercio, email, razon_social } = await req.json()

  // Validación estructural básica antes de llamar a la IA
  const cuitLimpio = String(cuit).replace(/\D/g, '')
  if (cuitLimpio.length !== 11) {
    return NextResponse.json({ valido: false, razon: 'CUIT inválido (debe tener 11 dígitos).' })
  }
  if (!tipo_comercio || tipo_comercio.trim().length < 3) {
    return NextResponse.json({ valido: false, razon: 'Tipo de comercio no especificado.' })
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ valido: false, razon: 'Email inválido.' })
  }

  const prompt = `Eres un filtro de leads B2B para POSTA SRL, empresa mayorista argentina de muebles plegables (sillones, reposeras, mesas, tendederos).
Solo aceptamos distribuidoras, ferreterías, bazares, mueblerías y comercios mayoristas/minoristas que puedan revender nuestros productos.

Analiza este registro y responde SOLO con JSON válido, sin markdown ni texto extra:

CUIT: ${cuitLimpio}
Razón social: ${razon_social ?? 'No indicado'}
Email: ${email}
Tipo de comercio: ${tipo_comercio}

Responde exactamente así:
{"valido": true/false, "razon": "breve explicación en español"}

Rechaza si: CUIT con dígitos repetidos (ej: 11111111111), tipo de comercio vacío/sin sentido/persona física sin negocio, email obviamente falso. Aprueba si parece un comercio legítimo aunque no sea perfecto.`

  try {
    const { stdout } = await execFileAsync('claude', ['-p', prompt], {
      timeout: 30000,
      env: process.env,
    })

    const jsonMatch = stdout.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')

    const result = JSON.parse(jsonMatch[0])
    return NextResponse.json(result)
  } catch (e) {
    // Si la IA falla, dejamos pasar para validación manual del admin
    console.error('Error en validate-lead IA:', e)
    return NextResponse.json({ valido: true, razon: 'Validación manual requerida.' })
  }
}
