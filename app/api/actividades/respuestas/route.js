import { NextResponse } from 'next/server';
import { readSheet, updateRow } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoVerRespuestasActividades, tienePermisoVerTodasRespuestas, tienePermisoEliminarRespuestas } from '../../../../lib/auth';
import { registrarAccion } from '../../../../lib/auditoria';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoVerRespuestasActividades(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });

  // Definiciones (para poder mostrar, por fila, cada pregunta con lo que respondió ese
  // estudiante — antes esta pantalla solo mostraba el puntaje total, sin forma de leer las
  // respuestas de desarrollo/abiertas, que no se autocorrigen y hay que revisar a mano).
  const normNom = (v) => (v || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim();
  const defsRaw = await readSheet(TABS.ACTIVIDADES);
  const preguntasPorTitulo = {};
  defsRaw.filter((f) => f.Slug).forEach((f) => {
    let raw = [];
    try {
      const parsed = JSON.parse(f['Preguntas JSON'] || '[]');
      raw = Array.isArray(parsed) ? parsed : (Array.isArray(parsed.preguntas) ? parsed.preguntas : []);
    } catch {}
    preguntasPorTitulo[normNom(f['Título'])] = raw;
  });

  const filas = (await readSheet(TABS.RESPUESTAS_ACT)).filter((f) => f.ID).map((f) => {
    let r = {}; try { r = JSON.parse(f['Respuestas JSON'] || '{}'); } catch {}
    const preguntas = preguntasPorTitulo[normNom(f.Actividad)] || [];
    const detalle = preguntas.map((p, i) => ({
      pregunta: p.pregunta, tipo: p.tipo || 'multiple',
      respuesta: r[i],
      opcionElegida: (p.tipo !== 'abierta' && r[i] != null && p.opciones) ? p.opciones[Number(r[i])] : undefined,
      ok: p.tipo === 'abierta' ? null : (r[i] != null && Number(r[i]) === Number(p.correcta))
    }));
    return {
      id: f.ID, fecha: f.Fecha, actividad: f.Actividad, curso: f.Curso, edicion: f['Edición'],
      email: f.Email, nombre: f.Nombre, puntaje: f['Puntuación'], total: f.Total, duracion: f['Duración seg'],
      detalle
    };
  });

  // Los que ven todo, ven todo. Un Docente ve solo curso+edición donde está asignado.
  if (tienePermisoVerTodasRespuestas(usuario)) {
    return NextResponse.json({ ok: true, respuestas: filas, alcance: 'todas' });
  }
  const docs = await readSheet(TABS.DOCENTES);
  const misAsign = docs.filter((d) => (d.Email || '').toLowerCase() === usuario.email.toLowerCase())
    .map((d) => `${(d.Curso || '').trim()}||${(d.Edición || '').trim()}`);
  const permitido = (r) => misAsign.some((a) => {
    const [c, e] = a.split('||');
    return c === (r.curso || '').trim() && (!e || e === (r.edicion || '').trim());
  });
  return NextResponse.json({ ok: true, respuestas: filas.filter(permitido), alcance: 'docente' });
}

// Pedido de Diego: el Admin puede eliminar una respuesta de actividad ya enviada (por ejemplo,
// una prueba/test cargada por error). Baja lógica, mismo criterio que ya usa DELETE en
// /api/actividades (y /api/docentes): se vacía la fila en vez de borrarla de verdad, porque no
// existe una función en lib/sheets.js para eliminar una fila real de la planilla.
export async function DELETE(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoEliminarRespuestas(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { id } = body || {};
  if (!id) return NextResponse.json({ ok: false, error: 'Falta el id' }, { status: 400 });
  const filas = await readSheet(TABS.RESPUESTAS_ACT, { noCache: true });
  const f = filas.find((x) => x.ID === id);
  if (!f) return NextResponse.json({ ok: false, error: 'No encontrada' }, { status: 404 });
  // Columnas de RESPUESTAS_ACT (ver lib/constants.js → HEADERS): ID, Fecha, Actividad, Curso,
  // Edición, Email, Nombre, Puntuación, Total, Respuestas JSON, Duración seg.
  await updateRow(TABS.RESPUESTAS_ACT, f._rowIndex, ['', '', '', '', '', '', '', '', '', '', '']);
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó respuesta de actividad', `${f.Nombre || f.Email || ''} — ${f.Actividad || ''}${f.Curso ? ' · ' + f.Curso : ''}`);
  return NextResponse.json({ ok: true });
}
