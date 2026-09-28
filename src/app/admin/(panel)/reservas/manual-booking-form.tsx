"use client";

import { useActionState, useEffect, useRef } from "react";
import { createManualBooking, type ManualBookingState } from "../../actions";

type Props = {
  date: string;
  services: { id: number; name: string; durationMin: number }[];
  barbers: { id: number; name: string }[];
};

export function ManualBookingForm({ date, services, barbers }: Props) {
  const [state, action, pending] = useActionState<ManualBookingState, FormData>(createManualBooking, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-1" key={date}>
      <label className="block">
        <span className="alabel">Servicio</span>
        <select name="serviceId" required className="ainput">
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.durationMin} min)
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="alabel">Profesional</span>
        <select name="barberId" className="ainput">
          <option value="">Sin asignar</option>
          {barbers.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="alabel">Fecha</span>
          <input type="date" name="date" defaultValue={date} required className="ainput" />
        </label>
        <label className="block">
          <span className="alabel">Hora</span>
          <input type="time" name="time" step={300} required className="ainput" />
        </label>
      </div>
      <label className="block">
        <span className="alabel">Cliente</span>
        <input name="name" required className="ainput" placeholder="Nombre" />
      </label>
      <label className="block">
        <span className="alabel">Teléfono</span>
        <input name="phone" type="tel" className="ainput" placeholder="+56 9…" />
      </label>
      <label className="block">
        <span className="alabel">Nota</span>
        <input name="notes" className="ainput" />
      </label>
      <label className="flex items-center gap-2 text-sm text-ink-600 md:col-span-2 2xl:col-span-1">
        <input type="checkbox" name="force" className="accent-emerald-700" /> Forzar aunque se cruce
      </label>
      {state.error && <p className="md:col-span-2 2xl:col-span-1 rounded-lg bg-crimson-500/8 px-3 py-2 text-sm text-crimson-700">{state.error}</p>}
      {state.ok && <p className="md:col-span-2 2xl:col-span-1 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">Reserva guardada ✓</p>}
      <button type="submit" disabled={pending} className="abtn-primary w-full md:col-span-2 2xl:col-span-1">
        {pending ? "Guardando…" : "Agregar reserva"}
      </button>
    </form>
  );
}
