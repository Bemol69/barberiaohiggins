import { SubmitButton } from "@/components/admin/ui";
import { getSettings } from "@/lib/data";
import { saveSettings } from "../../actions";

export default async function AjustesPage({ searchParams }: PageProps<"/admin/ajustes">) {
  const sp = await searchParams;
  const s = await getSettings();

  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow text-emerald-700">Negocio</p>
      <h1 className="page-title mt-2">Ajustes</h1>
      {sp.ok && <p className="mt-6 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">Cambios guardados ✓</p>}

      <form action={saveSettings} className="mt-8 space-y-6">
        <Section title="Identidad">
          <Field label="Nombre del negocio" name="name" defaultValue={s.name} required />
          <Field label="Frase corta" name="tagline" defaultValue={s.tagline} />
          <label className="sm:col-span-2">
            <span className="alabel">Descripción (sección “Nosotros”)</span>
            <textarea name="description" rows={4} defaultValue={s.description} className="ainput" />
          </label>
          <Field label="Logo (URL de imagen)" name="logoUrl" type="url" defaultValue={s.logoUrl} placeholder="https://… (vacío = emblema por defecto)" />
          <Field label="Foto principal (URL)" name="heroImageUrl" type="url" defaultValue={s.heroImageUrl} placeholder="https://…" />
        </Section>

        <Section title="Contacto y ubicación">
          <Field label="Dirección" name="address" defaultValue={s.address} required />
          <Field label="Ciudad" name="city" defaultValue={s.city} />
          <Field label="WhatsApp (con código país)" name="whatsapp" defaultValue={s.whatsapp} placeholder="56912345678" required />
          <Field label="Correo" name="email" type="email" defaultValue={s.email} />
          <Field label="Instagram" name="instagram" defaultValue={s.instagram} placeholder="barberiaohiggins" />
          <Field label="Facebook (URL)" name="facebook" type="url" defaultValue={s.facebook} />
        </Section>

        <Section title="Reputación y agenda">
          <Field label="Calificación (ej 4.9)" name="rating" defaultValue={s.rating} />
          <Field label="Cantidad de reseñas" name="reviewsCount" type="number" defaultValue={String(s.reviewsCount)} />
          <label>
            <span className="alabel">Intervalo entre horarios</span>
            <select name="slotMinutes" defaultValue={s.slotMinutes} className="ainput">
              {[10, 15, 20, 30, 45, 60].map((m) => <option key={m} value={m}>Cada {m} min</option>)}
            </select>
          </label>
        </Section>

        <div className="flex justify-end">
          <SubmitButton className="!px-6">Guardar ajustes</SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Field(props: { label: string; name: string; defaultValue?: string; type?: string; placeholder?: string; required?: boolean }) {
  return (
    <label>
      <span className="alabel">{props.label}</span>
      <input name={props.name} type={props.type ?? "text"} defaultValue={props.defaultValue} placeholder={props.placeholder} required={props.required} className="ainput" />
    </label>
  );
}
