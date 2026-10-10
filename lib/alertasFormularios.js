// Alertas de formularios sin respuestas (pedido de Diego): marcar los formularios PUBLICADOS que llevan más de un mes (30 días)
// sin recibir ninguna respuesta. Función pura SIN imports: la usan la API (solapa "Alertas" de Reportes) y el correo automático
// de los viernes, así los dos muestran exactamente la misma lista.
//
// Cómo se mide: desde la fecha de la ÚLTIMA respuesta; si nunca recibió ninguna, desde que se creó el formulario. Un formulario
// recién creado no alerta aunque todavía no tenga respuestas. Si no se sabe cuándo se creó (los formularios cargados antes de
// que existiera la columna "Creado") y nunca tuvo respuestas, igual se marca, avisando que no se sabe desde cuándo.
//
// OJO (limitación que ya existía): las respuestas se asocian al formulario por su TÍTULO. Si alguien le cambia el título a un
// formulario, sus respuestas anteriores quedan con el título viejo y el formulario puede figurar acá aunque sí reciba respuestas.

export const DIAS_SIN_RESPUESTAS = 30;
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const dia10 = (v) => { const s = String(v == null ? '' : v).slice(0, 10); return ISO.test(s) ? s : ''; };
const aMs = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const normTitulo = (v) => String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim();

/**
 * @param {{ formularios: Array<{slug,titulo,estado,creado,cursoFijo}>, respuestas: Array<{fecha,formulario}>, hoy: string (YYYY-MM-DD), dias?: number }} p
 * @returns {{ alertas: Array, publicados: number, dias: number }}
 */
export function formulariosSinRespuestas({ formularios, respuestas, hoy, dias = DIAS_SIN_RESPUESTAS }) {
  const hoyOk = dia10(hoy);
  const umbral = Number.isFinite(Number(dias)) && Number(dias) >= 1 ? Math.floor(Number(dias)) : DIAS_SIN_RESPUESTAS;
  if (!hoyOk) return { alertas: [], publicados: 0, dias: umbral };
  const ultimaPorTitulo = {};
  (respuestas || []).forEach((r) => {
    if (!r) return;
    const f = dia10(r.fecha); const k = normTitulo(r.formulario);
    if (!f || !k) return;
    if (!ultimaPorTitulo[k] || f > ultimaPorTitulo[k]) ultimaPorTitulo[k] = f;
  });
  const publicados = (formularios || []).filter((f) => f && f.slug && (f.estado || 'Publicada') === 'Publicada');
  const alertas = [];
  publicados.forEach((f) => {
    const ultima = ultimaPorTitulo[normTitulo(f.titulo)] || '';
    const desde = ultima || dia10(f.creado);
    if (!desde) { alertas.push({ slug: f.slug, titulo: f.titulo || f.slug, curso: f.cursoFijo || '', ultimaRespuesta: '', desde: '', diasSin: null, nunca: true, sinFecha: true }); return; }
    const diasSin = Math.floor((aMs(hoyOk) - aMs(desde)) / 86400000);
    if (diasSin > umbral) alertas.push({ slug: f.slug, titulo: f.titulo || f.slug, curso: f.cursoFijo || '', ultimaRespuesta: ultima, desde, diasSin, nunca: !ultima, sinFecha: false });
  });
  // Los que más tiempo llevan sin respuestas primero; los que no se sabe desde cuándo, al final.
  alertas.sort((a, b) => (a.sinFecha === b.sinFecha ? (b.diasSin || 0) - (a.diasSin || 0) : a.sinFecha ? 1 : -1) || String(a.titulo).localeCompare(String(b.titulo), 'es'));
  return { alertas, publicados: publicados.length, dias: umbral };
}
