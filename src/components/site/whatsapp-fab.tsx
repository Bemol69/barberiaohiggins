import { IconWhatsapp } from "@/components/icons";
import { whatsappLink } from "@/lib/format";

export function WhatsappFab({ phone }: { phone: string }) {
  return (
    <a
      href={whatsappLink(phone, "Hola! Quisiera hacer una consulta 💈")}
      target="_blank"
      rel="noreferrer"
      aria-label="Escríbenos por WhatsApp"
      className="group fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-emerald-500 p-4 text-white shadow-[0_18px_40px_-12px_rgba(28,134,96,0.8)] ring-1 ring-white/10 transition hover:bg-emerald-400 sm:bottom-7 sm:right-7"
    >
      <IconWhatsapp width={24} height={24} />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-all duration-500 group-hover:max-w-40 sm:inline">
        Escríbenos
      </span>
    </a>
  );
}
