/**
 * URL pública del sitio. Tolera variables vacías o sin protocolo
 * (ej: "barberiaohiggins.cl") y en Vercel usa el dominio del proyecto.
 */
export function getSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];
  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    try {
      return new URL(withProtocol).origin;
    } catch {
      // valor inválido: probar el siguiente
    }
  }
  return "http://localhost:3000";
}
