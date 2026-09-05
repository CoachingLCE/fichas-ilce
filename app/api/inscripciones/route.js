import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, tienePermisoInscripciones } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !usuario.activo || !tienePermisoInscripciones(usuario)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }
  const filas = await readSheet(TABS.INSCRIPCIONES);
  return NextResponse.json({ ok: true, filas });
}
