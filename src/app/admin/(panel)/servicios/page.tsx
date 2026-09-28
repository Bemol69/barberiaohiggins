import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Service } from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { IconPlus } from "@/components/icons";
import { deleteService, saveService } from "../../actions";
import { formatCLP, formatDuration } from "@/lib/format";

export default async function ServiciosPage() {
  const services = await db.select().from(schema.services).orderBy(asc(schema.services.sortOrder), asc(schema.services.id));
  const categories = Array.from(new Set(["Barbería", "Otros", ...services.map((s) => s.category)]));

  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow text-emerald-700">Carta</p>
      <h1 className="page-title mt-2">Servicios</h1>
      <p className="mt-2 text-sm text-ink-500">Precios en pesos chilenos, sin puntos. Los cambios se ven al instante en la web.</p>

      <datalist id="categories">
        {categories.map((c) => <option key={c} value={c} />)}
      </datalist>

      <ul className="mt-8 space-y-3">
        {services.map((s) => (
          <li key={s.id} className="card overflow-hidden">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.active ? "bg-emerald-500" : "bg-ink-500/30"}`} title={s.active ? "Visible" : "Oculto"} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {s.name} {s.featured && <span className="ml-1 text-xs text-gold-600">★ Favorito</span>}
                  </p>
                  <p className="text-xs text-ink-500">
                    {s.category} · {formatDuration(s.durationMin)}
                  </p>
                </div>
                <span className="font-display text-xl tabular-nums">{formatCLP(s.price)}</span>
                <span className="text-sm font-semibold text-emerald-700 group-open:hidden">Editar</span>
                <span className="hidden text-sm font-semibold text-ink-500 group-open:inline">Cerrar</span>
              </summary>
              <div className="border-t border-ink-900/6 bg-bone-100/50 p-5">
                <ServiceForm service={s} />
                <form action={deleteService} className="mt-3 flex justify-end">
                  <input type="hidden" name="id" value={s.id} />
                  <ConfirmButton message={`¿Eliminar "${s.name}"? Las reservas existentes se mantienen.`}>Eliminar servicio</ConfirmButton>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>

      <section className="card mt-8 p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <IconPlus /> Nuevo servicio
        </h2>
        <div className="mt-5">
          <ServiceForm />
        </div>
      </section>
    </div>
  );
}

function ServiceForm({ service }: { service?: Service }) {
  return (
    <form action={saveService} className="grid gap-4 sm:grid-cols-6">
      {service && <input type="hidden" name="id" value={service.id} />}
      <label className="sm:col-span-3">
        <span className="alabel">Nombre</span>
        <input name="name" required defaultValue={service?.name} className="ainput" placeholder="Ej: Corte + Barba" />
      </label>
      <label className="sm:col-span-3">
        <span className="alabel">Categoría</span>
        <input name="category" list="categories" defaultValue={service?.category ?? "Barbería"} className="ainput" />
      </label>
      <label className="sm:col-span-2">
        <span className="alabel">Precio (CLP)</span>
        <input name="price" type="number" min={0} step={10} required defaultValue={service?.price} className="ainput" placeholder="13000" />
      </label>
      <label className="sm:col-span-2">
        <span className="alabel">Duración (min)</span>
        <input name="durationMin" type="number" min={5} step={5} required defaultValue={service?.durationMin ?? 45} className="ainput" />
      </label>
      <label className="sm:col-span-2">
        <span className="alabel">Orden</span>
        <input name="sortOrder" type="number" defaultValue={service?.sortOrder ?? 0} className="ainput" />
      </label>
      <label className="sm:col-span-6">
        <span className="alabel">Descripción</span>
        <textarea name="description" rows={2} defaultValue={service?.description} className="ainput" />
      </label>
      <div className="flex flex-wrap items-center gap-6 sm:col-span-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={service?.active ?? true} className="h-4 w-4 accent-emerald-700" /> Visible en la web
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={service?.featured ?? false} className="h-4 w-4 accent-emerald-700" /> Destacar como favorito
        </label>
        <SubmitButton className="ml-auto">{service ? "Guardar cambios" : "Crear servicio"}</SubmitButton>
      </div>
    </form>
  );
}
