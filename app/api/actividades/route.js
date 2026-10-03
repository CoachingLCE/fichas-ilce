import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { parseActDef } from '../../../lib/actividades';
import { findUsuario, tienePermisoActividades, tienePermisoGestionActividades } from '../../../lib/auth';

export const dynamic = 'force-dynamic';

// Misma normalización que ya usa /api/actividades/reporte para cruzar una respuesta con su
// actividad por título (no hay otro identificador compartido entre ambas pestañas).
const normNom = (v) => (v || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim();

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoActividades(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const filas = await readSheet(TABS.ACTIVIDADES);
  // Cuántas respuestas ya tiene cada actividad (por título) — se usa en el editor para avisar
  // antes de tocar preguntas/configuración que puedan afectar respuestas ya enviadas. Un solo
  // conteo acá (no uno por actividad) para no pegarle N veces a la Sheet.
  let conteoResp = {};
  try {
    const resp = await readSheet(TABS.RESPUESTAS_ACT);
    resp.forEach((r) => { if (r.Actividad) { const k = normNom(r.Actividad); conteoResp[k] = (conteoResp[k] || 0) + 1; } });
  } catch { /* si falla, el editor simplemente no muestra el aviso — no bloquea la gestión */ }
  const actividades = filas.filter((f) => f.Slug).map((f) => {
    const { clase, intro, edicion, fechaDisponible, horaDisponible, fechaCierre, mostrarResultado, orden, preguntas } = parseActDef(f['Preguntas JSON']);
    return {
      slug: f.Slug, curso: f.Curso, titulo: f['Título'], clase, intro, edicion, fechaDisponible, horaDisponible, fechaCierre, mostrarResultado, orden,
      estado: f.Estado || 'Publicada', preguntas, actualizado: f.Actualizado, creado: f['Creado'] || '',
      totalRespuestas: conteoResp[normNom(f['Título'])] || 0
    };
  });
  return NextResponse.json({ ok: true, actividades });
}

export async function POST(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoGestionActividades(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });

  // Reordenamiento en bloque (drag & drop en el listado): solo toca el campo "orden" de cada
  // actividad involucrada, conservando intacto el resto de su definición (lee-modifica-escribe
  // cada fila, porque "orden" vive adentro del mismo JSON que preguntas/config).
  if (Array.isArray(body.reordenar)) {
    const filas = await readSheet(TABS.ACTIVIDADES, { noCache: true });
    for (const { slug, orden } of body.reordenar) {
      const f = filas.find((x) => x.Slug === slug);
      if (!f) continue;
      const def = parseActDef(f['Preguntas JSON']);
      const nuevoDef = JSON.stringify({ ...def, orden: Number(orden) || 0 });
      // Solo se tocan A:F (hasta "Actualizado") — "Creado" (columna G) queda intacto.
      await updateRow(TABS.ACTIVIDADES, f._rowIndex, [f.Slug, f.Curso, f['Título'], f.Estado || 'Publicada', nuevoDef, new Date().toISOString()]);
    }
    return NextResponse.json({ ok: true });
  }

  const { slug, curso, titulo, estado, preguntas, clase, intro, edicion, fechaDisponible, horaDisponible, fechaCierre, mostrarResultado, orden } = body || {};
  if (!slug || !titulo) return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
  if (!Array.isArray(preguntas) || preguntas.length === 0) return NextResponse.json({ ok: false, error: 'Agregá al menos una pregunta' }, { status: 400 });
  for (const p of preguntas) {
    if (!(p.pregunta || '').trim()) return NextResponse.json({ ok: false, error: 'Hay una pregunta sin texto' }, { status: 400 });
    const ops = (p.opciones || []).filter((o) => (o || '').trim());
    if (ops.length < 2) return NextResponse.json({ ok: false, error: `La pregunta "${p.pregunta}" necesita al menos 2 opciones` }, { status: 400 });
  }
  if (fechaDisponible && fechaCierre && fechaCierre < fechaDisponible) {
    return NextResponse.json({ ok: false, error: 'La fecha de cierre no puede ser anterior a la de disponibilidad' }, { status: 400 });
  }
  const def = JSON.stringify({
    clase: clase || '', intro: intro || '', edicion: edicion || '', fechaDisponible: fechaDisponible || '', horaDisponible: horaDisponible || '', fechaCierre: fechaCierre || '',
    mostrarResultado: mostrarResultado !== false, orden: Number(orden) || 0, preguntas
  });
  const filas = await readSheet(TABS.ACTIVIDADES, { noCache: true });
  const ex = filas.find((f) => f.Slug === slug);
  // "Creado" se escribe una sola vez: si ya existía, se conserva su valor original (aunque
  // esté vacío, por ser una actividad previa a este cambio); si es nueva, se marca ahora.
  const creado = ex ? (ex['Creado'] || '') : new Date().toISOString();
  const fila = [slug, curso || '', titulo, estado || 'Publicada', def, new Date().toISOString(), creado];
  if (ex) await updateRow(TABS.ACTIVIDADES, ex._rowIndex, fila);
  else await appendRow(TABS.ACTIVIDADES, fila);
  return NextResponse.json({ ok: true });
}

// Baja lógica (mismo criterio que ya usa /api/docentes): se vacía la fila en vez de borrarla
// de verdad — no hay ninguna función en lib/sheets.js para eliminar una fila de la planilla
// (nunca hizo falta hasta ahora), así que no se inventa una acá. Las respuestas ya guardadas
// en RESPUESTAS_ACT no se tocan: quedan en el historial aunque la actividad se borre.
export async function DELETE(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoGestionActividades(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { slug } = body || {};
  if (!slug) return NextResponse.json({ ok: false, error: 'Falta el slug' }, { status: 400 });
  const filas = await readSheet(TABS.ACTIVIDADES, { noCache: true });
  const f = filas.find((x) => x.Slug === slug);
  if (!f) return NextResponse.json({ ok: false, error: 'No encontrada' }, { status: 404 });
  await updateRow(TABS.ACTIVIDADES, f._rowIndex, ['', '', '', '', '', '']);
  return NextResponse.json({ ok: true });
}
