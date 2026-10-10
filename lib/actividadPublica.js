// Lo que se le manda al navegador del ESTUDIANTE cuando abre una actividad (/actividad/[slug]).
// Seguridad: hasta ahora la página le pasaba al reproductor la actividad COMPLETA, con la respuesta correcta (`correcta`) de cada
// pregunta. Eso viaja al navegador (se ve en el código fuente de la página), así que cualquier estudiante podía leer las
// respuestas de una evaluación con nota antes de contestarla. El reproductor real no necesita ese dato: la corrección la hace
// SIEMPRE el servidor (/api/actividad). Solo la vista previa del constructor corrige "de mentira", y esa recibe los datos del
// editor, no de esta página.
// Función pura SIN imports (se puede probar sola).

/** Copia de la actividad sin la respuesta correcta de las preguntas. No modifica la original. */
export function actividadParaEstudiante(act) {
  if (!act || typeof act !== 'object') return act;
  const preguntas = Array.isArray(act.preguntas)
    ? act.preguntas.map((p) => { const { correcta, ...resto } = (p && typeof p === 'object') ? p : {}; return resto; })
    : [];
  return { ...act, preguntas };
}
