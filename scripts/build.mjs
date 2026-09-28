// Arma la web para publicar. Vercel lo ejecuta en cada cambio (ver vercel.json).
//  1. Lee tienda.config.json (lo define el desarrollador) y data/ajustes.json (lo edita el cliente en /admin)
//  2. Junta data/productos/*.json y data/categorias/*.json en data/catalogo.json
//  3. Copia el sitio a dist/ reemplazando los %%MARCADORES%%, escribe los productos dentro
//     del HTML (para Google) y genera canonical, Open Graph, datos estructurados, robots.txt y sitemap.xml
// Uso local: node scripts/build.mjs  →  servir la carpeta dist/
import { readdirSync, readFileSync, writeFileSync, rmSync, mkdirSync, cpSync, existsSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DATA = join(ROOT, 'data');
const DIST = join(ROOT, 'dist');

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const config = readJson(join(ROOT, 'tienda.config.json'));
const ajustes = existsSync(join(DATA, 'ajustes.json')) ? readJson(join(DATA, 'ajustes.json')) : {};

// En Vercel se usa el dominio de producción (se actualiza solo al conectar un dominio propio)
const SITE = (process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : config.site_url || 'http://localhost:5600').replace(/\/$/, '');

// ---------- 1. Datos de la tienda ----------
const str = (v) => (v === undefined || v === null ? '' : String(v).trim());
const T = {
  nombre: str(config.nombre),
  marca_a: str(config.marca_a) || str(config.nombre),
  marca_b: str(config.marca_b),
  rubro: str(config.rubro),
  schema_tipo: str(config.schema_tipo) || 'Store',
  whatsapp: str(ajustes.whatsapp).replace(/\D/g, ''),
  instagram: str(ajustes.instagram).replace(/^@/, ''),
  tiktok: str(ajustes.tiktok).replace(/^@/, ''),
  email: str(ajustes.email),
  direccion: str(ajustes.direccion),
  ciudad: str(ajustes.ciudad),
  region: str(ajustes.region),
  envios: str(ajustes.envios),
  horario_dias: str(ajustes.horario_dias) || 'Lunes a domingo',
  hora_abre: str(ajustes.hora_abre) || '09:00',
  hora_cierra: str(ajustes.hora_cierra) || '20:00',
  // Sábado: si se deja vacío, usa el mismo horario de lunes a viernes
  hora_abre_sabado: str(ajustes.hora_abre_sabado) || str(ajustes.hora_abre) || '09:00',
  hora_cierra_sabado: str(ajustes.hora_cierra_sabado) || str(ajustes.hora_cierra) || '20:00',
  horario_domingo: str(ajustes.horario_domingo),
  hora_abre_domingo: str(ajustes.hora_abre_domingo),
  hora_cierra_domingo: str(ajustes.hora_cierra_domingo),
  sucursal1_nombre: str(ajustes.sucursal1_nombre) || 'Sucursal 1',
  sucursal1_direccion: str(ajustes.sucursal1_direccion),
  sucursal1_referencia: str(ajustes.sucursal1_referencia),
  sucursal1_mapa: str(ajustes.sucursal1_mapa),
  sucursal2_nombre: str(ajustes.sucursal2_nombre),
  sucursal2_direccion: str(ajustes.sucursal2_direccion),
  sucursal2_referencia: str(ajustes.sucursal2_referencia),
  sucursal2_mapa: str(ajustes.sucursal2_mapa),
  hero_titulo: str(ajustes.hero_titulo),
  hero_destacado: str(ajustes.hero_destacado),
  hero_bajada: str(ajustes.hero_bajada),
  calificacion: str(ajustes.calificacion).replace(',', '.'),
  resenas: Math.max(0, Math.round(Number(ajustes.resenas) || 0)),
  barberos: (Array.isArray(ajustes.barberos) ? ajustes.barberos : []).map(str).filter(Boolean),
  galeria: (Array.isArray(ajustes.galeria) ? ajustes.galeria : [])
    .filter((g) => g && typeof g.foto === 'string' && g.foto)
    .map((g) => ({ foto: g.foto.replace(/^\//, ''), texto: str(g.texto) })),
};

const faltan = ['nombre', 'whatsapp', 'ciudad'].filter((k) => !T[k]);
if (faltan.length) throw new Error(`Faltan datos obligatorios: ${faltan.join(', ')} (tienda.config.json / data/ajustes.json)`);
if (!/^\d{10,15}$/.test(T.whatsapp) || (T.whatsapp.startsWith('56') && !/^569\d{8}$/.test(T.whatsapp))) {
  throw new Error(`WhatsApp inválido "${T.whatsapp}": usa formato internacional; en Chile son 11 dígitos, ej 56912345678`);
}

// ---------- 2. Catálogo ----------
function readFolder(folder) {
  const dir = join(DATA, folder);
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { return []; }
  const items = [];
  for (const file of files) {
    try {
      items.push({ id: basename(file, '.json'), ...readJson(join(dir, file)) });
    } catch (e) {
      // Un archivo dañado no debe botar todo el catálogo: se omite y se avisa en el log
      console.warn(`⚠️  Se omitió ${folder}/${file}: ${e.message}`);
    }
  }
  return items;
}

const num = (v, def) => (v !== '' && v !== null && Number.isFinite(Number(v)) ? Number(v) : def);
const byOrder = (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es');

const productos = readFolder('productos')
  .filter((p) => p.visible !== false && typeof p.nombre === 'string' && p.nombre.trim())
  .map((p) => ({
    id: p.id,
    nombre: p.nombre.trim(),
    precio: Math.max(0, Math.round(num(p.precio, 0))),
    foto: typeof p.foto === 'string' && p.foto ? p.foto.replace(/^\//, '') : 'img/logo.jpg',
    descripcion: typeof p.descripcion === 'string' ? p.descripcion.trim() : '',
    incluye: Array.isArray(p.incluye) ? p.incluye.map((i) => String(i).trim()).filter(Boolean) : [],
    etiqueta: typeof p.etiqueta === 'string' ? p.etiqueta.trim() : '',
    agotado: p.agotado === true,
    orden: num(p.orden, 1000),
  }))
  .sort(byOrder)
  .map(({ orden, ...p }) => p);

const ids = new Set(productos.map((p) => p.id));

const categorias = readFolder('categorias')
  .filter((c) => c.visible !== false && typeof c.nombre === 'string' && c.nombre.trim())
  .map((c) => ({
    id: c.id,
    nombre: c.nombre.trim(),
    orden: num(c.orden, 1000),
    // se descartan productos borrados u ocultos, y repetidos
    productos: [...new Set(Array.isArray(c.productos) ? c.productos : [])].filter((id) => ids.has(id)),
  }))
  .sort(byOrder)
  .map(({ orden, ...c }) => c);

writeFileSync(join(DATA, 'catalogo.json'), JSON.stringify({
  _aviso: 'Archivo generado por scripts/build.mjs. No editar a mano.',
  categorias,
  productos,
}, null, 2) + '\n');
console.log(`✅ catálogo: ${productos.length} productos, ${categorias.length} categorías`);

// ---------- 3. Marcadores %%CLAVE%% ----------
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clp = (n) => '$' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
// Precio 0 = "a consultar" (servicios que se cotizan según el largo o el tipo de cabello)
const precioHtml = (n) => (n > 0 ? `<small>desde</small> ${clp(n)}` : '<small>precio</small> A consultar');
const mapaQuery = (dir) => encodeURIComponent([dir, T.ciudad, 'Chile'].filter(Boolean).join(', '));
const abs = (path) => `${SITE}/${String(path).replace(/^\//, '')}`;
const colores = config.colores || {};
const fuentes = config.fuentes || {};
const hero = Array.isArray(config.hero) ? config.hero : [];
const heroFoto = (i) => (hero[i] && hero[i].foto) || (productos[i] && productos[i].foto) || 'img/logo.jpg';
const heroAlt = (i) => (hero[i] && hero[i].alt) || (productos[i] && productos[i].nombre) || T.nombre;
const fuenteParam = (f, pesos) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@${pesos}`;
const FUENTE_TITULOS = fuentes.titulos || 'Dancing Script';
const FUENTE_TEXTO = fuentes.texto || 'Quicksand';
const PESOS_TITULOS = fuentes.pesos_titulos || '600;700';

const SEO_TITULO = str(config.seo_titulo) || `${T.nombre} · ${T.rubro} en ${T.ciudad}`;
const SEO_DESCRIPCION = str(config.seo_descripcion) || T.hero_bajada;

const rango = (a, c) => (a && c ? `${a} – ${c}` : 'Cerrado');
const galeriaHtml = T.galeria.map((g, i) => `
          <button class="shot${i % 3 === 0 ? ' shot--tall' : ''}" data-caption="${esc(g.texto)}"><img src="${esc(g.foto)}" alt="${esc(g.texto || `Trabajo de ${T.nombre}`)}" loading="lazy"></button>`).join('');

const VARS = {
  NOMBRE: T.nombre, MARCA_A: T.marca_a, MARCA_B: T.marca_b, RUBRO: T.rubro,
  SEO_TITULO, SEO_DESCRIPCION,
  CIUDAD: T.ciudad, REGION: T.region, DIRECCION: T.direccion, ENVIOS: T.envios,
  INSTAGRAM: T.instagram, TIKTOK: T.tiktok, EMAIL: T.email,
  HORARIO_DIAS: T.horario_dias, HORA_ABRE: T.hora_abre, HORA_CIERRA: T.hora_cierra,
  HORA_ABRE_SABADO: T.hora_abre_sabado, HORA_CIERRA_SABADO: T.hora_cierra_sabado,
  HORARIO_SEMANA_TXT: rango(T.hora_abre, T.hora_cierra),
  HORARIO_SABADO_TXT: rango(T.hora_abre_sabado, T.hora_cierra_sabado),
  HORARIO_DOMINGO_TXT: rango(T.hora_abre_domingo, T.hora_cierra_domingo),
  CALIFICACION: T.calificacion, RESENAS: T.resenas ? String(T.resenas) : '',
  GALERIA: T.galeria.length ? '1' : '',
  BARBEROS_TXT: T.barberos.length > 1 ? `${T.barberos.slice(0, -1).join(', ')} y ${T.barberos.at(-1)}` : T.barberos.join(''),
  HORARIO_DOMINGO: T.horario_domingo, HORA_ABRE_DOMINGO: T.hora_abre_domingo, HORA_CIERRA_DOMINGO: T.hora_cierra_domingo,
  SUCURSAL1_NOMBRE: T.sucursal1_nombre, SUCURSAL1_DIRECCION: T.sucursal1_direccion, SUCURSAL1_REFERENCIA: T.sucursal1_referencia,
  SUCURSAL1_MAPA: T.sucursal1_mapa || `https://www.google.com/maps/search/?api=1&query=${mapaQuery(T.sucursal1_direccion)}`,
  SUCURSAL1_QUERY: mapaQuery(T.sucursal1_direccion),
  SUCURSAL2_NOMBRE: T.sucursal2_nombre, SUCURSAL2_DIRECCION: T.sucursal2_direccion, SUCURSAL2_REFERENCIA: T.sucursal2_referencia,
  SUCURSAL2_MAPA: T.sucursal2_mapa || `https://www.google.com/maps/search/?api=1&query=${mapaQuery(T.sucursal2_direccion)}`,
  SUCURSAL2_QUERY: mapaQuery(T.sucursal2_direccion),
  HERO_TITULO: T.hero_titulo, HERO_DESTACADO: T.hero_destacado, HERO_BAJADA: T.hero_bajada,
  HERO_1: heroFoto(0), HERO_1_ALT: heroAlt(0), HERO_2: heroFoto(1), HERO_2_ALT: heroAlt(1), HERO_3: heroFoto(2), HERO_3_ALT: heroAlt(2),
  MAPA_QUERY: encodeURIComponent([T.direccion, T.ciudad, 'Chile'].filter(Boolean).join(', ')),
  FUENTES_URL: `https://fonts.googleapis.com/css2?${fuenteParam(FUENTE_TITULOS, PESOS_TITULOS)}&${fuenteParam(FUENTE_TEXTO, '400;500;600;700')}&display=swap`,
  FUENTE_TITULOS, FUENTE_TEXTO,
  GITHUB_REPO: str(config.github_repo), SITE_URL: `${SITE}/`,
  COLOR_PRIMARIO: colores.primario, COLOR_PRIMARIO_OSCURO: colores.primario_oscuro, COLOR_PRIMARIO_CLARO: colores.primario_claro,
  COLOR_SECUNDARIO: colores.secundario, COLOR_SECUNDARIO_CLARO: colores.secundario_claro,
  COLOR_ACENTO: colores.acento, COLOR_ACENTO_CLARO: colores.acento_claro,
  COLOR_TINTA: colores.tinta, COLOR_TINTA_SUAVE: colores.tinta_suave,
  COLOR_FONDO: colores.fondo, COLOR_EXTRA: colores.extra, COLOR_DORADO: colores.dorado,
  // Solo lo que necesita el navegador (app.js)
  TIENDA_JSON: JSON.stringify({
    nombre: T.nombre, whatsapp: T.whatsapp, ciudad: T.ciudad, hora_abre: T.hora_abre, hora_cierra: T.hora_cierra,
    hora_abre_sabado: T.hora_abre_sabado, hora_cierra_sabado: T.hora_cierra_sabado, barberos: T.barberos,
    hora_abre_domingo: T.hora_abre_domingo, hora_cierra_domingo: T.hora_cierra_domingo,
    sucursales: [T.sucursal1_nombre && T.sucursal1_direccion ? `${T.sucursal1_nombre} (${T.sucursal1_direccion})` : '',
      T.sucursal2_nombre && T.sucursal2_direccion ? `${T.sucursal2_nombre} (${T.sucursal2_direccion})` : ''].filter(Boolean),
  }),
};

// Bloques opcionales: <!-- SI:CLAVE --> ... <!-- /SI:CLAVE --> se eliminan si CLAVE está vacía
function render(text, file, escape) {
  let out = text.replace(/<!-- SI:([A-Z0-9_]+) -->([\s\S]*?)<!-- \/SI:\1 -->/g, (m, key, body) => (str(VARS[key]) ? body : ''));
  const missing = new Set();
  out = out.replace(/%%([A-Z0-9_]+)%%/g, (m, key) => {
    const v = VARS[key];
    if (v === undefined || v === null || (v === '' && key.startsWith('COLOR_'))) { missing.add(key); return m; }
    return escape && key !== 'TIENDA_JSON' ? esc(v) : String(v);
  });
  if (missing.size) throw new Error(`${file}: faltan valores para ${[...missing].join(', ')}`);
  return out;
}

// ---------- 4. SEO ----------
const card = (p) => `
    <article class="card${p.agotado ? ' is-soldout' : ''}">
      <div class="card__img">
        ${p.agotado ? '<span class="badge badge--soldout">No disponible</span>' : p.etiqueta ? `<span class="badge">${esc(p.etiqueta)}</span>` : ''}
        <img src="${esc(p.foto)}" alt="${esc(p.nombre)} en ${esc(T.nombre)}, ${esc(T.ciudad)}" loading="lazy">
      </div>
      <div class="card__body">
        <h3>${esc(p.nombre)}</h3>
        ${p.descripcion ? `<p class="card__desc">${esc(p.descripcion)}</p>` : ''}
        ${p.incluye.length ? `<ul>${p.incluye.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
        <div class="card__foot">
          <span class="price">${precioHtml(p.precio)}</span>
          ${p.agotado
            ? `<a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="${esc(`https://api.whatsapp.com/send?phone=${T.whatsapp}&text=${encodeURIComponent(`Hola! ¿Están haciendo ${p.nombre}?`)}`)}">Consultar</a>`
            : `<button class="btn btn--primary btn--sm" data-order="${esc(p.id)}">Agendar</button>`}
        </div>
      </div>
    </article>`; // misma tarjeta que renderProducts() en app.js

const OG_IMAGE = abs(heroFoto(0));
const precios = productos.map((p) => p.precio).filter((n) => n > 0);
const sameAs = [
  T.instagram && `https://www.instagram.com/${T.instagram}/`,
  T.tiktok && `https://www.tiktok.com/@${T.tiktok}`,
].filter(Boolean);

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': T.schema_tipo,
      '@id': `${SITE}/#tienda`,
      name: T.nombre,
      description: SEO_DESCRIPCION,
      url: `${SITE}/`,
      logo: abs('img/logo.jpg'),
      image: [OG_IMAGE, abs('img/logo.jpg')],
      email: T.email || undefined,
      priceRange: precios.length ? `${clp(Math.min(...precios))} – ${clp(Math.max(...precios))}` : undefined,
      currenciesAccepted: 'CLP',
      address: {
        '@type': 'PostalAddress',
        streetAddress: T.direccion || undefined,
        addressLocality: T.ciudad,
        addressRegion: T.region || undefined,
        addressCountry: 'CL',
      },
      telephone: `+${T.whatsapp}`,
      openingHoursSpecification: [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: config.dias_schema || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        opens: T.hora_abre,
        closes: T.hora_cierra,
      }, ...(!(config.dias_schema || []).includes('Saturday') ? [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: T.hora_abre_sabado,
        closes: T.hora_cierra_sabado,
      }] : []), ...(T.hora_abre_domingo && T.hora_cierra_domingo ? [{
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Sunday'],
        opens: T.hora_abre_domingo,
        closes: T.hora_cierra_domingo,
      }] : [])],
      sameAs: sameAs.length ? sameAs : undefined,
      aggregateRating: T.calificacion && T.resenas ? {
        '@type': 'AggregateRating',
        ratingValue: T.calificacion,
        reviewCount: T.resenas,
        bestRating: 5,
      } : undefined,
    },
    {
      '@type': 'ItemList',
      name: 'Servicios',
      itemListElement: productos.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Service',
          name: p.nombre,
          image: abs(p.foto),
          description: p.descripcion || p.incluye.join(', ') || p.nombre,
          provider: { '@id': `${SITE}/#tienda` },
          offers: p.precio > 0 ? {
            '@type': 'Offer',
            price: p.precio,
            priceCurrency: 'CLP',
          } : undefined,
        },
      })),
    },
  ],
};

const head = `<link rel="canonical" href="${SITE}/">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(T.nombre)}">
  <meta property="og:locale" content="es_CL">
  <meta property="og:url" content="${SITE}/">
  <meta property="og:title" content="${esc(SEO_TITULO)}">
  <meta property="og:description" content="${esc(SEO_DESCRIPCION)}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta name="twitter:card" content="summary_large_image">${config.google_verificacion
    ? `\n  <meta name="google-site-verification" content="${esc(config.google_verificacion)}">` : ''}
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`;

// ---------- 5. dist/ ----------
let html = readFileSync(join(ROOT, 'index.html'), 'utf8');
for (const marker of ['<!-- SEO:HEAD', '<!-- SEO:PRODUCTOS -->', '<!-- GALERIA -->']) {
  if (!html.includes(marker)) throw new Error(`Falta el marcador ${marker} en index.html`);
}
html = render(html, 'index.html', true)
  .replace(/<!-- SEO:HEAD[^>]*-->/, head)
  .replace('<!-- SEO:PRODUCTOS -->', productos.map(card).join(''))
  .replace('<!-- GALERIA -->', galeriaHtml);

rmSync(DIST, { recursive: true, force: true });
mkdirSync(join(DIST, 'data'), { recursive: true });
cpSync(join(ROOT, 'img'), join(DIST, 'img'), { recursive: true });
cpSync(join(ROOT, 'admin'), join(DIST, 'admin'), { recursive: true });
cpSync(join(DATA, 'catalogo.json'), join(DIST, 'data', 'catalogo.json'));
writeFileSync(join(DIST, 'index.html'), html);
writeFileSync(join(DIST, 'styles.css'), render(readFileSync(join(ROOT, 'styles.css'), 'utf8'), 'styles.css', false));
writeFileSync(join(DIST, 'app.js'), render(readFileSync(join(ROOT, 'app.js'), 'utf8'), 'app.js', false));
writeFileSync(join(DIST, 'admin', 'config.yml'), render(readFileSync(join(ROOT, 'admin', 'config.yml'), 'utf8'), 'admin/config.yml', false));

writeFileSync(join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: ${SITE}/sitemap.xml\n`);
writeFileSync(join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE}/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod></url>
</urlset>
`);

if (!existsSync(join(ROOT, 'img', 'logo.jpg'))) console.warn('⚠️  Falta img/logo.jpg (logo de la tienda)');
console.log(`✅ sitio listo en dist/ para ${SITE}`);
