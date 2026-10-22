// Lógica PURA (sin imports) de lo que pasa DESPUÉS de enviar un formulario: el mensaje en pantalla y el correo automático.
// La usan el constructor (cliente), el formulario público y las rutas del servidor. La configuración vive dentro del mismo "Campos JSON"
// del formulario (propiedad `confirmacion`), así que no hace falta tocar las columnas de la planilla y los formularios viejos siguen igual.
//
//   confirmacion = {
//     pantalla: { titulo, texto, botones: [{ texto, url }] },          // lo que se ve al terminar (vacío = el agradecimiento de siempre)
//     email:    { activo, asunto, cuerpo, botones: [{ texto, url }] }  // correo automático a quien respondió (apagado por defecto)
//   }
export const LIM_CONF = { titulo: 120, texto: 1500, boton: 40, botones: 2, asunto: 150, cuerpo: 4000, url: 500 };
export const VARIABLES = [['{nombre}', 'el nombre de quien respondió (si el formulario lo pregunta)'], ['{formulario}', 'el título del formulario'], ['{curso}', 'el curso, si el formulario tiene uno']];

const txt = (v, max) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim().slice(0, max) : '');

/** Solo enlaces https (incluye wa.me y chat.whatsapp.com). Devuelve el enlace limpio o '' si no es seguro. */
export function urlSegura(u) {
  const s = typeof u === 'string' ? u.trim() : '';
  if (!s || s.length > LIM_CONF.url || /\s/.test(s)) return '';
  try {
    const x = new URL(s);
    if (x.protocol !== 'https:' || !x.hostname.includes('.')) return '';
    return s;
  } catch { return ''; }
}

export const confirmacionVacia = () => ({ pantalla: { titulo: '', texto: '', botones: [] }, email: { activo: false, asunto: '', cuerpo: '', botones: [] } });

const botonesDe = (arr) => (Array.isArray(arr) ? arr : []).slice(0, LIM_CONF.botones).map((b) => ({ texto: txt(b && b.texto, LIM_CONF.boton), url: txt(b && b.url, LIM_CONF.url) }));

/** Normaliza lo que viene del navegador o de la planilla a la forma completa (sin validar enlaces). Siempre devuelve el objeto completo. */
export function normalizarConfirmacion(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  const p = r.pantalla && typeof r.pantalla === 'object' ? r.pantalla : {};
  const e = r.email && typeof r.email === 'object' ? r.email : {};
  return {
    pantalla: { titulo: txt(p.titulo, LIM_CONF.titulo), texto: txt(p.texto, LIM_CONF.texto), botones: botonesDe(p.botones) },
    email: { activo: e.activo === true, asunto: txt(e.asunto, LIM_CONF.asunto), cuerpo: txt(e.cuerpo, LIM_CONF.cuerpo), botones: botonesDe(e.botones) }
  };
}

export function hayConfirmacion(c) {
  if (!c) return false;
  const { pantalla: p, email: e } = c;
  return !!(p.titulo || p.texto || p.botones.some((b) => b.texto || b.url) || e.activo || e.asunto || e.cuerpo || e.botones.some((b) => b.texto || b.url));
}

/** Mensaje de error (en español, para mostrar) o '' si está todo bien. Un botón a medio completar es un error: no se guarda a escondidas. */
export function errorConfirmacion(conf, { anonimo = false } = {}) {
  const c = normalizarConfirmacion(conf);
  for (const [donde, botones] of [['en pantalla', c.pantalla.botones], ['del correo', c.email.botones]]) {
    for (const b of botones) {
      if (!b.texto && !b.url) continue;
      if (!b.texto) return `Un botón ${donde} tiene enlace pero no tiene texto.`;
      if (!urlSegura(b.url)) return `El botón "${b.texto}" (${donde}) necesita un enlace completo que empiece con https:// (por ejemplo el del grupo de WhatsApp).`;
    }
  }
  if (c.email.activo) {
    if (anonimo) return 'Un formulario anónimo no pide el correo, así que no puede mandar un correo de confirmación: apagá el correo automático o dejá de hacerlo anónimo.';
    if (!c.email.asunto) return 'El correo automático necesita un asunto.';
    if (!c.email.cuerpo) return 'El correo automático necesita un mensaje.';
  }
  return '';
}

/** Lo que se guarda: la forma completa con los botones a medio completar descartados, o null si no hay nada configurado. */
export function limpiarConfirmacion(raw) {
  const c = normalizarConfirmacion(raw);
  const util = (arr) => arr.filter((b) => b.texto && urlSegura(b.url));
  c.pantalla.botones = util(c.pantalla.botones);
  c.email.botones = util(c.email.botones);
  return hayConfirmacion(c) ? c : null;
}

/** Reemplaza {nombre}, {formulario} y {curso}. Lo que falta se borra y se arreglan los espacios y signos que quedan sueltos. */
export function aplicarVariables(texto, vars = {}) {
  const v = { nombre: '', formulario: '', curso: '', ...vars };
  let t = String(texto == null ? '' : texto);
  // Sin nombre: también se va la coma o el espacio que lo precedía ("Hola, {nombre}!" queda "Hola!").
  if (!v.nombre) t = t.replace(/[,\s]*\{nombre\}/gi, '');
  return t
    .replace(/\{nombre\}/gi, v.nombre)
    .replace(/\{formulario\}/gi, v.formulario || '')
    .replace(/\{curso\}/gi, v.curso || '')
    .replace(/[ \t]+([,.;:!?¡])/g, (m, s) => (s === '¡' ? m : s))
    .replace(/¡[ \t]+/g, '¡')
    .replace(/[ \t]{2,}/g, ' ');
}
