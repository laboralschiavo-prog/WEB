'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RejectButton({ clienteId, email, razonSocial }: {
  clienteId: string
  email: string
  razonSocial: string
}) {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [motivo, setMotivo] = useState('')
  const router = useRouter()

  async function handleReject() {
    setLoading(true)
    await fetch('/api/reject', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clienteId, email, razonSocial, motivo }),
    })
    setShowModal(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button onClick={() => setShowModal(true)}
        className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
        Rechazar
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-semibold text-gray-900 mb-3">Rechazar solicitud</h3>
            <p className="text-sm text-gray-500 mb-3">
              Cliente: <strong>{razonSocial}</strong>
            </p>
            <textarea
              value={motivo}
              onChange={e => setMotivo(e.target.value)}
              placeholder="Motivo del rechazo (opcional, se envía al cliente)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <button onClick={handleReject} disabled={loading}
                className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors">
                {loading ? '...' : 'Confirmar rechazo'}
              </button>
              <button onClick={() => setShowModal(false)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
