import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { usuarioDeSolicitud, tienePermisoHabilitarIntentos } from '../../../../lib/auth';
import { prepararPestanas, intentoDeFila, normEmail, normTitulo } from '../../../../lib/evaluaciones';
import { parseEvalDef, calcularElegibilidad, estadoIntento } from '../../../../lib/evaluacionesLogica';

export const dynamic = 'force-dynamic';

// Respuestas de las Evaluaciones finales: cada intento, y la lista de "pendientes de habilitar"
// (personas que gastaron todos sus intentos sin aprobar: un administrador puede darles uno más).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await usuarioDeSolicitud(req, searchParams.get('solicitanteEmail'));
  if (!usuario) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  try {
    await prepararPestanas();
    const [defs, filas, habs] = await Promise.all([
      readSheet(TABS.EVALUACIONES, { noCache: true }),
      readSheet(TABS.INTENTOS_EVAL, { noCache: true }),
      readSheet(TABS.HABILITACIONES_EVAL, { noCache: true })
    ]);
    const ahora = Date.now();
    const evals = {}; // por título normalizado
    defs.filter((f) => f.Slug).forEach((f) => { evals[normTitulo(f['Título'])] = { slug: f.Slug, titulo: f['Título'], curso: f.Curso || '', def: parseEvalDef(f['Definición JSON']) }; });

    const intentos = filas.filter((f) => f.ID).map((f) => {
      const ev = evals[normTitulo(f['Evaluación'])];
      const base = intentoDeFila(f);
      const real = ev ? estadoIntento(base, ev.def, ahora) : (f.Estado === 'Finalizado' ? 'finalizado' : 'sin_enviar');
      let r = {}; try { r = JSON.parse(f['Respuestas JSON'] || '{}'); } catch { /* */ }
      const estado = f.Estado === 'Finalizado' ? 'Finalizado' : (real === 'en_curso' ? 'En curso' : 'Sin enviar');
      return {
        id: f.ID, inicio: f.Inicio || '', fin: f.Fin || '', evaluacion: f['Evaluación'] || '', slug: ev ? ev.slug : '', curso: f.Curso || '', edicion: f['Edición'] || '',
        email: f.Email || '', nombre: f.Nombre || '', intento: Number(f.Intento) || 1, estado,
        puntaje: f.Estado === 'Finalizado' ? Number(String(f['Puntuación']).replace(',', '.')) || 0 : null,
        total: Number(String(f.Total).replace(',', '.')) || 0, resultado: f.Resultado || '', duracionSeg: Number(f['Duración seg']) || 0, r
      };
    }).sort((a, b) => (Date.parse(b.inicio) || 0) - (Date.parse(a.inicio) || 0));

    // Extras por (evaluación, email)
    const extras = {};
    habs.forEach((h) => {
      const k = normTitulo(h['Evaluación']) + '|' + normEmail(h.Email);
      extras[k] = (extras[k] || 0) + (Math.floor(Number(h['Intentos extra'])) || 0);
    });

    // Pendientes: por cada persona y evaluación, si la regla dice "sin_intentos" (y no aprobó).
    const porPersona = {};
    filas.filter((f) => f.ID && evals[normTitulo(f['Evaluación'])]).forEach((f) => {
      const k = normTitulo(f['Evaluación']) + '|' + normEmail(f.Email);
      (porPersona[k] || (porPersona[k] = [])).push(f);
    });
    const pendientes = [];
    Object.entries(porPersona).forEach(([k, fs]) => {
      const ev = evals[k.split('|')[0]];
      const res = calcularElegibilidad({ def: ev.def, intentos: fs.map(intentoDeFila), extra: extras[k] || 0, ahoraMs: ahora });
      if (res.motivo !== 'sin_intentos') return;
      const ult = fs.slice().sort((a, b) => (Date.parse(b.Inicio) || 0) - (Date.parse(a.Inicio) || 0))[0];
      const mejor = Math.max(...fs.filter((f) => f.Estado === 'Finalizado').map((f) => Number(String(f['Puntuación']).replace(',', '.')) || 0), 0);
      pendientes.push({
        evaluacion: ev.titulo, slug: ev.slug, curso: ev.curso, edicion: ult['Edición'] || '', email: normEmail(ult.Email), nombre: ult.Nombre || '',
        usados: res.usados, maxIntentos: res.maxIntentos, mejor, total: Number(String(ult.Total).replace(',', '.')) || 0, ultimo: ult.Fin || ult.Inicio || ''
      });
    });
    pendientes.sort((a, b) => (Date.parse(b.ultimo) || 0) - (Date.parse(a.ultimo) || 0));

    const habilitaciones = habs.filter((h) => h.Email).map((h) => ({ fecha: h.Fecha || '', evaluacion: h['Evaluación'] || '', email: h.Email, extra: Number(h['Intentos extra']) || 0, quien: h['Habilitó'] || '', motivo: h.Motivo || '' }))
      .sort((a, b) => (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0));

    // Preguntas de cada evaluación (para el detalle de un intento).
    const preguntas = {};
    Object.values(evals).forEach((e) => { preguntas[e.titulo] = e.def.preguntas.map((p) => ({ pregunta: p.pregunta, opciones: p.opciones, correcta: p.correcta, justificacion: p.justificacion })); });

    return NextResponse.json({ ok: true, intentos, pendientes, habilitaciones, preguntas, puedeHabilitar: tienePermisoHabilitarIntentos(usuario) });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'No se pudieron leer las respuestas' }, { status: 500 });
  }
}
