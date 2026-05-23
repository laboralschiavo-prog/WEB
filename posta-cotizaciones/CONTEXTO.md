# Contexto del proyecto — POSTA SRL

Archivo de contexto exclusivo de `posta-cotizaciones`. No aplica a ningún otro proyecto.

---

## Proyecto

Plataforma B2B de cotizaciones/presupuestos para POSTA SRL (muebles outdoor / camping).
- **Stack**: Next.js 16 App Router, Supabase (auth + DB + RLS), Tailwind CSS
- **URL local**: `http://localhost:3000`
- **Admin email**: configurado en `ADMIN_EMAIL` (.env.local)
- **Dev server**: `npx next dev --port 3000` desde `d:\Claude.VS_Code\posta-cotizaciones`

---

## Credenciales de prueba

| Rol | Email | Contraseña | Notas |
|---|---|---|---|
| Cliente prueba | `prueba@posta.com` | `Prueba1234` | Creado manualmente, estado aprobado |
| Cliente con historial | `cliente9083@test.com` | `Test1234` | Tiene presupuestos con descuentos y art 718 |
| Admin | ver `ADMIN_EMAIL` en .env.local | — | Redirige a `/admin` |

---

## Estructura de rutas

| Ruta | Descripción |
|---|---|
| `/login` | Login + formulario de registro (solicitar acceso) |
| `/dashboard` | Catálogo de productos (POV cliente) |
| `/cotizaciones` | Presupuestos del cliente |
| `/admin` | Home dashboard admin — fullscreen, SIN sidebar |
| `/admin/(panel)/solicitudes` | Aprobar/rechazar clientes |
| `/admin/(panel)/cotizaciones` | Presupuestos (admin) |
| `/admin/(panel)/clientes` | Ficha de clientes |
| `/admin/(panel)/productos` | Gestión de productos |
| `/admin/(panel)/promociones` | Gestión de promociones |
| `/admin/(panel)/configuracion` | Subcategorías |
| `/admin/(panel)/estadisticas` | Estadísticas de demanda |

---

## Modelo de datos

- `clientes` — estado: nuevo / pendiente / aprobado. Tiene `subcategoria_id`, `total_compras`, `margen_personalizado` (deprecado)
- `cotizaciones` — estados: pendiente / enviada / concretada / cancelada. Tiene `descuento_porcentaje`, `plazo_entrega_dias`
- `cotizacion_items` — `precio_mostrado`, `formato_entrega`, `formato_cantidad`, `precio_base_snapshot`, `margen_aplicado`
- `cotizacion_notas` — notas/comentarios por presupuesto (admin o sistema)
- `productos` — `precio_base` es precio de lista directo (sin margen). Tiene `stock`, `imagen_url`, `unidades_por_bulto`, `unidades_por_pallet`
- `subcategorias` — nuevo / frecuente / premium. Controlan acceso a promos. Ya NO usan `margen_porcentaje`
- `promociones` — promos por volumen/formato. `subcategoria_ids: null` = todos, array = solo esas categorías
- `cliente_descuentos` — descuentos guardados por cliente (descripcion + porcentaje), aplicables desde presupuesto admin

---

## Decisiones de diseño tomadas

- **Precio de lista directo**: clientes ven `precio_base` sin multiplicador. `margen_aplicado = 0` en nuevos items. Beneficios van por descuentos y promos.
- **Categorías = acceso a promos**: `subcategorias` no multiplica precios, define qué promos puede ver el cliente.
- **Promos universales vs restringidas**: `subcategoria_ids = null` → todos. Array de IDs → solo esas categorías.
- **Descuentos múltiples por cliente**: tabla `cliente_descuentos`, visible en ficha del cliente y aplicable con un click desde el presupuesto.
- **Sin sidebar en home admin**: `/admin` es fullscreen. Sidebar solo en `/admin/(panel)/*` (route group).
- **Nombre "presupuestos"**: en UI se llaman "presupuestos", no "cotizaciones" (aunque la tabla en BD sigue llamándose `cotizaciones`).
- **Límite de presupuestos activos**: controlado por env `MAX_PRESUPUESTOS_ACTIVOS` (default 3). Al superar → modal con WhatsApp.
- **Archivo automático**: presupuestos cancelados/concretados desaparecen del listado tras `DIAS_ARCHIVADO` días (default 30).
- **Plazo de entrega default**: 45 días.

---

## Preferencias del usuario (MUY IMPORTANTE)

- **Sin emojis en UI admin**: SVG Heroicons inline. Los emojis "rebajan el proyecto". — *Hay algunos emojis que quedaron en el POV cliente (💬 para notas) que están aceptados por el momento.*
- **Errores en español**: todos los mensajes de error al usuario deben estar en español. Usar `traducirError()` de `@/lib/errors.ts`.
- **No pedir confirmación para cambios de código normales**: avanzar directamente.
- **El servidor no se levanta automáticamente**: el usuario lo levanta manualmente o lo pide explícitamente.

---

## Patrones técnicos clave

### Supabase: dos clientes
```typescript
createClient()        // anon, respeta RLS — usar para auth y operaciones del cliente
createAdminClient()   // service role, bypasses RLS — usar para operaciones admin
```
- `createClient()` en server components usa `@supabase/ssr`
- `createAdminClient()` usa `@supabase/supabase-js` directamente para bypass real de RLS

### Registro de usuarios
- NO usar `supabase.auth.signUp()` desde el browser — falla con email confirmation habilitado
- Usar `supabase.auth.admin.createUser({ email_confirm: true })` desde `/api/registro/route.ts`
- Si falla el insert en `clientes`, eliminar el usuario auth con `auth.admin.deleteUser(id)`

### Fragments con key en listas
```tsx
import { Fragment } from 'react'
// CORRECTO — acepta key
<Fragment key={`group-${id}`}>...</Fragment>
// INCORRECTO — no acepta key
<key={...}>...</>
```

### Filtro de archivo en queries
```typescript
.or(`estado.in.(pendiente,enviada),creado_en.gte.${cutoff.toISOString()}`)
// Muestra: activos (cualquier fecha) + cerrados/cancelados recientes
```

### Cart con multi-formato
- `CartItem._key` es un UUID runtime (`newKey()`), no `producto.id`
- `cambiarFormato` fusiona entries con mismo (producto, formato)
- Overlay click cierra carrito sin limpiar estado

---

## Errores solucionados y cómo

### "Error al crear la cuenta"
- **Causa**: `supabase.auth.signUp()` desde el browser falla cuando email confirmation está activado en Supabase.
- **Solución**: mover el registro a un server route `/api/registro` usando `auth.admin.createUser({ email_confirm: true })`.

### "Could not find the table 'public.promociones'"
- **Causa**: la migración SQL no había sido ejecutada en Supabase.
- **Solución**: el usuario ejecuta el SQL directamente en el Supabase SQL Editor. Siempre avisar al usuario que debe pegar el SQL antes de probar.

### "Two parallel pages resolve to the same path"
- **Causa**: al crear `admin/(panel)/cotizaciones/page.tsx`, el original `admin/cotizaciones/page.tsx` seguía existiendo.
- **Solución**: eliminar los directorios originales con PowerShell después de mover a `(panel)`.

### "Each child in a list should have a unique key prop"
- **Causa**: `<>` dentro de `.map()` no acepta `key`.
- **Solución**: usar `<Fragment key={...}>` importado de React.

### "Expression expected" en JSX
- **Causa**: al reemplazar `<>` por `<Fragment>`, el cierre `</>` quedó sin cambiar.
- **Solución**: reemplazar también `</>` por `</Fragment>`.

### Build error: `res` defined multiple times
- **Causa**: dos `const res = await fetch(...)` en el mismo scope.
- **Solución**: renombrar el primero a `const validateRes`.

### Type error: "Two different types with this name exist"
- **Causa**: `ProductosTabla.tsx` tenía tipo `Producto` sin los campos `unidades_por_bulto` y `unidades_por_pallet` que sí estaban en `ProductoModal.tsx`.
- **Solución**: agregar los campos faltantes al tipo en `ProductosTabla.tsx`.

### Type error: cast `as Promise<{data: ...}>` en Supabase
- **Causa**: el builder de Supabase no es un `Promise` directamente y TypeScript lo rechaza.
- **Solución**: `(res.data ?? []) as unknown as MiTipo[]` después del await.

### Puerto 3000 ocupado (EADDRINUSE)
- **Causa**: una instancia anterior del servidor sigue corriendo.
- **Solución**: el servidor ya está activo, no hace falta levantarlo de nuevo.

---

## Variables de entorno relevantes (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
ADMIN_EMAIL
MAX_PRESUPUESTOS_ACTIVOS   # default 3
DIAS_ARCHIVADO             # default 30
NEXT_PUBLIC_WHATSAPP_VENDEDOR
```

---

## Features implementadas (resumen)

- Registro con todos los datos de empresa (razón social, CUIT, teléfono, dirección, tipo de comercio)
- Aprobación/rechazo de clientes desde admin con notificación por email
- Catálogo con filtro por categoría, imagen, stock, formatos (unidades / bultos / pallet)
- Carrito multi-formato con cierre al click exterior
- Presupuestos con: descuento manual, plazo de entrega, notas/comentarios, badge de cantidad de notas
- Límite anti-DOS de presupuestos activos por cliente con modal de WhatsApp
- Archivo automático de presupuestos cerrados
- Filtros en presupuestos del cliente (por estado, artículo, plazo)
- Agrupación por cliente en tabla de admin
- Cancelación obligatoria con motivo + email al cliente
- Sistema de promociones por volumen/formato con sugerencias en carrito
- Restricción de promos por categoría de cliente
- Descuentos múltiples por cliente con aplicación rápida en presupuesto
- Dashboard home admin fullscreen con stats y preview de estadísticas
- Página completa de estadísticas: alta rotación, formatos, tendencia mensual, conversión, productos en alza, tipo de comercio, top clientes
- Precio de lista directo (sin margen por categoría)
