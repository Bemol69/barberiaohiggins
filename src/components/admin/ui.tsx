"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { bookingStatuses, type BookingStatus } from "@/db/schema";
import { setBookingStatus } from "@/app/admin/actions";

export function SubmitButton({ children, className = "", pendingText = "Guardando…" }: { children: React.ReactNode; className?: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`abtn-primary ${className}`}>
      {pending ? pendingText : children}
    </button>
  );
}

export function ConfirmButton({ children, message, className = "" }: { children: React.ReactNode; message: string; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className || "abtn-danger"}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export const STATUS_LABEL: Record<BookingStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  completada: "Completada",
  cancelada: "Cancelada",
  no_asistio: "No asistió",
};

export const STATUS_STYLE: Record<BookingStatus, string> = {
  pendiente: "bg-gold-200/60 text-gold-700 ring-gold-400/40",
  confirmada: "bg-royal-500/10 text-royal-700 ring-royal-500/25",
  completada: "bg-emerald-500/12 text-emerald-700 ring-emerald-500/30",
  cancelada: "bg-ink-500/10 text-ink-500 ring-ink-500/20 line-through",
  no_asistio: "bg-crimson-500/10 text-crimson-700 ring-crimson-500/25",
};

export function StatusSelect({ id, status }: { id: number; status: BookingStatus }) {
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Estado de la reserva"
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value as BookingStatus;
        setValue(next);
        start(() => setBookingStatus(id, next));
      }}
      className={`cursor-pointer appearance-none rounded-full px-3 py-1 text-xs font-semibold ring-1 transition disabled:opacity-60 ${STATUS_STYLE[value]}`}
    >
      {bookingStatuses.map((s) => (
        <option key={s} value={s}>
          {STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function NavLink({ href, children, exact = false }: { href: string; children: React.ReactNode; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
        active ? "bg-gold-400 text-ink-900 shadow-[0_8px_24px_-12px_rgba(212,173,90,0.9)]" : "text-bone-300 hover:bg-bone-100/6 hover:text-bone-50"
      }`}
    >
      {children}
    </Link>
  );
}

export function MobileNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [last, setLast] = useState(pathname);
  if (last !== pathname) {
    setLast(pathname);
    setOpen(false);
  }
  return (
    <div className="lg:hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg border border-bone-100/15 px-3 py-1.5 text-sm text-bone-100" aria-expanded={open}>
        {open ? "Cerrar" : "Menú"}
      </button>
      {open && <div className="absolute inset-x-0 top-full z-40 space-y-1 border-b border-bone-100/10 bg-ink-900 p-4">{children}</div>}
    </div>
  );
}
