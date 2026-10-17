import { NextResponse } from 'next/server';
import { verificarToken, crearToken } from '../../../../lib/sesionFirmada';
import { findUsuario } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/auth/renovar (con el token actual en Authorization: Bearer …) -> { ok, token }
// Renueva una sesión "larga": la de quien tildó "Mantener sesión abierta" al ingresar y la de Admin. El navegador lo pide solo cuando el token tiene más de un día, así la sesión no vence
// mientras se la use. Una sesión normal devuelve { ok: true, token: null } y termina como siempre. Un token inválido o vencido, de un usuario desactivado, o el que solo sirve para elegir
// contraseña, no se renueva.
export async function POST(request) {
  const m = /^Bearer\s+(\S+)\s*$/i.exec(request.headers.get('authorization') || '');
  const t = m ? verificarToken(m[1]) : null;
  if (!t) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  if (t.cp) return NextResponse.json({ ok: false, error: 'Primero elegí tu contraseña' }, { status: 403 });
  const usuario = await findUsuario(t.email);
  if (!usuario || !usuario.activo) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  // Solo se renuevan las sesiones largas (las de quien tildó "Mantener sesión abierta" y las de Admin). Las demás terminan como siempre.
  if (!t.larga) return NextResponse.json({ ok: true, token: null });
  return NextResponse.json({ ok: true, token: crearToken(usuario.email, (usuario.roles || []).includes('Admin'), Date.now(), { larga: true }) });
}
