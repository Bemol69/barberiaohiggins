import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { IconTrash } from "@/components/icons";
import { addGalleryItem, deleteGalleryItem } from "../../actions";

export default async function GaleriaPage() {
  const items = await db.select().from(schema.gallery).orderBy(asc(schema.gallery.sortOrder), asc(schema.gallery.id));
  return (
    <div className="mx-auto max-w-5xl">
      <p className="eyebrow text-emerald-700">Portafolio</p>
      <h1 className="page-title mt-2">Galería</h1>
      <p className="mt-2 text-sm text-ink-500">
        Agrega fotos de cortes con un enlace directo a la imagen. La sección aparece en la web cuando hay al menos una foto.
      </p>

      <form action={addGalleryItem} className="card mt-8 grid gap-3 p-5 sm:grid-cols-[1fr_14rem_6rem_auto] sm:items-end">
        <label>
          <span className="alabel">URL de la imagen</span>
          <input name="url" type="url" required className="ainput" placeholder="https://…/foto.jpg" />
        </label>
        <label>
          <span className="alabel">Descripción</span>
          <input name="caption" className="ainput" placeholder="Ej: Fade medio + barba" />
        </label>
        <label>
          <span className="alabel">Orden</span>
          <input name="sortOrder" type="number" defaultValue={0} className="ainput" />
        </label>
        <SubmitButton>Agregar</SubmitButton>
      </form>

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-ink-900/15 p-12 text-center text-sm text-ink-500">Aún no hay fotos.</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((g) => (
            <figure key={g.id} className="card group relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.url} alt={g.caption} className="aspect-square w-full object-cover" />
              <figcaption className="flex items-center justify-between gap-2 p-3 text-xs text-ink-600">
                <span className="truncate">{g.caption || "Sin descripción"}</span>
                <form action={deleteGalleryItem}>
                  <input type="hidden" name="id" value={g.id} />
                  <ConfirmButton message="¿Quitar esta foto?" className="abtn-danger !p-1.5">
                    <IconTrash width={14} height={14} />
                  </ConfirmButton>
                </form>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
