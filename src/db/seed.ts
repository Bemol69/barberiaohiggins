/**
 * Aplica migraciones y carga datos iniciales (solo si la base está vacía).
 * Uso: npm run db:setup
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import * as schema from "./schema";

async function main() {
  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:local.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const db = drizzle(client, { schema });

  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("✓ Migraciones aplicadas");

  const existing = await db.select().from(schema.settings).limit(1);
  if (existing.length > 0) {
    console.log("• La base ya tiene datos, no se sobreescribe nada.");
    return;
  }

  await db.insert(schema.settings).values({
    id: 1,
    name: "Barbería O'Higgins",
    tagline: "Tradición y estilo en el corazón de Rancagua",
    description:
      "Barbería O'Higgins es un espacio donde la tradición y el estilo se unen. Ofrecemos cortes clásicos y modernos, perfilado de barba y masajes de relajación, en un ambiente cálido y profesional. Inspirados en el carácter del Libertador, buscamos reflejar elegancia, respeto y distinción en cada servicio.",
    address: "Alcázar 320",
    city: "Rancagua, Chile",
    whatsapp: "56961619679",
    instagram: "barberiaohiggins",
    rating: "4.9",
    reviewsCount: 101,
    slotMinutes: 15,
  });

  await db.insert(schema.services).values([
    { name: "Corte de Cabello", description: "Corte clásico o moderno a tu medida, con máquina y tijera. Terminación prolija y lavado.", category: "Barbería", price: 13000, durationMin: 45, featured: true, sortOrder: 1 },
    { name: "Corte Premium", description: "La experiencia completa: asesoría de estilo, corte detallado, toalla caliente y styling final.", category: "Barbería", price: 15990, durationMin: 60, featured: true, sortOrder: 2 },
    { name: "Perfilado de Barba", description: "Diseño y perfilado con navaja, toalla caliente y aceites para barba.", category: "Barbería", price: 8000, durationMin: 30, sortOrder: 3 },
    { name: "Corte + Barba", description: "Corte de cabello y perfilado de barba en una sola sesión.", category: "Barbería", price: 18000, durationMin: 75, featured: true, sortOrder: 4 },
    { name: "Masaje de Relajación", description: "Masaje de cuello, hombros y cuero cabelludo para desconectarte.", category: "Otros", price: 10000, durationMin: 30, sortOrder: 5 },
    { name: "Perfilado de Cejas", description: "Limpieza y definición de cejas con navaja.", category: "Otros", price: 3000, durationMin: 15, sortOrder: 6 },
  ]);

  await db.insert(schema.barbers).values([
    { name: "Criss", role: "Barbero", sortOrder: 1 },
    { name: "Daylan", role: "Barbero", sortOrder: 2 },
    { name: "Benja", role: "Barbero", sortOrder: 3 },
    { name: "Alejandro", role: "Barbero", sortOrder: 4 },
  ]);

  await db.insert(schema.hours).values([
    { weekday: 0, isOpen: false, openTime: "10:00", closeTime: "14:00" },
    { weekday: 1, isOpen: true, openTime: "10:00", closeTime: "20:00" },
    { weekday: 2, isOpen: true, openTime: "10:00", closeTime: "20:00" },
    { weekday: 3, isOpen: true, openTime: "10:00", closeTime: "20:00" },
    { weekday: 4, isOpen: true, openTime: "10:00", closeTime: "20:00" },
    { weekday: 5, isOpen: true, openTime: "10:00", closeTime: "20:00" },
    { weekday: 6, isOpen: true, openTime: "10:00", closeTime: "17:00" },
  ]);

  console.log("✓ Datos iniciales cargados");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
