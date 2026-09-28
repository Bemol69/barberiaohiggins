# Barbería O'Higgins · Web + Admin

Web de **Barbería O'Higgins** (Alcázar 320, Rancagua) con un panel de administración protegido por token.

- **Web** (`/`): portada, servicios y precios, equipo, galería, reseñas, horario con "Abierto ahora", mapa y WhatsApp. Los botones "Reservar" abren WhatsApp con el mensaje listo, o un link de reservas si lo configuras.
- **Admin** (`/admin`): entras con el token y editas todo desde un solo lugar: datos del negocio, servicios, equipo, horarios, fotos y reseñas. Con la sesión iniciada, la web muestra arriba una barra de admin.

## Publicar en Vercel

1. Importa el repo en Vercel y agrega **una** variable:
   - `ADMIN_TOKEN` = la clave para entrar a `/admin`
2. Despliega. La web ya funciona con los datos de la barbería.
3. Para que el admin pueda **guardar cambios y subir fotos**: en Vercel ve a **Storage → Create → Blob**, elige acceso **Public**, conéctalo al proyecto y vuelve a desplegar.

Opcional: `NEXT_PUBLIC_SITE_URL` con tu dominio (ej. `https://barberiaohiggins.cl`) para el sitemap de Google.

## Desarrollo local

```bash
echo "ADMIN_TOKEN=demo123" > .env.local
npm install
npm run dev        # http://localhost:3000  ·  admin: /admin
```

En local, los cambios del admin se guardan en `.data/content.json`.

## Contenido inicial

Está en `src/content/defaults.ts`.

- **Datos reales** (del perfil de AgendaPro): dirección, WhatsApp, horario, calificación, equipo, "Corte de Cabello" y "Corte Premium".
- **Precios de referencia** que hay que confirmar con el local: Perfilado de Barba, Corte + Barba, Masaje y Cejas.

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · Vercel Blob (contenido y fotos).
