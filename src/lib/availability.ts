import "server-only";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { fromMinutes, isValidDate, nowInChile, toMinutes, weekdayOf } from "./time";

/** Anticipación mínima para reservar online. */
const LEAD_MINUTES = 30;
/** Hasta cuántos días hacia adelante se puede reservar. */
export const BOOKING_WINDOW_DAYS = 30;

export type Slot = { time: string; barberIds: number[] };

/**
 * Calcula horarios libres para un servicio en una fecha.
 * - barberId = null → "sin preferencia": sirve cualquier barbero libre.
 */
export async function getAvailableSlots(opts: {
  date: string;
  durationMin: number;
  barberId: number | null;
}): Promise<Slot[]> {
  const { date, durationMin, barberId } = opts;
  if (!isValidDate(date)) return [];

  const now = nowInChile();
  if (date < now.date) return [];

  const [day] = await db.select().from(schema.hours).where(eq(schema.hours.weekday, weekdayOf(date)));
  if (!day || !day.isOpen) return [];

  const [settings] = await db.select().from(schema.settings).where(eq(schema.settings.id, 1));
  const step = settings?.slotMinutes || 15;

  const barbers = await db
    .select({ id: schema.barbers.id })
    .from(schema.barbers)
    .where(eq(schema.barbers.active, true));
  const candidateIds = barberId ? barbers.filter((b) => b.id === barberId).map((b) => b.id) : barbers.map((b) => b.id);
  // Sin barberos cargados, la barbería funciona como una sola agenda (id 0).
  const agendaIds = barbers.length === 0 ? [0] : candidateIds;
  if (agendaIds.length === 0) return [];

  const dayBookings = await db
    .select({
      barberId: schema.bookings.barberId,
      time: schema.bookings.time,
      durationMin: schema.bookings.durationMin,
    })
    .from(schema.bookings)
    .where(and(eq(schema.bookings.date, date), ne(schema.bookings.status, "cancelada")));

  const open = toMinutes(day.openTime);
  const close = toMinutes(day.closeTime);
  const minStart = date === now.date ? now.minutes + LEAD_MINUTES : -1;

  const slots: Slot[] = [];
  for (let start = open; start + durationMin <= close; start += step) {
    if (start < minStart) continue;
    const end = start + durationMin;
    const free = agendaIds.filter((id) =>
      dayBookings.every((b) => {
        // Reservas sin barbero asignado bloquean a todos.
        if (b.barberId !== null && b.barberId !== id && id !== 0) return true;
        const bStart = toMinutes(b.time);
        const bEnd = bStart + b.durationMin;
        return end <= bStart || start >= bEnd;
      }),
    );
    if (free.length > 0) slots.push({ time: fromMinutes(start), barberIds: free });
  }
  return slots;
}
