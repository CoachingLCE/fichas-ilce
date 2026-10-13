// Saneado de lo que llega a las rutas públicas (sin imports: función pura, probada aparte).

const LARGOS = new Set(['sobre', 'coment', 'salud', 'modOtro']); // campos de texto largo: hasta 2000 caracteres
const MAX_CORTO = 300;
const MAX_LARGO = 2000;
const MAX_EMAIL = 254;
const MAX_CLAVES = 80;
export const MAX_PAYLOAD = 40000; // caracteres del cuerpo completo, ya convertido a texto

// Quita caracteres de control (en los de una línea, también saltos de línea y tabulaciones: no deben viajar a un mail ni a una celda).
function limpiar(v, multilinea) {
  const re = multilinea ? /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g;
  return String(v).replace(re, ' ').trim();
}

/** Copia del formulario con cada texto recortado a su tope y limpio de caracteres de control. No rechaza: recorta (para no perder una inscripción legítima). */
export function acotarForm(form) {
  const out = {};
  if (!form || typeof form !== 'object' || Array.isArray(form)) return out;
  Object.keys(form).slice(0, MAX_CLAVES).forEach((k) => {
    const v = form[k];
    if (typeof v === 'string') {
      const tope = k === 'email' ? MAX_EMAIL : (LARGOS.has(k) ? MAX_LARGO : MAX_CORTO);
      out[k] = limpiar(v, LARGOS.has(k)).slice(0, tope);
    } else out[k] = v;
  });
  return out;
}

/** ¿El cuerpo es demasiado grande para ser una ficha real? */
export function demasiadoGrande(body) {
  try { return JSON.stringify(body || {}).length > MAX_PAYLOAD; } catch { return true; }
}

/**
 * ¿Parece un programa y no una persona? Dos señales muy conservadoras:
 *  - el campo trampa (invisible para una persona) vino con algo escrito;
 *  - pasaron menos de `minMs` entre que la persona empezó a escribir (`_inicio`) y el envío. El umbral es bajo a propósito: el autocompletado del
 *    navegador llena varios campos de golpe, y una persona real nunca manda una ficha en menos de un par de segundos.
 * Si falta `_inicio`, NO se descarta (no se sabe): queda solo el límite de ritmo.
 */
export function pareceRobot({ trampa, inicio, ahora = Date.now(), minMs = 2000 }) {
  if (typeof trampa === 'string' ? trampa.trim() !== '' : !!trampa) return true;
  if (!inicio) return false;
  const t = Date.parse(inicio);
  if (Number.isNaN(t)) return false;
  const transcurrido = ahora - t;
  return transcurrido >= 0 && transcurrido < minMs;
}
