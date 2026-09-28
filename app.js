// Barbería O'Higgins · interacción de la web (sin librerías)
// Los datos (horario, servicios, equipo, galería) los escribe scripts/build.mjs en <script id="web-data">
const DATA = JSON.parse(document.getElementById('web-data')?.textContent || '{}');
document.documentElement.classList.add('js');

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clp = (n) => '$' + Number(n).toLocaleString('es-CL');
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const REDUCIR = matchMedia('(prefers-reduced-motion: reduce)').matches;
// api.whatsapp.com y no wa.me: la redirección de wa.me rompe los emojis del mensaje
const waUrl = (text) => `https://api.whatsapp.com/send?phone=${DATA.whatsapp}&text=${encodeURIComponent(text)}`;
const toMin = (t) => { const [h, m] = String(t).split(':').map(Number); return h * 60 + (m || 0); };
const fmtMin = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const duracionTxt = (m) => (!m ? '' : m < 60 ? `${m} min` : m % 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m / 60} h`);
const horarioDe = (day) => (DATA.horario || {})[day] || null; // [abre, cierra] o null (cerrado)

// Fecha y hora actuales en Chile, aunque el visitante esté en otro huso horario
function chileNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', weekday: 'short',
  }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { iso: `${p.year}-${p.month}-${p.day}`, day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday), min: Number(p.hour) * 60 + Number(p.minute) };
}
const dayOfIso = (iso) => new Date(iso + 'T12:00:00').getDay();
const addDays = (iso, n) => { const d = new Date(iso + 'T12:00:00'); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// ===== Cabecera y menú =====
const siteHead = $('#siteHead');
const onScroll = () => siteHead && siteHead.classList.toggle('is-scrolled', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true });
onScroll();

const burger = $('#burger');
function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  burger?.setAttribute('aria-expanded', String(open));
  burger?.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
}
burger?.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
$('#nav')?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });

// ===== Estado: abierto / cerrado (hora de Chile) =====
(function estado() {
  const now = chileNow();
  const h = horarioDe(now.day);
  const open = !!h && now.min >= toMin(h[0]) && now.min < toMin(h[1]);
  let next = '';
  if (!open) {
    for (let i = 0; i < 8; i++) {
      const d = (now.day + i) % 7, hh = horarioDe(d);
      if (hh && (i > 0 || now.min < toMin(hh[0]))) { next = `${i === 0 ? 'hoy' : i === 1 ? 'mañana' : 'el ' + DIAS[d]} a las ${hh[0]}`; break; }
    }
  }
  const set = (sel, txt) => $$(sel).forEach((el) => { el.textContent = txt; });
  $$('[data-status]').forEach((el) => { el.textContent = open ? 'Abierto ahora' : 'Cerrado ahora'; el.classList.add(open ? 'is-open' : 'is-closed'); });
  $$(`[data-hours] [data-day="${now.day}"]`).forEach((li) => li.classList.add('is-today'));
  set('[data-status-line]', open ? `Abierto hoy hasta las ${h[1]}` : next ? `Cerrado · abrimos ${next}` : 'Cerrado');
  set('[data-status-word]', open ? 'Abierto' : 'Cerrado');
  $$('[data-status-word]').forEach((el) => el.classList.toggle('is-open', open));
  set('[data-status-sub]', open ? `Hoy hasta las ${h[1]} hrs` : next ? `Abrimos ${next}` : '');
  set('[data-status-today]', open ? `Abierto hasta las ${h[1]}` : 'Cerrado ahora');
  set('[data-status-next]', open ? `Hoy de ${h[0]} a ${h[1]} hrs` : next ? `Abrimos ${next}` : '');
})();

// ===== Portada: fotos que se van turnando =====
(function heroSlider() {
  const hero = $('.hero');
  const slides = $$('.hero__slide');
  if (!hero || slides.length < 2) return;
  const dots = $$('.hero__dot');
  const num = $('#heroNum');
  let i = 0, timer = null;
  function go(n) {
    i = (n + slides.length) % slides.length;
    slides.forEach((s, k) => s.classList.toggle('is-active', k === i));
    dots.forEach((d, k) => {
      d.classList.remove('is-active');
      if (k === i) { void d.offsetWidth; d.classList.add('is-active'); } // reinicia la barra de progreso
    });
    if (num) num.textContent = String(i + 1).padStart(2, '0');
    // precarga la siguiente
    const nextImg = slides[(i + 1) % slides.length].querySelector('img');
    if (nextImg && nextImg.loading === 'lazy') nextImg.loading = 'eager';
  }
  const start = () => { if (!REDUCIR) { clearInterval(timer); timer = setInterval(() => go(i + 1), 6000); } };
  const stop = () => clearInterval(timer);
  dots.forEach((d) => d.addEventListener('click', () => { go(Number(d.dataset.go)); start(); }));
  hero.addEventListener('mouseenter', () => { stop(); hero.classList.add('is-paused'); });
  hero.addEventListener('mouseleave', () => { go(i); start(); hero.classList.remove('is-paused'); });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  go(0); start();
})();

// ===== Carta de precios: pestañas =====
const menus = $('#menus');
function setTab(cat) {
  if (!menus) return;
  $$('.tab').forEach((t) => { const on = t.dataset.cat === cat; t.classList.toggle('is-active', on); t.setAttribute('aria-selected', String(on)); });
  $$('.menu', menus).forEach((m) => { m.hidden = cat !== 'todos' && m.dataset.group !== cat; });
  menus.classList.toggle('is-single', cat !== 'todos');
}
$('.tabs')?.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) setTab(t.dataset.cat); });
document.addEventListener('click', (e) => { const a = e.target.closest('[data-tab]'); if (a && menus) setTab(a.dataset.tab); });

// ===== Ventana de reserva =====
const modal = $('#modal');
const fServicio = $('#fServicio'), fFecha = $('#fFecha'), fHora = $('#fHora'), fBarbero = $('#fBarbero'), fNombre = $('#fNombre');
const SERV = DATA.servicios || [];
const EQUIPO = DATA.equipo || [];
const findServ = (id) => SERV.find((s) => s.id === id);

if (fServicio) {
  const cats = DATA.categorias || [];
  fServicio.innerHTML = '<option value="">Aún no lo sé, quiero asesoría</option>' + cats.map((c) => `
    <optgroup label="${esc(c.n)}">${SERV.filter((s) => s.c === c.id).map((s) => `<option value="${esc(s.id)}">${esc(s.n)}${s.p ? ` · ${clp(s.p)}` : ''}</option>`).join('')}</optgroup>`).join('');
}

function renderBarberos() {
  const s = findServ(fServicio.value);
  const prev = fBarbero.value;
  const lista = s && s.b.length ? EQUIPO.filter((e) => s.b.includes(e.id)) : EQUIPO;
  fBarbero.innerHTML = '<option value="">El primero disponible</option>' + lista.map((e) => `<option value="${esc(e.id)}"${e.id === prev ? ' selected' : ''}>${esc(e.n)}</option>`).join('');
}
function renderInfo() {
  const s = findServ(fServicio.value);
  const box = $('#svcInfo');
  if (!s) { box.hidden = true; return; }
  const con = s.b.length ? `Con ${EQUIPO.filter((e) => s.b.includes(e.id)).map((e) => e.n).join(', ').replace(/, ([^,]*)$/, ' y $1')}` : 'Con cualquier barbero';
  box.innerHTML = `<span><b>${s.p ? clp(s.p) : 'A consultar'}</b></span><span>${duracionTxt(s.d)}</span><span>${esc(con)}</span>`;
  box.hidden = false;
}
// Horas del día elegido según el horario de ese día (si es hoy, solo las que faltan)
function renderHoras() {
  const prev = fHora.value;
  const now = chileNow();
  if (!fFecha.value) { fHora.innerHTML = '<option value="">Elige un día</option>'; return; }
  const h = horarioDe(dayOfIso(fFecha.value));
  if (!h) { fHora.innerHTML = '<option value="">Cerrado ese día</option>'; return; }
  const s = findServ(fServicio.value);
  const dur = Math.max(30, (s && s.d) || 30);
  const [abre, cierra] = h.map(toMin);
  const desde = fFecha.value === now.iso ? Math.max(abre, Math.ceil((now.min + 30) / 30) * 30) : abre;
  const slots = [];
  for (let m = desde; m <= cierra - dur; m += 30) slots.push(fmtMin(m));
  fHora.innerHTML = slots.length
    ? '<option value="">Elige una hora</option>' + slots.map((t) => `<option${t === prev ? ' selected' : ''}>${t}</option>`).join('')
    : '<option value="">No quedan horas ese día</option>';
}
function openModal(servId, barberoId) {
  if (!modal) return false;
  fServicio.value = servId && findServ(servId) ? servId : '';
  renderBarberos(); renderInfo();
  if (barberoId && [...fBarbero.options].some((o) => o.value === barberoId)) fBarbero.value = barberoId;
  const now = chileNow();
  fFecha.min = now.iso;
  if (!fFecha.value || fFecha.value < now.iso) fFecha.value = now.iso;
  renderHoras();
  // Si hoy ya no quedan horas, propone el siguiente día con atención
  for (let i = 1; i <= 7 && fHora.options.length < 2; i++) { fFecha.value = addDays(now.iso, i); renderHoras(); }
  $('#waError').hidden = true;
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => fServicio.focus({ preventScroll: true }), 60);
  return true;
}
function closeModal() {
  if (!modal?.classList.contains('is-open')) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = document.body.classList.contains('menu-open') ? 'hidden' : '';
}
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-reservar]');
  if (btn) { if (openModal(btn.dataset.reservar, btn.dataset.barbero)) { e.preventDefault(); setMenu(false); } return; }
  if (e.target.closest('[data-close]')) closeModal();
});
fServicio?.addEventListener('change', () => { renderBarberos(); renderInfo(); renderHoras(); });
fFecha?.addEventListener('change', renderHoras);

$('#waForm')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const falta = [];
  if (!fFecha.value) falta.push('el día');
  if (!fHora.value) falta.push('la hora');
  if (!fNombre.value.trim()) falta.push('tu nombre');
  const err = $('#waError');
  if (falta.length) { err.textContent = `Falta completar ${falta.join(', ').replace(/, ([^,]*)$/, ' y $1')}.`; err.hidden = false; return; }
  err.hidden = true;
  const s = findServ(fServicio.value);
  const b = EQUIPO.find((x) => x.id === fBarbero.value);
  const L = [`¡Hola ${DATA.nombre}! 💈 Quiero pedir una hora:`, ''];
  L.push(`✂️ *Servicio:* ${s ? `${s.n}${s.p ? ` (${clp(s.p)} · ${duracionTxt(s.d)})` : ''}` : 'Aún no lo sé, quiero asesoría'}`);
  L.push(`📅 *Día:* ${DIAS[dayOfIso(fFecha.value)]} ${fFecha.value.split('-').reverse().slice(0, 2).join('/')}`);
  L.push(`🕒 *Hora:* ${fHora.value} aprox.`);
  L.push(`💈 *Barbero:* ${b ? b.n : 'El primero disponible'}`);
  L.push(`🙋‍♂️ *Nombre:* ${fNombre.value.trim()}`);
  L.push('', '¿Me confirman si hay disponibilidad? 🙌');
  window.open(waUrl(L.join('\n')), '_blank', 'noopener');
  closeModal();
});

// ===== Formulario de contacto (abre WhatsApp con el mensaje) =====
const cForm = $('#contactForm');
if (cForm) {
  const cNombre = $('#cNombre'), cMotivo = $('#cMotivo'), cMensaje = $('#cMensaje'), cMail = $('#cMail');
  const mailBase = cMail?.getAttribute('href');
  const syncMail = () => {
    if (!cMail) return;
    const body = `${cMensaje.value.trim()}\n\n${cNombre.value.trim()}`.trim();
    cMail.href = `${mailBase}?subject=${encodeURIComponent(`${cMotivo.value} · ${DATA.nombre}`)}${body ? `&body=${encodeURIComponent(body)}` : ''}`;
  };
  cForm.addEventListener('input', syncMail);
  cForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const err = $('#cError');
    const falta = [];
    if (!cNombre.value.trim()) falta.push('tu nombre');
    if (!cMensaje.value.trim()) falta.push('el mensaje');
    if (falta.length) { err.textContent = `Falta completar ${falta.join(' y ')}.`; err.hidden = false; return; }
    err.hidden = true;
    const txt = [`¡Hola ${DATA.nombre}! 👋`, '', `🙋‍♂️ *Nombre:* ${cNombre.value.trim()}`, `📌 *Motivo:* ${cMotivo.value}`, `💬 *Mensaje:* ${cMensaje.value.trim()}`].join('\n');
    window.open(waUrl(txt), '_blank', 'noopener');
  });
}

// ===== Galería: visor de fotos =====
const lb = $('#lightbox');
const FOTOS = DATA.galeria || [];
let lbIndex = 0;
function showFoto(n) {
  lbIndex = (n + FOTOS.length) % FOTOS.length;
  const f = FOTOS[lbIndex];
  $('#lbImg').src = f.foto;
  $('#lbImg').alt = f.texto || `Corte hecho en ${DATA.nombre}`;
  $('#lbCap').textContent = f.texto ? `${f.texto} · ${lbIndex + 1}/${FOTOS.length}` : `${lbIndex + 1}/${FOTOS.length}`;
}
function closeLightbox() { if (!lb?.classList.contains('is-open')) return; lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
$('#gallery')?.addEventListener('click', (e) => {
  const shot = e.target.closest('[data-shot]');
  if (!shot || !FOTOS.length) return;
  showFoto(Number(shot.dataset.shot));
  lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
  $('.lightbox__close', lb).focus();
});
lb?.addEventListener('click', (e) => {
  const b = e.target.closest('[data-lb]');
  if (b) { if (b.dataset.lb === 'close') closeLightbox(); else showFoto(lbIndex + (b.dataset.lb === 'next' ? 1 : -1)); return; }
  if (e.target === lb) closeLightbox();
});
let touchX = null;
lb?.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }, { passive: true });
lb?.addEventListener('touchend', (e) => {
  if (touchX === null) return;
  const dx = e.changedTouches[0].clientX - touchX; touchX = null;
  if (Math.abs(dx) > 50) showFoto(lbIndex + (dx < 0 ? 1 : -1));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); closeLightbox(); setMenu(false); }
  if (lb?.classList.contains('is-open') && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) showFoto(lbIndex + (e.key === 'ArrowRight' ? 1 : -1));
});

// ===== Reseñas: carrusel =====
(function reviews() {
  const track = $('#reviews');
  if (!track) return;
  const paso = () => { const c = track.querySelector('.review'); return c ? c.getBoundingClientRect().width + 22 : track.clientWidth; };
  const mover = (dir) => {
    const fin = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    if (dir > 0 && fin) track.scrollTo({ left: 0 }); else track.scrollBy({ left: dir * paso() });
  };
  $$('[data-rev]').forEach((b) => b.addEventListener('click', () => mover(b.dataset.rev === 'next' ? 1 : -1)));
  if (REDUCIR) return;
  let timer = setInterval(() => mover(1), 7000);
  const pausa = () => clearInterval(timer);
  const sigue = () => { clearInterval(timer); timer = setInterval(() => mover(1), 7000); };
  track.addEventListener('mouseenter', pausa); track.addEventListener('mouseleave', sigue);
  track.addEventListener('focusin', pausa); track.addEventListener('focusout', sigue);
  track.addEventListener('touchstart', pausa, { passive: true });
})();

// ===== Video: se reproduce solo cuando está a la vista =====
(function video() {
  const v = $('#reelVideo'), btn = $('#reelToggle');
  if (!v) return;
  let pausadoPorUsuario = REDUCIR;
  const icono = () => {
    const playing = !v.paused;
    btn.innerHTML = `<svg class="ic ic--fill" aria-hidden="true"><use href="#i-${playing ? 'pausa' : 'play'}"/></svg>`;
    btn.setAttribute('aria-label', playing ? 'Pausar video' : 'Reproducir video');
  };
  v.addEventListener('play', icono); v.addEventListener('pause', icono);
  btn.addEventListener('click', () => { if (v.paused) { pausadoPorUsuario = false; v.play(); } else { pausadoPorUsuario = true; v.pause(); } });
  icono();
  if (!('IntersectionObserver' in window)) return;
  new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting && !pausadoPorUsuario) { v.preload = 'auto'; v.play().catch(() => {}); } else if (!en.isIntersecting) v.pause();
  }), { threshold: .35 }).observe(v);
})();

// ===== Mapas: se cargan al acercarse (la página abre más rápido) =====
(function mapas() {
  const frames = $$('iframe[data-src]');
  const cargar = (f) => { f.src = f.dataset.src; f.removeAttribute('data-src'); };
  if (!('IntersectionObserver' in window)) { frames.forEach(cargar); return; }
  const io = new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { cargar(en.target); io.unobserve(en.target); } }), { rootMargin: '400px' });
  frames.forEach((f) => io.observe(f));
})();

// ===== Animaciones al hacer scroll y sección actual en el menú =====
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
  }), { threshold: .12, rootMargin: '0px 0px -40px 0px' });
  $$('[data-reveal]').forEach((el) => {
    const hermanos = [...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal'));
    el.style.transitionDelay = `${Math.min(hermanos.indexOf(el), 5) * 80}ms`;
    io.observe(el);
  });
  if (document.body.dataset.page === 'inicio') {
    const links = $$('.nav > a[data-nav]');
    const spy = new IntersectionObserver((entries) => entries.forEach((en) => {
      if (en.isIntersecting) links.forEach((a) => a.classList.toggle('is-current', a.dataset.nav === en.target.id));
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['nosotros', 'precios', 'equipo', 'galeria', 'resenas'].forEach((id) => { const s = document.getElementById(id); if (s) spy.observe(s); });
  }
} else {
  $$('[data-reveal]').forEach((el) => el.classList.add('is-in'));
}
