// Fecha de creación legible (dd/mm/aaaa) a partir de la columna "Creado" de la Sheet.
// v1.43.0 (pedido de Diego: "EN ALGUN LADO DEJAR REGISTRADO CUANDO FUE CREADA"). Devuelve '' si no hay fecha
// (filas anteriores a la columna "Creado", o pegadas a mano en la Sheet sin ese dato).
export function fechaCreacion(iso) {
  if (!iso) return '';
  const t = String(iso).trim();
  const d = new Date(t.length <= 10 ? `${t.slice(0, 10)}T00:00:00` : t);
  if (isNaN(d)) return '';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Fecha "efectiva" de creación: la columna "Creado" si existe; si está vacía (filas pegadas a mano en la Sheet o anteriores a esa
// columna) se usa "Actualizado", que en esas filas es la fecha en que se cargaron. Se marca como aproximada para no engañar.
export function creadaEfectiva(creado, actualizado) {
  const exacta = fechaCreacion(creado);
  if (exacta) return { texto: exacta, aprox: false, ms: Date.parse(String(creado).trim().length <= 10 ? `${String(creado).trim().slice(0, 10)}T00:00:00` : creado) || 0 };
  const aprox = fechaCreacion(actualizado);
  if (aprox) return { texto: aprox, aprox: true, ms: Date.parse(String(actualizado).trim().length <= 10 ? `${String(actualizado).trim().slice(0, 10)}T00:00:00` : actualizado) || 0 };
  return { texto: '', aprox: false, ms: 0 };
}
