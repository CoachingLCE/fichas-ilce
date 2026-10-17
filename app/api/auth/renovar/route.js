import { NextResponse } from 'next/server';
import { verificarToken, crearToken } from '../../../../lib/sesionFirmada';
import { findUsuario } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/renovar (con el token actual en Authorization: Bearer …) -> { ok, token }
// Renueva la sesión de un Admin: el navegador lo pide solo cuando el token tiene más de un día, así la sesión no vence mientras se la use. Para el resto de los roles devuelve
// { ok: true, token: null } (su sesión no se renueva: termina como siempre). Un token inválido o vencido, de un usuario desactivado, o el que solo sirve para elegir contraseña, no se renueva.
export async function POST(request) {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(request.headers.get('authorization') || '');
  const t = m ? verificarToken(m[1]) : null;
  if (!t) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  if (t.cp) return NextResponse.json({ ok: false, error: 'Primero elegí tu contraseña' }, { status: 403 });
  const usuario = await findUsuario(t.email);
  if (!usuario || !usuario.activo) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  if (!(usuario.roles || []).includes('Admin')) return NextResponse.json({ ok: true, token: null });
  return NextResponse.json({ ok: true, token: crearToken(usuario.email, true) });
}
