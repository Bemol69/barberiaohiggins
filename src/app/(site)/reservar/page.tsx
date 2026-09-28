import type { Metadata } from "next";
import { BOOKING_WINDOW_DAYS } from "@/lib/availability";
import { getActiveBarbers, getActiveServices, getHours, getSettings } from "@/lib/data";
import { addDays, nowInChile } from "@/lib/time";
import { BookingWizard } from "./booking-wizard";

export const metadata: Metadata = {
  title: "Reservar hora",
  description: "Reserva tu hora online en Barbería O'Higgins, Rancagua.",
};

export default async function ReservarPage({ searchParams }: PageProps<"/reservar">) {
  const sp = await searchParams;
  const [settings, services, barbers, hours] = await Promise.all([
    getSettings(),
    getActiveServices(),
    getActiveBarbers(),
    getHours(),
  ]);

  const today = nowInChile().date;
  const openWeekdays = hours.filter((h) => h.isOpen).map((h) => h.weekday);
  const dates = Array.from({ length: BOOKING_WINDOW_DAYS }, (_, i) => addDays(today, i));

  const pick = (v: string | string[] | undefined) => (typeof v === "string" ? Number(v) : NaN);
  const initialServiceId = services.find((s) => s.id === pick(sp.servicio))?.id ?? null;
  const initialBarberId = barbers.find((b) => b.id === pick(sp.barbero))?.id ?? null;

  return (
    <section className="grain relative min-h-[100svh] overflow-hidden bg-ink-900 pb-24 pt-32">
      <div className="pointer-events-none absolute -right-40 -top-20 h-[36rem] w-[36rem] rounded-full bg-emerald-700/30 blur-[140px]" />
      <div className="relative mx-auto max-w-5xl px-5 sm:px-8">
        <p className="eyebrow text-gold-400">Reserva online</p>
        <h1 className="mt-4 font-display text-5xl font-medium tracking-tight text-bone-50 sm:text-6xl">
          Agenda tu <em className="gold-text italic">hora</em>
        </h1>
        <p className="mt-4 max-w-xl text-bone-400">
          Cuatro pasos y listo. Recibirás la confirmación y podrás avisarnos por WhatsApp.
        </p>

        <BookingWizard
          services={services}
          barbers={barbers}
          dates={dates}
          openWeekdays={openWeekdays}
          whatsapp={settings.whatsapp}
          initialServiceId={initialServiceId}
          initialBarberId={initialBarberId}
        />
      </div>
    </section>
  );
}
