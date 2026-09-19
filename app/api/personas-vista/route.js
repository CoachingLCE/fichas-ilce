import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario } from '../../../lib/auth';
import { puedeVerComoOtro } from '../../../lib/permisos';

export const dynamic = 'force-dynamic';

// Lista de personas que un Admin puede usar en "Ver como" (previsualización).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !puedeVerComoOtro(usuario)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }
  const usuarios = await readSheet(TABS.USUARIOS);
  const personas = usuarios
    .filter((u) => u.Email && (u.Activo || '') !== 'FALSE' && (u.Activo || '').toLowerCase() !== 'no')
    .map((u) => ({
      email: u.Email,
      nombre: u.Nombre || u.Email,
      roles: (u.Roles || '').split(/[,+]/).map((r) => r.trim()).filter(Boolean)
    }))
    .filter((p) => p.email.toLowerCase() !== usuario.email.toLowerCase())
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  return NextResponse.json({ ok: true, personas });
}
