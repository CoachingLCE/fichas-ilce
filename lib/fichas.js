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
