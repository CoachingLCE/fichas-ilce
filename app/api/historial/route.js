import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, tienePermisoInscripciones } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoInscripciones(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const id = searchParams.get('id');
  const filas = await readSheet(TABS.HISTORIAL);
  const eventos = filas.filter((f) => String(f['Inscripción ID']) === String(id))
    .map((f) => ({ fecha: f.Fecha, usuario: f.Usuario, accion: f['Acción'], detalle: f.Detalle }));
  return NextResponse.json({ ok: true, eventos });
}
