/**
 * Emblema vectorial de respaldo inspirado en el escudo de la barbería
 * (medallón verde, orla dorada, poste azul/rojo). Si se sube un logo en
 * Ajustes, el sitio usa esa imagen en su lugar.
 */
export function Crest({ className = "", title = "Barbería O'Higgins" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id="crest-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f0dcaa" />
          <stop offset=".5" stopColor="#d4ad5a" />
          <stop offset="1" stopColor="#8a6a24" />
        </linearGradient>
        <radialGradient id="crest-green" cx=".5" cy=".4" r=".7">
          <stop offset="0" stopColor="#1c8660" />
          <stop offset="1" stopColor="#072519" />
        </radialGradient>
        <pattern id="crest-pole" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(40)">
          <rect width="8" height="8" fill="#fbf8f2" />
          <rect width="2.5" height="8" fill="#b3261e" />
          <rect x="4" width="2.5" height="8" fill="#22449b" />
        </pattern>
      </defs>
      {/* postes laterales */}
      <rect x="6" y="30" width="9" height="56" rx="4.5" fill="url(#crest-pole)" stroke="url(#crest-gold)" strokeWidth="1.5" />
      <rect x="105" y="30" width="9" height="56" rx="4.5" fill="url(#crest-pole)" stroke="url(#crest-gold)" strokeWidth="1.5" />
      {/* medallón */}
      <circle cx="60" cy="56" r="42" fill="#0b0e0d" stroke="url(#crest-gold)" strokeWidth="3" />
      <circle cx="60" cy="56" r="35" fill="url(#crest-green)" stroke="url(#crest-gold)" strokeWidth="1" />
      {/* rayos */}
      <g stroke="#3fa87f" strokeOpacity=".35" strokeWidth="1">
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * Math.PI * 2) / 24;
          return (
            <line key={i} x1={60 + Math.cos(a) * 10} y1={56 + Math.sin(a) * 10} x2={60 + Math.cos(a) * 34} y2={56 + Math.sin(a) * 34} />
          );
        })}
      </g>
      {/* tijeras cruzadas */}
      <g stroke="url(#crest-gold)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M44 72 76 40" />
        <path d="M76 72 44 40" />
      </g>
      <g fill="#0b0e0d" stroke="url(#crest-gold)" strokeWidth="2.2">
        <circle cx="41" cy="75" r="5.5" />
        <circle cx="79" cy="75" r="5.5" />
      </g>
      <circle cx="60" cy="56" r="3" fill="url(#crest-gold)" />
      {/* cinta */}
      <path d="M14 92c14 8 30 12 46 12s32-4 46-12l-4 16c-13 6-27 9-42 9s-29-3-42-9l-4-16Z" fill="#1a3478" stroke="url(#crest-gold)" strokeWidth="2" />
      <text x="60" y="110" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700" fontSize="10.5" fill="#fbf8f2" letterSpacing="1">
        O&apos;HIGGINS
      </text>
      {/* estrella chilena */}
      <path d="m60 6 2.4 4.9 5.4.8-3.9 3.8.9 5.4L60 18.4l-4.8 2.5.9-5.4-3.9-3.8 5.4-.8L60 6Z" fill="url(#crest-gold)" />
    </svg>
  );
}

export function BrandMark({ logoUrl, className = "" }: { logoUrl?: string; className?: string }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt="Barbería O'Higgins" className={`${className} object-contain`} />;
  }
  return <Crest className={className} />;
}
