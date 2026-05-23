# Setup — POSTA SRL Cotizaciones

## 1. Supabase (base de datos + auth)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. En el SQL Editor, ejecutar el contenido de `supabase/migrations/001_initial.sql`
3. Copiar las credenciales del proyecto (Settings → API):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

## 2. Variables de entorno

Copiar `.env.local.example` a `.env.local` y completar:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
RESEND_API_KEY=re_xxxx               # resend.com — free tier ok
RESEND_FROM_EMAIL=noreply@postasrl.com.ar
ADMIN_EMAIL=laboral.schiavo@gmail.com
```

## 3. Correr en desarrollo

```bash
npm install
npm run dev
```

## 4. Deploy en Vercel

```bash
npx vercel --prod
```

Agregar las variables de entorno en el dashboard de Vercel (Settings → Environment Variables).

---

## Agregar productos

Desde el SQL Editor de Supabase:

```sql
INSERT INTO productos (nombre, descripcion, precio_base, categoria, activo)
VALUES
  ('Sillón Reposera Basic',  'Aluminio y PVC, 4 posiciones', 18500, 'Sillones',   true),
  ('Mesa Plegable 1.80m',    'Acero con tapa de MDF',       32000, 'Mesas',       true),
  ('Tendedero de Ropa Doble','2 cuerpos, aluminio',          8900, 'Tendederos',  true);
```

## Acceso admin

El email definido en `ADMIN_EMAIL` es el único que accede a `/admin`.
Creá una cuenta con ese email via Supabase Auth → Authentication → Users → Add user.

---

## Estructura de precios

| Subcategoría | Margen | Ascenso tras |
|---|---|---|
| Nuevo         | +40%  | 5 compras   |
| Frecuente     | +25%  | 15 compras  |
| Premium       | +15%  | 30 compras  |
| VIP (manual)  | custom| —           |

Los márgenes son configurables desde `/admin/configuracion`.
