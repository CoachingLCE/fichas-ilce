import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { sesionDeRequest } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const ses = sesionDeRequest(req);
  if (!ses) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const filas = await readSheet(TABS.HISTORIAL);
  const eventos = filas
    .filter((f) => String(f['Inscripción ID']) === String(id))
    .map((f) => ({ fecha: f.Fecha, usuario: f.Usuario, accion: f.Acción, detalle: f.Detalle }));
  return NextResponse.json({ ok: true, eventos });
}
