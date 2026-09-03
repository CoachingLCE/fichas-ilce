import { NextResponse } from 'next/server';
import { readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { sesionDeRequest } from '../../../lib/auth';
import { can } from '../../../lib/permisos';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const ses = sesionDeRequest(req);
  if (!ses) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  if (!can(ses.rol, 'verInscripciones')) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });

  const filas = await readSheet(TABS.INSCRIPCIONES);
  return NextResponse.json({ ok: true, filas });
}
