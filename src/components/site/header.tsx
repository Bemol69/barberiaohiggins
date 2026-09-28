"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/crest";
import { IconMenu, IconX } from "@/components/icons";

const NAV = [
  { href: "/#servicios", label: "Servicios" },
  { href: "/#equipo", label: "Equipo" },
  { href: "/#nosotros", label: "Nosotros" },
  { href: "/#ubicacion", label: "Ubicación" },
];

export function SiteHeader({ name, logoUrl }: { name: string; logoUrl: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-500 ${
        scrolled || open
          ? "border-b border-bone-100/8 bg-ink-900/85 backdrop-blur-xl"
          : "border-b border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-3" onClick={() => setOpen(false)}>
          <BrandMark logoUrl={logoUrl} className="h-10 w-10 transition-transform duration-500 group-hover:rotate-[-6deg]" />
          <span className="flex flex-col leading-none">
            <span className="font-display text-lg font-semibold tracking-tight text-bone-50">{name}</span>
            <span className="eyebrow mt-1 text-[0.58rem] text-gold-400">Barbería · Rancagua</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-9 md:flex" aria-label="Principal">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative text-sm text-bone-200 transition hover:text-bone-50 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold-400 after:transition-all after:duration-300 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
          <Link href="/reservar" className="btn-gold !px-5 !py-2.5">
            Reservar hora
          </Link>
        </nav>

        <button
          type="button"
          className="grid h-11 w-11 place-items-center rounded-full border border-bone-100/15 text-bone-100 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
        >
          {open ? <IconX /> : <IconMenu />}
        </button>
      </div>

      {open && (
        <nav className="h-[calc(100dvh-4.5rem)] border-t border-bone-100/8 px-5 pb-10 pt-6 md:hidden" aria-label="Móvil">
          <ul className="flex flex-col">
            {NAV.map((item, i) => (
              <li key={item.href} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between border-b border-bone-100/8 py-5 font-display text-3xl text-bone-50"
                >
                  {item.label}
                  <span className="text-sm text-gold-400">0{i + 1}</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/reservar" onClick={() => setOpen(false)} className="btn-gold mt-8 w-full !py-4">
            Reservar hora
          </Link>
        </nav>
      )}
    </header>
  );
}
