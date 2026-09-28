import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Barber } from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { IconPlus } from "@/components/icons";
import { deleteBarber, saveBarber } from "../../actions";
import { initials } from "@/lib/format";

export default async function EquipoPage() {
  const barbers = await db.select().from(schema.barbers).orderBy(asc(schema.barbers.sortOrder), asc(schema.barbers.id));
  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow text-emerald-700">Profesionales</p>
      <h1 className="page-title mt-2">Equipo</h1>
      <p className="mt-2 text-sm text-ink-500">Cada profesional activo tiene su propia agenda. Para la foto, pega un enlace de imagen (https://…).</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {barbers.map((b) => (
          <div key={b.id} className="card p-5">
            <div className="flex items-center gap-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-b from-emerald-700 to-emerald-900 font-display text-xl italic text-gold-300">
                {b.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.photoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  initials(b.name)
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl">{b.name}</p>
                <p className="text-sm text-ink-500">{b.role}</p>
              </div>
              {!b.active && <span className="rounded-full bg-ink-500/10 px-2.5 py-1 text-xs font-semibold text-ink-500">Inactivo</span>}
            </div>
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-700">Editar</summary>
              <div className="mt-4">
                <BarberForm barber={b} />
                <form action={deleteBarber} className="mt-2 flex justify-end">
                  <input type="hidden" name="id" value={b.id} />
                  <ConfirmButton message={`¿Eliminar a ${b.name}? Sus reservas quedarán sin asignar.`}>Eliminar</ConfirmButton>
                </form>
              </div>
            </details>
          </div>
        ))}
      </div>

      <section className="card mt-8 p-6">
        <h2 className="flex items-center gap-2 font-display text-2xl">
          <IconPlus /> Agregar profesional
        </h2>
        <div className="mt-5">
          <BarberForm />
        </div>
      </section>
    </div>
  );
}

function BarberForm({ barber }: { barber?: Barber }) {
  return (
    <form action={saveBarber} className="grid gap-3 sm:grid-cols-2">
      {barber && <input type="hidden" name="id" value={barber.id} />}
      <label>
        <span className="alabel">Nombre</span>
        <input name="name" required defaultValue={barber?.name} className="ainput" />
      </label>
      <label>
        <span className="alabel">Rol</span>
        <input name="role" defaultValue={barber?.role ?? "Barbero"} className="ainput" />
      </label>
      <label className="sm:col-span-2">
        <span className="alabel">Foto (URL)</span>
        <input name="photoUrl" type="url" defaultValue={barber?.photoUrl} className="ainput" placeholder="https://…" />
      </label>
      <label>
        <span className="alabel">Instagram</span>
        <input name="instagram" defaultValue={barber?.instagram} className="ainput" placeholder="@usuario" />
      </label>
      <label>
        <span className="alabel">Orden</span>
        <input name="sortOrder" type="number" defaultValue={barber?.sortOrder ?? 0} className="ainput" />
      </label>
      <label className="sm:col-span-2">
        <span className="alabel">Bio corta</span>
        <textarea name="bio" rows={2} defaultValue={barber?.bio} className="ainput" />
      </label>
      <div className="flex items-center justify-between sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={barber?.active ?? true} className="h-4 w-4 accent-emerald-700" /> Activo (recibe reservas)
        </label>
        <SubmitButton>{barber ? "Guardar" : "Agregar"}</SubmitButton>
      </div>
    </form>
  );
}
