# LP Fitness — Sistema de Mantenimiento

App web para gestión de mantenimiento de máquinas del gimnasio.
Responsive completa: funciona en desktop y móvil.

---

## 🚀 Pasos para arrancar

### 1. Instalar dependencias
```bash
cd lpfitness-maint
npm install
```

---

### 2. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Nombre: `lpfitness-maint` | Región: más cercana
3. Guarda la contraseña del proyecto
4. Espera que termine de configurarse (~2 min)

---

### 3. Configurar base de datos

1. En Supabase: **SQL Editor** → **New query**
2. Copia y pega todo el contenido de `supabase/migrations/001_init.sql`
3. Clic en **Run** — debe decir "Success"

---

### 4. Configurar variables de entorno

1. Copia el archivo de ejemplo:
```bash
cp .env.example .env
```

2. En Supabase → **Settings → API**, copia:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

3. Para el email (QR técnicos), crea cuenta en [resend.com](https://resend.com):
   - Obtén tu API Key → `VITE_RESEND_API_KEY`
   - Coloca el correo de la empresa → `VITE_EMPRESA_EMAIL`

---

### 5. Crear usuarios administradores

En Supabase → **Authentication → Users** → **Invite user**:

- Tu usuario admin: `tu@email.com`
- Los dos dueños: `dueno1@lpfitness.com`, `dueno2@lpfitness.com`

Luego en **SQL Editor** actualiza los roles:
```sql
-- Cambia el email por el correo real de cada usuario
update perfiles set rol = 'admin' where email = 'tu@email.com';
update perfiles set rol = 'dueno' where email = 'dueno1@lpfitness.com';
update perfiles set rol = 'dueno' where email = 'dueno2@lpfitness.com';
```

---

### 6. Configurar Edge Function para emails (QR técnicos)

En Supabase → **Edge Functions** → **New function** → nombre: `enviar-qr-tecnico`

```typescript
// Pega este código en la función:
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { token, nombre_tecnico, expira_at, qr_base64, empresa_email } = await req.json()
  
  const resendKey = Deno.env.get('RESEND_API_KEY')
  const expiraFecha = new Date(expira_at).toLocaleString('es-CO')
  
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'LP Fitness <noreply@lpfitness.com>',
      to: empresa_email,
      subject: `🔑 Acceso QR para técnico: ${nombre_tecnico}`,
      html: `
        <h2>Acceso temporal para técnico</h2>
        <p><strong>Técnico:</strong> ${nombre_tecnico}</p>
        <p><strong>Válido hasta:</strong> ${expiraFecha}</p>
        <p>Comparte el código QR adjunto por WhatsApp con el técnico.</p>
        <img src="${qr_base64}" style="width:200px;height:200px;" />
        <p style="color:#888;font-size:12px;">LP Fitness — Sistema de Mantenimiento</p>
      `
    })
  })
  
  return new Response(JSON.stringify({ ok: res.ok }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
```

Agrega el secret `RESEND_API_KEY` en la función.

---

### 7. Correr en desarrollo

```bash
npm run dev
```

Abre [http://localhost:5173](http://localhost:5173)

---

### 8. Publicar en Vercel (cuando esté listo)

```bash
npm install -g vercel
vercel
```

Agrega las variables de entorno en el dashboard de Vercel.

---

## 📱 Cómo funciona el acceso QR para técnicos

1. Admin o dueño va a **Acceso QR** en el menú
2. Escribe el nombre del técnico → clic en **Generar QR**
3. El QR llega al correo de la empresa automáticamente
4. Reenvía la imagen por **WhatsApp** al técnico
5. El técnico abre la app → **Ingresar con QR** → escanea
6. Acceso válido por **24 horas**, luego expira automáticamente

---

## 🗂️ Estructura del proyecto

```
src/
├── components/
│   └── layout/AppLayout.tsx     # Sidebar + bottom nav
├── hooks/
│   └── useAuth.tsx              # Contexto de autenticación
├── lib/
│   └── supabase.ts              # Cliente + tipos
├── pages/
│   ├── LoginPage.tsx            # Login email + QR
│   ├── DashboardPage.tsx        # Panel principal
│   ├── NovedadesPage.tsx        # Lista novedades
│   ├── NuevaNovedadPage.tsx     # Crear/editar novedad
│   ├── MaquinasPage.tsx         # Lista máquinas
│   ├── NuevaMaquinaPage.tsx     # Crear/editar máquina
│   ├── HistorialMaquinaPage.tsx # Historial público por QR
│   ├── ComprasPage.tsx          # Compras generales
│   ├── ProveedoresPage.tsx      # Base de proveedores
│   └── TokensPage.tsx          # Generar QR técnicos
supabase/
└── migrations/001_init.sql      # Tablas + RLS + Storage
```

---

## 🎨 Colores LP Fitness

| Variable | Color | Uso |
|----------|-------|-----|
| `brand-dark` | `#1a3a6b` | Sidebar, títulos |
| `brand-mid` | `#1e7ec8` | Botones, activos |
| `brand-light` | `#4ab3e8` | Acentos |
| `brand-pale` | `#e8f4fc` | Fondos suaves |