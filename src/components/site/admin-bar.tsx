import Link from "next/link";
import { IconLogout, IconSettings } from "@/components/icons";
import { logout } from "@/app/admin/actions";

/** Barra superior visible solo cuando el administrador tiene la sesión iniciada. */
export function AdminBar() {
  return (
    <div className="fixed inset-x-0 top-0 z-[60] flex h-10 items-center justify-between gap-3 bg-gold-400 px-4 text-xs font-semibold text-ink-900 sm:px-6">
      <span className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-700" />
        Modo administrador
      </span>
      <div className="flex items-center gap-2">
        <Link href="/admin" className="flex items-center gap-1.5 rounded-full bg-ink-900 px-3 py-1.5 text-bone-50 hover:bg-emerald-800">
          <IconSettings width={14} height={14} /> Editar web
        </Link>
        <form action={logout}>
          <button type="submit" className="flex items-center gap-1.5 rounded-full px-3 py-1.5 hover:bg-ink-900/10">
            <IconLogout width={14} height={14} /> Salir
          </button>
        </form>
      </div>
    </div>
  );
}
