"use client";

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto mt-10 max-w-lg p-8">
      <p className="eyebrow text-crimson-600">Algo salió mal</p>
      <h1 className="mt-2 font-display text-3xl">No pudimos guardar los cambios</h1>
      <p className="mt-3 text-sm text-ink-500">Revisa que los campos tengan el formato correcto (URLs con https://, números sin puntos, etc.).</p>
      {error.message && <pre className="mt-4 overflow-auto rounded-xl bg-bone-100 p-3 text-xs text-ink-600">{error.message.slice(0, 400)}</pre>}
      <button onClick={reset} className="abtn-primary mt-6">Volver a intentar</button>
    </div>
  );
}
