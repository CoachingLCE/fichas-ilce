import { NextResponse } from 'next/server';
import { buscarUsuario, crearUsuario } from '../../../../lib/auth';
import { ROLES } from '../../../../lib/permisos';

export const dynamic = 'force-dynamic';

// Crea un usuario. Protegido con SETUP_TOKEN.
// Uso: /api/auth/seed?token=SETUP_TOKEN&email=...&nombre=...&password=...&rol=SuperAdmin
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (!process.env.SETUP_TOKEN || searchParams.get('token') !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }
  const email = (searchParams.get('email') || '').trim();
  const nombre = (searchParams.get('nombre') || email.split('@')[0]).trim();
  const password = searchParams.get('password') || '';
  const rol = searchParams.get('rol') || 'SuperAdmin';

  if (!email || !password) return NextResponse.json({ ok: false, error: 'Faltan email o password' }, { status: 400 });
  if (!ROLES.includes(rol)) return NextResponse.json({ ok: false, error: 'Rol inválido' }, { status: 400 });

  const existe = await buscarUsuario(email);
  if (existe) return NextResponse.json({ ok: false, error: 'Ese email ya existe en Usuarios' }, { status: 409 });

  await crearUsuario({ email, nombre, rol, password });
  return NextResponse.json({ ok: true, email, nombre, rol });
}
