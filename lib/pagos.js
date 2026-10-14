// Pago de la 1ª cuota en la pantalla final de la ficha de inscripción.
//
// Los valores y links salen de la hoja "Productos y Valores" de Gestión, que se COPIA en vivo a una pestaña "ProductosValores" de la planilla de Fichas
// (con IMPORTRANGE, solo las columnas necesarias: no pasan el margen ni las ventas). Fichas nunca toca la planilla de Gestión.
//   · Argentina (el país de la ficha) -> Mercado Pago (contado) y débito automático, cada uno solo si el curso tiene su link.
//   · Cualquier otro país             -> PayPal, "1 cuota: USD x", solo si el curso tiene su link.
// Solo se muestran los BOTONES, sin ningún valor (pedido de Diego: los valores ya se informaron en otro momento): ni importes en pesos ni el de dólares.
// Si algo falla (pestaña inexistente, cuota de Google), la inscripción se guarda igual y no aparece el bloque.
import { readSheet } from './sheets';
import { esArgentina } from './validacion';
import { CURSOS } from './constants';

export const TAB_PRODUCTOS_VALORES = 'ProductosValores';

// slug de la ficha -> nombre del producto en la hoja (sin tildes ni mayúsculas)
const NOMBRE_POR_SLUG = {
  'coaching-deportivo': 'coaching deportivo',
  'coaching-ontologico': 'coaching ontologico profesional',
  'coaching-educativo': 'coaching educativo',
  'coaching-vocacional': 'coaching vocacional',
  'oratoria': 'oratoria',
  'coaching-de-equipos': 'coaching de equipos',
  'copywriting-para-redes-sociales': 'copywriting para redes sociales',
  'formacion-para-formadores': 'formador para formadores',
  'coaching-inmobiliario': 'coaching inmobiliario',
  'comunidad-ilce': 'comunidad'
};

// Solo se aceptan links de estos sitios (por si alguien edita mal la hoja: nunca se manda a un sitio cualquiera).
const HOSTS_PERMITIDOS = new Set(['mpago.la', 'mercadopago.com', 'www.mercadopago.com', 'mercadopago.com.ar', 'www.mercadopago.com.ar', 'paypal.com', 'www.paypal.com', 'paypal.me', 'www.paypal.me']);

export function normNombre(s) {
  return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
}
function esVerdadero(v) { return v === true || /^(true|verdadero|si|sí|1)$/i.test(String(v == null ? '' : v).trim()); }

/** Devuelve el link limpio (sin espacios) si es https y de un sitio permitido; si no, ''. */
export function linkSeguro(l) {
  const t = String(l == null ? '' : l).trim();
  if (!t) return '';
  try {
    const u = new URL(t);
    if (u.protocol !== 'https:' || !HOSTS_PERMITIDOS.has(u.hostname.toLowerCase())) return '';
    return u.href;
  } catch { return ''; }
}

function jsonSeguro(s) { try { const o = JSON.parse(s); return o && typeof o === 'object' ? o : {}; } catch { return {}; } }
function medio(m) { return typeof m === 'string' ? { link: m, valor: null } : { link: (m && m.link) || '', valor: m && m.valor != null ? m.valor : null }; }

export function parseMedios(json) {
  const o = jsonSeguro(json);
  return { contado: medio(o.contado), debitoAutomatico: medio(o.debitoAutomatico), exterior: medio(o.exterior) };
}

/** Nombres con los que puede figurar el curso en la hoja: el del producto (tabla de arriba) y el nombre del curso en la app (por si en la hoja no lleva "Profesional" u otro agregado). */
function nombresBuscados(slug) {
  const base = NOMBRE_POR_SLUG[slug];
  if (!base) return [];
  const curso = (CURSOS || []).find((c) => c.slug === slug);
  return [...new Set([base, curso ? normNombre(curso.nombre) : ''].filter(Boolean))];
}

/** Por qué una fila se descarta (o null si sirve): solo filas activas, que no sean variantes ni estén archivadas. */
function motivoDescarte(f) {
  if (normNombre(f.estado) !== 'activo') return `su estado es "${f.estado || '(vacío)'}" y tiene que ser "Activo"`;
  if (esVerdadero(f.esVariante)) return 'está marcada como variante';
  if (esVerdadero(f.archivado)) return 'está archivada';
  return null;
}

/** Fila de la hoja que corresponde a la ficha: mismo nombre (el del producto o el del curso), activa, que no sea variante ni esté archivada. */
export function elegirFila(filas, slug) {
  const objetivos = nombresBuscados(slug);
  if (!objetivos.length || !Array.isArray(filas)) return null;
  return filas.find((f) => objetivos.includes(normNombre(f.nombre)) && !motivoDescarte(f)) || null;
}

/** Botones de pago según el país de la ficha. null si no corresponde mostrar nada. */
export function construirPago(fila, pais) {
  if (!fila) return null;
  const m = parseMedios(fila.mediosDePagoJSON);
  const botones = [];
  if (esArgentina(pais)) {
    const mp = linkSeguro(m.contado.link);
    if (mp) botones.push({ clave: 'contado', titulo: 'Pagar con Mercado Pago', link: mp });
    const db = linkSeguro(m.debitoAutomatico.link);
    if (db) botones.push({ clave: 'debito', titulo: 'Pagar con débito automático', link: db });
  } else {
    const pp = linkSeguro(m.exterior.link);
    if (pp) botones.push({ clave: 'paypal', titulo: 'Pagar con PayPal', link: pp });
  }
  return botones.length ? { botones } : null;
}

// ---- Lectura de la hoja, con caché (la pantalla final se muestra después de CADA inscripción: no puede leer la planilla cada vez) ----
const TTL_MS = 5 * 60 * 1000;
const TTL_FALLO_MS = 60 * 1000;
let cache = { t: 0, filas: null, fallo: 0 };

export function _reiniciarCache() { cache = { t: 0, filas: null, fallo: 0 }; }

export async function leerProductosValores(ahora = Date.now(), leer = readSheet) {
  if (cache.filas && ahora - cache.t < TTL_MS) return cache.filas;
  if (cache.fallo && ahora - cache.fallo < TTL_FALLO_MS) return cache.filas; // falló hace poco: no se insiste (devuelve lo último que se pudo leer, o nada)
  try {
    const filas = await leer(TAB_PRODUCTOS_VALORES);
    cache = { t: ahora, filas, fallo: 0 };
    return filas;
  } catch {
    cache = { ...cache, fallo: ahora };
    return cache.filas;
  }
}

export async function getPago(slug, pais, opc = {}) {
  const filas = await leerProductosValores(opc.ahora, opc.leer);
  if (!filas) return null;
  return construirPago(elegirFila(filas, slug), pais);
}

/** Espera como máximo `ms`: si tarda más, devuelve `porDefecto` (la inscripción no puede demorarse por esto). */
export function conTimeout(promesa, ms, porDefecto = null) {
  return Promise.race([promesa, new Promise((r) => setTimeout(() => r(porDefecto), ms))]);
}

const COLUMNAS = ['id', 'nombre', 'estado', 'esVariante', 'archivado', 'mediosDePagoJSON', 'precioExterior'];
const host = (l) => { try { return new URL(String(l).trim()).hostname; } catch { return ''; } };

/**
 * Explica, paso a paso, por qué la pantalla final de una ficha muestra (o no) los botones de pago. `lectura` = { filas } si se pudo leer la pestaña, o { error } si no.
 * Solo se usa en el diagnóstico protegido con la llave técnica (/api/pago-diagnostico): ahí se ve el motivo, que en la pantalla del estudiante se oculta a propósito.
 */
export function diagnosticarPago(lectura, slug, pais) {
  const d = { slug, pais: pais || '(sin país: se trata como Argentina)', pasos: [] };
  const paso = (ok, texto) => d.pasos.push({ ok, texto });
  if (!NOMBRE_POR_SLUG[slug]) { paso(false, `"${slug}" no es el identificador de ninguno de los 10 cursos con pago. Los válidos son: ${Object.keys(NOMBRE_POR_SLUG).join(', ')}.`); d.veredicto = 'NO SE MUESTRA: el identificador del curso no existe.'; return d; }
  if (!lectura || lectura.error || !Array.isArray(lectura.filas)) {
    paso(false, `No se pudo leer la pestaña "${TAB_PRODUCTOS_VALORES}" de la planilla de Fichas${lectura && lectura.error ? `: ${lectura.error}` : ''}. Lo más probable es que no exista o que se llame distinto (tiene que ser exactamente ${TAB_PRODUCTOS_VALORES}).`);
    d.veredicto = `NO SE MUESTRA: la pestaña "${TAB_PRODUCTOS_VALORES}" no se encuentra en la planilla de Fichas.`; return d;
  }
  const filas = lectura.filas;
  paso(true, `La pestaña "${TAB_PRODUCTOS_VALORES}" existe y tiene ${filas.length} fila(s).`);
  if (!filas.length) { paso(false, 'Está vacía: la fórmula IMPORTRANGE todavía no trajo datos (revisá que dentro de la pestaña no diga #REF! ni "Permitir acceso" pendiente).'); d.veredicto = 'NO SE MUESTRA: la pestaña está vacía.'; return d; }
  const cols = Object.keys(filas[0] || {});
  const faltan = COLUMNAS.filter((c) => !cols.includes(c));
  d.columnasEncontradas = cols;
  paso(!faltan.length, faltan.length ? `Faltan columnas con estos títulos exactos: ${faltan.join(', ')}. Títulos que sí hay: ${cols.join(', ')}.` : 'Están todas las columnas necesarias (id, nombre, estado, esVariante, archivado, mediosDePagoJSON, precioExterior).');
  const buscados = nombresBuscados(slug);
  const coinciden = filas.filter((f) => buscados.includes(normNombre(f.nombre)));
  d.nombreBuscado = buscados;
  d.productosEnLaHoja = filas.map((f) => f.nombre).filter(Boolean).slice(0, 40);
  if (!coinciden.length) { paso(false, `No hay ningún producto llamado ${buscados.map((x) => `"${x}"`).join(' ni ')} (sin tildes ni mayúsculas). Productos que sí hay: ${d.productosEnLaHoja.join(' · ')}.`); d.veredicto = 'NO SE MUESTRA: el nombre del curso no coincide con ningún producto de la hoja.'; return d; }
  paso(true, `Producto encontrado: ${coinciden.map((f) => `"${f.nombre}"`).join(', ')}.`);
  const elegida = coinciden.find((f) => !motivoDescarte(f));
  if (!elegida) { coinciden.forEach((f) => paso(false, `"${f.nombre}" se descarta: ${motivoDescarte(f)}.`)); d.veredicto = 'NO SE MUESTRA: ninguna fila de ese producto sirve (tiene que estar Activo, sin ser variante ni estar archivada).'; return d; }
  paso(true, `La fila elegida está Activa y no es variante ni está archivada.`);
  const m = parseMedios(elegida.mediosDePagoJSON);
  const crudo = jsonSeguro(elegida.mediosDePagoJSON);
  if (!Object.keys(crudo).length) paso(false, 'La columna mediosDePagoJSON está vacía o no es un JSON válido: no hay links de pago cargados.');
  for (const [clave, nombreMedio] of [['contado', 'Mercado Pago'], ['debitoAutomatico', 'Débito automático'], ['exterior', 'PayPal']]) {
    const raw = m[clave].link;
    if (!String(raw || '').trim()) { paso(false, `${nombreMedio}: no tiene link cargado en la hoja.`); continue; }
    const limpio = linkSeguro(raw);
    paso(!!limpio, limpio ? `${nombreMedio}: link válido (${host(limpio)}).` : `${nombreMedio}: el link se descarta porque no es https o no es de mpago.la, mercadopago o paypal (empieza con "${String(raw).trim().slice(0, 30)}").`);
  }
  const pago = construirPago(elegida, pais);
  d.botones = pago ? pago.botones.map((b) => ({ boton: b.titulo, link: b.link })) : [];
  d.veredicto = pago ? `SE MUESTRAN ${pago.botones.length} botón(es) para ${esArgentina(pais) ? 'Argentina' : 'quien eligió otro país'}: ${pago.botones.map((b) => b.titulo).join(' y ')}.`
    : `NO SE MUESTRA: para ${esArgentina(pais) ? 'Argentina hacen falta los links de Mercado Pago o de débito automático' : 'otro país hace falta el link de PayPal'} y no hay ninguno válido.`;
  return d;
}

/** Lectura SIN caché y sin tragarse el error (para el diagnóstico). */
export async function leerParaDiagnostico(leer = readSheet) {
  try { return { filas: await leer(TAB_PRODUCTOS_VALORES, { noCache: true }) }; }
  catch (e) { return { error: String((e && e.message) || e).slice(0, 300) }; }
}
