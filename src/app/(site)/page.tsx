import Link from "next/link";
import { BrandMark } from "@/components/crest";
import {
  IconArrowRight,
  IconClock,
  IconPin,
  IconRazor,
  IconScissors,
  IconSparkle,
  IconStar,
  IconWhatsapp,
} from "@/components/icons";
import { getContent } from "@/lib/content";
import { bookingHref, formatCLP, formatDuration, formatPhone, initials, whatsappLink } from "@/lib/format";
import { WEEKDAYS, nowInChile, toMinutes, weekdayOf } from "@/lib/time";

export default async function HomePage() {
  const content = await getContent();
  const { business, hours, gallery, reviews } = content;
  const services = content.services.filter((s) => s.visible);
  const barbers = content.team.filter((b) => b.visible);

  const now = nowInChile();
  const todayIdx = weekdayOf(now.date);
  const today = hours.find((h) => h.weekday === todayIdx);
  const openNow =
    !!today?.isOpen && now.minutes >= toMinutes(today.open) && now.minutes < toMinutes(today.close);

  const categories = Array.from(new Set(services.map((s) => s.category)));
  const orderedHours = [1, 2, 3, 4, 5, 6, 0].map((d) => hours.find((h) => h.weekday === d)).filter(Boolean);
  const mapQuery = encodeURIComponent(`${business.address}, ${business.city}`);
  const fromPrice = services.length ? Math.min(...services.map((s) => s.price)) : null;

  const dayCodes = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BarberShop",
    name: business.name,
    description: business.description,
    telephone: `+${business.whatsapp}`,
    address: {
      "@type": "PostalAddress",
      streetAddress: business.address,
      addressLocality: "Rancagua",
      addressRegion: "O'Higgins",
      addressCountry: "CL",
    },
    priceRange: fromPrice ? `Desde ${formatCLP(fromPrice)}` : undefined,
    sameAs: business.instagram ? [`https://instagram.com/${business.instagram}`] : undefined,
    aggregateRating: business.reviewsCount
      ? { "@type": "AggregateRating", ratingValue: business.rating, reviewCount: business.reviewsCount }
      : undefined,
    openingHoursSpecification: hours
      .filter((h) => h.isOpen)
      .map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: dayCodes[h.weekday], opens: h.open, closes: h.close })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      {/* ───────────────────────── HERO ───────────────────────── */}
      <section className="grain relative flex min-h-[100svh] items-center overflow-hidden bg-ink-900 pt-24">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-40 top-10 h-[42rem] w-[42rem] rounded-full bg-emerald-700/35 blur-[140px]" />
          <div className="absolute -left-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-gold-600/15 blur-[120px]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(244,239,229,0.035)_1px,transparent_1px)] bg-[size:120px_100%]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-16 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-3 rounded-full border border-bone-100/12 bg-ink-800/60 py-1.5 pl-1.5 pr-4 backdrop-blur">
              <span className="flex items-center gap-1 rounded-full bg-gold-400 px-2.5 py-1 text-xs font-bold text-ink-900">
                <IconStar width={12} height={12} /> {business.rating}
              </span>
              <span className="text-xs text-bone-300">{business.reviewsCount} reseñas de clientes</span>
            </div>

            <h1 className="mt-8 font-display text-[clamp(2.9rem,7.5vw,6.2rem)] font-medium leading-[0.95] tracking-[-0.02em] text-bone-50">
              El oficio del
              <br />
              <em className="gold-text font-normal italic">buen corte</em>,
              <br />
              con carácter.
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-relaxed text-bone-300">
              Cortes clásicos y modernos, perfilado de barba y masajes de relajación en el centro de Rancagua.
              Tradición, técnica y trato cercano en cada visita.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href={bookingHref(business)} target="_blank" rel="noreferrer" className="btn-gold !px-8 !py-4 text-base">
                Reservar hora <IconArrowRight />
              </a>
              <Link href="#servicios" className="btn-ghost !px-8 !py-4 text-base">
                Ver servicios
              </Link>
            </div>

            <dl className="mt-14 grid max-w-xl grid-cols-3 gap-6 border-t border-bone-100/10 pt-8">
              <div>
                <dt className="eyebrow text-bone-500">Desde</dt>
                <dd className="mt-2 font-display text-2xl text-bone-50">{fromPrice ? formatCLP(fromPrice) : "—"}</dd>
              </div>
              <div>
                <dt className="eyebrow text-bone-500">Barberos</dt>
                <dd className="mt-2 font-display text-2xl text-bone-50">{barbers.length || "—"}</dd>
              </div>
              <div>
                <dt className="eyebrow text-bone-500">Hoy</dt>
                <dd className="mt-2 flex items-center gap-2 font-display text-2xl text-bone-50">
                  <span className={`h-2 w-2 rounded-full ${openNow ? "bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400" : "bg-crimson-500"}`} />
                  {openNow ? "Abierto" : "Cerrado"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Ventana en arco: foto del local o emblema */}
          <div className="relative mx-auto w-full max-w-md animate-fade-up [animation-delay:150ms] lg:max-w-none">
            <div className="absolute -inset-4 rounded-t-[999px] border border-gold-400/25" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-t-[999px] border border-gold-400/40 bg-gradient-to-b from-emerald-800 via-emerald-900 to-ink-900 shadow-2xl shadow-black/60">
              {business.heroImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={business.heroImageUrl} alt={business.name} className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(63,168,127,0.35),transparent_60%)]" />
                  <BrandMark logoUrl={business.logoUrl} className="relative w-3/4 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/95 to-transparent p-6 pt-20">
                <p className="eyebrow text-gold-300">Rancagua · Chile</p>
                <p className="mt-2 font-display text-2xl text-bone-50">{business.address}</p>
              </div>
            </div>
            <div className="pole-stripe absolute -left-3 top-1/4 hidden h-40 w-3 rounded-full shadow-lg lg:block" />
          </div>
        </div>
      </section>

      {/* ───────────────────────── MARQUEE ───────────────────────── */}
      <div className="relative overflow-hidden border-y border-gold-400/20 bg-emerald-900 py-5" aria-hidden>
        <div className="flex w-max animate-marquee gap-10 whitespace-nowrap font-display text-2xl italic text-bone-100/90">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Corte clásico", "Fade & degradado", "Perfilado de barba", "Toalla caliente", "Navaja", "Masaje de relajación", "Cejas"].map(
              (t) => (
                <span key={`${k}-${t}`} className="flex items-center gap-10">
                  {t} <span className="text-gold-400 not-italic">✦</span>
                </span>
              ),
            ),
          )}
        </div>
      </div>

      {/* ───────────────────────── SERVICIOS ───────────────────────── */}
      <section id="servicios" className="scroll-mt-20 bg-bone-100 py-24 text-ink-900 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="eyebrow text-emerald-700">Carta de servicios</p>
              <h2 className="mt-4 font-display text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl">
                Precios claros,
                <br />
                <em className="italic text-emerald-700">resultados finos.</em>
              </h2>
              <p className="mt-6 max-w-md text-ink-600">
                Cada servicio incluye asesoría y terminación al detalle. Toca cualquier servicio para pedir tu hora por
                WhatsApp.
              </p>
              <div className="mt-8 flex gap-6 text-emerald-700">
                <IconScissors width={28} height={28} />
                <IconRazor width={28} height={28} />
                <IconSparkle width={28} height={28} />
              </div>
            </div>

            <div className="space-y-14">
              {categories.map((cat) => (
                <div key={cat}>
                  <div className="flex items-center gap-4">
                    <h3 className="eyebrow text-ink-500">{cat}</h3>
                    <span className="h-px flex-1 bg-ink-900/12" />
                  </div>
                  <ul className="mt-4 divide-y divide-ink-900/10">
                    {services
                      .filter((s) => s.category === cat)
                      .map((s) => (
                        <li key={s.id} className="group">
                          <a
                            href={bookingHref(business, `para ${s.name}`)}
                            target="_blank"
                            rel="noreferrer"
                            className="-mx-4 flex items-start gap-6 rounded-2xl px-4 py-6 transition hover:bg-bone-50"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                                <span className="font-display text-2xl font-medium text-ink-900">{s.name}</span>
                                {s.featured && (
                                  <span className="rounded-full bg-emerald-700 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-bone-50">
                                    Favorito
                                  </span>
                                )}
                              </div>
                              {s.description && <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-500">{s.description}</p>}
                              <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-ink-500">
                                <IconClock width={14} height={14} /> {formatDuration(s.durationMin)}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                              <span className="font-display text-2xl font-semibold text-ink-900 tabular-nums">{formatCLP(s.price)}</span>
                              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 opacity-0 transition group-hover:opacity-100 max-sm:opacity-100">
                                Reservar <IconArrowRight width={14} height={14} />
                              </span>
                            </div>
                          </a>
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── NOSOTROS ───────────────────────── */}
      <section id="nosotros" className="grain relative scroll-mt-20 overflow-hidden bg-ink-900 py-24 sm:py-32">
        <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-emerald-700/25 blur-[120px]" />
        <div className="relative mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="eyebrow text-gold-400">Nuestra esencia</p>
            <blockquote className="mt-6 font-display text-[clamp(2rem,4vw,3.25rem)] font-light leading-[1.12] text-bone-50">
              “Elegancia, respeto y <em className="gold-text italic">distinción</em> en cada servicio.”
            </blockquote>
            <p className="mt-8 max-w-xl leading-relaxed text-bone-300">{business.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { k: business.rating, v: "Calificación promedio", icon: <IconStar className="text-gold-400" /> },
              { k: String(business.reviewsCount), v: "Reseñas de clientes", icon: <IconSparkle className="text-gold-400" /> },
              { k: String(services.length), v: "Servicios a tu medida", icon: <IconScissors className="text-gold-400" /> },
              { k: "WhatsApp", v: "Atención directa", icon: <IconWhatsapp className="text-gold-400" /> },
            ].map((s, i) => (
              <div
                key={s.v}
                className={`rounded-3xl border border-bone-100/8 bg-ink-800/60 p-7 backdrop-blur ${i % 2 ? "translate-y-8" : ""}`}
              >
                {s.icon}
                <p className="mt-8 font-display text-4xl text-bone-50">{s.k}</p>
                <p className="mt-2 text-sm text-bone-400">{s.v}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── EQUIPO ───────────────────────── */}
      {barbers.length > 0 && (
        <section id="equipo" className="scroll-mt-20 border-t border-bone-100/6 bg-ink-850 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow text-gold-400">El equipo</p>
                <h2 className="mt-4 font-display text-5xl font-medium tracking-tight text-bone-50 sm:text-6xl">
                  Manos <em className="italic text-gold-300">expertas</em>
                </h2>
              </div>
              <p className="max-w-sm text-bone-400">Pide hora con tu barbero de confianza directo por WhatsApp.</p>
            </div>

            <div className="mt-14 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {barbers.map((b, i) => (
                <a key={b.id} href={bookingHref(business, `con ${b.name}`)} target="_blank" rel="noreferrer" className="group">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-3xl border border-bone-100/10 bg-gradient-to-b from-emerald-800 to-ink-900">
                    {b.photoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={b.photoUrl}
                        alt={b.name}
                        className="h-full w-full object-cover grayscale-[35%] transition duration-700 group-hover:scale-105 group-hover:grayscale-0"
                      />
                    ) : (
                      <div className="grid h-full place-items-center">
                        <span className="font-display text-7xl italic text-gold-300/90">{initials(b.name)}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gold-400 py-3 text-center text-sm font-semibold text-ink-900 transition duration-500 group-hover:translate-y-0">
                      Reservar con {b.name}
                    </div>
                    <span className="absolute left-5 top-8 font-display text-sm text-bone-100/50">0{i + 1}</span>
                  </div>
                  <div className="mt-4 px-1">
                    <p className="font-display text-2xl text-bone-50">{b.name}</p>
                    <p className="text-sm text-bone-400">{b.role}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── GALERÍA ───────────────────────── */}
      {gallery.length > 0 && (
        <section className="bg-ink-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <p className="eyebrow text-gold-400">Trabajos recientes</p>
            <h2 className="mt-4 font-display text-5xl font-medium tracking-tight text-bone-50">Galería</h2>
            <div className="mt-12 columns-2 gap-4 sm:columns-3 [&>*]:mb-4">
              {gallery.map((g) => (
                <figure key={g.id} className="group relative overflow-hidden rounded-2xl break-inside-avoid">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt={g.caption || "Trabajo de la barbería"} loading="lazy" className="w-full transition duration-700 group-hover:scale-105" />
                  {g.caption && (
                    <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink-950/90 to-transparent p-4 text-sm text-bone-100 opacity-0 transition group-hover:opacity-100">
                      {g.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── RESEÑAS ───────────────────────── */}
      {reviews.length > 0 && (
        <section className="bg-bone-100 py-24 text-ink-900 sm:py-32">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
              <div>
                <p className="eyebrow text-emerald-700">Lo que dicen</p>
                <h2 className="mt-4 font-display text-5xl font-medium tracking-tight">Clientes que vuelven</h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-display text-5xl">{business.rating}</span>
                <div>
                  <div className="flex text-gold-500">
                    {Array.from({ length: 5 }).map((_, i) => <IconStar key={i} width={16} height={16} />)}
                  </div>
                  <p className="text-sm text-ink-500">{business.reviewsCount} reseñas</p>
                </div>
              </div>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {reviews.map((r) => (
                <figure key={r.id} className="rounded-3xl bg-bone-50 p-8 shadow-[0_1px_0_rgba(0,0,0,0.04)] ring-1 ring-ink-900/6">
                  <div className="flex text-gold-500">
                    {Array.from({ length: r.rating }).map((_, i) => <IconStar key={i} width={14} height={14} />)}
                  </div>
                  <blockquote className="mt-5 font-display text-lg leading-relaxed">“{r.text}”</blockquote>
                  <figcaption className="mt-6 text-sm font-semibold text-ink-600">— {r.author}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ───────────────────────── UBICACIÓN Y HORARIO ───────────────────────── */}
      <section id="ubicacion" className="scroll-mt-20 bg-ink-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <p className="eyebrow text-gold-400">Visítanos</p>
          <h2 className="mt-4 font-display text-5xl font-medium tracking-tight text-bone-50 sm:text-6xl">
            En pleno centro de <em className="italic text-gold-300">Rancagua</em>
          </h2>

          <div className="mt-14 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <div className="relative min-h-[22rem] overflow-hidden rounded-3xl border border-bone-100/10 bg-ink-800">
              <iframe
                title="Mapa de ubicación"
                src={`https://www.google.com/maps?q=${mapQuery}&output=embed`}
                className="absolute inset-0 h-full w-full [filter:grayscale(1)_invert(0.92)_contrast(0.9)_hue-rotate(160deg)]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-3xl border border-bone-100/10 bg-ink-800/70 p-8">
                <div className="flex items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-800 text-gold-300"><IconPin /></span>
                  <div>
                    <p className="font-display text-2xl text-bone-50">{business.address}</p>
                    <p className="text-bone-400">{business.city}</p>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-gold-300 hover:text-gold-200"
                    >
                      Cómo llegar <IconArrowRight width={14} height={14} />
                    </a>
                  </div>
                </div>
                <div className="mt-6 flex items-start gap-4 border-t border-bone-100/8 pt-6">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-800 text-gold-300"><IconWhatsapp /></span>
                  <div>
                    <a href={whatsappLink(business.whatsapp)} target="_blank" rel="noreferrer" className="font-display text-2xl text-bone-50 hover:text-gold-300">
                      {formatPhone(business.whatsapp)}
                    </a>
                    <p className="text-bone-400">Escríbenos por WhatsApp</p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-bone-100/10 bg-ink-800/70 p-8">
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-2 font-display text-xl text-bone-50"><IconClock className="text-gold-300" /> Horario</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${openNow ? "bg-emerald-500/15 text-emerald-400" : "bg-crimson-500/15 text-crimson-500"}`}>
                    {openNow ? "Abierto ahora" : "Cerrado ahora"}
                  </span>
                </div>
                <ul className="mt-5 space-y-1">
                  {orderedHours.map((h) => (
                    <li
                      key={h!.weekday}
                      className={`flex justify-between rounded-xl px-3 py-2 text-sm ${
                        h!.weekday === todayIdx ? "bg-gold-400/10 font-semibold text-gold-200" : "text-bone-300"
                      }`}
                    >
                      <span>{WEEKDAYS[h!.weekday]}</span>
                      <span className="tabular-nums">{h!.isOpen ? `${h!.open} – ${h!.close}` : "Cerrado"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}
      <section className="grain relative overflow-hidden bg-emerald-800 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(212,173,90,0.25),transparent_50%)]" />
        <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 text-center sm:px-8">
          <BrandMark logoUrl={business.logoUrl} className="h-20 w-20" />
          <h2 className="mt-8 font-display text-[clamp(2.5rem,6vw,4.5rem)] font-medium leading-none tracking-tight text-bone-50">
            Tu próximo corte
            <br />
            <em className="gold-text italic">te está esperando.</em>
          </h2>
          <p className="mt-6 max-w-lg text-bone-200">Reserva en segundos y te esperamos en {business.address}.</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <a href={bookingHref(business)} target="_blank" rel="noreferrer" className="btn-gold !px-8 !py-4 text-base">
              Reservar hora <IconArrowRight />
            </a>
            {business.bookingUrl ? (
              <a href={whatsappLink(business.whatsapp, "Hola! Tengo una consulta 💈")} target="_blank" rel="noreferrer" className="btn-ghost !px-8 !py-4 text-base">
                <IconWhatsapp /> WhatsApp
              </a>
            ) : (
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${mapQuery}`} target="_blank" rel="noreferrer" className="btn-ghost !px-8 !py-4 text-base">
                <IconPin /> Cómo llegar
              </a>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
