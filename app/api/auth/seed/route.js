import { NextResponse } from 'next/server';
import { findUsuario } from '../../../../lib/auth';
import { appendRow } from '../../../../lib/sheets';
import { TABS, ROLES } from '../../../../lib/constants';
import { encryptPassword } from '../../../../lib/passwords';

export const dynamic = 'force-dynamic';

// Crea el primer usuario admin (bootstrap). Protegido con SETUP_TOKEN.
// /api/auth/seed?token=SETUP_TOKEN&email=...&nombre=...&password=...&roles=Admin
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (!process.env.SETUP_TOKEN || searchParams.get('token') !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }
  const email = (searchParams.get('email') || '').trim();
  const nombre = (searchParams.get('nombre') || email.split('@')[0]).trim();
  const password = searchParams.get('password') || '';
  const rolesParam = searchParams.get('roles') || searchParams.get('rol') || 'Admin';
  const roles = rolesParam.split(',').map((r) => r.trim()).filter((r) => ROLES.includes(r));

  if (!email || !password) return NextResponse.json({ ok: false, error: 'Faltan email o password' }, { status: 400 });
  if (!roles.length) return NextResponse.json({ ok: false, error: 'Rol inválido. Usá: ' + ROLES.join(', ') }, { status: 400 });

  const existe = await findUsuario(email);
  if (existe) return NextResponse.json({ ok: false, error: 'Ese email ya existe en Usuarios' }, { status: 409 });

  await appendRow(TABS.USUARIOS, [email, nombre, roles.join(','), encryptPassword(password), 'TRUE']);
  return NextResponse.json({ ok: true, email, nombre, roles });
}
