import crypto from 'crypto';

// Clave de 32 bytes derivada de PASSWORD_ENCRYPTION_KEY (cualquier string sirve).
function getKey() {
  const base = process.env.PASSWORD_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'ilce-fallback-key';
  return crypto.scryptSync(base, 'ilce-pwd-salt', 32);
}

// Encripta (reversible) -> "ivB64:tagB64:ctB64"
export function encryptPassword(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getKey(), iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${tag.toString('base64')}:${ct.toString('base64')}`;
}

export function decryptPassword(stored) {
  try {
    const [ivB, tagB, ctB] = String(stored).split(':');
    if (!ivB || !tagB || !ctB) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getKey(), Buffer.from(ivB, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB, 'base64'));
    const pt = Buffer.concat([decipher.update(Buffer.from(ctB, 'base64')), decipher.final()]);
    return pt.toString('utf8');
  } catch {
    return null;
  }
}

export function verifyPassword(input, stored) {
  const real = decryptPassword(stored);
  if (real == null) return false;
  const a = Buffer.from(String(input));
  const b = Buffer.from(real);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
