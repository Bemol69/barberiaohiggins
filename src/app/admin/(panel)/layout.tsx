import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Crest } from "@/components/crest";
import { MobileNav, NavLink } from "@/components/admin/ui";
import {
  IconCalendar,
  IconChart,
  IconClock,
  IconExternal,
  IconImage,
  IconLogout,
  IconScissors,
  IconSettings,
  IconStar,
  IconUsers,
} from "@/components/icons";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../auth-actions";

export const metadata: Metadata = { title: "Panel", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Resumen", icon: IconChart, exact: true },
  { href: "/admin/reservas", label: "Reservas", icon: IconCalendar },
  { href: "/admin/servicios", label: "Servicios", icon: IconScissors },
  { href: "/admin/equipo", label: "Equipo", icon: IconUsers },
  { href: "/admin/horarios", label: "Horarios", icon: IconClock },
  { href: "/admin/galeria", label: "Galería", icon: IconImage },
  { href: "/admin/resenas", label: "Reseñas", icon: IconStar },
  { href: "/admin/ajustes", label: "Ajustes", icon: IconSettings },
];

function Links() {
  return (
    <>
      {NAV.map(({ href, label, icon: Icon, exact }) => (
        <NavLink key={href} href={href} exact={exact}>
          <Icon width={18} height={18} /> {label}
        </NavLink>
      ))}
    </>
  );
}

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await connection();
  await requireAdmin();

  return (
    <div className="admin min-h-[100svh] lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="relative z-30 bg-ink-900">
        <div className="flex flex-col lg:sticky lg:top-0 lg:h-[100svh]">
          <div className="flex items-center justify-between gap-3 px-5 py-5 lg:py-7">
            <Link href="/admin" className="flex items-center gap-3">
              <Crest className="h-10 w-10" />
              <span className="leading-tight">
                <span className="block font-display text-lg text-bone-50">O&apos;Higgins</span>
                <span className="eyebrow text-[0.55rem] text-gold-400">Panel de gestión</span>
              </span>
            </Link>
            <MobileNav>
              <Links />
            </MobileNav>
          </div>
          <nav className="hidden flex-1 space-y-1 px-3 lg:block" aria-label="Panel">
            <Links />
          </nav>
          <div className="hidden space-y-1 border-t border-bone-100/8 p-3 lg:block">
            <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-bone-400 hover:text-bone-50">
              <IconExternal width={18} height={18} /> Ver sitio
            </Link>
            <form action={logout}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-bone-400 hover:text-bone-50">
                <IconLogout width={18} height={18} /> Cerrar sesión
              </button>
            </form>
          </div>
        </div>
        <div className="pole-stripe absolute inset-x-0 bottom-0 h-1 lg:hidden" />
      </aside>
      <div className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</div>
    </div>
  );
}
