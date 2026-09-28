import Link from "next/link";
import { and, asc, gte, lte, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { StatusSelect } from "@/components/admin/ui";
import { IconArrowRight, IconWhatsapp } from "@/components/icons";
import { formatCLP, whatsappLink } from "@/lib/format";
import { addDays, formatDateLong, formatDateShort, nowInChile } from "@/lib/time";

export default async function DashboardPage() {
  const today = nowInChile().date;
  const weekEnd = addDays(today, 6);
  const monthStart = today.slice(0, 8) + "01";

  const [upcoming, monthRows, barbers] = await Promise.all([
    db
      .select()
      .from(schema.bookings)
      .where(and(gte(schema.bookings.date, today), lte(schema.bookings.date, weekEnd), ne(schema.bookings.status, "cancelada")))
      .orderBy(asc(schema.bookings.date), asc(schema.bookings.time)),
    db.select().from(schema.bookings).where(and(gte(schema.bookings.date, monthStart), lte(schema.bookings.date, today))),
    db.select().from(schema.barbers),
  ]);
  const barberName = new Map(barbers.map((b) => [b.id, b.name]));

  const todays = upcoming.filter((b) => b.date === today);
  const pending = upcoming.filter((b) => b.status === "pendiente").length;
  const monthDone = monthRows.filter((b) => b.status === "completada");
  const monthRevenue = monthDone.reduce((s, b) => s + b.price, 0);
  const todayRevenue = todays.reduce((s, b) => s + b.price, 0);

  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i)).map((d) => ({
    date: d,
    count: upcoming.filter((b) => b.date === d).length,
  }));
  const maxCount = Math.max(1, ...week.map((w) => w.count));

  return (
    <div className="mx-auto max-w-6xl">
      <p className="eyebrow text-emerald-700 first-letter:uppercase">{formatDateLong(today)}</p>
      <h1 className="page-title mt-2">Buen día 👋</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Reservas hoy" value={String(todays.length)} hint={`${formatCLP(todayRevenue)} estimado`} />
        <Kpi label="Por confirmar" value={String(pending)} hint="próximos 7 días" accent={pending > 0} />
        <Kpi label="Próximos 7 días" value={String(upcoming.length)} hint="reservas activas" />
        <Kpi label="Ingresos del mes" value={formatCLP(monthRevenue)} hint={`${monthDone.length} servicios completados`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="card p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Agenda de hoy</h2>
            <Link href="/admin/reservas" className="flex items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-600">
              Ver todas <IconArrowRight width={14} height={14} />
            </Link>
          </div>
          {todays.length === 0 ? (
            <p className="mt-6 rounded-xl border border-dashed border-ink-900/15 p-8 text-center text-sm text-ink-500">
              No hay reservas para hoy todavía.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-ink-900/6">
              {todays.map((b) => (
                <li key={b.id} className="flex items-center gap-4 py-3.5">
                  <span className="w-14 font-display text-xl tabular-nums">{b.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{b.customerName}</p>
                    <p className="truncate text-sm text-ink-500">
                      {b.serviceName}
                      {b.barberId ? ` · ${barberName.get(b.barberId) ?? ""}` : ""}
                    </p>
                  </div>
                  {b.customerPhone && (
                    <a href={whatsappLink(b.customerPhone)} target="_blank" rel="noreferrer" className="text-emerald-600 hover:text-emerald-500" aria-label="WhatsApp cliente">
                      <IconWhatsapp />
                    </a>
                  )}
                  <StatusSelect id={b.id} status={b.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="font-display text-2xl">Próxima semana</h2>
          <p className="text-sm text-ink-500">Reservas activas por día</p>
          <div className="mt-6 flex h-44 items-end gap-2" role="img" aria-label="Reservas por día de los próximos 7 días">
            {week.map((w) => {
              const f = formatDateShort(w.date);
              return (
                <Link key={w.date} href={`/admin/reservas?fecha=${w.date}`} className="group flex flex-1 flex-col items-center gap-2">
                  <span className="text-xs font-semibold tabular-nums text-ink-600">{w.count}</span>
                  <span
                    className={`w-full rounded-t-md transition group-hover:bg-emerald-500 ${w.date === today ? "bg-gold-400" : "bg-emerald-700"}`}
                    style={{ height: `${Math.max(4, (w.count / maxCount) * 120)}px` }}
                  />
                  <span className="text-[0.65rem] font-semibold uppercase text-ink-500">{f.weekday}</span>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, hint, accent }: { label: string; value: string; hint: string; accent?: boolean }) {
  return (
    <div className={`card p-5 ${accent ? "!bg-gold-200/50 ring-gold-400/40" : ""}`}>
      <p className="alabel !mb-0">{label}</p>
      <p className="mt-3 font-display text-3xl tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-ink-500">{hint}</p>
    </div>
  );
}
