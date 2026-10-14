// WhatsApp de la ficha de inscripción: país del número + número -> formato internacional completo (E.164, "+5491155551234"), que sirve directo en WhatsApp.
// Lo comparten el navegador (que lo valida mientras se escribe) y el servidor (que SIEMPRE revalida). Usa libphonenumber-js (MIT) con los metadatos "mobile":
// validan celulares, que es lo que hace falta para WhatsApp (un fijo no sirve) y pesan 39 KB comprimidos. En el navegador se carga recién al llegar al paso del teléfono.
import { parsePhoneNumberFromString, getCountries, getCountryCallingCode, getExampleNumber, AsYouType } from 'libphonenumber-js/mobile';
import ejemplos from 'libphonenumber-js/examples.mobile.json';

import { PAIS_POR_NOMBRE, isoDeResidencia } from './waLink';
export { PAIS_POR_NOMBRE, isoDeResidencia };

export function bandera(iso) {
  return String(iso || '').toUpperCase().replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}
const sinTildes = (s) => String(s == null ? '' : s).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const soloDigitos = (s) => String(s == null ? '' : s).replace(/\D/g, '');

let _lista = null;
/** Todos los países con prefijo: primero los de la ficha (en su orden), después el resto de la A a la Z. [{ iso, nombre, prefijo: '+54', bandera, destacado }] */
export function listaPaises() {
  if (_lista) return _lista;
  let nombres = null;
  try { nombres = new Intl.DisplayNames(['es'], { type: 'region' }); } catch { /* navegador viejo: se muestra el código */ }
  const armar = (iso) => ({ iso, nombre: (nombres && nombres.of(iso)) || iso, prefijo: '+' + getCountryCallingCode(iso), bandera: bandera(iso) });
  const destacados = Object.values(PAIS_POR_NOMBRE).map((iso) => ({ ...armar(iso), destacado: true }));
  const resto = getCountries().filter((iso) => !Object.values(PAIS_POR_NOMBRE).includes(iso)).map(armar).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  _lista = [...destacados, ...resto];
  return _lista;
}

/** Búsqueda al escribir: por nombre ("uru"), por prefijo ("+598" o "598") o por código ("uy"). Sin tildes ni mayúsculas. */
export function buscarPaises(consulta, lista = listaPaises()) {
  const t = sinTildes(consulta).trim();
  if (!t) return lista;
  const numerica = /^\+?\d+$/.test(t);
  const dig = t.replace(/\D/g, '');
  const puntuados = [];
  for (const p of lista) {
    const n = sinTildes(p.nombre);
    let punto = null;
    if (numerica) { if (p.prefijo.slice(1).startsWith(dig)) punto = p.prefijo.slice(1) === dig ? 0 : 1; }
    else if (n.startsWith(t) || p.iso.toLowerCase() === t) punto = 0;
    else if (n.split(/[\s-]+/).some((w) => w.startsWith(t))) punto = 1;
    else if (n.includes(t)) punto = 2;
    if (punto !== null) puntuados.push({ p, punto });
  }
  return puntuados.sort((a, b) => a.punto - b.punto || (b.p.destacado ? 1 : 0) - (a.p.destacado ? 1 : 0)).map((x) => x.p);
}

function parsear(texto, iso) {
  try { return parsePhoneNumberFromString(texto, iso || undefined); } catch { return undefined; }
}

/** Largo típico del número nacional de un celular del país (para decir "faltan" o "sobran" dígitos). */
function largoEjemplo(iso) {
  try { const e = getExampleNumber(iso, ejemplos); return e ? String(e.nationalNumber).length : null; } catch { return null; }
}

/** El número como se escribe dentro del país (sin el prefijo), para mostrar en el campo. Argentina: sin el 9 ("11 5555-1234"). */
export function nacionalParaMostrar(p) {
  if (!p) return '';
  if (p.countryCallingCode === '54') { const sinNueve = String(p.nationalNumber).replace(/^9/, ''); return new AsYouType('AR').input(sinNueve) || sinNueve; }
  return p.formatNational();
}

/**
 * Normaliza lo que escribió la persona. `iso` = el país elegido en el desplegable. Si el número trae "+" o "00" (lo pegó completo), manda el país del propio número.
 * Devuelve { ok: true, e164, iso, internacional, nacional } o { ok: false, codigo: 'vacio' | 'corto' | 'largo' | 'invalido', iso }.
 * Argentina: WhatsApp necesita el 9 después del +54 en los celulares ("+54 9 11 5555 1234"); quien escribe "11 5555 1234" (o con 0 y 15) obtiene el 9 solo.
 */
export function normalizarWhatsapp(numero, iso) {
  const entrada = String(numero == null ? '' : numero).trim();
  const pais = /^[A-Za-z]{2}$/.test(String(iso || '')) ? String(iso).toUpperCase() : undefined;
  if (!entrada) return { ok: false, codigo: 'vacio', iso: pais };
  let texto = entrada;
  // México: antes se marcaba 01 / 02 (otra ciudad) o 044 / 045 (a un celular) delante de los 10 dígitos; hoy no hace falta y la librería no los reconoce.
  if (pais === 'MX' && !/^(\+|00)/.test(entrada)) { const m = soloDigitos(entrada).match(/^(?:0[12]|04[45])(\d{10})$/); if (m) texto = m[1]; }
  let p = parsear(texto, pais);
  if (!p && !pais && !/^(\+|00)/.test(entrada)) return { ok: false, codigo: 'sinpais', iso: pais };
  if (!p) return { ok: false, codigo: soloDigitos(entrada).length < 6 ? 'corto' : 'invalido', iso: pais };
  let nsn = String(p.nationalNumber);
  if (p.countryCallingCode === '54' && !nsn.startsWith('9')) { const q = parsear('+549' + nsn); if (q) { p = q; nsn = String(p.nationalNumber); } }
  // México: hasta 2020 los celulares llevaban un "1" después del +52; hoy ya no. Quien lo escribe con el 1 viejo no tiene por qué saberlo.
  if (p.countryCallingCode === '52' && !p.isValid() && nsn.length === 11 && nsn.startsWith('1')) { const q = parsear('+52' + nsn.slice(1)); if (q) { p = q; nsn = String(p.nationalNumber); } }
  const isoNum = p.country || pais;
  if (!p.isValid()) {
    const ej = isoNum ? largoEjemplo(isoNum) : null;
    const codigo = ej && nsn.length < ej ? 'corto' : (ej && nsn.length > ej ? 'largo' : 'invalido');
    return { ok: false, codigo, iso: isoNum };
  }
  return { ok: true, e164: p.number, iso: isoNum, internacional: p.formatInternational(), nacional: nacionalParaMostrar(p) };
}

// Ejemplos de celular, como se escriben dentro de cada país (sin código de país, sin 0 de llamada ni 15). Los de la librería a veces parecen líneas fijas (Chile) o traen el 0 inicial.
// La prueba verifica que todos estos ejemplos sean aceptados por la propia validación.
const EJEMPLOS = {
  AR: '11 5555 1234', BO: '7123 4567', BR: '11 98765 4321', CL: '9 8765 4321', CO: '300 123 4567', CR: '8312 3456', CU: '5 123 4567', EC: '99 123 4567', SV: '7012 3456',
  ES: '612 345 678', GT: '5123 4567', HN: '9123 4567', MX: '55 1234 5678', NI: '8123 4567', PA: '6123 4567', PY: '981 123 456', PE: '912 345 678', PR: '787 555 1234',
  UY: '99 123 456', VE: '412 123 4567', DO: '809 555 1234'
};

/** Cómo se escribe un celular de ese país (ejemplo para el cartel de ayuda y el placeholder). Argentina: sin el 0, el 15 ni el 9. */
export function ejemploCelular(iso) {
  const i = String(iso || '').toUpperCase();
  if (EJEMPLOS[i]) return EJEMPLOS[i];
  try { const e = getExampleNumber(i, ejemplos); return e ? e.formatNational() : ''; } catch { return ''; }
}

export function nombrePais(iso) {
  const p = listaPaises().find((x) => x.iso === String(iso || '').toUpperCase());
  return p ? p.nombre : '';
}

/** Mensaje de error, con el mismo comienzo de siempre ("WhatsApp inválido") y qué hacer. */
export function mensajeWhatsapp(res, iso) {
  const i = (res && res.iso) || iso;
  const pais = nombrePais(i);
  const ej = i ? ejemploCelular(i) : '';
  const cola = ej ? ` Ejemplo: ${ej}.` : '';
  const codigo = res && res.codigo;
  if (codigo === 'vacio') return 'WhatsApp inválido: ingresá tu número.';
  if (codigo === 'sinpais') return 'WhatsApp inválido: elegí el país del número.';
  if (codigo === 'corto') return `WhatsApp inválido: faltan dígitos${pais ? ` para un celular de ${pais}` : ''}.${cola}`;
  if (codigo === 'largo') return `WhatsApp inválido: sobran dígitos${pais ? ` para un celular de ${pais}` : ''}.${cola}`;
  return `WhatsApp inválido: no parece un celular válido${pais ? ` de ${pais}` : ''}. Revisá el número y el país elegido.${cola}`;
}

/** Ayuda debajo del campo. */
export function ayudaWhatsapp(iso) {
  const i = String(iso || '').toUpperCase();
  if (i === 'AR') return 'Escribí el código de área y tu número, sin 0 ni 15 (ej.: 11 5555 1234). Nosotros agregamos el 9 que WhatsApp necesita para los celulares de Argentina.';
  const ej = ejemploCelular(i);
  return ej ? `Escribí tu celular sin el código del país (ej.: ${ej}).` : 'Escribí tu celular sin el código del país.';
}

/**
 * Para recuperar un borrador viejo o una ficha anterior a este cambio: separa un número ya escrito en { iso, num }.
 * Con "+" toma el país del propio número; sin él, usa el país de residencia.
 */
export function separarGuardado(valor, paisResidencia) {
  const v = String(valor == null ? '' : valor).trim();
  const residencia = isoDeResidencia(paisResidencia) || null;
  if (/^(\+|00)/.test(v)) { const p = parsear(v); if (p && p.country) return { iso: p.country, num: nacionalParaMostrar(p) }; }
  return { iso: residencia, num: v };
}
