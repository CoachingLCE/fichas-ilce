import { createHmac, timingSafeEqual } from 'crypto';
import { crearLimiteLogin } from './limiteLogin';

// "Olvidé mi contraseña": se manda por mail un enlace firmado que sirve UNA sola vez y vence a los 30 minutos. No se guarda nada en la planilla:
// la firma incluye la contraseña guardada en ese momento, así que apenas se cambia (con este mismo enlace, por un Admin o por la propia persona)
// el enlace deja de valer. La contraseña actual no se toca hasta que se usa el enlace.
export const VIGENCIA_MS = 30 * 60 * 1000;
export const VIGENCIA_MIN = 30;

function secreto() {
  const s = process.env.SESSION_SECRET, k = process.env.PASSWORD_ENCRYPTION_KEY;
  const base = s && s.length >= 16 ? s : (k || null);
  if (!base) return null;
  return createHmac('sha256', base).update('ilce-fichas-recuperar-v1').digest();   // clave propia de esta función: no sirve para firmar sesiones
}
export function recuperacionDisponible() { return !!secreto() && !!process.env.GMAIL_SENDER_EMAIL && !!process.env.GMAIL_APP_PASSWORD; }

const b64u = (x) => Buffer.from(x).toString('base64url');
const firmar = (email, exp, passwordHash) => createHmac('sha256', secreto()).update(`${email}|${exp}|${passwordHash}`).digest('base64url');

export function crearTokenRecuperacion(email, passwordHash, ahora = Date.now()) {
  const e = String(email || '').trim().toLowerCase(); const x = ahora + VIGENCIA_MS;
  return `${b64u(JSON.stringify({ e, x }))}.${firmar(e, x, String(passwordHash || ''))}`;
}
// Forma del enlace, sin mirar la hora ni la firma.
function parsear(token) {
  if (typeof token !== 'string' || token.length > 600) return null;
  const i = token.indexOf('.'); if (i < 1) return null;
  try {
    const p = JSON.parse(Buffer.from(token.slice(0, i), 'base64url').toString('utf8'));
    if (!p || typeof p.e !== 'string' || !Number.isFinite(p.x)) return null;
    return { email: p.e, exp: p.x };
  } catch { return null; }
}
/** Lee el enlace SIN verificar la firma (todavía no se sabe la contraseña guardada): devuelve { email, exp } si tiene forma válida y no venció. */
export function leerTokenRecuperacion(token, ahora = Date.now()) {
  const p = parsear(token); if (!p) return null;
  if (p.exp <= ahora || p.exp > ahora + VIGENCIA_MS + 60000) return null;   // vencido, o con una fecha inventada más lejana de lo posible
  return p;
}
/** Con la contraseña guardada ahora, ¿la firma del enlace es la correcta? (comparación de tiempo constante). El vencimiento va dentro de lo firmado: no se puede estirar. */
export function firmaValida(token, passwordHash) {
  const l = parsear(token); if (!l || !secreto()) return false;
  const dada = Buffer.from(token.slice(token.indexOf('.') + 1)); const esperada = Buffer.from(firmar(l.email, l.exp, String(passwordHash || '')));
  return dada.length === esperada.length && timingSafeEqual(dada, esperada);
}

// Frenos (en memoria, igual que el del ingreso): pedir enlaces y probar enlaces.
export const limiteOlvide = crearLimiteLogin({ ventanaMs: 60 * 60 * 1000, maxCuentaIp: 3, maxCuenta: 5, maxIp: 20 });
export const limiteRestablecer = crearLimiteLogin({ ventanaMs: 15 * 60 * 1000, maxCuentaIp: 10, maxCuenta: 30, maxIp: 40 });
export function mensajeEspera(seg) { const m = Math.max(1, Math.ceil(seg / 60)); return `Pediste varios enlaces seguidos. Probá de nuevo en ${m} minuto${m !== 1 ? 's' : ''}.`; }
