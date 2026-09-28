import "server-only";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";

export async function getSettings() {
  const [row] = await db.select().from(schema.settings).where(eq(schema.settings.id, 1));
  if (!row) throw new Error("Falta configuración. Ejecuta `npm run db:setup`.");
  return row;
}

export function getActiveServices() {
  return db
    .select()
    .from(schema.services)
    .where(eq(schema.services.active, true))
    .orderBy(asc(schema.services.sortOrder), asc(schema.services.id));
}

export function getActiveBarbers() {
  return db
    .select()
    .from(schema.barbers)
    .where(eq(schema.barbers.active, true))
    .orderBy(asc(schema.barbers.sortOrder), asc(schema.barbers.id));
}

export function getHours() {
  return db.select().from(schema.hours).orderBy(asc(schema.hours.weekday));
}

export function getGallery() {
  return db.select().from(schema.gallery).orderBy(asc(schema.gallery.sortOrder), asc(schema.gallery.id));
}

export function getActiveReviews() {
  return db.select().from(schema.reviews).where(eq(schema.reviews.active, true));
}
