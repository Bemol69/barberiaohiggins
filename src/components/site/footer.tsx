import Link from "next/link";
import type { Settings } from "@/db/schema";
import { BrandMark } from "@/components/crest";
import { IconFacebook, IconInstagram, IconWhatsapp } from "@/components/icons";
import { formatPhone, whatsappLink } from "@/lib/format";

export function SiteFooter({ settings }: { settings: Settings }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative overflow-hidden border-t border-bone-100/8 bg-ink-950">
      <div className="pole-stripe h-1.5 w-full opacity-90" />
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark logoUrl={settings.logoUrl} className="h-12 w-12" />
            <span className="font-display text-2xl text-bone-50">{settings.name}</span>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-bone-400">{settings.tagline}</p>
          <div className="mt-6 flex gap-3">
            {settings.instagram && (
              <a
                href={`https://instagram.com/${settings.instagram}`}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="grid h-11 w-11 place-items-center rounded-full border border-bone-100/12 text-bone-200 transition hover:border-gold-400 hover:text-gold-300"
              >
                <IconInstagram />
              </a>
            )}
            {settings.facebook && (
              <a
                href={settings.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Facebook"
                className="grid h-11 w-11 place-items-center rounded-full border border-bone-100/12 text-bone-200 transition hover:border-gold-400 hover:text-gold-300"
              >
                <IconFacebook />
              </a>
            )}
            <a
              href={whatsappLink(settings.whatsapp)}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="grid h-11 w-11 place-items-center rounded-full border border-bone-100/12 text-bone-200 transition hover:border-gold-400 hover:text-gold-300"
            >
              <IconWhatsapp />
            </a>
          </div>
        </div>

        <div>
          <p className="eyebrow text-gold-400">Visítanos</p>
          <p className="mt-4 text-bone-200">{settings.address}</p>
          <p className="text-bone-400">{settings.city}</p>
          <a href={whatsappLink(settings.whatsapp)} className="mt-4 block text-bone-200 hover:text-gold-300">
            {formatPhone(settings.whatsapp)}
          </a>
        </div>

        <div>
          <p className="eyebrow text-gold-400">Explora</p>
          <ul className="mt-4 space-y-2 text-bone-300">
            <li><Link className="hover:text-gold-300" href="/#servicios">Servicios y precios</Link></li>
            <li><Link className="hover:text-gold-300" href="/#equipo">Nuestro equipo</Link></li>
            <li><Link className="hover:text-gold-300" href="/reservar">Reservar hora</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-bone-100/6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 text-xs text-bone-500 sm:flex-row sm:px-8">
          <p>© {year} {settings.name}. Todos los derechos reservados.</p>
          <Link href="/admin" className="hover:text-bone-300">Acceso equipo</Link>
        </div>
      </div>
    </footer>
  );
}
