import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Review } from "@/db/schema";
import { ConfirmButton, SubmitButton } from "@/components/admin/ui";
import { IconStar } from "@/components/icons";
import { deleteReview, saveReview } from "../../actions";

export default async function ResenasPage() {
  const reviews = await db.select().from(schema.reviews).orderBy(desc(schema.reviews.id));
  return (
    <div className="mx-auto max-w-4xl">
      <p className="eyebrow text-emerald-700">Testimonios</p>
      <h1 className="page-title mt-2">Reseñas</h1>
      <p className="mt-2 text-sm text-ink-500">
        Copia aquí reseñas reales de tus clientes (Google, AgendaPro, Instagram). Se muestran en la web las que estén visibles.
      </p>

      <section className="card mt-8 p-6">
        <h2 className="font-display text-2xl">Nueva reseña</h2>
        <div className="mt-4">
          <ReviewForm />
        </div>
      </section>

      <ul className="mt-6 space-y-3">
        {reviews.map((r) => (
          <li key={r.id} className="card p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {r.author} {!r.active && <span className="ml-2 text-xs font-normal text-ink-500">(oculta)</span>}
              </p>
              <span className="flex text-gold-500">
                {Array.from({ length: r.rating }).map((_, i) => <IconStar key={i} width={14} height={14} />)}
              </span>
            </div>
            <p className="mt-2 text-sm text-ink-600">“{r.text}”</p>
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-semibold text-emerald-700">Editar</summary>
              <div className="mt-3">
                <ReviewForm review={r} />
                <form action={deleteReview} className="mt-2 flex justify-end">
                  <input type="hidden" name="id" value={r.id} />
                  <ConfirmButton message="¿Eliminar esta reseña?">Eliminar</ConfirmButton>
                </form>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReviewForm({ review }: { review?: Review }) {
  return (
    <form action={saveReview} className="grid gap-3 sm:grid-cols-[1fr_8rem]">
      {review && <input type="hidden" name="id" value={review.id} />}
      <label>
        <span className="alabel">Autor</span>
        <input name="author" required defaultValue={review?.author} className="ainput" placeholder="Nombre del cliente" />
      </label>
      <label>
        <span className="alabel">Estrellas</span>
        <select name="rating" defaultValue={review?.rating ?? 5} className="ainput">
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>
      <label className="sm:col-span-2">
        <span className="alabel">Texto</span>
        <textarea name="text" required rows={3} defaultValue={review?.text} className="ainput" />
      </label>
      <div className="flex items-center justify-between sm:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={review?.active ?? true} className="h-4 w-4 accent-emerald-700" /> Visible en la web
        </label>
        <SubmitButton>{review ? "Guardar" : "Publicar"}</SubmitButton>
      </div>
    </form>
  );
}
