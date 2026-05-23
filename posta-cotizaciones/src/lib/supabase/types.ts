// Explicit row types (no circular refs)
export interface SubcategoriaRow {
  id: string
  nombre: string
  margen_porcentaje: number
  compras_requeridas: number
  orden: number
}

export interface ClienteRow {
  id: string
  email: string
  telefono: string | null
  cuit: string
  tipo_comercio: string
  direccion: string | null
  razon_social: string | null
  subcategoria_id: string
  margen_personalizado: number | null
  total_compras: number
  estado: 'pendiente' | 'aprobado' | 'rechazado'
  motivo_rechazo: string | null
  aprobado_por: string | null
  aprobado_en: string | null
  creado_en: string
}

export interface ProductoRow {
  id: string
  nombre: string
  descripcion: string | null
  precio_base: number
  categoria: string | null
  activo: boolean
  creado_en: string
}

export interface CotizacionRow {
  id: string
  cliente_id: string
  estado: 'pendiente' | 'enviada' | 'negociando' | 'concretada' | 'cancelada'
  total_calculado: number
  notas: string | null
  creado_en: string
  actualizado_en: string
}

export interface CotizacionItemRow {
  id: string
  cotizacion_id: string
  producto_id: string
  cantidad: number
  precio_base_snapshot: number
  margen_aplicado: number
  precio_mostrado: number
  precio_negociado: number | null
}

export interface CompraRow {
  id: string
  cliente_id: string
  cotizacion_id: string | null
  monto_total: number
  creado_en: string
}

export type Database = {
  public: {
    Views: Record<string, never>
    Functions: Record<string, never>
    Tables: {
      subcategorias: {
        Row: SubcategoriaRow
        Insert: SubcategoriaRow
        Update: Partial<SubcategoriaRow>
        Relationships: []
      }
      clientes: {
        Row: ClienteRow
        Insert: {
          id: string
          email: string
          telefono?: string | null
          cuit: string
          tipo_comercio: string
          direccion?: string | null
          razon_social?: string | null
          subcategoria_id: string
          margen_personalizado?: number | null
          estado?: 'pendiente' | 'aprobado' | 'rechazado'
          motivo_rechazo?: string | null
          aprobado_por?: string | null
          aprobado_en?: string | null
        }
        Update: Partial<ClienteRow>
        Relationships: []
      }
      productos: {
        Row: ProductoRow
        Insert: {
          id?: string
          nombre: string
          descripcion?: string | null
          precio_base: number
          categoria?: string | null
          activo?: boolean
        }
        Update: Partial<ProductoRow>
        Relationships: []
      }
      cotizaciones: {
        Row: CotizacionRow
        Insert: {
          id?: string
          cliente_id: string
          estado?: 'pendiente' | 'enviada' | 'negociando' | 'concretada' | 'cancelada'
          total_calculado: number
          notas?: string | null
        }
        Update: Partial<CotizacionRow>
        Relationships: []
      }
      cotizacion_items: {
        Row: CotizacionItemRow
        Insert: {
          id?: string
          cotizacion_id: string
          producto_id: string
          cantidad: number
          precio_base_snapshot: number
          margen_aplicado: number
          precio_mostrado: number
          precio_negociado?: number | null
        }
        Update: Partial<CotizacionItemRow>
        Relationships: []
      }
      compras: {
        Row: CompraRow
        Insert: {
          id?: string
          cliente_id: string
          cotizacion_id?: string | null
          monto_total: number
        }
        Update: Partial<CompraRow>
        Relationships: []
      }
    }
  }
}

// Convenience aliases
export type Cliente = ClienteRow
export type Producto = ProductoRow
export type Subcategoria = SubcategoriaRow
export type Cotizacion = CotizacionRow
export type CotizacionItem = CotizacionItemRow
