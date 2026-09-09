import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, tienePermisoFormularios } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const filas = await readSheet(TABS.FORMULARIOS);
  const formularios = filas.filter((f) => f.Slug).map((f) => {
    let campos = []; try { campos = JSON.parse(f['Campos JSON'] || '[]'); } catch {}
    return { slug: f.Slug, titulo: f['Título'], tipo: f.Tipo, estado: f.Estado || 'Publicada', campos, actualizado: f.Actualizado };
  });
  return NextResponse.json({ ok: true, formularios });
}

export async function POST(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { slug, titulo, tipo, estado, campos } = body || {};
  if (!slug || !titulo) return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
  const fila = [slug, titulo, tipo || '', estado || 'Publicada', JSON.stringify(campos || []), new Date().toISOString()];
  const filas = await readSheet(TABS.FORMULARIOS, { noCache: true });
  const ex = filas.find((f) => f.Slug === slug);
  if (ex) await updateRow(TABS.FORMULARIOS, ex._rowIndex, fila);
  else await appendRow(TABS.FORMULARIOS, fila);
  return NextResponse.json({ ok: true });
}
