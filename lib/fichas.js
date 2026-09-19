import { CURSOS, EDICIONES_DEFAULT } from './constants';

// Definición de la ficha por curso. Por ahora hardcodeada (patrón "AMBAS": defaults en código;
// más adelante se combina con la pestaña Fichas / el constructor visual).
const TEXTOS = {
  'coaching-deportivo': {
    bienvenida:
      '¡Nos alegra tenerte acá! Toma unos minutos y podés seguir más tarde sin perder nada: tu ficha se guarda sola.'
  }
};

export function getCurso(slug) {
  return CURSOS.find((c) => c.slug === slug) || null;
}

export function getEdiciones(slug) {
  return EDICIONES_DEFAULT[slug] || [];
}

export function getFichaDef(slug) {
  const curso = getCurso(slug);
  if (!curso) return null;
  return {
    slug,
    curso: curso.nombre,
    titulo: `Ficha de inscripción — ${curso.nombre}`,
    bienvenida: (TEXTOS[slug] && TEXTOS[slug].bienvenida) ||
      '¡Nos alegra tenerte acá! Completá tu ficha de inscripción. Se guarda sola, podés seguir más tarde.',
    ediciones: getEdiciones(slug)
  };
}

// Versión "en vivo": combina los defaults con lo guardado en la pestaña Fichas (constructor).
// Se usa en la página pública para reflejar título, bienvenida, ediciones y estado reales.
import { readSheet } from './sheets';
import { TABS } from './constants';

export async function getFichaDefLive(slug) {
  const base = getFichaDef(slug);
  if (!base) return null;
  try {
    const filas = await readSheet(TABS.FICHAS);
    const fila = filas.find((f) => f.Slug === slug);
    if (fila) {
      const saved = JSON.parse(fila['Definición JSON'] || '{}');
      return {
        ...base,
        titulo: saved.titulo || base.titulo,
        bienvenida: saved.bienvenida || base.bienvenida,
        ediciones: Array.isArray(saved.ediciones) && saved.ediciones.length ? saved.ediciones : base.ediciones,
        estado: saved.estado || 'Publicada',
        // Selección/orden de campos y configuración armados en el Constructor por pasos.
        // Todavía no se usan para render en esta página pública (ver nota en Constructor.jsx);
        // se guardan acá para no perder el trabajo mientras se conecta en un lote siguiente.
        campos: Array.isArray(saved.campos) ? saved.campos : undefined,
        config: saved.config || undefined
      };
    }
  } catch { /* si falla, usamos los defaults */ }
  return { ...base, estado: 'Publicada' };
}
