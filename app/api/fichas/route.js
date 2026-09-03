import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS, CURSOS, EDICIONES_DEFAULT } from '../../../lib/constants';
import { sesionDeRequest } from '../../../lib/auth';
import { can } from '../../../lib/permisos';

export const dynamic = 'force-dynamic';

// Definición por defecto (hardcode) combinada con lo guardado en la pestaña Fichas.
function defDefault(slug, nombre) {
  return {
    slug, curso: nombre, titulo: `Ficha de inscripción — ${nombre}`,
    estado: 'Publicada',
    bienvenida: '¡Nos alegra tenerte acá! Completá tu ficha de inscripción. Se guarda sola, podés seguir más tarde.',
    ediciones: EDICIONES_DEFAULT[slug] || []
  };
}

export async function GET(req) {
  const ses = sesionDeRequest(req);
  if (!ses) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const guardadas = await readSheet(TABS.FICHAS);
  const porSlug = {};
  guardadas.forEach((f) => {
    try { porSlug[f.Slug] = { ...JSON.parse(f['Definición JSON'] || '{}'), _rowIndex: f._rowIndex }; } catch {}
  });
  const defs = CURSOS.map((c) => ({ ...defDefault(c.slug, c.nombre), ...(porSlug[c.slug] || {}) }));
  return NextResponse.json({ ok: true, defs });
}

export async function POST(req) {
  const ses = sesionDeRequest(req);
  if (!ses) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  if (!can(ses.rol, 'constructor')) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { slug, def } = body || {};
  const curso = CURSOS.find((c) => c.slug === slug);
  if (!curso || !def) return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });

  const limpio = { titulo: def.titulo || '', bienvenida: def.bienvenida || '', estado: def.estado || 'Publicada', ediciones: def.ediciones || [] };
  const fila = [slug, curso.nombre, limpio.titulo, limpio.estado, JSON.stringify(limpio), new Date().toISOString()];

  const guardadas = await readSheet(TABS.FICHAS, { noCache: true });
  const existente = guardadas.find((f) => f.Slug === slug);
  if (existente) await updateRow(TABS.FICHAS, existente._rowIndex, fila);
  else await appendRow(TABS.FICHAS, fila);

  return NextResponse.json({ ok: true });
}
