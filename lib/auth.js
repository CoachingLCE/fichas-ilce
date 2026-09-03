import crypto from 'crypto';
import { readSheet, appendRow } from './sheets';
import { TABS } from './constants';

const SECRET = process.env.SESSION_SECRET || process.env.SETUP_TOKEN || 'cambia-esto';

// ---- Password hashing (scrypt) ----
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  return `${salt}:${hash}`;
}
export function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const calc = crypto.scryptSync(String(pw), salt, 32).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(calc, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Tokens de sesión (HMAC firmado, expiración 10h) ----
function b64url(obj) { return Buffer.from(JSON.stringify(obj)).toString('base64url'); }
function firma(body) { return crypto.createHmac('sha256', SECRET).update(body).digest('base64url'); }

export function signToken(payload, horas = 10) {
  const exp = Date.now() + horas * 3600 * 1000;
  const body = b64url({ ...payload, exp });
  return `${body}.${firma(body)}`;
}
export function verifyToken(token) {
  if (!token || !token.includes('.')) return null;
  const [body, sig] = token.split('.');
  if (firma(body) !== sig) return null;
  let data;
  try { data = JSON.parse(Buffer.from(body, 'base64url').toString()); } catch { return null; }
  if (!data.exp || Date.now() > data.exp) return null;
  return data;
}

// Extrae y valida el token del header Authorization de una request.
export function sesionDeRequest(req) {
  const h = req.headers.get('authorization') || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : '';
  return verifyToken(token);
}

// ---- Usuarios (pestaña Usuarios: Email, Nombre, Rol, Hash, Activo) ----
export async function buscarUsuario(email) {
  const usuarios = await readSheet(TABS.USUARIOS);
  const e = (email || '').trim().toLowerCase();
  return usuarios.find((u) => (u.Email || '').trim().toLowerCase() === e) || null;
}

export async function crearUsuario({ email, nombre, rol, password }) {
  await appendRow(TABS.USUARIOS, [email, nombre, rol, hashPassword(password), 'Sí']);
}
