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

/** Fila de la hoja que corresponde a la ficha: mismo nombre, activa, que no sea variante ni esté archivada. */
export function elegirFila(filas, slug) {
  const objetivo = NOMBRE_POR_SLUG[slug];
  if (!objetivo || !Array.isArray(filas)) return null;
  return filas.find((f) => normNombre(f.nombre) === objetivo && normNombre(f.estado) === 'activo' && !esVerdadero(f.esVariante) && !esVerdadero(f.archivado)) || null;
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
