import { readSheet, asegurarPestana } from './sheets';
import { TABS, HEADERS } from './constants';
import { parseEvalDef, calcularElegibilidad } from './evaluacionesLogica';

// Lado servidor de las Evaluaciones finales (lee la planilla). Las reglas puras están en evaluacionesLogica.js.

// Crea las pestañas la primera vez (después es una consulta en memoria). Todo lo que lee o escribe evaluaciones pasa primero por acá.
export async function prepararPestanas() {
  await asegurarPestana(TABS.EVALUACIONES, HEADERS[TABS.EVALUACIONES]);
  await asegurarPestana(TABS.INTENTOS_EVAL, HEADERS[TABS.INTENTOS_EVAL]);
  await asegurarPestana(TABS.HABILITACIONES_EVAL, HEADERS[TABS.HABILITACIONES_EVAL]);
}

export const normEmail = (v) => String(v || '').trim().toLowerCase();
export const normTitulo = (v) => String(v || '').trim().toLowerCase();

/** Lee una evaluación publicada/borrador por slug (o null). */
export async function getEvaluacion(slug) {
  await prepararPestanas();
  const filas = await readSheet(TABS.EVALUACIONES);
  const f = filas.find((x) => x.Slug && x.Slug === slug);
  if (!f) return null;
  return { slug: f.Slug, curso: f.Curso || '', titulo: f['Título'] || 'Evaluación final', estado: f.Estado || 'Borrador', actualizado: f.Actualizado || '', creado: f.Creado || '', ...parseEvalDef(f['Definición JSON']) };
}

/** Fila de la planilla → intento para la lógica de elegibilidad. */
export function intentoDeFila(f) {
  const inicioMs = Date.parse(f.Inicio || '') || 0;
  const finMs = Date.parse(f.Fin || '') || 0;
  const resultado = String(f.Resultado || '').toLowerCase();
  return {
    id: f.ID, estado: f.Estado === 'Finalizado' ? 'Finalizado' : 'En curso',
    inicioMs, finMs, aprobado: resultado === 'aprobado',
    _fila: f
  };
}

/** Todos los intentos de una evaluación (por título, que es lo que se guarda en la fila). */
export async function intentosDeEvaluacion(titulo, { noCache = false } = {}) {
  const filas = await readSheet(TABS.INTENTOS_EVAL, { noCache });
  const t = normTitulo(titulo);
  return filas.filter((f) => f.ID && normTitulo(f['Evaluación']) === t);
}

/** Intentos extra habilitados a mano, por email (suma de la columna "Intentos extra"). */
export async function extrasPorEmail(titulo, { noCache = false } = {}) {
  const filas = await readSheet(TABS.HABILITACIONES_EVAL, { noCache });
  const t = normTitulo(titulo);
  const mapa = {};
  filas.forEach((f) => {
    if (normTitulo(f['Evaluación']) !== t) return;
    const e = normEmail(f.Email);
    if (!e) return;
    mapa[e] = (mapa[e] || 0) + (Math.floor(Number(f['Intentos extra'])) || 0);
  });
  return mapa;
}

/** Elegibilidad de UNA persona para UNA evaluación, leyendo la planilla (sin caché: se usa para decidir). */
export async function elegibilidadDe(ev, email, ahoraMs = Date.now()) {
  const e = normEmail(email);
  const [filas, extras] = await Promise.all([intentosDeEvaluacion(ev.titulo, { noCache: true }), extrasPorEmail(ev.titulo, { noCache: true })]);
  const suyos = filas.filter((f) => normEmail(f.Email) === e).map(intentoDeFila);
  const res = calcularElegibilidad({ def: ev, intentos: suyos, extra: extras[e] || 0, ahoraMs });
  return { res, suyos };
}

/** Identificador de intento difícil de adivinar (se usa para retomar y para enviar). */
export function nuevoIdIntento() {
  // eslint-disable-next-line global-require
  const { randomBytes } = require('crypto');
  return 'I' + randomBytes(7).toString('base64url').replace(/[^A-Za-z0-9]/g, 'x').slice(0, 10).toUpperCase();
}
