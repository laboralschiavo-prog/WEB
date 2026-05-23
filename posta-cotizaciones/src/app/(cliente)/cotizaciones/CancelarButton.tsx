'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CancelarButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleCancelar() {
    if (!confirm('¿Cancelar esta cotización?')) return
    setLoading(true)
    await fetch('/api/cotizacion/cancelar', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={handleCancelar} disabled={loading}
      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors">
      {loading ? '...' : 'Cancelar'}
    </button>
  )
}
