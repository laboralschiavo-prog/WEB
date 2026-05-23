const MENSAJES: Array<[RegExp | string, string]> = [
  [/could not find the table/i,        'Tabla no encontrada. Verificá que la migración SQL esté ejecutada.'],
  [/violates foreign key constraint/i, 'No se puede eliminar: hay registros relacionados.'],
  [/violates unique constraint/i,       'Ya existe un registro con esos datos (valor duplicado).'],
  [/violates not-null constraint/i,     'Falta completar un campo obligatorio.'],
  [/permission denied/i,               'Sin permiso para realizar esta operación.'],
  [/JWT expired/i,                      'Tu sesión expiró. Volvé a iniciar sesión.'],
  [/invalid input syntax/i,            'Formato de dato incorrecto.'],
  [/already been registered/i,         'Ese email ya está registrado.'],
  [/already exists/i,                  'Ya existe un registro con esos datos.'],
  [/schema cache/i,                    'Error de base de datos: tabla no encontrada. Verificá la migración SQL.'],
  [/Network request failed/i,          'Sin conexión. Verificá tu internet e intentá de nuevo.'],
  [/fetch failed/i,                    'Error de red. Intentá de nuevo.'],
]

export function traducirError(msg: string | undefined | null): string {
  if (!msg) return 'Ocurrió un error inesperado. Intentá de nuevo.'
  for (const [pattern, traduccion] of MENSAJES) {
    if (typeof pattern === 'string' ? msg.includes(pattern) : pattern.test(msg)) {
      return traduccion
    }
  }
  return `Error: ${msg}`
}
