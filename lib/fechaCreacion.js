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
