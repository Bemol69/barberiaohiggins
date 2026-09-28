// ===== CONFIGURACIÓN =====
// Datos de la barbería: los inserta scripts/build.mjs desde tienda.config.json y data/ajustes.json
const TIENDA = %%TIENDA_JSON%%;
document.documentElement.classList.add('js');

// WhatsApp en formato internacional, solo dígitos (Chile: 56 + 9 + 8 dígitos)
const WHATSAPP_NUMBER = TIENDA.whatsapp;

// Horario por día (0 = domingo, 6 = sábado). Si el domingo no tiene horario, se considera cerrado.
const HORARIO = (day) =>
  day === 0
    ? (TIENDA.hora_abre_domingo && TIENDA.hora_cierra_domingo ? [TIENDA.hora_abre_domingo, TIENDA.hora_cierra_domingo] : null)
    : day === 6
      ? [TIENDA.hora_abre_sabado || TIENDA.hora_abre, TIENDA.hora_cierra_sabado || TIENDA.hora_cierra]
      : [TIENDA.hora_abre, TIENDA.hora_cierra];
const SLOT_MIN = 30; // cada cuántos minutos se ofrecen horas en el formulario
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Servicios y categorías se editan desde el panel /admin (data/productos, data/categorias)
// y se publican juntos en data/catalogo.json (lo genera scripts/build.mjs)
let PRODUCTS = [];
let FILTERS = [['todos', 'Todos']];

const CUSTOM = { id: 'asesoria', name: 'No sé aún, quiero asesoría', price: 0 };

// Servicios que se pueden sumar al principal
const EXTRAS = ['Perfilado de barba', 'Masaje de relajación'];

const SORTS = {
  destacados: null,
  'precio-asc': (a, b) => (a.price || Infinity) - (b.price || Infinity),
  'precio-desc': (a, b) => b.price - a.price,
};

// ===== UTILIDADES =====
const clp = (n) => '$' + n.toLocaleString('es-CL');
const precioHtml = (n) => (n > 0 ? `<small>desde</small> ${clp(n)}` : '<small>precio</small> A consultar');
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const findProduct = (id) => (id === CUSTOM.id ? CUSTOM : PRODUCTS.find((p) => p.id === id));
// Se usa api.whatsapp.com y no wa.me: la redirección de wa.me rompe los emojis (llegan como �)
const waUrl = (text) =>
  `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}${text ? '&text=' + encodeURIComponent(text) : ''}`;
const toMin = (hhmm) => { const [h, m] = String(hhmm || '0:0').split(':').map(Number); return (h || 0) * 60 + (m || 0); };
const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

// Fecha y hora actuales en Chile (aunque el visitante esté en otro huso)
function chileNow() {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(parts.weekday);
  return { iso: `${parts.year}-${parts.month}-${parts.day}`, day, min: Number(parts.hour) * 60 + Number(parts.minute) };
}
const dayOfIso = (iso) => new Date(iso + 'T12:00:00').getDay();

function nextOrderNumber() {
  let n = 141;
  try { n = parseInt(localStorage.getItem('orderCounter') || '141', 10) || 141; } catch (e) {}
  return String(n + 1).padStart(4, '0');
}
function commitOrderNumber(num) {
  try { localStorage.setItem('orderCounter', String(parseInt(num, 10))); } catch (e) {}
}

// ===== CATÁLOGO DE SERVICIOS =====
const grid = $('#productGrid');
const filters = $('#filters');
let currentCat = 'todos';

function renderFilters(active) {
  const count = (k) => (k === 'todos' ? PRODUCTS.length : PRODUCTS.filter((p) => p.tags.includes(k)).length);
  filters.innerHTML = FILTERS
    .filter(([k]) => count(k) > 0)
    .map(([k, label]) => `<button class="tab ${k === active ? 'is-active' : ''}" role="tab" aria-selected="${k === active}" data-cat="${esc(k)}">${esc(label)}<span class="tab__n">${count(k)}</span></button>`)
    .join('');
}

function renderProducts(cat = currentCat) {
  currentCat = cat;
  let list = cat === 'todos' ? PRODUCTS : PRODUCTS.filter((p) => p.tags.includes(cat));
  const sort = SORTS[$('#sort').value];
  if (sort) list = [...list].sort(sort);
  $('#count').innerHTML = `Mostrando <strong>${list.length}</strong> ${list.length === 1 ? 'servicio' : 'servicios'}`;
  // misma tarjeta que card() en scripts/build.mjs
  grid.innerHTML = list.map((p, i) => `
    <article class="card${p.agotado ? ' is-soldout' : ''}" style="animation-delay:${Math.min(i, 8) * 45}ms">
      <div class="card__img">
        ${p.agotado ? '<span class="badge badge--soldout">No disponible</span>' : p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ''}
        <img src="${esc(p.img)}" alt="${esc(p.name)} en ${esc(TIENDA.nombre)}, ${esc(TIENDA.ciudad)}" loading="lazy">
      </div>
      <div class="card__body">
        <h3>${esc(p.name)}</h3>
        ${p.desc ? `<p class="card__desc">${esc(p.desc)}</p>` : ''}
        ${p.items.length ? `<ul>${p.items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : ''}
        <div class="card__foot">
          <span class="price">${precioHtml(p.price)}</span>
          ${p.agotado
            ? `<a class="btn btn--ghost btn--sm" target="_blank" rel="noopener" href="${esc(waUrl(`Hola! ¿Están haciendo ${p.name}? 💈`))}">Consultar</a>`
            : `<button class="btn btn--primary btn--sm" data-order="${esc(p.id)}">Agendar</button>`}
        </div>
      </div>
    </article>`).join('');
}

filters.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cat]');
  if (!btn) return;
  renderFilters(btn.dataset.cat);
  renderProducts(btn.dataset.cat);
});
$('#sort').addEventListener('change', () => renderProducts());

// ===== FORMULARIO DE RESERVA =====
const modal = $('#orderModal');
const form = $('#orderForm');
const fServicio = $('#fServicio');
const fFecha = $('#fFecha');
const fHora = $('#fHora');
let orderNumber = nextOrderNumber();

function renderServiceOptions() {
  fServicio.innerHTML =
    PRODUCTS.filter((p) => !p.agotado)
      .map((p) => `<option value="${esc(p.id)}">${esc(p.name)} (${p.price ? 'desde ' + clp(p.price) : 'a consultar'})</option>`).join('') +
    `<option value="${CUSTOM.id}">${CUSTOM.name}</option>`;
}

$('#fExtras').innerHTML = EXTRAS
  .map((x) => `<label><input type="checkbox" value="${esc(x)}"><span>+ ${esc(x)}</span></label>`)
  .join('');

// Con una sola sucursal no se pregunta dónde: se oculta el campo
const SUCURSALES = (TIENDA.sucursales || []).length > 1 ? [...TIENDA.sucursales, 'La que tenga hora antes'] : [...(TIENDA.sucursales || [])];
if (SUCURSALES.length <= 1) $('#fSucursal').closest('fieldset').hidden = true;
$('#fSucursal').innerHTML = SUCURSALES
  .map((s, i) => `<label class="radio"><input type="radio" name="sucursal" value="${i}"${i === 0 ? ' checked' : ''}><span>${esc(s.replace(/\s*\(.*\)$/, ''))}</span></label>`)
  .join('');

// Horas disponibles para el día elegido (según el horario de ese día; si es hoy, solo las que faltan)
function renderHours() {
  const prev = fHora.value;
  const now = chileNow();
  if (!fFecha.value) { fHora.innerHTML = '<option value="">Elige un día</option>'; return; }
  const h = HORARIO(dayOfIso(fFecha.value));
  if (!h) { fHora.innerHTML = '<option value="">Cerrado ese día</option>'; return; }
  const [abre, cierra] = h.map(toMin);
  const desde = fFecha.value === now.iso ? Math.max(abre, Math.ceil((now.min + 30) / SLOT_MIN) * SLOT_MIN) : abre;
  const slots = [];
  for (let m = desde; m <= cierra - SLOT_MIN; m += SLOT_MIN) slots.push(fmtMin(m));
  fHora.innerHTML = slots.length
    ? '<option value="">Elige una hora</option>' + slots.map((s) => `<option${s === prev ? ' selected' : ''}>${s}</option>`).join('')
    : '<option value="">No quedan horas hoy</option>';
}

function getOrder() {
  const suc = form.querySelector('input[name="sucursal"]:checked');
  return {
    product: findProduct(fServicio.value) || CUSTOM,
    extras: $$('#fExtras input:checked').map((i) => i.value),
    sucursal: suc ? SUCURSALES[Number(suc.value)] : '',
    fecha: fFecha.value,
    hora: fHora.value,
    nombre: $('#fNombre').value.trim(),
    barbero: $('#fBarbero').value.trim(),
    comentario: $('#fComentario').value.trim(),
  };
}

// *texto* = negrita y _texto_ = cursiva en WhatsApp
function buildMessage(o) {
  const custom = o.product.id === CUSTOM.id;
  const L = [`💈 *RESERVA #${orderNumber}* 💈`, '━━━━━━━━━━━━━━━'];
  L.push(`✂️ *Servicio:* ${o.product.name}${custom || !o.product.price ? '' : ` (desde ${clp(o.product.price)})`}`);
  if (o.extras.length) L.push(`➕ *Agregar:* ${o.extras.join(', ')}`);
  if (o.sucursal) L.push(`📍 *Sucursal:* ${o.sucursal}`);
  if (o.fecha) L.push(`📅 *Día:* ${DIAS[dayOfIso(o.fecha)]} ${o.fecha.split('-').reverse().join('/')}`);
  if (o.hora) L.push(`🕒 *Hora:* ${o.hora} hrs`);
  if (o.barbero) L.push(`💇‍♂️ *Barbero:* ${o.barbero}`);
  if (o.nombre) L.push(`🙋‍♂️ *Nombre:* ${o.nombre}`);
  if (o.comentario) L.push(`📝 *Comentario:* _${o.comentario}_`);
  L.push('━━━━━━━━━━━━━━━');
  L.push('');
  L.push(`¡Hola ${TIENDA.nombre}! Quiero agendar esta hora 🙌`);
  return L.join('\n');
}

function formatPreview(text) {
  return esc(text)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_([^_\n]+)_/g, '$1<em>$2</em>');
}

function update() {
  const o = getOrder();
  $('#msgPreview').innerHTML = formatPreview(buildMessage(o));
  $('#fTotal').textContent = o.product.price ? 'Desde ' + clp(o.product.price) : 'A consultar';
}

function openModal(productId, sucursal) {
  if (productId && findProduct(productId)) fServicio.value = productId;
  if (sucursal !== undefined) {
    const r = form.querySelector(`input[name="sucursal"][value="${sucursal}"]`);
    if (r) r.checked = true;
  }
  const now = chileNow();
  fFecha.min = now.iso;
  if (!fFecha.value || fFecha.value < now.iso) fFecha.value = now.iso;
  renderHours();
  // Si hoy ya no quedan horas (o está cerrado), propone el siguiente día con horas libres
  for (let i = 1; i <= 7 && fHora.options.length < 2; i++) {
    const d = new Date(now.iso + 'T12:00:00');
    d.setDate(d.getDate() + i);
    fFecha.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    renderHours();
  }
  $('#formError').hidden = true;
  update();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => fServicio.focus(), 50);
}
function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.addEventListener('click', (e) => {
  const orderBtn = e.target.closest('[data-order]');
  if (orderBtn) { e.stopPropagation(); openModal(orderBtn.dataset.order, orderBtn.dataset.sucursal); return; }
  if (e.target.closest('[data-close]')) closeModal();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closeLightbox(); } });
form.addEventListener('input', update);
form.addEventListener('change', (e) => {
  if (e.target === fFecha) renderHours();
  update();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const o = getOrder();
  const missing = [];
  if (!o.fecha) missing.push('el día');
  if (!o.hora) missing.push('la hora');
  if (!o.nombre) missing.push('tu nombre');
  if (missing.length) {
    const err = $('#formError');
    err.textContent = 'Falta completar: ' + missing.join(', ') + '.';
    err.hidden = false;
    return;
  }
  window.open(waUrl(buildMessage(o)), '_blank', 'noopener');
  commitOrderNumber(orderNumber);
  orderNumber = nextOrderNumber();
  form.reset();
  closeModal();
});

// Barberos del local (se editan en /admin → Ajustes)
const fBarbero = $('#fBarbero');
fBarbero.innerHTML = '<option value="">El que esté disponible</option>' +
  (TIENDA.barberos || []).map((b) => `<option>${esc(b)}</option>`).join('');

// Links directos a WhatsApp
['#footerWa', '#ctaWa', '#waFloat'].forEach((s) => { const el = $(s); if (el) el.href = waUrl(`Hola ${TIENDA.nombre}! 💈 Quiero hacer una consulta`); });
$('#year').textContent = new Date().getFullYear();

// ===== ABIERTO / CERRADO (hora de Chile) =====
(function openStatus() {
  const now = chileNow();
  const h = HORARIO(now.day);
  const open = !!h && now.min >= toMin(h[0]) && now.min < toMin(h[1]);
  const el = $('#openStatus');
  el.textContent = open ? 'Abierto ahora' : 'Cerrado ahora';
  el.className = 'status ' + (open ? 'is-open' : 'is-closed');
  const today = document.querySelector(`#hoursList [data-day="${now.day}"]`);
  if (today) today.classList.add('is-today');

  // Próxima apertura para el texto del hero
  let next = '';
  if (!open) {
    for (let i = 0; i < 7; i++) {
      const d = (now.day + i) % 7, hh = HORARIO(d);
      if (hh && (i > 0 || now.min < toMin(hh[0]))) { next = `${i === 0 ? 'hoy' : i === 1 ? 'mañana' : DIAS[d]} a las ${hh[0]}`; break; }
    }
  }
  $('#heroStatus').textContent = open ? 'Abierto ahora' : 'Cerrado ahora';
  $('#heroStatus').style.color = open ? '#4ADE80' : '';
  $('#heroStatusSub').textContent = open ? `Hoy hasta las ${h[1]} hrs` : next ? `Abrimos ${next}` : '';
})();

// ===== MAPA POR SUCURSAL =====
$$('.branch').forEach((b) => b.addEventListener('click', (e) => {
  if (e.target.closest('a, button')) return;
  $$('.branch').forEach((x) => x.classList.toggle('is-active', x === b));
  $('#mapFrame').src = `https://maps.google.com/maps?q=${b.dataset.map}&z=16&output=embed`;
}));

// ===== GALERÍA =====
const lb = $('#lightbox');
function closeLightbox() { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); }
$('#gallery')?.addEventListener('click', (e) => {
  const shot = e.target.closest('.shot');
  if (!shot) return;
  const img = shot.querySelector('img');
  $('#lbImg').src = img.src;
  $('#lbImg').alt = img.alt;
  $('#lbCap').textContent = shot.dataset.caption || '';
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
});
lb.addEventListener('click', (e) => { if (e.target === lb || e.target.closest('[data-lb-close]')) closeLightbox(); });

// ===== MENÚ MÓVIL =====
const navLinks = $('#navLinks');
const navToggle = $('#navToggle');
navToggle.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
});
navLinks.addEventListener('click', (e) => {
  if (e.target.closest('a')) { navLinks.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); }
});

// ===== ANIMACIONES AL HACER SCROLL =====
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el, i) => { el.style.transitionDelay = `${(i % 4) * 70}ms`; io.observe(el); });

  // Resalta la sección actual en el menú
  const links = $$('.nav__links a');
  const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-current', a.getAttribute('href') === '#' + en.target.id));
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((a) => { const s = document.querySelector(a.getAttribute('href')); if (s) spy.observe(s); });
} else {
  $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
}

// ===== CARGA DEL CATÁLOGO =====
async function loadProducts() {
  try {
    const res = await fetch('data/catalogo.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const categorias = Array.isArray(data.categorias) ? data.categorias : [];

    const tagsOf = {};
    categorias.forEach((c) => (c.productos || []).forEach((id) => (tagsOf[id] = tagsOf[id] || []).push(c.id)));

    FILTERS = [['todos', 'Todos'], ...categorias.map((c) => [c.id, c.nombre])];
    PRODUCTS = (data.productos || []).map((p) => ({
      id: p.id,
      name: p.nombre,
      price: Number(p.precio) || 0,
      img: (p.foto || 'img/logo.jpg').replace(/^\//, ''),
      desc: p.descripcion || '',
      items: Array.isArray(p.incluye) ? p.incluye : [],
      tags: tagsOf[p.id] || [],
      badge: p.etiqueta || '',
      agotado: !!p.agotado,
    }));
  } catch (e) {
    console.error(e);
    grid.innerHTML = '<p class="muted">No se pudo cargar la lista de servicios. Intenta recargar la página.</p>';
  }
  renderFilters('todos');
  renderProducts('todos');
  renderServiceOptions();
}

loadProducts();
