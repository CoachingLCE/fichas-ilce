import { readSheet } from './sheets';
import { TABS } from './constants';
import { getCurso } from './fichas';

// Devuelve la definición de una actividad publicada por slug.
export async function getActividad(slug) {
  const filas = await readSheet(TABS.ACTIVIDADES);
  const f = filas.find((x) => x.Slug === slug);
  if (!f) return null;
  let preguntas = [];
  try { preguntas = JSON.parse(f['Preguntas JSON'] || '[]'); } catch { preguntas = []; }
  return {
    slug: f.Slug,
    curso: f.Curso,
    titulo: f['Título'] || 'Actividad',
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
