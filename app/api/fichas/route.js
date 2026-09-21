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
  // Blindaje: si alguna ficha quedó guardada con "ediciones"/"campos"/"config" en un formato
  // viejo o corrupto (no array / no objeto), acá se normaliza para que el Constructor y la
  // lista de Fichas nunca reciban algo que les rompa el .map()/.filter() y tiren pantalla en blanco.
  const defs = CURSOS.map((c) => {
    const base = { ...defDefault(c.slug, c.nombre), ...(porSlug[c.slug] || {}) };
    return {
      ...base,
      ediciones: Array.isArray(base.ediciones) ? base.ediciones : [],
      campos: Array.isArray(base.campos) ? base.campos : undefined,
      config: (base.config && typeof base.config === 'object' && !Array.isArray(base.config)) ? base.config : undefined
    };
  });
  return NextResponse.json({ ok: true, defs });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
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
  try {
    const guardadas = await readSheet(TABS.FICHAS, { noCache: true });
    const existente = guardadas.find((f) => f.Slug === slug);
    if (existente) await updateRow(TABS.FICHAS, existente._rowIndex, fila);
    else await appendRow(TABS.FICHAS, fila);
    return NextResponse.json({ ok: true });
  } catch (e) {
    // Sin este try/catch, un timeout o error transitorio de Google Sheets rompía la función
    // a mitad de guardado: el navegador recibía una respuesta vacía/cortada y el Constructor
    // solo podía mostrar un "No pudimos guardar" genérico, sin decir por qué falló de verdad.
    return NextResponse.json({ ok: false, error: e.message || 'Error al guardar' }, { status: 500 });
  }
}
