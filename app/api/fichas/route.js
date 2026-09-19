import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS, CURSOS, EDICIONES_DEFAULT } from '../../../lib/constants';
import { findUsuario, tienePermisoConstructor } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

function defDefault(slug, nombre) {
  return { slug, curso: nombre, titulo: `Ficha de inscripción — ${nombre}`, estado: 'Publicada',
    bienvenida: '¡Nos alegra tenerte acá! Completá tu ficha de inscripción. Se guarda sola, podés seguir más tarde.',
    ediciones: EDICIONES_DEFAULT[slug] || [] };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const guardadas = await readSheet(TABS.FICHAS);
  const porSlug = {};
  guardadas.forEach((f) => { try { porSlug[f.Slug] = { ...JSON.parse(f['Definición JSON'] || '{}'), _rowIndex: f._rowIndex }; } catch {} });
  const defs = CURSOS.map((c) => ({ ...defDefault(c.slug, c.nombre), ...(porSlug[c.slug] || {}) }));
  return NextResponse.json({ ok: true, defs });
}

export async function POST(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoConstructor(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { slug, def } = body || {};
  const curso = CURSOS.find((c) => c.slug === slug);
  if (!curso || !def) return NextResponse.json({ ok: false, error: 'Datos inválidos' }, { status: 400 });
  const limpio = {
    titulo: def.titulo || '', bienvenida: def.bienvenida || '', estado: def.estado || 'Publicada', ediciones: def.ediciones || [],
    // Campos del Constructor por pasos (wizard): selección/orden de campos, configuración de
    // respuestas, y en qué paso quedó cada ficha (para el "continuar donde dejaste").
    campos: Array.isArray(def.campos) ? def.campos : undefined,
    config: def.config || undefined,
    wizardPaso: typeof def.wizardPaso === 'number' ? def.wizardPaso : undefined,
    wizardCompletado: def.wizardCompletado || undefined
  };
  const fila = [slug, curso.nombre, limpio.titulo, limpio.estado, JSON.stringify(limpio), new Date().toISOString()];
  const guardadas = await readSheet(TABS.FICHAS, { noCache: true });
  const existente = guardadas.find((f) => f.Slug === slug);
  if (existente) await updateRow(TABS.FICHAS, existente._rowIndex, fila);
  else await appendRow(TABS.FICHAS, fila);
  return NextResponse.json({ ok: true });
}
