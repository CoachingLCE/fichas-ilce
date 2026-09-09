import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, tienePermisoAuditoria } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// Historial completo de acciones (todo lo registrado). Solo Admin.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoAuditoria(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const eventos = (await readSheet(TABS.HISTORIAL))
    .filter((f) => f.Fecha && (f['Acción'] || f['Inscripción ID']))
    .map((f) => ({ fecha: f.Fecha, id: f['Inscripción ID'], usuario: f.Usuario, accion: f['Acción'], detalle: f.Detalle }))
    .reverse();
  return NextResponse.json({ ok: true, eventos });
}
