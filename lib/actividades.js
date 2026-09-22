import { readSheet } from './sheets';
import { TABS } from './constants';
import { getCurso } from './fichas';

// Una pregunta siempre normalizada a esta forma, sin importar de qué versión del
// formato viejo venga (así el resto del código nunca tiene que fijarse si "tipo"
// existe o no). 'vf' = Verdadero/Falso (2 opciones fijas); 'multiple' = opción múltiple.
function normPregunta(p) {
  const tipo = p && p.tipo === 'vf' ? 'vf' : 'multiple';
  const opciones = tipo === 'vf'
    ? ['Verdadero', 'Falso']
    : (Array.isArray(p?.opciones) && p.opciones.length ? p.opciones : ['', '', '']);
  const correctaNum = Number(p?.correcta);
  return { pregunta: p?.pregunta || '', tipo, opciones, correcta: Number.isFinite(correctaNum) ? correctaNum : 0 };
}

// Lee la columna "Preguntas JSON", compatible con los tres formatos que fue teniendo:
//  - v1: un array de preguntas                    -> { clase:'', preguntas:[...] }
//  - v2: { clase, preguntas }
//  - v3 (actual): { clase, edicion, fechaDisponible, mostrarResultado, preguntas }
// Los campos nuevos (edicion/fechaDisponible/mostrarResultado) no piden ninguna columna
// nueva en la Sheet — viven dentro de este mismo JSON, así una actividad vieja que nunca
// los tuvo simplemente cae en los valores por defecto de abajo.
export function parseActDef(raw) {
  let data;
  try { data = JSON.parse(raw || '[]'); } catch { data = []; }
  if (Array.isArray(data)) return { clase: '', edicion: '', fechaDisponible: '', mostrarResultado: true, intro: '', preguntas: data.map(normPregunta) };
  return {
    clase: data.clase || '',
    intro: data.intro || '',
    edicion: data.edicion || '',
    fechaDisponible: data.fechaDisponible || '',
    mostrarResultado: data.mostrarResultado !== false,
    preguntas: Array.isArray(data.preguntas) ? data.preguntas.map(normPregunta) : []
  };
}

// Hoy (fecha, no hora) en formato YYYY-MM-DD, para comparar contra "fechaDisponible".
function hoyISO() { return new Date().toISOString().slice(0, 10); }

// Estado que se le muestra a la persona (admin o estudiante), derivado del Estado guardado
// + fechaDisponible. "Programada" no se guarda en ningún lado: una actividad sigue siendo
// Publicada por dentro, solo que todavía no llegó su fecha.
export function estadoEfectivo(a) {
  if (a.estado === 'Publicada' && a.fechaDisponible && a.fechaDisponible > hoyISO()) return 'Programada';
  return a.estado || 'Publicada';
}

// Devuelve la definición de una actividad publicada por slug.
export async function getActividad(slug) {
  const filas = await readSheet(TABS.ACTIVIDADES);
  const f = filas.find((x) => x.Slug === slug);
  if (!f) return null;
  const { clase, intro, edicion, fechaDisponible, mostrarResultado, preguntas } = parseActDef(f['Preguntas JSON']);
  return {
    slug: f.Slug,
    curso: f.Curso,
    titulo: f['Título'] || 'Actividad',
    clase,
    intro,
    edicion,
    fechaDisponible,
    mostrarResultado,
    estado: f.Estado || 'Publicada',
    actualizado: f.Actualizado || '',
    preguntas // [{ pregunta, tipo, opciones:[...], correcta: idx }]
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
