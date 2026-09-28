export function formatCLP(value: number): string {
  return "$" + new Intl.NumberFormat("es-CL").format(value);
}

export function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function whatsappLink(phone: string, text?: string): string {
  const digits = phone.replace(/\D/g, "");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

export function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("569")) return `+56 9 ${d.slice(3, 7)} ${d.slice(7)}`;
  return phone;
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/** Destino de los botones "Reservar": link externo si está configurado, si no WhatsApp con mensaje. */
export function bookingHref(business: { bookingUrl: string; whatsapp: string }, detail?: string): string {
  if (business.bookingUrl) return business.bookingUrl;
  return whatsappLink(
    business.whatsapp,
    `Hola! Quiero reservar una hora${detail ? ` ${detail}` : ""} 💈`,
  );
}
