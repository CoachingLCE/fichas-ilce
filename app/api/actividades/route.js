import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { parseActDef } from '../../../lib/actividades';
import { findUsuario, tienePermisoActividades, tienePermisoGestionActividades } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoActividades(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const filas = await readSheet(TABS.ACTIVIDADES);
  const actividades = filas.filter((f) => f.Slug).map((f) => {
    const { clase, edicion, fechaDisponible, mostrarResultado, preguntas } = parseActDef(f['Preguntas JSON']);
    return {
      slug: f.Slug, curso: f.Curso, titulo: f['Título'], clase, edicion, fechaDisponible, mostrarResultado,
      estado: f.Estado || 'Publicada', preguntas, actualizado: f.Actualizado
    };
  });
  return NextResponse.json({ ok: true, actividades });
}

export async function POST(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoGestionActividades(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { slug, curso, titulo, estado, preguntas, clase, edicion, fechaDisponible, mostrarResultado } = body || {};
  if (!slug || !titulo) return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
  if (!Array.isArray(preguntas) || preguntas.length === 0) return NextResponse.json({ ok: false, error: 'Agregá al menos una pregunta' }, { status: 400 });
  for (const p of preguntas) {
    if (!(p.pregunta || '').trim()) return NextResponse.json({ ok: false, error: 'Hay una pregunta sin texto' }, { status: 400 });
    const ops = (p.opciones || []).filter((o) => (o || '').trim());
    if (ops.length < 2) return NextResponse.json({ ok: false, error: `La pregunta "${p.pregunta}" necesita al menos 2 opciones` }, { status: 400 });
  }
  const def = JSON.stringify({
    clase: clase || '', edicion: edicion || '', fechaDisponible: fechaDisponible || '',
    mostrarResultado: mostrarResultado !== false, preguntas
  });
  const fila = [slug, curso || '', titulo, estado || 'Publicada', def, new Date().toISOString()];
  const filas = await readSheet(TABS.ACTIVIDADES, { noCache: true });
  const ex = filas.find((f) => f.Slug === slug);
  if (ex) await updateRow(TABS.ACTIVIDADES, ex._rowIndex, fila);
  else await appendRow(TABS.ACTIVIDADES, fila);
  return NextResponse.json({ ok: true });
}
