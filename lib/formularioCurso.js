// Curso de un formulario (pedido de Diego: un formulario puede NO estar relacionado con ningún curso o programa).
// Funciones puras y SIN imports a propósito: las usa el formulario público (componente de cliente) y la API (servidor), y
// lib/formularios.js importa la lectura de Google Sheets, que no puede viajar al navegador.

/**
 * Curso con el que arranca la respuesta de un formulario.
 *  - Si el formulario tiene el curso fijado → ese.
 *  - Si no → vacío ('' = sin curso). Antes arrancaba SIEMPRE con el primero de la lista ("Coaching Deportivo"): una respuesta a
 *    un formulario sin relación con ningún curso quedaba guardada con ese curso, y en uno que pregunta el curso venía
 *    preseleccionado sin que la persona lo hubiera elegido.
 */
export function cursoInicial(form) {
  return (form && form.cursoFijo) ? String(form.cursoFijo) : '';
}

/** Curso que se guarda con la respuesta: el fijo del formulario manda sobre lo que mande el navegador. */
export function cursoAGuardar(form, respuestas) {
  if (form && form.cursoFijo) return String(form.cursoFijo);
  return String((respuestas && respuestas.curso) || '').trim();
}
