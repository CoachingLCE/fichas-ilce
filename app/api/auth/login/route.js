import { NextResponse } from 'next/server';
import { buscarUsuario, verifyPassword, signToken } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { email, password } = body || {};
  if (!email || !password) return NextResponse.json({ ok: false, error: 'Completá email y contraseña' }, { status: 400 });

  const u = await buscarUsuario(email);
  if (!u || (u.Activo && String(u.Activo).toLowerCase() === 'no')) {
    return NextResponse.json({ ok: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }
  if (!verifyPassword(password, u.Hash)) {
    return NextResponse.json({ ok: false, error: 'Usuario o contraseña incorrectos' }, { status: 401 });
  }
  const token = signToken({ email: u.Email, nombre: u.Nombre, rol: u.Rol || 'Consulta' });
  return NextResponse.json({ ok: true, token, usuario: { email: u.Email, nombre: u.Nombre, rol: u.Rol || 'Consulta' } });
}
