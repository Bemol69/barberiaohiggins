import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton, StatusSelect } from "@/components/admin/ui";
import { IconArrowLeft, IconArrowRight, IconTrash, IconWhatsapp } from "@/components/icons";
import { deleteBooking } from "../../actions";
import { formatCLP, formatDuration, formatPhone, whatsappLink } from "@/lib/format";
import { addDays, formatDateLong, isValidDate, nowInChile } from "@/lib/time";
import { ManualBookingForm } from "./manual-booking-form";

export default async function ReservasPage({ searchParams }: PageProps<"/admin/reservas">) {
  const sp = await searchParams;
  const today = nowInChile().date;
  const date = typeof sp.fecha === "string" && isValidDate(sp.fecha) ? sp.fecha : today;

  const [rows, services, barbers] = await Promise.all([
    db.select().from(schema.bookings).where(eq(schema.bookings.date, date)).orderBy(asc(schema.bookings.time)),
    db.select().from(schema.services).orderBy(asc(schema.services.sortOrder)),
    db.select().from(schema.barbers).orderBy(asc(schema.barbers.sortOrder)),
  ]);
  const barberName = new Map(barbers.map((b) => [b.id, b.name]));
  const active = rows.filter((r) => r.status !== "cancelada");
  const total = active.reduce((s, r) => s + r.price, 0);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-emerald-700">Agenda</p>
          <h1 className="page-title mt-2">Reservas</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`?fecha=${addDays(date, -1)}`} className="abtn-secondary !px-3" aria-label="Día anterior">
            <IconArrowLeft width={16} height={16} />
          </Link>
          <form className="flex items-center gap-2">
            <input type="date" name="fecha" defaultValue={date} className="ainput !w-auto" />
            <button className="abtn-secondary">Ir</button>
          </form>
          <Link href={`?fecha=${addDays(date, 1)}`} className="abtn-secondary !px-3" aria-label="Día siguiente">
            <IconArrowRight width={16} height={16} />
          </Link>
          {date !== today && (
            <Link href="/admin/reservas" className="abtn-secondary">
              Hoy
            </Link>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 2xl:grid-cols-[1fr_22rem]">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-900/6 px-6 py-4">
            <h2 className="font-display text-2xl first-letter:uppercase">{formatDateLong(date)}</h2>
            <p className="text-sm text-ink-500">
              {active.length} {active.length === 1 ? "reserva" : "reservas"} · <span className="font-semibold text-ink-800">{formatCLP(total)}</span>
            </p>
          </div>
          {rows.length === 0 ? (
            <p className="p-12 text-center text-sm text-ink-500">Sin reservas este día.</p>
          ) : (
            <>
            <ul className="divide-y divide-ink-900/6 md:hidden">
              {rows.map((b) => (
                <li key={b.id} className="flex gap-4 px-5 py-4">
                  <div className="w-14 shrink-0">
                    <span className="font-display text-lg tabular-nums">{b.time}</span>
                    <span className="block text-xs text-ink-500">{formatDuration(b.durationMin)}</span>
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold">{b.customerName}</p>
                    <p className="text-ink-600">
                      {b.serviceName} · {formatCLP(b.price)}
                    </p>
                    <p className="text-xs text-ink-500">{b.barberId ? barberName.get(b.barberId) ?? "—" : "Sin asignar"}</p>
                    {b.notes && <p className="mt-1 text-xs italic text-ink-500">“{b.notes}”</p>}
                    <div className="mt-3 flex items-center gap-3">
                      <StatusSelect id={b.id} status={b.status} />
                      {b.customerPhone && (
                        <a href={whatsappLink(b.customerPhone)} target="_blank" rel="noreferrer" className="text-emerald-700" aria-label="WhatsApp cliente">
                          <IconWhatsapp width={18} height={18} />
                        </a>
                      )}
                      <form action={deleteBooking} className="ml-auto">
                        <input type="hidden" name="id" value={b.id} />
                        <ConfirmButton message={`¿Eliminar la reserva de ${b.customerName}?`} className="abtn-danger !p-2">
                          <IconTrash width={16} height={16} />
                        </ConfirmButton>
                      </form>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[44rem] text-sm">
                <thead>
                  <tr className="text-left text-[0.7rem] uppercase tracking-wider text-ink-500">
                    <th className="px-6 py-3 font-semibold">Hora</th>
                    <th className="px-3 py-3 font-semibold">Cliente</th>
                    <th className="px-3 py-3 font-semibold">Servicio</th>
                    <th className="px-3 py-3 font-semibold">Profesional</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-900/6">
                  {rows.map((b) => (
                    <tr key={b.id} className="align-top hover:bg-bone-100/60">
                      <td className="px-6 py-4">
                        <span className="font-display text-lg tabular-nums">{b.time}</span>
                        <span className="block text-xs text-ink-500">{formatDuration(b.durationMin)}</span>
                      </td>
                      <td className="px-3 py-4">
                        <p className="font-semibold">{b.customerName}</p>
                        {b.customerPhone && (
                          <a href={whatsappLink(b.customerPhone)} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline">
                            <IconWhatsapp width={12} height={12} /> {formatPhone(b.customerPhone)}
                          </a>
                        )}
                        {b.notes && <p className="mt-1 max-w-[14rem] text-xs italic text-ink-500">“{b.notes}”</p>}
                      </td>
                      <td className="px-3 py-4">
                        {b.serviceName}
                        <span className="block text-xs text-ink-500">{formatCLP(b.price)}</span>
                      </td>
                      <td className="px-3 py-4">{b.barberId ? barberName.get(b.barberId) ?? "—" : <span className="text-ink-500">Sin asignar</span>}</td>
                      <td className="px-3 py-4">
                        <StatusSelect id={b.id} status={b.status} />
                      </td>
                      <td className="px-3 py-4 text-right">
                        <form action={deleteBooking}>
                          <input type="hidden" name="id" value={b.id} />
                          <ConfirmButton message={`¿Eliminar la reserva de ${b.customerName}?`} className="abtn-danger !p-2">
                            <IconTrash width={16} height={16} />
                          </ConfirmButton>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}
        </section>

        <aside className="card h-fit p-6">
          <h2 className="font-display text-2xl">Agendar manual</h2>
          <p className="mt-1 text-sm text-ink-500">Para reservas por teléfono o clientes que llegan al local.</p>
          <ManualBookingForm
            date={date}
            services={services.map((s) => ({ id: s.id, name: s.name, durationMin: s.durationMin }))}
            barbers={barbers.map((b) => ({ id: b.id, name: b.name }))}
          />
        </aside>
      </div>
    </div>
  );
}
