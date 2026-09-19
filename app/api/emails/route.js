import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, tienePermisoEmails } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoEmails(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const emails = (await readSheet(TABS.EMAILS)).filter((f) => f.Fecha).map((f) => ({
    fecha: f.Fecha, tipo: f.Tipo, para: f.Para, asunto: f.Asunto, estado: f.Estado, detalle: f.Detalle,
    payload: f.Payload || ''
  })).reverse();
  return NextResponse.json({ ok: true, emails });
}
