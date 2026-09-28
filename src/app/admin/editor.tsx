"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { upload } from "@vercel/blob/client";
import type { SiteContent } from "@/content/schema";
import { Crest } from "@/components/crest";
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
  IconClock,
  IconExternal,
  IconImage,
  IconLogout,
  IconPlus,
  IconScissors,
  IconSettings,
  IconStar,
  IconTrash,
  IconUsers,
} from "@/components/icons";
import type { StorageMode } from "@/lib/content";
import { WEEKDAYS } from "@/lib/time";
import { logout, saveContent } from "./actions";

const TABS = [
  { id: "negocio", label: "Negocio", icon: IconSettings },
  { id: "servicios", label: "Servicios", icon: IconScissors },
  { id: "equipo", label: "Equipo", icon: IconUsers },
  { id: "horarios", label: "Horarios", icon: IconClock },
  { id: "fotos", label: "Fotos", icon: IconImage },
  { id: "resenas", label: "Reseñas", icon: IconStar },
] as const;
type TabId = (typeof TABS)[number]["id"];

type Status = { kind: "idle" } | { kind: "saved" } | { kind: "error"; message: string };

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta;
  if (target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function Editor({ initial, mode }: { initial: SiteContent; mode: StorageMode }) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [tab, setTab] = useState<TabId>("negocio");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(content) !== JSON.stringify(saved);
  const canUpload = mode === "blob";

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update<K extends keyof SiteContent>(key: K, value: SiteContent[K]) {
    setContent((c) => ({ ...c, [key]: value }));
    setStatus({ kind: "idle" });
  }
  const setBusiness = (patch: Partial<SiteContent["business"]>) => update("business", { ...content.business, ...patch });

  function save() {
    startTransition(async () => {
      const res = await saveContent(content);
      if (res.ok) {
        setSaved(content);
        setStatus({ kind: "saved" });
      } else {
        setStatus({ kind: "error", message: res.error });
      }
    });
  }

  const b = content.business;

  return (
    <div className="admin min-h-[100svh] pb-32">
      {/* Barra superior */}
      <header className="sticky top-0 z-40 bg-ink-900 text-bone-100">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Crest className="h-9 w-9 shrink-0" />
            <div className="min-w-0 leading-tight">
              <p className="truncate font-display text-lg text-bone-50">{b.name || "Mi barbería"}</p>
              <p className="eyebrow text-[0.55rem] text-gold-400">Administrar web</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-bone-300 hover:text-bone-50">
              <IconExternal width={16} height={16} /> <span className="hidden sm:inline">Ver web</span>
            </Link>
            <form action={logout}>
              <button type="submit" className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-bone-300 hover:text-bone-50">
                <IconLogout width={16} height={16} /> <span className="hidden sm:inline">Salir</span>
              </button>
            </form>
          </div>
        </div>
        <nav className="border-t border-bone-100/8" aria-label="Secciones">
          <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-3 py-2 sm:px-5 [scrollbar-width:none]">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                aria-current={tab === id ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === id ? "bg-gold-400 text-ink-900" : "text-bone-300 hover:bg-bone-100/6 hover:text-bone-50"
                }`}
              >
                <Icon width={16} height={16} /> {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {mode === "readonly" && (
          <div className="mb-6 rounded-2xl border border-gold-500/40 bg-gold-200/40 p-5 text-sm text-ink-800">
            <p className="font-semibold">Falta un paso para poder guardar cambios</p>
            <p className="mt-1">
              En Vercel ve a <b>Storage → Create → Blob</b>, elige acceso <b>Public</b>, conéctalo a este proyecto y
              vuelve a desplegar. Mientras tanto la web muestra el contenido inicial.
            </p>
          </div>
        )}

        {tab === "negocio" && (
          <Section title="Datos del negocio" hint="Lo que aparece en la portada, el pie de página y Google.">
            <Grid>
              <Text label="Nombre" value={b.name} onChange={(v) => setBusiness({ name: v })} />
              <Text label="Frase corta" value={b.tagline} onChange={(v) => setBusiness({ tagline: v })} />
              <Area label="Descripción (sección “Nuestra esencia”)" value={b.description} onChange={(v) => setBusiness({ description: v })} wide />
              <Text label="Dirección" value={b.address} onChange={(v) => setBusiness({ address: v })} />
              <Text label="Ciudad" value={b.city} onChange={(v) => setBusiness({ city: v })} />
              <Text label="WhatsApp (con código país)" value={b.whatsapp} onChange={(v) => setBusiness({ whatsapp: v })} placeholder="56912345678" inputMode="tel" />
              <Text label="Instagram" value={b.instagram} onChange={(v) => setBusiness({ instagram: v })} placeholder="usuario" />
              <Text label="Facebook (enlace)" value={b.facebook} onChange={(v) => setBusiness({ facebook: v })} placeholder="https://facebook.com/…" />
              <Text
                label="Link de reservas (opcional)"
                value={b.bookingUrl}
                onChange={(v) => setBusiness({ bookingUrl: v })}
                placeholder="Vacío = los botones Reservar abren WhatsApp"
              />
              <Text label="Calificación" value={b.rating} onChange={(v) => setBusiness({ rating: v })} placeholder="4.9" />
              <Text
                label="Cantidad de reseñas"
                value={String(b.reviewsCount)}
                onChange={(v) => setBusiness({ reviewsCount: Number(v.replace(/\D/g, "")) || 0 })}
                inputMode="numeric"
              />
            </Grid>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <ImageField label="Logo" value={b.logoUrl} onChange={(v) => setBusiness({ logoUrl: v })} canUpload={canUpload} hint="Vacío = emblema por defecto" />
              <ImageField label="Foto principal (portada)" value={b.heroImageUrl} onChange={(v) => setBusiness({ heroImageUrl: v })} canUpload={canUpload} />
            </div>
          </Section>
        )}

        {tab === "servicios" && (
          <Section title="Servicios y precios" hint="Precios en pesos, sin puntos. Ocultos no se muestran en la web.">
            <div className="space-y-3">
              {content.services.map((s, i) => {
                const set = (patch: Partial<typeof s>) =>
                  update("services", content.services.map((x) => (x.id === s.id ? { ...x, ...patch } : x)));
                return (
                  <ItemCard
                    key={s.id}
                    muted={!s.visible}
                    onUp={() => update("services", move(content.services, i, -1))}
                    onDown={() => update("services", move(content.services, i, 1))}
                    onDelete={() => update("services", content.services.filter((x) => x.id !== s.id))}
                    deleteLabel={`¿Eliminar "${s.name || "servicio"}"?`}
                  >
                    <div className="grid gap-3 sm:grid-cols-6">
                      <Text className="sm:col-span-3" label="Nombre" value={s.name} onChange={(v) => set({ name: v })} />
                      <Text className="sm:col-span-3" label="Categoría" value={s.category} onChange={(v) => set({ category: v })} placeholder="Barbería" />
                      <Text className="sm:col-span-2" label="Precio (CLP)" value={String(s.price)} onChange={(v) => set({ price: Number(v.replace(/\D/g, "")) || 0 })} inputMode="numeric" />
                      <Text className="sm:col-span-2" label="Duración (min)" value={String(s.durationMin)} onChange={(v) => set({ durationMin: Number(v.replace(/\D/g, "")) || 0 })} inputMode="numeric" />
                      <div className="flex flex-wrap items-end gap-x-5 gap-y-2 pb-2 sm:col-span-2">
                        <Check label="Visible" checked={s.visible} onChange={(v) => set({ visible: v })} />
                        <Check label="Favorito" checked={s.featured} onChange={(v) => set({ featured: v })} />
                      </div>
                      <Area className="sm:col-span-6" label="Descripción" value={s.description} onChange={(v) => set({ description: v })} rows={2} />
                    </div>
                  </ItemCard>
                );
              })}
            </div>
            <AddButton
              label="Agregar servicio"
              onClick={() =>
                update("services", [
                  ...content.services,
                  { id: newId(), name: "", description: "", category: "Barbería", price: 0, durationMin: 30, featured: false, visible: true },
                ])
              }
            />
          </Section>
        )}

        {tab === "equipo" && (
          <Section title="Equipo" hint="Los barberos que aparecen en la web.">
            <div className="grid gap-3 md:grid-cols-2">
              {content.team.map((m, i) => {
                const set = (patch: Partial<typeof m>) => update("team", content.team.map((x) => (x.id === m.id ? { ...x, ...patch } : x)));
                return (
                  <ItemCard
                    key={m.id}
                    muted={!m.visible}
                    onUp={() => update("team", move(content.team, i, -1))}
                    onDown={() => update("team", move(content.team, i, 1))}
                    onDelete={() => update("team", content.team.filter((x) => x.id !== m.id))}
                    deleteLabel={`¿Quitar a ${m.name || "este profesional"}?`}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Text label="Nombre" value={m.name} onChange={(v) => set({ name: v })} />
                      <Text label="Rol" value={m.role} onChange={(v) => set({ role: v })} placeholder="Barbero" />
                      <div className="sm:col-span-2">
                        <ImageField label="Foto" value={m.photoUrl} onChange={(v) => set({ photoUrl: v })} canUpload={canUpload} compact />
                      </div>
                      <Check label="Visible en la web" checked={m.visible} onChange={(v) => set({ visible: v })} />
                    </div>
                  </ItemCard>
                );
              })}
            </div>
            <AddButton label="Agregar profesional" onClick={() => update("team", [...content.team, { id: newId(), name: "", role: "Barbero", photoUrl: "", visible: true }])} />
          </Section>
        )}

        {tab === "horarios" && (
          <Section title="Horario de atención" hint="La web muestra “Abierto ahora” según este horario (hora de Chile).">
            <div className="card divide-y divide-ink-900/6">
              {[1, 2, 3, 4, 5, 6, 0].map((d) => {
                const h = content.hours.find((x) => x.weekday === d)!;
                const set = (patch: Partial<typeof h>) => update("hours", content.hours.map((x) => (x.weekday === d ? { ...x, ...patch } : x)));
                return (
                  <div key={d} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4">
                    <label className="flex w-36 items-center gap-3 font-semibold">
                      <input type="checkbox" checked={h.isOpen} onChange={(e) => set({ isOpen: e.target.checked })} className="h-4 w-4 accent-emerald-700" />
                      {WEEKDAYS[d]}
                    </label>
                    {h.isOpen ? (
                      <div className="flex items-center gap-2">
                        <input type="time" value={h.open} onChange={(e) => set({ open: e.target.value })} className="ainput !w-32" aria-label={`Abre ${WEEKDAYS[d]}`} />
                        <span className="text-ink-500">a</span>
                        <input type="time" value={h.close} onChange={(e) => set({ close: e.target.value })} className="ainput !w-32" aria-label={`Cierra ${WEEKDAYS[d]}`} />
                      </div>
                    ) : (
                      <span className="text-sm text-ink-500">Cerrado</span>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {tab === "fotos" && (
          <Section title="Galería de trabajos" hint="Aparece en la web cuando hay al menos una foto.">
            <div className="grid gap-3 sm:grid-cols-2">
              {content.gallery.map((g, i) => {
                const set = (patch: Partial<typeof g>) => update("gallery", content.gallery.map((x) => (x.id === g.id ? { ...x, ...patch } : x)));
                return (
                  <ItemCard
                    key={g.id}
                    onUp={() => update("gallery", move(content.gallery, i, -1))}
                    onDown={() => update("gallery", move(content.gallery, i, 1))}
                    onDelete={() => update("gallery", content.gallery.filter((x) => x.id !== g.id))}
                    deleteLabel="¿Quitar esta foto?"
                  >
                    <ImageField label="Foto" value={g.url} onChange={(v) => set({ url: v })} canUpload={canUpload} />
                    <Text className="mt-3" label="Descripción" value={g.caption} onChange={(v) => set({ caption: v })} placeholder="Ej: Fade medio + barba" />
                  </ItemCard>
                );
              })}
            </div>
            <AddButton label="Agregar foto" onClick={() => update("gallery", [...content.gallery, { id: newId(), url: "", caption: "" }])} />
          </Section>
        )}

        {tab === "resenas" && (
          <Section title="Reseñas de clientes" hint="Copia reseñas reales (Google, AgendaPro, Instagram). Aparecen en la web si hay al menos una.">
            <div className="space-y-3">
              {content.reviews.map((r, i) => {
                const set = (patch: Partial<typeof r>) => update("reviews", content.reviews.map((x) => (x.id === r.id ? { ...x, ...patch } : x)));
                return (
                  <ItemCard
                    key={r.id}
                    onUp={() => update("reviews", move(content.reviews, i, -1))}
                    onDown={() => update("reviews", move(content.reviews, i, 1))}
                    onDelete={() => update("reviews", content.reviews.filter((x) => x.id !== r.id))}
                    deleteLabel="¿Eliminar esta reseña?"
                  >
                    <div className="grid gap-3 sm:grid-cols-[1fr_8rem]">
                      <Text label="Autor" value={r.author} onChange={(v) => set({ author: v })} />
                      <label>
                        <span className="alabel">Estrellas</span>
                        <select value={r.rating} onChange={(e) => set({ rating: Number(e.target.value) })} className="ainput">
                          {[5, 4, 3, 2, 1].map((n) => (
                            <option key={n} value={n}>
                              {"★".repeat(n)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <Area className="sm:col-span-2" label="Texto" value={r.text} onChange={(v) => set({ text: v })} rows={2} />
                    </div>
                  </ItemCard>
                );
              })}
            </div>
            <AddButton label="Agregar reseña" onClick={() => update("reviews", [...content.reviews, { id: newId(), author: "", text: "", rating: 5 }])} />
          </Section>
        )}
      </main>

      {/* Barra de guardado */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-900/10 bg-bone-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <p className="min-w-0 text-sm" role="status">
            {status.kind === "error" ? (
              <span className="text-crimson-700">{status.message}</span>
            ) : status.kind === "saved" && !dirty ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <IconCheck width={16} height={16} /> Guardado. Ya se ve en la web.
              </span>
            ) : dirty ? (
              <span className="font-medium text-gold-700">Tienes cambios sin guardar</span>
            ) : (
              <span className="text-ink-500">Sin cambios</span>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-2">
            {dirty && (
              <button type="button" onClick={() => { setContent(saved); setStatus({ kind: "idle" }); }} className="abtn-secondary hidden sm:inline-flex">
                Descartar
              </button>
            )}
            <button type="button" onClick={save} disabled={!dirty || pending || mode === "readonly"} className="abtn-primary !px-6">
              {pending ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Piezas del formulario ───────────── */

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="page-title">{title}</h1>
      {hint && <p className="mt-2 text-sm text-ink-500">{hint}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">{children}</div>;
}

type TextProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
};

function Text({ label, value, onChange, placeholder, className = "", inputMode }: TextProps) {
  return (
    <label className={`block ${className}`}>
      <span className="alabel">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} inputMode={inputMode} className="ainput" />
    </label>
  );
}

function Area({ label, value, onChange, rows = 4, wide, className = "" }: TextProps & { rows?: number; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""} ${className}`}>
      <span className="alabel">{label}</span>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="ainput" />
    </label>
  );
}

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-emerald-700" />
      {label}
    </label>
  );
}

function ItemCard(props: {
  children: React.ReactNode;
  muted?: boolean;
  onUp: () => void;
  onDown: () => void;
  onDelete: () => void;
  deleteLabel: string;
}) {
  return (
    <div className={`card p-4 sm:p-5 ${props.muted ? "opacity-60" : ""}`}>
      {props.children}
      <div className="mt-3 flex items-center justify-end gap-1 border-t border-ink-900/6 pt-3">
        <button type="button" onClick={props.onUp} className="abtn-secondary !p-2" aria-label="Subir">
          <IconArrowLeft width={14} height={14} className="rotate-90" />
        </button>
        <button type="button" onClick={props.onDown} className="abtn-secondary !p-2" aria-label="Bajar">
          <IconArrowRight width={14} height={14} className="rotate-90" />
        </button>
        <button type="button" onClick={() => confirm(props.deleteLabel) && props.onDelete()} className="abtn-danger !px-3 !py-2">
          <IconTrash width={14} height={14} /> Eliminar
        </button>
      </div>
    </div>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ink-900/15 py-4 text-sm font-semibold text-ink-600 transition hover:border-emerald-600 hover:text-emerald-700"
    >
      <IconPlus width={16} height={16} /> {label}
    </button>
  );
}

function ImageField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  canUpload: boolean;
  hint?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const safe = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").slice(-60);
      const blob = await upload(`uploads/${safe}`, file, { access: "public", handleUploadUrl: "/api/admin/upload" });
      props.onChange(blob.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <span className="alabel">{props.label}</span>
      <div className="flex items-start gap-3">
        <div className={`grid shrink-0 place-items-center overflow-hidden rounded-xl bg-bone-200 text-ink-500 ring-1 ring-ink-900/8 ${props.compact ? "h-16 w-16" : "h-24 w-24"}`}>
          {props.value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={props.value} alt="" className="h-full w-full object-cover" />
          ) : (
            <IconImage />
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          {props.canUpload && (
            <>
              <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading} className="abtn-secondary !py-2">
                  {uploading ? "Subiendo…" : props.value ? "Cambiar foto" : "Subir foto"}
                </button>
                {props.value && (
                  <button type="button" onClick={() => props.onChange("")} className="abtn-danger !py-2">
                    Quitar
                  </button>
                )}
              </div>
            </>
          )}
          <input
            value={props.value}
            onChange={(e) => props.onChange(e.target.value)}
            placeholder={props.canUpload ? "…o pega un enlace https://" : "Pega un enlace a la imagen (https://…)"}
            className="ainput !py-2 text-xs"
            aria-label={`${props.label}: enlace`}
          />
          {(error || props.hint) && <p className={`text-xs ${error ? "text-crimson-700" : "text-ink-500"}`}>{error ?? props.hint}</p>}
        </div>
      </div>
    </div>
  );
}
