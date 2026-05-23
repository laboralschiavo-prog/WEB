export function calcularPrecioMostrado(precioBase: number, margenPorcentaje: number): number {
  return Number((precioBase * (1 + margenPorcentaje)).toFixed(2))
}

export function formatPrecio(precio: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(precio)
}

export function getMargenCliente(
  subcategoriaId: string,
  margenPersonalizado: number | null,
  subcategorias: Array<{ id: string; margen_porcentaje: number }>
): number {
  if (margenPersonalizado !== null) return margenPersonalizado
  return subcategorias.find(s => s.id === subcategoriaId)?.margen_porcentaje ?? 0.40
}
