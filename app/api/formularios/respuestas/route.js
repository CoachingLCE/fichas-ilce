import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoFormularios } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const respuestas = (await readSheet(TABS.RESPUESTAS_FORM)).filter((f) => f.ID).map((f) => {
    let r = {}; try { r = JSON.parse(f['Respuestas JSON'] || '{}'); } catch {}
    return { id: f.ID, fecha: f.Fecha, formulario: f.Formulario, curso: f.Curso, email: f.Email, nombre: f.Nombre, edicion: f['Edición'], r };
  }).reverse();
  return NextResponse.json({ ok: true, respuestas });
}
