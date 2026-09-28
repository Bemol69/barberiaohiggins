import { db, schema } from "@/db";
import { SubmitButton } from "@/components/admin/ui";
import { saveHours } from "../../actions";
import { WEEKDAYS } from "@/lib/time";

export default async function HorariosPage({ searchParams }: PageProps<"/admin/horarios">) {
  const sp = await searchParams;
  const rows = await db.select().from(schema.hours);
  const byDay = new Map(rows.map((r) => [r.weekday, r]));
  const order = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="mx-auto max-w-3xl">
      <p className="eyebrow text-emerald-700">Atención</p>
      <h1 className="page-title mt-2">Horarios</h1>
      <p className="mt-2 text-sm text-ink-500">Define cuándo se pueden tomar reservas online. La web muestra “Abierto ahora” según este horario.</p>

      {sp.ok && <p className="mt-6 rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">Horario guardado ✓</p>}

      <form action={saveHours} className="card mt-8 divide-y divide-ink-900/6">
        {order.map((d) => {
          const h = byDay.get(d);
          return (
            <div key={d} className="flex flex-wrap items-center gap-4 px-6 py-4">
              <label className="flex w-40 items-center gap-3 font-semibold">
                <input type="checkbox" name={`isOpen_${d}`} defaultChecked={h?.isOpen ?? false} className="h-4 w-4 accent-emerald-700" />
                {WEEKDAYS[d]}
              </label>
              <div className="flex items-center gap-2">
                <input type="time" name={`open_${d}`} defaultValue={h?.openTime ?? "10:00"} required className="ainput !w-32" aria-label={`Apertura ${WEEKDAYS[d]}`} />
                <span className="text-ink-500">a</span>
                <input type="time" name={`close_${d}`} defaultValue={h?.closeTime ?? "20:00"} required className="ainput !w-32" aria-label={`Cierre ${WEEKDAYS[d]}`} />
              </div>
            </div>
          );
        })}
        <div className="flex justify-end px-6 py-4">
          <SubmitButton>Guardar horario</SubmitButton>
        </div>
      </form>
    </div>
  );
}
