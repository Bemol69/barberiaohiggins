// Arma la web para publicar. Vercel lo ejecuta en cada cambio (ver vercel.json).
//  1. Lee tienda.config.json (desarrollador) y data/*.json (lo edita el dueño en /admin)
//  2. Dibuja cada página (index.html, contacto.html) con los datos: servicios, equipo, galería, reseñas…
//     Todo queda escrito en el HTML final, así Google lo lee sin ejecutar JavaScript.
//  3. Genera canonical, Open Graph, datos estructurados, robots.txt y sitemap.xml en dist/
// Uso local: node scripts/build.mjs  →  servir la carpeta dist/ (ver .claude/launch.json)
import { readdirSync, readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = join(ROOT, 'data');
const DIST = join(ROOT, 'dist');

// ---------- Lectura tolerante ----------
const avisos = [];
function readJson(path, fallback) {
  if (!existsSync(path)) { if (fallback === undefined) throw new Error(`Falta ${path}`); return fallback; }
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch (e) {
    if (fallback === undefined) throw new Error(`${path} tiene un error: ${e.message}`);
    avisos.push(`Se ignoró ${basename(path)} (JSON dañado: ${e.message})`); return fallback;
  }
}
function readFolder(folder) {
  const dir = join(DATA, folder);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    const item = readJson(join(dir, f), null);
    return item && typeof item === 'object' ? { id: basename(f, '.json'), ...item } : null;
  }).filter(Boolean);
}

const config = readJson(join(ROOT, 'tienda.config.json'));
const ajustes = readJson(join(DATA, 'ajustes.json'), {});
const textos = readJson(join(DATA, 'textos.json'), {});
const galeriaData = readJson(join(DATA, 'galeria.json'), {});
const resenasData = readJson(join(DATA, 'resenas.json'), {});

const SITE = (process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : config.site_url || 'http://localhost:5600').replace(/\/$/, '');

// ---------- Utilidades ----------
const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
const num = (v, def) => (v !== '' && v !== null && v !== undefined && Number.isFinite(Number(v)) ? Number(v) : def);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clp = (n) => '$' + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const img = (p) => (str(p) ? '/' + str(p).replace(/^\/+/, '') : '');
const abs = (p) => `${SITE}${img(p)}`;
const byOrder = (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es');
const listaY = (xs) => (xs.length > 1 ? `${xs.slice(0, -1).join(', ')} y ${xs.at(-1)}` : xs.join(''));
const duracionTxt = (m) => (!m ? '' : m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);
const parrafos = (t) => str(t).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
const icon = (id, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;

// ---------- 1. Datos del negocio ----------
const whatsapp = str(ajustes.whatsapp).replace(/\D/g, '');
if (!/^\d{10,15}$/.test(whatsapp) || (whatsapp.startsWith('56') && !/^569\d{8}$/.test(whatsapp))) {
  throw new Error(`WhatsApp inválido "${whatsapp}": usa formato internacional; en Chile son 11 dígitos, ej 56912345678`);
}
const B = {
  nombre: str(config.nombre),
  whatsapp,
  telefono: str(ajustes.telefono) || `+${whatsapp}`,
  email: str(ajustes.email),
  instagram: str(ajustes.instagram).replace(/^@/, ''),
  tiktok: str(ajustes.tiktok).replace(/^@/, ''),
  facebook: str(ajustes.facebook),
  direccion: str(ajustes.direccion),
  ciudad: str(ajustes.ciudad),
  region: str(ajustes.region),
  referencia: str(ajustes.referencia),
  lat: num(ajustes.latitud, null),
  lng: num(ajustes.longitud, null),
  calificacion: str(ajustes.calificacion).replace(',', '.'),
  resenas: Math.max(0, Math.round(num(ajustes.resenas, 0))),
};
for (const k of ['nombre', 'ciudad', 'direccion']) if (!B[k]) throw new Error(`Falta el dato obligatorio "${k}"`);
const waUrl = (text) => `https://api.whatsapp.com/send?phone=${B.whatsapp}${text ? '&text=' + encodeURIComponent(text) : ''}`;
const direccionCompleta = [B.direccion, B.ciudad].filter(Boolean).join(', ');
const mapaQuery = encodeURIComponent(`${B.nombre}, ${direccionCompleta}, Chile`);
const MAPA_URL = str(ajustes.mapa_url) || `https://www.google.com/maps/search/?api=1&query=${mapaQuery}`;
const MAPA_EMBED = `https://maps.google.com/maps?q=${mapaQuery}&z=17&output=embed`;
const WAZE_URL = B.lat !== null && B.lng !== null
  ? `https://waze.com/ul?ll=${B.lat},${B.lng}&navigate=yes`
  : `https://waze.com/ul?q=${encodeURIComponent(direccionCompleta)}&navigate=yes`;
// Las reservas se piden por WhatsApp. Este link es el respaldo si el navegador no carga app.js
// (con app.js, los botones «Reservar» abren el formulario de reserva de la propia web).
const RESERVA_URL = waUrl(`Hola ${B.nombre}! Quiero reservar una hora`);

// ---------- Horario ----------
const DIAS = [
  { k: 'lunes', n: 'Lunes', c: 'Lun', s: 'Monday', js: 1 }, { k: 'martes', n: 'Martes', c: 'Mar', s: 'Tuesday', js: 2 },
  { k: 'miercoles', n: 'Miércoles', c: 'Mié', s: 'Wednesday', js: 3 }, { k: 'jueves', n: 'Jueves', c: 'Jue', s: 'Thursday', js: 4 },
  { k: 'viernes', n: 'Viernes', c: 'Vie', s: 'Friday', js: 5 }, { k: 'sabado', n: 'Sábado', c: 'Sáb', s: 'Saturday', js: 6 },
  { k: 'domingo', n: 'Domingo', c: 'Dom', s: 'Sunday', js: 0 },
];
const hhmm = (v) => (/^\d{1,2}:\d{2}$/.test(str(v)) ? str(v).padStart(5, '0') : '');
const horario = DIAS.map((d) => {
  const h = (ajustes.horario || {})[d.k] || {};
  const abre = hhmm(h.abre), cierra = hhmm(h.cierra);
  return { ...d, abre: abre && cierra ? abre : '', cierra: abre && cierra ? cierra : '' };
});
const rangoTxt = (d) => (d.abre ? `${d.abre} – ${d.cierra}` : 'Cerrado');
// Agrupa días seguidos con el mismo horario: "Lunes a viernes: 10:00 – 20:00"
const grupos = [];
for (const d of horario) {
  const g = grupos.at(-1);
  if (g && g.abre === d.abre && g.cierra === d.cierra) g.dias.push(d); else grupos.push({ abre: d.abre, cierra: d.cierra, dias: [d] });
}
const nombreGrupo = (g) => (g.dias.length === 1 ? g.dias[0].n : g.dias.length === 2 ? `${g.dias[0].n} y ${g.dias[1].n.toLowerCase()}` : `${g.dias[0].n} a ${g.dias.at(-1).n.toLowerCase()}`);
const HORARIO_RESUMEN = grupos.map((g) => (g.abre ? `${nombreGrupo(g)} de ${g.abre} a ${g.cierra}` : `${nombreGrupo(g)} cerrado`)).join(', ').replace(/, ([^,]*)$/, ' y $1');

// ---------- 2. Catálogo ----------
const equipo = readFolder('equipo')
  .filter((e) => e.visible !== false && str(e.nombre))
  .map((e) => ({ id: e.id, nombre: str(e.nombre), cargo: str(e.cargo) || 'Barbero', foto: img(e.foto), instagram: str(e.instagram).replace(/^@/, ''), orden: num(e.orden, 1000) }))
  .sort(byOrder);
const equipoIds = new Set(equipo.map((e) => e.id));
const nombreBarbero = Object.fromEntries(equipo.map((e) => [e.id, e.nombre]));

const categorias = readFolder('categorias')
  .filter((c) => c.visible !== false && str(c.nombre))
  .map((c) => ({ id: c.id, nombre: str(c.nombre), descripcion: str(c.descripcion), foto: img(c.foto), icono: str(c.icono) || 'tijeras', orden: num(c.orden, 1000) }))
  .sort(byOrder);
const catIds = new Set(categorias.map((c) => c.id));

const servicios = readFolder('servicios')
  .filter((s) => s.visible !== false && str(s.nombre))
  .map((s) => {
    const barberos = [...new Set(Array.isArray(s.barberos) ? s.barberos : [])].filter((id) => equipoIds.has(id));
    return {
      id: s.id, nombre: str(s.nombre),
      categoria: catIds.has(str(s.categoria)) ? str(s.categoria) : 'otros',
      precio: Math.max(0, Math.round(num(s.precio, 0))), duracion: Math.max(0, Math.round(num(s.duracion, 0))),
      descripcion: str(s.descripcion), nota: str(s.nota), etiqueta: str(s.etiqueta),
      incluye: (Array.isArray(s.incluye) ? s.incluye : []).map(str).filter(Boolean),
      // lista vacía (o todos) = lo hace todo el equipo
      barberos: barberos.length && barberos.length < equipo.length ? barberos : [],
      orden: num(s.orden, 1000),
    };
  })
  .sort(byOrder);
// Servicios con una categoría borrada u oculta se muestran en "Otros servicios"
if (servicios.some((s) => s.categoria === 'otros')) categorias.push({ id: 'otros', nombre: 'Otros servicios', descripcion: '', foto: '', icono: 'estrella', orden: 9999 });
const grupoServicios = categorias.map((c) => ({ ...c, items: servicios.filter((s) => s.categoria === c.id) })).filter((c) => c.items.length);
const precios = servicios.map((s) => s.precio).filter((n) => n > 0);
const precioDesde = (items) => { const p = items.map((s) => s.precio).filter((n) => n > 0); return p.length ? Math.min(...p) : 0; };

const galeria = (Array.isArray(galeriaData.fotos) ? galeriaData.fotos : [])
  .filter((g) => g && str(g.foto)).map((g) => ({ foto: img(g.foto), texto: str(g.texto) }));
const resenas = (Array.isArray(resenasData.resenas) ? resenasData.resenas : [])
  .filter((r) => r && str(r.texto) && str(r.nombre))
  .map((r) => ({ nombre: str(r.nombre), texto: str(r.texto), servicio: str(r.servicio), estrellas: Math.min(5, Math.max(1, Math.round(num(r.estrellas, 5)))) }));
const heroFotos = (Array.isArray(textos.hero_fotos) ? textos.hero_fotos : [])
  .filter((f) => f && str(f.foto)).map((f) => ({ foto: img(f.foto), alt: str(f.alt) || B.nombre, foco: ['top', 'center', 'bottom'].includes(f.foco) ? f.foco : 'center' }));
if (!heroFotos.length) heroFotos.push({ foto: '/img/og.jpg', alt: B.nombre, foco: 'center' });

console.log(`✅ ${servicios.length} servicios en ${grupoServicios.length} categorías · ${equipo.length} barberos · ${galeria.length} fotos · ${resenas.length} reseñas`);

// ---------- 3. Bloques de HTML ----------
const reservarBtn = (s, cls = 'price__book') => `<button class="${cls}" type="button" data-reservar="${esc(s.id)}" aria-label="Reservar ${esc(s.nombre)}">${icon('calendario')} Reservar</button>`;
const barberosTxt = (s) => (s.barberos.length ? `Con ${listaY(s.barberos.map((id) => nombreBarbero[id]))}` : '');

const BLOQUES = {
  HERO_SLIDES: heroFotos.map((f, i) => `
          <figure class="hero__slide${i === 0 ? ' is-active' : ''}" data-slide="${i}">
            <img src="${esc(f.foto)}" alt="${esc(f.alt)}" style="object-position:center ${f.foco}" width="1200" height="1600"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>
          </figure>`).join(''),
  HERO_DOTS: heroFotos.length > 1 ? heroFotos.map((f, i) => `<button class="hero__dot${i === 0 ? ' is-active' : ''}" type="button" data-go="${i}" aria-label="Ver foto ${i + 1}"><span></span></button>`).join('') : '',

  SERVICIOS_CARDS: grupoServicios.map((c, i) => `
        <article class="svc${c.foto ? '' : ' svc--sin-foto'}" data-reveal>
          ${c.foto ? `<figure class="svc__img"><img src="${esc(c.foto)}" alt="${esc(c.nombre)} en ${esc(B.nombre)}" loading="lazy" width="800" height="640"></figure>` : ''}
          <span class="svc__n">${String(i + 1).padStart(2, '0')}</span>
          <span class="svc__ic">${icon(c.icono)}</span>
          <h3>${esc(c.nombre)}</h3>
          ${c.descripcion ? `<p>${esc(c.descripcion)}</p>` : ''}
          <p class="svc__from">${precioDesde(c.items) ? `Desde <b>${clp(precioDesde(c.items))}</b>` : ''} <span>${c.items.length} ${c.items.length === 1 ? 'servicio' : 'servicios'}</span></p>
          <a class="svc__link" href="/#precios" data-tab="${esc(c.id)}">Ver precios ${icon('flecha')}</a>
        </article>`).join(''),

  PRECIOS_TABS: [`<button class="tab is-active" type="button" role="tab" aria-selected="true" data-cat="todos">Todos</button>`,
    ...grupoServicios.map((c) => `<button class="tab" type="button" role="tab" aria-selected="false" data-cat="${esc(c.id)}">${esc(c.nombre)}</button>`)].join(''),

  PRECIOS_LISTAS: grupoServicios.map((c) => `
          <div class="menu" data-group="${esc(c.id)}">
            <h3 class="menu__title">${icon(c.icono)} ${esc(c.nombre)}</h3>
            <ul class="menu__list">${c.items.map((s) => `
              <li class="price">
                <div class="price__row">
                  <h4 class="price__name">${esc(s.nombre)}${s.etiqueta ? ` <span class="chip">${esc(s.etiqueta)}</span>` : ''}</h4>
                  <span class="price__dots" aria-hidden="true"></span>
                  <strong class="price__val">${s.precio ? clp(s.precio) : 'Consultar'}</strong>
                </div>
                ${s.descripcion ? `<p class="price__desc">${esc(s.descripcion)}</p>` : ''}
                ${s.incluye.length ? `<p class="price__desc">Incluye: ${esc(s.incluye.join(' · '))}</p>` : ''}
                <div class="price__meta">
                  ${s.duracion ? `<span>${icon('reloj')} ${duracionTxt(s.duracion)}</span>` : ''}
                  ${s.nota ? `<span>${icon('calendario')} ${esc(s.nota)}</span>` : ''}
                  ${s.barberos.length ? `<span>${icon('usuario')} ${esc(barberosTxt(s))}</span>` : ''}
                  ${reservarBtn(s)}
                </div>
              </li>`).join('')}
            </ul>
          </div>`).join(''),

  EQUIPO: equipo.map((e) => `
        <article class="barber" data-reveal>
          <figure class="barber__img">
            ${e.foto ? `<img src="${esc(e.foto)}" alt="${esc(e.nombre)}, ${esc(e.cargo.toLowerCase())} de ${esc(B.nombre)}" loading="lazy" width="720" height="900">` : icon('usuario', 'ic barber__ph')}
            <a class="barber__book" href="${esc(waUrl(`Hola ${B.nombre}! Quiero reservar una hora con ${e.nombre}`))}" data-reservar="" data-barbero="${esc(e.id)}">${icon('calendario')} Reservar con ${esc(e.nombre)}</a>
          </figure>
          <div class="barber__body">
            <h3>${esc(e.nombre)}</h3>
            <p>${esc(e.cargo)}</p>
            ${e.instagram ? `<a class="barber__ig" href="https://www.instagram.com/${esc(e.instagram)}/" target="_blank" rel="noopener" aria-label="Instagram de ${esc(e.nombre)}">${icon('instagram')}</a>` : ''}
          </div>
        </article>`).join(''),

  GALERIA: galeria.map((g, i) => `
        <button class="shot" type="button" data-shot="${i}" data-reveal>
          <img src="${esc(g.foto)}" alt="${esc(g.texto || `Corte hecho en ${B.nombre}`)}" loading="lazy" width="900" height="1200">
          ${g.texto ? `<span class="shot__cap">${esc(g.texto)}</span>` : ''}
        </button>`).join(''),

  RESENAS: resenas.map((r) => `
          <figure class="review">
            <div class="stars" aria-label="${r.estrellas} de 5 estrellas">${icon('estrella').repeat(r.estrellas)}</div>
            <blockquote>${esc(r.texto)}</blockquote>
            <figcaption><b>${esc(r.nombre)}</b>${r.servicio ? `<span>${esc(r.servicio)}</span>` : ''}</figcaption>
          </figure>`).join(''),

  HORARIO_TABLA: horario.map((d) => `<li data-day="${d.js}"><span>${d.n}</span><b>${rangoTxt(d)}</b></li>`).join(''),

  FOOTER_SERVICIOS: grupoServicios.map((c) => `<a href="/#precios" data-tab="${esc(c.id)}">${esc(c.nombre)}</a>`).join(''),

  NOSOTROS_TEXTO: parrafos(textos.nosotros_texto).map((p, i) => `<p${i === 0 ? ' class="lead"' : ''}>${esc(p)}</p>`).join('\n          '),

  FAQ: (Array.isArray(textos.faq) ? textos.faq : []).filter((f) => f && str(f.pregunta) && str(f.respuesta)).map((f) => {
    const r = str(f.respuesta)
      .replaceAll('{telefono}', B.telefono).replaceAll('{direccion}', B.direccion).replaceAll('{ciudad}', B.ciudad)
      .replaceAll('{barberos}', listaY(equipo.map((e) => e.nombre))).replaceAll('{horario}', HORARIO_RESUMEN);
    return `
          <details class="faq__item" data-reveal>
            <summary>${esc(str(f.pregunta))} ${icon('mas')}</summary>
            <p>${esc(r)}</p>
          </details>`;
  }).join(''),
};

// Datos para el navegador (app.js): reserva, horario y visor de fotos
const WEB_DATA = {
  nombre: B.nombre, whatsapp: B.whatsapp,
  horario: Object.fromEntries(horario.map((d) => [d.js, d.abre ? [d.abre, d.cierra] : null])),
  categorias: grupoServicios.map((c) => ({ id: c.id, n: c.nombre })),
  servicios: servicios.map((s) => ({ id: s.id, n: s.nombre, p: s.precio, d: s.duracion, b: s.barberos, c: s.categoria })),
  equipo: equipo.map((e) => ({ id: e.id, n: e.nombre })),
  galeria,
};

// ---------- 4. Marcadores %%CLAVE%% ----------
const colores = config.colores || {};
const fuentes = config.fuentes || {};
const familia = (f, pesos) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}${pesos ? `:wght@${pesos}` : ''}`;
const nServ = servicios.length;
const VARS = {
  NOMBRE: B.nombre, RUBRO: str(config.rubro), SITE,
  WHATSAPP: B.whatsapp, WA_URL: waUrl(`Hola ${B.nombre}! Quiero hacer una consulta`),
  TELEFONO: B.telefono, TEL_HREF: `tel:+${B.whatsapp}`, EMAIL: B.email,
  INSTAGRAM: B.instagram, INSTAGRAM_URL: B.instagram ? `https://www.instagram.com/${B.instagram}/` : '',
  TIKTOK_URL: B.tiktok ? `https://www.tiktok.com/@${B.tiktok}` : '', FACEBOOK_URL: B.facebook,
  RESERVA_URL,
  DIRECCION: B.direccion, CIUDAD: B.ciudad, REGION: B.region, REFERENCIA: B.referencia, DIRECCION_COMPLETA: direccionCompleta,
  MAPA_URL, MAPA_EMBED, WAZE_URL,
  CALIFICACION: B.calificacion && B.resenas ? B.calificacion.replace('.', ',') : '', RESENAS: B.resenas ? String(B.resenas) : '',
  HORARIO_RESUMEN,
  HERO_KICKER: str(textos.hero_kicker), HERO_TITULO: str(textos.hero_titulo), HERO_DESTACADO: str(textos.hero_destacado), HERO_BAJADA: str(textos.hero_bajada),
  HERO_TOTAL: String(heroFotos.length).padStart(2, '0'), HERO_VARIAS: heroFotos.length > 1 ? '1' : '',
  NOSOTROS_TITULO: str(textos.nosotros_titulo), NOSOTROS_FIRMA: str(textos.nosotros_firma),
  VIDEO_TITULO: str(textos.video_titulo), VIDEO_TEXTO: str(textos.video_texto),
  CTA_TITULO: str(textos.cta_titulo), CTA_TEXTO: str(textos.cta_texto),
  N_BARBEROS: String(equipo.length), N_SERVICIOS: String(nServ), PRECIO_DESDE: precios.length ? clp(Math.min(...precios)) : '',
  BARBEROS_TXT: listaY(equipo.map((e) => e.nombre)),
  HAY_EQUIPO: equipo.length ? '1' : '', HAY_GALERIA: galeria.length ? '1' : '', HAY_RESENAS: resenas.length ? '1' : '', HAY_FAQ: BLOQUES.FAQ ? '1' : '',
  YEAR: String(new Date().getFullYear()),
  FUENTES_URL: `https://fonts.googleapis.com/css2?${familia(fuentes.titulos || 'Prata')}&${familia(fuentes.texto || 'Barlow', '400;500;600')}&${familia(fuentes.etiquetas || 'Barlow Condensed', '500;600')}&display=swap`,
  FUENTE_TITULOS: fuentes.titulos || 'Prata', FUENTE_TEXTO: fuentes.texto || 'Barlow', FUENTE_ETIQUETAS: fuentes.etiquetas || 'Barlow Condensed',
  GITHUB_REPO: str(config.github_repo), GITHUB_RAMA: str(config.github_rama) || 'main', SITE_URL: `${SITE}/`,
  ...Object.fromEntries(Object.entries(colores).map(([k, v]) => [`COLOR_${k.toUpperCase()}`, v])),
};

// <!-- SI:CLAVE --> … <!-- /SI:CLAVE --> se elimina si CLAVE está vacía; <!-- @BLOQUE --> se reemplaza por HTML
function render(text, file, { escape = true } = {}) {
  let out = text.replace(/<!-- SI:([A-Z0-9_]+) -->([\s\S]*?)<!-- \/SI:\1 -->/g, (m, key, body) => (str(VARS[key]) ? body : ''));
  out = out.replace(/<!-- @([A-Z_]+) -->/g, (m, key) => {
    if (!(key in BLOQUES)) throw new Error(`${file}: bloque desconocido @${key}`);
    return BLOQUES[key];
  });
  const missing = new Set();
  out = out.replace(/%%([A-Z0-9_]+)%%/g, (m, key) => {
    const v = VARS[key];
    if (v === undefined || v === null || (v === '' && key.startsWith('COLOR_'))) { missing.add(key); return m; }
    return escape ? esc(v) : String(v);
  });
  if (missing.size) throw new Error(`${file}: faltan valores para ${[...missing].join(', ')}`);
  return out;
}
// Piezas comunes (menú, pie de página, ventana de reserva…) en partials/
const include = (text) => text.replace(/<!-- #include ([\w.-]+) -->/g, (m, f) => readFileSync(join(ROOT, 'partials', f), 'utf8'));

// ---------- 5. SEO ----------
const sameAs = [VARS.INSTAGRAM_URL, VARS.TIKTOK_URL, B.facebook].filter(Boolean);
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': config.schema_tipo || 'BarberShop',
  '@id': `${SITE}/#negocio`,
  name: B.nombre,
  description: config.seo_descripcion,
  url: `${SITE}/`,
  logo: abs('img/logo.png'),
  image: [abs('img/og.jpg'), ...heroFotos.slice(0, 2).map((f) => abs(f.foto))],
  telephone: `+${B.whatsapp}`,
  email: B.email || undefined,
  priceRange: precios.length ? `${clp(Math.min(...precios))} – ${clp(Math.max(...precios))}` : undefined,
  currenciesAccepted: 'CLP',
  address: { '@type': 'PostalAddress', streetAddress: B.direccion, addressLocality: B.ciudad, addressRegion: B.region || undefined, addressCountry: 'CL' },
  geo: B.lat !== null ? { '@type': 'GeoCoordinates', latitude: B.lat, longitude: B.lng } : undefined,
  hasMap: MAPA_URL,
  openingHoursSpecification: grupos.filter((g) => g.abre).map((g) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: g.dias.map((d) => d.s), opens: g.abre, closes: g.cierra })),
  sameAs: sameAs.length ? sameAs : undefined,
  aggregateRating: B.calificacion && B.resenas ? { '@type': 'AggregateRating', ratingValue: B.calificacion, reviewCount: B.resenas, bestRating: 5 } : undefined,
  hasOfferCatalog: {
    '@type': 'OfferCatalog', name: 'Servicios',
    itemListElement: grupoServicios.map((c) => ({
      '@type': 'OfferCatalog', name: c.nombre,
      itemListElement: c.items.map((s) => ({ '@type': 'Offer', price: s.precio || undefined, priceCurrency: 'CLP', itemOffered: { '@type': 'Service', name: s.nombre, description: s.descripcion || undefined } })),
    })),
  },
};
const PAGINAS = [
  { src: 'index.html', out: 'index.html', path: '/', titulo: str(config.seo_titulo), descripcion: str(config.seo_descripcion) },
  { src: 'contacto.html', out: 'contacto/index.html', path: '/contacto/', titulo: `Contacto y ubicación | ${B.nombre}, ${B.ciudad}`,
    descripcion: `Escríbenos por WhatsApp al ${B.telefono}, visítanos en ${direccionCompleta} o reserva tu hora online. ${HORARIO_RESUMEN}.` },
];
const head = (p) => `<title>${esc(p.titulo)}</title>
  <meta name="description" content="${esc(p.descripcion)}">
  <link rel="canonical" href="${SITE}${p.path}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(B.nombre)}">
  <meta property="og:locale" content="es_CL">
  <meta property="og:url" content="${SITE}${p.path}">
  <meta property="og:title" content="${esc(p.titulo)}">
  <meta property="og:description" content="${esc(p.descripcion)}">
  <meta property="og:image" content="${abs('img/og.jpg')}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">${config.google_verificacion ? `\n  <meta name="google-site-verification" content="${esc(config.google_verificacion)}">` : ''}
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`;

// ---------- 6. dist/ ----------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });
cpSync(join(ROOT, 'img'), join(DIST, 'img'), { recursive: true });
cpSync(join(ROOT, 'admin'), join(DIST, 'admin'), { recursive: true });

for (const p of PAGINAS) {
  let html = include(readFileSync(join(ROOT, p.src), 'utf8'));
  if (!html.includes('<!-- SEO:HEAD -->')) throw new Error(`Falta <!-- SEO:HEAD --> en ${p.src}`);
  html = render(html, p.src)
    .replace('<!-- SEO:HEAD -->', head(p))
    .replace('<!-- WEB:DATA -->', `<script id="web-data" type="application/json">${JSON.stringify(WEB_DATA).replace(/</g, '\\u003c')}</script>`);
  mkdirSync(join(DIST, p.out, '..'), { recursive: true });
  writeFileSync(join(DIST, p.out), html);
}
writeFileSync(join(DIST, 'styles.css'), render(readFileSync(join(ROOT, 'styles.css'), 'utf8'), 'styles.css', { escape: false }));
cpSync(join(ROOT, 'app.js'), join(DIST, 'app.js'));
writeFileSync(join(DIST, 'admin', 'config.yml'), render(readFileSync(join(ROOT, 'admin', 'config.yml'), 'utf8'), 'admin/config.yml', { escape: false }));

const hoy = new Date().toISOString().slice(0, 10);
writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PAGINAS.map((p) => `  <url><loc>${SITE}${p.path}</loc><lastmod>${hoy}</lastmod></url>`).join('\n')}
</urlset>
`);

// Fotos que se nombran en los datos pero no existen (ej: se borró el archivo)
const faltantes = [...heroFotos.map((f) => f.foto), ...equipo.map((e) => e.foto), ...galeria.map((g) => g.foto)]
  .filter((f) => f && f.startsWith('/img/') && !existsSync(join(ROOT, f)));
for (const f of faltantes) avisos.push(`No existe la foto ${f}`);
for (const a of avisos) console.warn(`⚠️  ${a}`);
console.log(`✅ sitio listo en dist/ para ${SITE}`);
