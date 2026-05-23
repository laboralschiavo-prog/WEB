'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ApproveButton({ clienteId, email, razonSocial }: {
  clienteId: string
  email: string
  razonSocial: string
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleApprove() {
    setLoading(true)
    await fetch('/api/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, email, razonSocial }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button onClick={handleApprove} disabled={loading}
      className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors">
      {loading ? '...' : 'Aprobar'}
    </button>
  )
}
