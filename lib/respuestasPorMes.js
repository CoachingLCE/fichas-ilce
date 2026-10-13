// Respuestas por mes (pedido de Diego: "que se abran las respuestas del mes; con Ver más se abre el mes anterior, así no se satura al cargar; con todo hagamos así").
// Lógica compartida por las pantallas de "Respuestas" (fichas, actividades y formularios): se muestra el mes MÁS RECIENTE que tenga respuestas, y cada "Ver más" suma el mes
// anterior. Funciones puras (sin imports), probadas aparte.

export const MESES_ES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

/** Mes de una fecha, como "2026-09". Sin fecha válida -> "sin-fecha". Una fecha sin hora ("2026-10-01") se lee tal cual: con new Date() se tomaría como UTC y en Argentina caería en el mes anterior. */
export function mesClave(iso) {
  const s = String(iso == null ? '' : iso).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const m = Number(s.slice(5, 7)); return m >= 1 && m <= 12 ? s.slice(0, 7) : 'sin-fecha'; }
  const d = new Date(s);
  if (!s || isNaN(d)) return 'sin-fecha';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function nombreMes(clave) {
  if (clave === 'sin-fecha') return 'sin fecha';
  const [y, m] = clave.split('-');
  const mes = MESES_ES[Number(m) - 1];
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}`;
}

// De más reciente a más viejo; "sin fecha" siempre al final.
const masRecientePrimero = (a, b) => (a === 'sin-fecha' ? 1 : b === 'sin-fecha' ? -1 : b.localeCompare(a));

/**
 * `items` ya filtrados; `fecha(item)` devuelve su fecha. Devuelve { visibles, mesesTotal, proximoMes: { clave, cantidad } | null }.
 * `mesesVistos` = cuántos meses mostrar (arranca en 1). `mostrarTodo` = true cuando hay una búsqueda o un filtro de fechas: ahí se muestra todo, porque se está buscando a alguien o algo puntual.
 * Los meses se ordenan por su fecha, no por el orden en que vienen los datos, así el "primer mes" es siempre el más reciente aunque la tabla esté ordenada por nombre.
 */
export function paginarPorMes(items, fecha, mesesVistos, mostrarTodo) {
  const lista = Array.isArray(items) ? items : [];
  const claves = [...new Set(lista.map((x) => mesClave(fecha(x))))].sort(masRecientePrimero);
  if (mostrarTodo) return { visibles: lista, mesesTotal: claves.length, proximoMes: null };
  const n = Math.max(1, mesesVistos | 0);
  const mostrar = new Set(claves.slice(0, n));
  const prox = claves[n] || null;
  return {
    visibles: lista.filter((x) => mostrar.has(mesClave(fecha(x)))),
    mesesTotal: claves.length,
    proximoMes: prox ? { clave: prox, cantidad: lista.filter((x) => mesClave(fecha(x)) === prox).length } : null
  };
}
