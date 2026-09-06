import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, tienePermisoActividades, tienePermisoGestionActividades } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoActividades(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const filas = await readSheet(TABS.ACTIVIDADES);
  const actividades = filas.filter((f) => f.Slug).map((f) => {
    let preguntas = []; try { preguntas = JSON.parse(f['Preguntas JSON'] || '[]'); } catch {}
    return { slug: f.Slug, curso: f.Curso, titulo: f['Título'], estado: f.Estado || 'Publicada', preguntas, actualizado: f.Actualizado };
  });
  return NextResponse.json({ ok: true, actividades });
}

export async function POST(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoGestionActividades(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { slug, curso, titulo, estado, preguntas } = body || {};
  if (!slug || !titulo) return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
  const fila = [slug, curso || '', titulo, estado || 'Publicada', JSON.stringify(preguntas || []), new Date().toISOString()];
  const filas = await readSheet(TABS.ACTIVIDADES, { noCache: true });
  const ex = filas.find((f) => f.Slug === slug);
  if (ex) await updateRow(TABS.ACTIVIDADES, ex._rowIndex, fila);
  else await appendRow(TABS.ACTIVIDADES, fila);
  return NextResponse.json({ ok: true });
}
