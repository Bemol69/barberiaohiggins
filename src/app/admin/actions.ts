"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { bookingStatuses } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { toMinutes } from "@/lib/time";

function refresh() {
  revalidatePath("/", "layout");
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string) => Number(fd.get(k));
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
const id = (fd: FormData) => z.coerce.number().int().positive().parse(fd.get("id"));

const httpUrl = z.union([z.literal(""), z.string().url().refine((u) => /^https?:\/\//.test(u), "URL inválida")]);

/* ───────────── Reservas ───────────── */

export async function setBookingStatus(bookingId: number, status: string) {
  await requireAdmin();
  const s = z.enum(bookingStatuses).parse(status);
  await db.update(schema.bookings).set({ status: s }).where(eq(schema.bookings.id, bookingId));
  refresh();
}

export async function deleteBooking(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.bookings).where(eq(schema.bookings.id, id(fd)));
  refresh();
}

export type ManualBookingState = { error?: string; ok?: boolean };

export async function createManualBooking(_prev: ManualBookingState, fd: FormData): Promise<ManualBookingState> {
  await requireAdmin();
  const parsed = z
    .object({
      serviceId: z.coerce.number().int().positive(),
      barberId: z.coerce.number().int().nonnegative(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
      time: z.string().regex(/^\d{2}:\d{2}$/, "Hora inválida"),
      name: z.string().trim().min(1, "Falta el nombre"),
      phone: z.string().trim().default(""),
      notes: z.string().trim().default(""),
      force: z.boolean(),
    })
    .safeParse({
      serviceId: fd.get("serviceId"),
      barberId: fd.get("barberId") || 0,
      date: fd.get("date"),
      time: fd.get("time"),
      name: fd.get("name"),
      phone: fd.get("phone") ?? "",
      notes: fd.get("notes") ?? "",
      force: fd.get("force") === "on",
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const v = parsed.data;

  const [service] = await db.select().from(schema.services).where(eq(schema.services.id, v.serviceId));
  if (!service) return { error: "Servicio no encontrado" };

  if (!v.force) {
    const start = toMinutes(v.time);
    const end = start + service.durationMin;
    const same = await db
      .select()
      .from(schema.bookings)
      .where(and(eq(schema.bookings.date, v.date), ne(schema.bookings.status, "cancelada")));
    const clash = same.find((b) => {
      if (v.barberId && b.barberId && b.barberId !== v.barberId) return false;
      const bs = toMinutes(b.time);
      return start < bs + b.durationMin && end > bs;
    });
    if (clash) {
      return { error: `Se cruza con la reserva de ${clash.customerName} a las ${clash.time}. Marca "forzar" para guardarla igual.` };
    }
  }

  await db.insert(schema.bookings).values({
    serviceId: service.id,
    barberId: v.barberId || null,
    serviceName: service.name,
    customerName: v.name,
    customerPhone: v.phone,
    notes: v.notes,
    date: v.date,
    time: v.time,
    durationMin: service.durationMin,
    price: service.price,
    status: "confirmada",
  });
  refresh();
  return { ok: true };
}

/* ───────────── Servicios ───────────── */

const serviceSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  category: z.string().min(1),
  price: z.number().int().nonnegative(),
  durationMin: z.number().int().min(5).max(480),
  sortOrder: z.number().int(),
  featured: z.boolean(),
  active: z.boolean(),
});

function readService(fd: FormData) {
  return serviceSchema.parse({
    name: str(fd, "name"),
    description: str(fd, "description"),
    category: str(fd, "category") || "Barbería",
    price: num(fd, "price"),
    durationMin: num(fd, "durationMin"),
    sortOrder: num(fd, "sortOrder") || 0,
    featured: bool(fd, "featured"),
    active: bool(fd, "active"),
  });
}

export async function saveService(fd: FormData) {
  await requireAdmin();
  const data = readService(fd);
  const rawId = fd.get("id");
  if (rawId) await db.update(schema.services).set(data).where(eq(schema.services.id, id(fd)));
  else await db.insert(schema.services).values(data);
  refresh();
}

export async function deleteService(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.services).where(eq(schema.services.id, id(fd)));
  refresh();
}

/* ───────────── Equipo ───────────── */

export async function saveBarber(fd: FormData) {
  await requireAdmin();
  const data = z
    .object({
      name: z.string().min(1),
      role: z.string(),
      bio: z.string(),
      photoUrl: httpUrl,
      instagram: z.string(),
      sortOrder: z.number().int(),
      active: z.boolean(),
    })
    .parse({
      name: str(fd, "name"),
      role: str(fd, "role") || "Barbero",
      bio: str(fd, "bio"),
      photoUrl: str(fd, "photoUrl"),
      instagram: str(fd, "instagram").replace(/^@/, ""),
      sortOrder: num(fd, "sortOrder") || 0,
      active: bool(fd, "active"),
    });
  if (fd.get("id")) await db.update(schema.barbers).set(data).where(eq(schema.barbers.id, id(fd)));
  else await db.insert(schema.barbers).values(data);
  refresh();
}

export async function deleteBarber(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.barbers).where(eq(schema.barbers.id, id(fd)));
  refresh();
}

/* ───────────── Horarios ───────────── */

export async function saveHours(fd: FormData) {
  await requireAdmin();
  const time = z.string().regex(/^\d{2}:\d{2}$/);
  for (let d = 0; d < 7; d++) {
    const openTime = time.parse(str(fd, `open_${d}`));
    const closeTime = time.parse(str(fd, `close_${d}`));
    const isOpen = bool(fd, `isOpen_${d}`) && toMinutes(closeTime) > toMinutes(openTime);
    await db
      .insert(schema.hours)
      .values({ weekday: d, isOpen, openTime, closeTime })
      .onConflictDoUpdate({ target: schema.hours.weekday, set: { isOpen, openTime, closeTime } });
  }
  refresh();
  redirect("/admin/horarios?ok=1");
}

/* ───────────── Galería ───────────── */

export async function addGalleryItem(fd: FormData) {
  await requireAdmin();
  const url = z.string().url().parse(str(fd, "url"));
  await db.insert(schema.gallery).values({ url, caption: str(fd, "caption"), sortOrder: num(fd, "sortOrder") || 0 });
  refresh();
}

export async function deleteGalleryItem(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.gallery).where(eq(schema.gallery.id, id(fd)));
  refresh();
}

/* ───────────── Reseñas ───────────── */

export async function saveReview(fd: FormData) {
  await requireAdmin();
  const data = z
    .object({ author: z.string().min(1), text: z.string().min(1), rating: z.number().int().min(1).max(5), active: z.boolean() })
    .parse({ author: str(fd, "author"), text: str(fd, "text"), rating: num(fd, "rating") || 5, active: bool(fd, "active") });
  if (fd.get("id")) await db.update(schema.reviews).set(data).where(eq(schema.reviews.id, id(fd)));
  else await db.insert(schema.reviews).values(data);
  refresh();
}

export async function deleteReview(fd: FormData) {
  await requireAdmin();
  await db.delete(schema.reviews).where(eq(schema.reviews.id, id(fd)));
  refresh();
}

/* ───────────── Ajustes ───────────── */

export async function saveSettings(fd: FormData) {
  await requireAdmin();
  const data = z
    .object({
      name: z.string().min(1),
      tagline: z.string(),
      description: z.string(),
      address: z.string().min(1),
      city: z.string(),
      whatsapp: z.string().regex(/^\d{8,15}$/, "WhatsApp: solo dígitos con código país, ej 56912345678"),
      instagram: z.string(),
      facebook: httpUrl,
      email: z.union([z.literal(""), z.string().email()]),
      logoUrl: httpUrl,
      heroImageUrl: httpUrl,
      rating: z.string().regex(/^\d(\.\d)?$/),
      reviewsCount: z.number().int().nonnegative(),
      slotMinutes: z.number().int().min(5).max(120),
    })
    .parse({
      name: str(fd, "name"),
      tagline: str(fd, "tagline"),
      description: str(fd, "description"),
      address: str(fd, "address"),
      city: str(fd, "city"),
      whatsapp: str(fd, "whatsapp").replace(/\D/g, ""),
      instagram: str(fd, "instagram").replace(/^@/, ""),
      facebook: str(fd, "facebook"),
      email: str(fd, "email"),
      logoUrl: str(fd, "logoUrl"),
      heroImageUrl: str(fd, "heroImageUrl"),
      rating: str(fd, "rating").replace(",", "."),
      reviewsCount: num(fd, "reviewsCount") || 0,
      slotMinutes: num(fd, "slotMinutes") || 15,
    });
  await db.update(schema.settings).set(data).where(eq(schema.settings.id, 1));
  refresh();
  redirect("/admin/ajustes?ok=1");
}
