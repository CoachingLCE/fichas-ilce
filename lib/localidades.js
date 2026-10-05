// Reportes por localidad y provincia (Fichas).
//
// Localidad y provincia las escribe cada estudiante a mano en la ficha ("Córdoba", "cordoba", "CBA",
// "Ciudad de Córdoba", "Córdoba capital"...). Si se contaran tal cual, una misma ciudad aparecería
// repartida en varias filas. Acá se normalizan (sin tildes, mayúsculas ni puntuación) y se agrupan las
// variantes más comunes; lo que no es un lugar real ("si", "-", un estado de la ficha, solo números)
// se cuenta aparte como "sin datos" en lugar de mostrarse como si fuera una localidad.
//
// Este archivo no depende de la pantalla: lo usan Reportes (para agrupar) y el Panel (para filtrar las
// fichas de una localidad al hacer clic), con la MISMA clave, así lo que se cuenta es lo que se filtra.

/** Sin tildes, en minúsculas, sin puntuación y con los espacios colapsados. */
export function normTxt(s) {
  return (s == null ? '' : String(s))
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const NO_ES_LUGAR = new Set([
  'si', 'no', 'true', 'false', 'na', 'n a', 'none', 'null', 'undefined', 'ninguno', 'ninguna', 'no aplica',
  'sin datos', 'sin informar', 'x', 'xx', 'xxx', 'ok', 'otro', 'otra', 'casa', 'mi casa',
  // estados de la ficha (a veces quedan en una columna corrida)
  'iniciada', 'pendiente', 'en revision', 'observada', 'completada', 'inscrito', 'rechazada', 'cancelada'
]);

/** ¿Parece un lugar real? (descarta vacíos, "-", números solos, "si"/"no" y estados de la ficha). */
export function esLugarValido(v) {
  const n = normTxt(v);
  if (n.length < 2) return false;
  if (/^[0-9\s]+$/.test(n)) return false;
  return !NO_ES_LUGAR.has(n);
}

// Variantes muy comunes que son, sin dudas, el mismo lugar. Se limita a lo casi seguro: ante la duda,
// mejor dos filas separadas que dos lugares distintos fusionados por error.
const CABA = 'CABA';
const ALIAS_COMUNES = {
  'caba': CABA, 'c a b a': CABA, 'capital federal': CABA, 'cap fed': CABA, 'ciudad autonoma de buenos aires': CABA,
  'cdad autonoma de buenos aires': CABA, 'ciudad de buenos aires': CABA, 'bs as capital': CABA, 'buenos aires capital': CABA,
  'cba': 'Córdoba'
};
const ALIAS_PROVINCIA = {
  ...ALIAS_COMUNES,
  'bs as': 'Buenos Aires', 'bs as prov': 'Buenos Aires', 'gba': 'Buenos Aires', 'gran buenos aires': 'Buenos Aires',
  'sf': 'Santa Fe', 'tuc': 'Tucumán'
};

const SIGLAS = new Set(['USA', 'EEUU', 'UK', 'UAE', 'CABA', 'GBA', 'RM']);
const PALABRAS_MENORES = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y', 'e', 'en']);
/** Pasa "CORDOBA" o "córdoba" a "Córdoba" / "San Miguel de Tucumán". Si ya trae mayúsculas mezcladas, la respeta. */
export function embellecer(s) {
  const t = (s || '').trim().replace(/\s+/g, ' ');
  if (!t) return t;
  // Siglas ("RM", "CDMX", "USA"): una sola palabra en mayúsculas, corta y sin vocales (o de una lista corta) se deja como está.
  if (/^[A-ZÁÉÍÓÚÑ]{2,5}$/.test(t) && (!/[AEIOUÁÉÍÓÚ]/.test(t) || SIGLAS.has(t))) return t;
  const mezclado = /[a-záéíóúñü]/.test(t) && /[A-ZÁÉÍÓÚÑÜ]/.test(t);
  if (mezclado) return t;
  return t.toLowerCase().split(' ').map((p, i) => (i > 0 && PALABRAS_MENORES.has(p) ? p : p.charAt(0).toUpperCase() + p.slice(1))).join(' ');
}

/**
 * Clave estable de un lugar. Devuelve { clave, nombre } o null si no es un lugar válido.
 * `nivel`: 'loc' (localidad) o 'prov' (provincia/estado).
 */
export function lugarInfo(valor, nivel) {
  if (!esLugarValido(valor)) return null;
  // "Rosario, Santa Fe" / "Córdoba - Argentina": nos quedamos con lo primero.
  let crudo = String(valor).split(/[,;\/]/)[0].replace(/\s+-\s+.*$/, '').trim();
  let n = normTxt(crudo);
  if (!esLugarValido(crudo)) return null;
  const alias = (nivel === 'prov' ? ALIAS_PROVINCIA : ALIAS_COMUNES)[n];
  if (alias) return { clave: normTxt(alias), nombre: alias };
  if (nivel === 'prov') n = n.replace(/^(provincia|pcia|prov)( de| del)? /, '');
  else n = n.replace(/^(ciudad|localidad|cdad|barrio)( de| del)? /, '').replace(/^(\S+( \S+)*) capital$/, '$1');
  if (!n || n.length < 2) return null;
  const alias2 = (nivel === 'prov' ? ALIAS_PROVINCIA : ALIAS_COMUNES)[n];
  if (alias2) return { clave: normTxt(alias2), nombre: alias2 };
  return { clave: n, nombre: embellecer(crudo.replace(/^(provincia|pcia|prov)( de| del)? /i, '')) };
}

/** Clave del país de una fila ('' si no es válido). */
function paisClave(pais) { return esLugarValido(pais) ? normTxt(pais) : ''; }

/** Clave de la fila para filtrar: igual a la del reporte. null si la fila no tiene lugar válido. */
export function claveLugarFila(r, nivel) {
  const info = lugarInfo(nivel === 'prov' ? r.prov : r.loc, nivel);
  if (!info) return null;
  return paisClave(r.pais) + '|' + info.clave;
}

// Para mostrar un lugar que se escribió de varias maneras: la más frecuente, salvo que haya una forma con tilde
// que alcance al menos 40% de esa (quien escribe sin tilde no está "más bien escrito": "Córdoba" gana a "Cordoba").
const sinTildes = (x) => x.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function elegirNombre(mapa) {
  const top = masFrecuente(mapa);
  if (top == null) return top;
  const nTop = mapa.get(top);
  let mejor = top;
  mapa.forEach((n, k) => { if (k !== top && sinTildes(k) !== k && sinTildes(k).toLowerCase() === sinTildes(top).toLowerCase() && n >= nTop * 0.4 && sinTildes(mejor) === mejor) mejor = k; });
  return mejor;
}
function masFrecuente(mapa) {
  let mejor = null, n = 0;
  mapa.forEach((v, k) => { if (v > n || (v === n && mejor !== null && k.length < mejor.length)) { mejor = k; n = v; } });
  return mejor;
}
const sumar = (m, k) => { if (k) m.set(k, (m.get(k) || 0) + 1); };

/**
 * Agrupa las fichas por localidad o provincia.
 * Devuelve { grupos, sinDatos, considerados }:
 *  - grupos: [{ clave, nombre, provincia, varias, pais, total, completadas, pct }] ordenados de mayor a menor.
 *  - sinDatos: fichas sin localidad/provincia válida.
 *  - considerados: fichas que entraron al reporte (después de filtrar por país).
 * `pais`: nombre de un país para ver solo ese ('' = todos).
 */
export function agruparLugares(rows, { nivel = 'loc', pais = '' } = {}) {
  const filtroPais = pais ? normTxt(pais) : '';
  const m = new Map();
  let sinDatos = 0, considerados = 0;
  for (const r of rows || []) {
    const pc = paisClave(r.pais);
    if (filtroPais && pc !== filtroPais) continue;
    considerados++;
    const info = lugarInfo(nivel === 'prov' ? r.prov : r.loc, nivel);
    if (!info) { sinDatos++; continue; }
    const k = pc + '|' + info.clave;
    let g = m.get(k);
    if (!g) { g = { clave: k, nombres: new Map(), provs: new Map(), paises: new Map(), total: 0, completadas: 0 }; m.set(k, g); }
    sumar(g.nombres, info.nombre);
    if (nivel === 'loc') { const p = lugarInfo(r.prov, 'prov'); if (p) sumar(g.provs, p.nombre); }
    if (esLugarValido(r.pais)) sumar(g.paises, embellecer(String(r.pais)));
    g.total++;
    if (r.estado === 'Completada') g.completadas++;
  }
  const grupos = [...m.values()].map((g) => {
    const provincias = [...g.provs.entries()].sort((a, b) => b[1] - a[1]);
    const totalProv = provincias.reduce((s, [, n]) => s + n, 0);
    // Si dos provincias distintas tienen cada una al menos 30% de los datos, es probable que sean dos lugares
    // distintos con el mismo nombre (ej. un mismo nombre de localidad en dos provincias): se avisa.
    const varias = provincias.length > 1 && provincias[1][1] / Math.max(1, totalProv) >= 0.3;
    return {
      clave: g.clave,
      nombre: elegirNombre(g.nombres),
      provincia: provincias.length ? provincias[0][0] : '',
      varias,
      pais: masFrecuente(g.paises) || '',
      total: g.total,
      completadas: g.completadas,
      pct: g.total ? Math.round((g.completadas / g.total) * 100) : 0
    };
  }).sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
  return { grupos, sinDatos, considerados };
}

/** Países con datos válidos, de más a menos fichas: [[nombre, cantidad], ...]. */
export function paisesDisponibles(rows) {
  const m = new Map(), nombres = new Map();
  for (const r of rows || []) {
    if (!esLugarValido(r.pais)) continue;
    const k = normTxt(r.pais);
    m.set(k, (m.get(k) || 0) + 1);
    if (!nombres.has(k)) nombres.set(k, new Map());
    sumar(nombres.get(k), embellecer(String(r.pais)));
  }
  return [...m.entries()].map(([k, n]) => [masFrecuente(nombres.get(k)), n]).sort((a, b) => b[1] - a[1]);
}
