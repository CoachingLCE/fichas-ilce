// Variación contra el período anterior — UNA sola regla para todos los indicadores de ILCE (documento de auditoría, sistema visual, "Métricas"):
//   valor · variación contra el período anterior · VALOR ANTERIOR a la vista · y el color depende de si el cambio es BUENO, no de la flecha
//   (que las bajas bajen se muestra en verde; que las ausencias suban, en rojo).
// Antes cada app lo hacía a su manera (▲▼ en una, ↑↓ en otra; "vs mes anterior", "vs. mes anterior", "vs. período anterior"), ninguna mostraba siempre
// el valor anterior, y Fichas inventaba un "+100%" cuando el período anterior era 0. Función pura SIN imports, idéntica en las apps.

const nf = (n, dec = 1) => Number(n).toLocaleString('es-AR', { maximumFractionDigits: dec });
export const fmtNum = (n) => nf(n, 1);

/**
 * @param actual    valor del período actual
 * @param anterior  valor del período anterior
 * @param opts.invertido  true si SUBIR es malo (bajas, ausencias, postergaciones, pendientes)
 * @param opts.puntos     true si son porcentajes y se compara en puntos porcentuales (pp), no en % relativo
 */
export function calcularVariacion(actual, anterior, { invertido = false, puntos = false } = {}) {
  const a = Number(actual), p = Number(anterior);
  if (actual == null || anterior == null || actual === '' || anterior === '' || !Number.isFinite(a) || !Number.isFinite(p)) return { tipo: 'sin-dato', tono: 'neutro' };
  const tono = (delta) => (delta === 0 ? 'neutro' : (invertido ? delta < 0 : delta > 0) ? 'bueno' : 'malo');
  if (puntos) {
    const d = Math.round((a - p) * 10) / 10;
    if (Math.abs(d) < 0.05) return { tipo: 'igual', tono: 'neutro', actual: a, anterior: p, puntos: true };
    return { tipo: d > 0 ? 'sube' : 'baja', tono: tono(d), delta: d, actual: a, anterior: p, puntos: true };
  }
  if (p === 0) {
    if (a === 0) return { tipo: 'igual', tono: 'neutro', actual: a, anterior: p };
    return { tipo: a > 0 ? 'sube' : 'baja', tono: tono(a), delta: a, actual: a, anterior: 0, desdeCero: true }; // no hay % posible: se muestra el cambio absoluto
  }
  const pct = ((a - p) / Math.abs(p)) * 100;
  if (Math.abs(pct) < 0.5) return { tipo: 'igual', tono: 'neutro', actual: a, anterior: p };
  // Con una base mínima el % se dispara (2 → 929 = 46350%) y no dice nada: ahí se muestra el cambio absoluto.
  if (Math.abs(pct) >= 1000) return { tipo: pct > 0 ? 'sube' : 'baja', tono: tono(pct), delta: a - p, actual: a, anterior: p, absoluto: true };
  return { tipo: pct > 0 ? 'sube' : 'baja', tono: tono(pct), delta: pct, actual: a, anterior: p };
}

/** Textos ya armados para mostrar. `formato` da formato al valor anterior (por ejemplo dinero o %). */
export function textoVariacion(v, { etiqueta = 'mes anterior', formato = fmtNum } = {}) {
  if (!v || v.tipo === 'sin-dato') return { flecha: '', cambio: '', comparacion: 'sin dato previo', tono: 'neutro', completo: '— sin dato previo' };
  const fue = `fue ${formato(v.anterior)}`;
  if (v.tipo === 'igual') return { flecha: '=', cambio: '', comparacion: `sin cambios vs ${etiqueta} (${fue})`, tono: 'neutro', completo: `≈ sin cambios vs ${etiqueta} (${fue})` };
  const flecha = v.tipo === 'sube' ? '▲' : '▼';
  let cambio;
  if (v.puntos) cambio = `${nf(Math.abs(v.delta), 1)} pp`;
  else if (v.desdeCero || v.absoluto) cambio = `${v.delta > 0 ? '+' : '-'}${nf(Math.abs(v.delta), 0)}`;
  else cambio = `${nf(Math.abs(v.delta), 1)}%`;
  const comparacion = `vs ${etiqueta} (${fue})`;
  return { flecha, cambio, comparacion, tono: v.tono, completo: `${flecha} ${cambio} ${comparacion}` };
}

/**
 * Promedio por día del mes ANTERIOR a `mes` ('YYYY-MM'): cantidad del mes anterior ÷ días de ese mes (mismo criterio que el indicador del mes
 * actual, que es cantidad ÷ días del mes). Devuelve null si el mes no es válido o no hay dato del mes anterior.
 */
export function promedioPorDiaAnterior(mes, cantidadAnterior) {
  const m = /^(\d{4})-(\d{2})$/.exec(String(mes || ''));
  if (!m || cantidadAnterior == null || cantidadAnterior === '' || !Number.isFinite(Number(cantidadAnterior))) return null;
  const y = Number(m[1]), mm = Number(m[2]);
  if (mm < 1 || mm > 12) return null;
  const dias = new Date(y, mm - 1, 0).getDate(); // último día del mes anterior
  return Number(cantidadAnterior) / dias;
}
