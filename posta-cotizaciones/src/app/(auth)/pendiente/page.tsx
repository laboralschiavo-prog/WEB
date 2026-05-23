export default function PendientePage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Solicitud en revisión</h2>
          <p className="text-sm text-gray-500 mb-4">
            Tu solicitud fue recibida y está siendo revisada por nuestro equipo.
            Te avisaremos por email cuando esté aprobada.
          </p>
          <p className="text-xs text-gray-400">
            ¿Consultas? WhatsApp{' '}
            <a href="https://wa.me/5491171819710" className="text-blue-600 hover:underline">
              11 7181-9710
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
