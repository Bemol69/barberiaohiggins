import { eq } from "drizzle-orm";
import { NextResponse, type NextRequest } from "next/server";
import { db, schema } from "@/db";
import { getAvailableSlots } from "@/lib/availability";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const serviceId = Number(sp.get("servicio"));
  const barberParam = sp.get("barbero");
  const barberId = barberParam ? Number(barberParam) : null;
  const date = sp.get("fecha") ?? "";

  if (!Number.isInteger(serviceId) || (barberId !== null && !Number.isInteger(barberId))) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const [service] = await db.select().from(schema.services).where(eq(schema.services.id, serviceId));
  if (!service || !service.active) {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 404 });
  }

  const slots = await getAvailableSlots({ date, durationMin: service.durationMin, barberId });
  return NextResponse.json(
    { slots: slots.map((s) => s.time) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
