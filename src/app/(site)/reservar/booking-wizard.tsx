"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { Barber, Service } from "@/db/schema";
import { IconArrowLeft, IconArrowRight, IconCalendar, IconCheck, IconClock, IconUsers, IconWhatsapp } from "@/components/icons";
import { formatCLP, formatDuration, initials, whatsappLink } from "@/lib/format";
import { formatDateLong, formatDateShort, weekdayOf } from "@/lib/time";
import { createBooking, type BookingResult } from "./actions";

type Props = {
  services: Service[];
  barbers: Barber[];
  dates: string[];
  openWeekdays: number[];
  whatsapp: string;
  initialServiceId: number | null;
  initialBarberId: number | null;
};

const STEPS = ["Servicio", "Profesional", "Fecha y hora", "Tus datos"] as const;

export function BookingWizard(props: Props) {
  const { services, barbers, dates, openWeekdays, whatsapp } = props;

  const [serviceId, setServiceId] = useState<number | null>(props.initialServiceId);
  // undefined = aún no elige; null = sin preferencia
  const [barberId, setBarberId] = useState<number | null | undefined>(
    props.initialBarberId ?? (barbers.length === 0 ? null : undefined),
  );
  const [step, setStep] = useState(() => {
    if (!props.initialServiceId) return 0;
    if (props.initialBarberId || barbers.length === 0) return 2;
    return 1;
  });
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "", website: "" });
  const [result, setResult] = useState<BookingResult | null>(null);
  const [pending, startTransition] = useTransition();
  const [reloadKey, setReloadKey] = useState(0);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const barber = barbers.find((b) => b.id === barberId) ?? null;
  const availableDates = useMemo(() => dates.filter((d) => openWeekdays.includes(weekdayOf(d))), [dates, openWeekdays]);

  // Carga horarios al cambiar servicio / barbero / fecha.
  useEffect(() => {
    if (!serviceId || !date || barberId === undefined) return;
    const ctrl = new AbortController();
    const params = new URLSearchParams({ servicio: String(serviceId), fecha: date });
    if (barberId) params.set("barbero", String(barberId));
    fetch(`/api/disponibilidad?${params}`, { signal: ctrl.signal, cache: "no-store" })
      .then((r) => r.json())
      .then((data: { slots?: string[]; error?: string }) => {
        if (data.error) setSlotsError(data.error);
        else setSlots(data.slots ?? []);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setSlotsError("No pudimos cargar los horarios. Intenta de nuevo.");
      });
    return () => ctrl.abort();
  }, [serviceId, barberId, date, reloadKey]);

  function chooseDate(d: string) {
    setDate(d);
    setTime(null);
    setSlots(null);
    setSlotsError(null);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !date || !time) return;
    startTransition(async () => {
      const res = await createBooking({
        serviceId,
        barberId: barberId ?? null,
        date,
        time,
        ...form,
      });
      setResult(res);
      if (!res.ok && res.error.includes("horario")) {
        setTime(null);
        setSlots(null);
        setStep(2);
        setReloadKey((k) => k + 1);
      }
    });
  }

  if (result?.ok) {
    const b = result.booking;
    const msg = `Hola! Acabo de reservar en la web 💈\n• ${b.serviceName}\n• ${formatDateLong(b.date)} a las ${b.time}${
      b.barberName ? `\n• Con ${b.barberName}` : ""
    }\n• A nombre de ${form.name}\nReserva #${b.id}`;
    return (
      <div className="mt-12 animate-fade-up overflow-hidden rounded-[2rem] border border-gold-400/30 bg-ink-800/80 backdrop-blur">
        <div className="pole-stripe h-1.5" />
        <div className="p-8 sm:p-12">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_40px] shadow-emerald-500/40">
            <IconCheck width={32} height={32} />
          </span>
          <h2 className="mt-8 font-display text-4xl text-bone-50">¡Reserva recibida, {form.name.split(" ")[0]}!</h2>
          <p className="mt-3 text-bone-300">Te esperamos. Si necesitas cambiar tu hora, escríbenos por WhatsApp.</p>

          <dl className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-bone-100/10 sm:grid-cols-2">
            {[
              ["Servicio", b.serviceName],
              ["Profesional", b.barberName ?? "Por asignar"],
              ["Fecha", formatDateLong(b.date)],
              ["Hora", `${b.time} · ${formatDuration(b.durationMin)}`],
              ["Valor", formatCLP(b.price)],
              ["N° de reserva", `#${b.id}`],
            ].map(([k, v]) => (
              <div key={k} className="bg-ink-850 p-5">
                <dt className="eyebrow text-bone-500">{k}</dt>
                <dd className="mt-2 font-display text-xl text-bone-50">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-wrap gap-4">
            <a href={whatsappLink(whatsapp, msg)} target="_blank" rel="noreferrer" className="btn !bg-emerald-500 !px-7 !py-4 text-white hover:!bg-emerald-400">
              <IconWhatsapp /> Confirmar por WhatsApp
            </a>
            <Link href="/" className="btn-ghost !px-7 !py-4">
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="min-w-0">
        {/* Progreso */}
        <ol className="mb-8 grid grid-cols-4 gap-2" aria-label="Pasos">
          {STEPS.map((label, i) => {
            const done = i < step;
            const current = i === step;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => setStep(i)}
                  className="group w-full text-left disabled:cursor-default"
                  aria-current={current ? "step" : undefined}
                >
                  <span className={`block h-1 rounded-full transition-colors duration-500 ${done || current ? "bg-gold-400" : "bg-bone-100/10"}`} />
                  <span className={`mt-3 hidden text-xs font-semibold uppercase tracking-wider sm:block ${current ? "text-bone-50" : done ? "text-gold-300" : "text-bone-500"}`}>
                    {i + 1}. {label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="rounded-[2rem] border border-bone-100/10 bg-ink-800/60 p-5 backdrop-blur sm:p-8">
          {/* Paso 1: servicio */}
          {step === 0 && (
            <div className="animate-fade-up">
              <h2 className="font-display text-3xl text-bone-50">¿Qué te hacemos hoy?</h2>
              <ul className="mt-6 grid gap-3">
                {services.map((s) => {
                  const active = s.id === serviceId;
                  return (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setServiceId(s.id);
                          setTime(null);
                          setSlots(null);
                          setStep(barbers.length === 0 ? 2 : 1);
                        }}
                        className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${
                          active ? "border-gold-400 bg-gold-400/10" : "border-bone-100/10 hover:border-bone-100/25 hover:bg-ink-700/50"
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-display text-xl text-bone-50">{s.name}</p>
                          <p className="mt-1 flex items-center gap-1.5 text-sm text-bone-400">
                            <IconClock width={14} height={14} /> {formatDuration(s.durationMin)}
                            <span className="text-bone-500">· {s.category}</span>
                          </p>
                        </div>
                        <span className="font-display text-xl font-semibold tabular-nums text-gold-300">{formatCLP(s.price)}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Paso 2: barbero */}
          {step === 1 && (
            <div className="animate-fade-up">
              <h2 className="font-display text-3xl text-bone-50">¿Con quién?</h2>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <BarberOption
                  active={barberId === null}
                  onClick={() => {
                    setBarberId(null);
                    setTime(null);
                    setSlots(null);
                    setStep(2);
                  }}
                  title="Sin preferencia"
                  subtitle="Primer disponible"
                  avatar={<IconUsers width={26} height={26} />}
                />
                {barbers.map((b) => (
                  <BarberOption
                    key={b.id}
                    active={barberId === b.id}
                    onClick={() => {
                      setBarberId(b.id);
                      setTime(null);
                      setSlots(null);
                      setStep(2);
                    }}
                    title={b.name}
                    subtitle={b.role}
                    avatar={
                      b.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-display text-xl italic">{initials(b.name)}</span>
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}

          {/* Paso 3: fecha y hora */}
          {step === 2 && (
            <div className="animate-fade-up">
              <h2 className="font-display text-3xl text-bone-50">Elige el día</h2>
              <div className="-mx-5 mt-6 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 [scrollbar-width:thin]">
                <div className="flex gap-2">
                  {availableDates.map((d) => {
                    const f = formatDateShort(d);
                    const active = d === date;
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => chooseDate(d)}
                        className={`flex w-[4.5rem] shrink-0 flex-col items-center rounded-2xl border py-3 transition ${
                          active ? "border-gold-400 bg-gold-400 text-ink-900" : "border-bone-100/10 text-bone-200 hover:border-bone-100/30"
                        }`}
                      >
                        <span className="text-[0.7rem] font-semibold uppercase tracking-wider opacity-80">{f.weekday}</span>
                        <span className="font-display text-2xl leading-tight">{f.day}</span>
                        <span className="text-[0.7rem] uppercase opacity-70">{f.month}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {date && (
                <div className="mt-8">
                  <h3 className="font-display text-2xl text-bone-50">
                    Horarios · <span className="text-bone-300">{formatDateLong(date)}</span>
                  </h3>
                  {slotsError ? (
                    <p className="mt-4 text-crimson-500">{slotsError}</p>
                  ) : slots === null ? (
                    <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="h-12 animate-pulse rounded-xl bg-bone-100/5" />
                      ))}
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="mt-5 rounded-2xl border border-dashed border-bone-100/15 p-6 text-center text-bone-400">
                      No quedan horas este día. Prueba otra fecha{barberId ? " u otro profesional" : ""}.
                    </div>
                  ) : (
                    <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {slots.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => {
                            setTime(t);
                            setStep(3);
                          }}
                          className={`rounded-xl border py-3 text-sm font-semibold tabular-nums transition ${
                            t === time ? "border-gold-400 bg-gold-400 text-ink-900" : "border-bone-100/10 text-bone-100 hover:border-gold-400/60 hover:text-gold-200"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Paso 4: datos */}
          {step === 3 && (
            <form onSubmit={submit} className="animate-fade-up">
              <h2 className="font-display text-3xl text-bone-50">Tus datos</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nombre y apellido" required>
                  <input required autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" placeholder="Juan Pérez" />
                </Field>
                <Field label="WhatsApp / teléfono" required>
                  <input required type="tel" autoComplete="tel" inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="field" placeholder="+56 9 1234 5678" />
                </Field>
                <Field label="Correo (opcional)">
                  <input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" placeholder="tu@correo.cl" />
                </Field>
                <Field label="Comentario (opcional)">
                  <input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="field" placeholder="Ej: fade bajo, traigo foto" />
                </Field>
                <input
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden
                  className="absolute left-[-9999px]"
                  value={form.website}
                  onChange={(e) => setForm({ ...form, website: e.target.value })}
                  name="website"
                />
              </div>

              {result && !result.ok && (
                <p role="alert" className="mt-5 rounded-xl border border-crimson-500/40 bg-crimson-600/10 px-4 py-3 text-sm text-crimson-500">
                  {result.error}
                </p>
              )}

              <button type="submit" disabled={pending} className="btn-gold mt-8 w-full !py-4 text-base">
                {pending ? "Confirmando…" : "Confirmar reserva"} {!pending && <IconArrowRight />}
              </button>
              <p className="mt-3 text-center text-xs text-bone-500">Sin pagos por adelantado. Pagas en el local.</p>
            </form>
          )}
        </div>

        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => (s === 2 && barbers.length === 0 ? 0 : s - 1))} className="mt-5 inline-flex items-center gap-2 text-sm text-bone-400 hover:text-bone-100">
            <IconArrowLeft width={16} height={16} /> Volver
          </button>
        )}
      </div>

      {/* Resumen */}
      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="overflow-hidden rounded-[2rem] border border-bone-100/10 bg-ink-850">
          <div className="pole-stripe h-1" />
          <div className="p-6">
            <p className="eyebrow text-gold-400">Tu reserva</p>
            <ul className="mt-5 space-y-4 text-sm">
              <SummaryRow icon={<IconClock width={16} height={16} />} label="Servicio" value={service ? `${service.name} · ${formatDuration(service.durationMin)}` : "—"} />
              <SummaryRow icon={<IconUsers width={16} height={16} />} label="Profesional" value={barberId === undefined ? "—" : barber?.name ?? "Sin preferencia"} />
              <SummaryRow icon={<IconCalendar width={16} height={16} />} label="Fecha" value={date ? `${formatDateLong(date)}${time ? ` · ${time}` : ""}` : "—"} />
            </ul>
            <div className="mt-6 flex items-baseline justify-between border-t border-bone-100/10 pt-5">
              <span className="text-bone-400">Total</span>
              <span className="font-display text-3xl text-bone-50">{service ? formatCLP(service.price) : "—"}</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

function BarberOption(props: { active: boolean; onClick: () => void; title: string; subtitle: string; avatar: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`flex flex-col items-center rounded-2xl border p-5 text-center transition ${
        props.active ? "border-gold-400 bg-gold-400/10" : "border-bone-100/10 hover:border-bone-100/25 hover:bg-ink-700/50"
      }`}
    >
      <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-emerald-700 to-emerald-900 text-gold-300 ring-1 ring-gold-400/30">
        {props.avatar}
      </span>
      <span className="mt-3 font-display text-lg text-bone-50">{props.title}</span>
      <span className="text-xs text-bone-400">{props.subtitle}</span>
    </button>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-bone-400">
        {label} {required && <span className="text-gold-400">*</span>}
      </span>
      {children}
    </label>
  );
}

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 text-gold-300">{icon}</span>
      <div>
        <p className="text-xs text-bone-500">{label}</p>
        <p className="text-bone-100">{value}</p>
      </div>
    </li>
  );
}
