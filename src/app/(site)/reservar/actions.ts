"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { BOOKING_WINDOW_DAYS, getAvailableSlots } from "@/lib/availability";
import { addDays, nowInChile } from "@/lib/time";

const bookingInput = z.object({
  serviceId: z.coerce.number().int().positive(),
  barberId: z.coerce.number().int().positive().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  name: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[^\d+]/g, ""))
    .refine((v) => v.replace(/\D/g, "").length >= 8, "Ingresa un teléfono válido"),
  email: z.union([z.literal(""), z.string().trim().email("Correo inválido")]).default(""),
  notes: z.string().trim().max(500).default(""),
  // Campo trampa anti-spam: los humanos lo dejan vacío.
  website: z.string().max(0).optional(),
});

export type BookingInput = z.input<typeof bookingInput>;

export type BookingResult =
  | {
      ok: true;
      booking: { id: number; serviceName: string; barberName: string | null; date: string; time: string; price: number; durationMin: number };
    }
  | { ok: false; error: string };

export async function createBooking(raw: BookingInput): Promise<BookingResult> {
  const parsed = bookingInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const input = parsed.data;

  const today = nowInChile().date;
  if (input.date < today || input.date > addDays(today, BOOKING_WINDOW_DAYS)) {
    return { ok: false, error: "La fecha elegida no está disponible." };
  }

  const [service] = await db
    .select()
    .from(schema.services)
    .where(and(eq(schema.services.id, input.serviceId), eq(schema.services.active, true)));
  if (!service) return { ok: false, error: "El servicio ya no está disponible." };

  // Revalida disponibilidad justo antes de guardar.
  const slots = await getAvailableSlots({ date: input.date, durationMin: service.durationMin, barberId: input.barberId });
  const slot = slots.find((s) => s.time === input.time);
  if (!slot) {
    return { ok: false, error: "Ese horario acaba de ser tomado. Por favor elige otro." };
  }

  // Sin preferencia: asigna al primer barbero libre (id 0 = agenda única sin barberos).
  const assigned = input.barberId ?? (slot.barberIds[0] || null);

  let barberName: string | null = null;
  if (assigned) {
    const [b] = await db.select({ name: schema.barbers.name }).from(schema.barbers).where(eq(schema.barbers.id, assigned));
    barberName = b?.name ?? null;
  }

  const [row] = await db
    .insert(schema.bookings)
    .values({
      serviceId: service.id,
      barberId: assigned,
      serviceName: service.name,
      customerName: input.name,
      customerPhone: input.phone,
      customerEmail: input.email,
      notes: input.notes,
      date: input.date,
      time: input.time,
      durationMin: service.durationMin,
      price: service.price,
      status: "pendiente",
    })
    .returning({ id: schema.bookings.id });

  revalidatePath("/admin", "layout");

  return {
    ok: true,
    booking: {
      id: row.id,
      serviceName: service.name,
      barberName,
      date: input.date,
      time: input.time,
      price: service.price,
      durationMin: service.durationMin,
    },
  };
}
