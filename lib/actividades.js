import { readSheet } from './sheets';
import { TABS } from './constants';
import { getCurso } from './fichas';

// Lee la columna "Preguntas JSON", compatible con los dos formatos:
//  - viejo: un array de preguntas  -> { clase: '', preguntas: [...] }
//  - nuevo: un objeto { clase, preguntas }
export function parseActDef(raw) {
  let data;
  try { data = JSON.parse(raw || '[]'); } catch { data = []; }
  if (Array.isArray(data)) return { clase: '', preguntas: data };
  return { clase: data.clase || '', preguntas: Array.isArray(data.preguntas) ? data.preguntas : [] };
}

// Devuelve la definición de una actividad publicada por slug.
export async function getActividad(slug) {
  const filas = await readSheet(TABS.ACTIVIDADES);
  const f = filas.find((x) => x.Slug === slug);
  if (!f) return null;
  const { clase, preguntas } = parseActDef(f['Preguntas JSON']);
  return {
    slug: f.Slug,
    curso: f.Curso,
    titulo: f['Título'] || 'Actividad',
    clase,
    estado: f.Estado || 'Publicada',
    preguntas // [{ pregunta, opciones:[...], correcta: idx }]
  };
}

// Corrige las respuestas del estudiante contra la definición. respuestas = { [i]: idxElegido }
export function corregir(preguntas, respuestas) {
  let puntaje = 0;
  const detalle = preguntas.map((p, i) => {
    const elegido = respuestas ? respuestas[i] : undefined;
    const ok = elegido != null && Number(elegido) === Number(p.correcta);
    if (ok) puntaje++;
    return { i, elegido, correcta: p.correcta, ok };
  });
  return { puntaje, total: preguntas.length, detalle };
}

export { getCurso };
