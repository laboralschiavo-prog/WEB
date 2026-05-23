import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY no configurada en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTestUser() {
  const randomNum = Math.floor(Math.random() * 10000)
  const email = `cliente${randomNum}@test.com`
  const password = `Test${Math.random().toString(36).slice(2, 10).toUpperCase()}!`

  console.log('🔄 Creando usuario...')

  // 1. Crear usuario en Auth
  const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // confirmar email automáticamente
  })

  if (authError) {
    console.error('❌ Error al crear usuario:', authError.message)
    process.exit(1)
  }

  const userId = authUser.user.id
  console.log(`✅ Usuario Auth creado: ${email}`)

  // 2. Insertar en tabla clientes con estado='nuevo'
  const { error: clienteError } = await supabase.from('clientes').insert({
    id: userId,
    email,
    cuit: `${30000000000 + randomNum}`, // CUIT falso pero válido
    tipo_comercio: 'Comercio de prueba',
    subcategoria_id: 'nuevo',
    total_compras: 0,
    estado: 'pendiente', // pendiente aprobación del admin
  })

  if (clienteError) {
    console.error('❌ Error al insertar en clientes:', clienteError.message)
    process.exit(1)
  }

  console.log(`✅ Cliente creado en BD`)
  console.log('\n📋 Credenciales de prueba:')
  console.log(`   Email:    ${email}`)
  console.log(`   Password: ${password}`)
  console.log('\n🔗 Acceso:')
  console.log(`   Cliente:  http://localhost:3000/login`)
  console.log(`   Admin:    http://localhost:3000/admin (solo con ADMIN_EMAIL)`)
}

createTestUser().catch(err => {
  console.error('Error:', err)
  process.exit(1)
})
