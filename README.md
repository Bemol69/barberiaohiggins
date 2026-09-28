# Barbería O'Higgins · Web + Panel de gestión

Sitio web con reservas online y panel de administración para **Barbería O'Higgins** (Alcázar 320, Rancagua).

- **Sitio público**: portada, carta de servicios con precios, equipo, horarios con estado "Abierto ahora", mapa, WhatsApp y SEO local (datos estructurados `BarberShop` para Google).
- **Reservas online** (`/reservar`): el cliente elige servicio → profesional (o "sin preferencia") → día y hora libres → datos. Evita choques de horario por barbero y ofrece confirmar por WhatsApp.
- **Panel** (`/admin`): resumen del día y la semana, agenda con cambio de estado y reservas manuales, y edición de servicios, equipo, horarios, galería, reseñas y datos del negocio.

## Stack

Next.js 16 (App Router, Server Actions) · React 19 · Tailwind CSS 4 · Drizzle ORM · libSQL (SQLite en local, [Turso](https://turso.tech) en producción).

## Desarrollo local

```bash
cp .env.example .env.local   # define ADMIN_PASSWORD y SESSION_SECRET
npm install
npm run db:setup             # crea las tablas y carga los datos iniciales
npm run dev                  # http://localhost:3000
```

El panel está en `/admin` y se entra con la contraseña de `ADMIN_PASSWORD`.

## Publicar (Vercel + Turso, ambos con plan gratis)

1. Crea una base en Turso y obtén la URL (`libsql://…`) y el token.
2. Importa el repo en Vercel y configura estas variables:
   - `DATABASE_URL`, `DATABASE_AUTH_TOKEN`
   - `ADMIN_PASSWORD`
   - `SESSION_SECRET` (genéralo con `openssl rand -base64 32`)
   - `NEXT_PUBLIC_SITE_URL` (por ejemplo `https://barberiaohiggins.cl`)
3. Carga la base una vez desde tu equipo: `DATABASE_URL=… DATABASE_AUTH_TOKEN=… npm run db:setup`
4. Conecta el dominio propio en Vercel → Settings → Domains. Un `.cl` se compra en NIC Chile.

## Datos iniciales

`src/db/seed.ts` solo carga datos si la base está vacía.

- **Datos reales**, tomados del perfil de AgendaPro: dirección, WhatsApp, horario, calificación (4.9 con 101 reseñas), profesionales, Corte de Cabello ($13.000 / 45 min) y Corte Premium ($15.990 / 1 h).
- **Datos de referencia que hay que confirmar con el local**: Perfilado de Barba, Corte + Barba, Masaje y Cejas (precios y duraciones), fotos del equipo, logo y galería. Todo se edita desde `/admin`.

## Estructura

```
src/
  app/(site)/          sitio público (portada y /reservar)
  app/admin/           login y panel
  app/api/disponibilidad/   horarios libres (GET)
  db/                  esquema Drizzle, cliente y seed
  lib/                 disponibilidad, auth, formato, fechas (zona America/Santiago)
drizzle/               migraciones SQL
```
