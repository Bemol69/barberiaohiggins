// Función de Vercel: consulta días y horas disponibles en la agenda online (AgendaPro)
// y devuelve solo lo necesario. Así la web no depende de los permisos del navegador (CORS).
//   /api/agenda?tipo=dias&sucursal=411379&servicio=2780592&desde=2026-09-28&hasta=2026-10-11
//   /api/agenda?tipo=horas&sucursal=411379&servicio=2780592&desde=2026-09-29
const BASE = 'https://agendapro.com/api_views/workflow/v2/service_providers';
const fecha = (v) => (/^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : '');
const digitos = (v) => (/^\d{1,12}$/.test(String(v || '')) ? String(v) : '');

export async function consultarAgenda({ tipo, sucursal, servicio, desde, hasta }) {
  const local = digitos(sucursal), serv = digitos(servicio), ini = fecha(desde), fin = fecha(hasta) || ini;
  if (!local || !serv || !ini || !['dias', 'horas'].includes(tipo)) return { status: 400, body: { error: 'Parámetros inválidos' } };
  const params = new URLSearchParams({
    start_date: ini, end_date: tipo === 'horas' ? ini : fin, local, services: JSON.stringify([serv]),
    providers: '{}', providers_array: '[]', bundled: '0', bundle_id: '0', ...(tipo === 'horas' ? { dates_and_providers: '[]' } : {}),
  });
  const r = await fetch(`${BASE}/${tipo === 'dias' ? 'available_days_sql_improved' : 'available_hours_sql_improved'}?${params}`, {
    headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) return { status: 502, body: { error: `Agenda respondió ${r.status}` } };
  const data = await r.json();
  if (tipo === 'dias') {
    return { status: 200, body: { dias: (Array.isArray(data) ? data : []).map((d) => ({ fecha: d.date, disponible: !!d.available })) } };
  }
  const vistas = new Set();
  const horas = ['morning_hours', 'afternoon_hours', 'evening_hours', 'night_hours'].flatMap((k) => data[k] || [])
    .filter((h) => h.status === 'hora-disponible' && h.start_block && !vistas.has(h.start_block) && vistas.add(h.start_block))
    .map((h) => ({ hora: h.start_block, barbero: h.available_provider || '' }));
  return { status: 200, body: { horas } };
}

export default async function handler(req, res) {
  try {
    const { status, body } = await consultarAgenda(req.query || {});
    res.setHeader('Cache-Control', status === 200 ? 's-maxage=60, stale-while-revalidate=120' : 'no-store');
    res.status(status).json(body);
  } catch (e) {
    res.setHeader('Cache-Control', 'no-store');
    res.status(502).json({ error: 'No se pudo consultar la agenda' });
  }
}
