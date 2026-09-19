import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoActividades, tienePermisoVerTodasRespuestas } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoActividades(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });

  try {
    return await construirReporte(usuario);
  } catch (e) {
    // Sin este try/catch, un timeout o error transitorio de Google Sheets rompía la
    // función serverless a mitad de camino: el navegador recibía una respuesta vacía
    // o cortada y fallaba con "Unexpected end of JSON input" sin explicar la causa.
    return NextResponse.json({ ok: false, error: e.message || 'Error al generar el reporte' }, { status: 500 });
  }
}

async function construirReporte(usuario) {
  // Definiciones (para saber las preguntas y la correcta)
  const defsRaw = await readSheet(TABS.ACTIVIDADES);
  const defs = defsRaw.filter((f) => f.Slug).map((f) => {
    let preguntas = []; try { preguntas = JSON.parse(f['Preguntas JSON'] || '[]'); } catch {}
    return { slug: f.Slug, curso: f.Curso, titulo: f['Título'], preguntas };
  });
  const porTitulo = {};
  defs.forEach((d) => { porTitulo[d.titulo] = d; });

  // Respuestas
  let resp = (await readSheet(TABS.RESPUESTAS_ACT)).filter((f) => f.ID).map((f) => {
    let r = {}; try { r = JSON.parse(f['Respuestas JSON'] || '{}'); } catch {}
    return { actividad: f.Actividad, curso: f.Curso, edicion: f['Edición'], email: (f.Email || '').trim().toLowerCase(), puntaje: Number(f['Puntuación']) || 0, total: Number(f.Total) || 0, dur: Number(f['Duración seg']) || 0, r };
  });

  // Alcance docente
  if (!tienePermisoVerTodasRespuestas(usuario)) {
    const docs = await readSheet(TABS.DOCENTES);
    const asign = docs.filter((d) => (d.Email || '').toLowerCase() === usuario.email.toLowerCase())
      .map((d) => `${(d.Curso || '').trim()}||${(d['Edición'] || '').trim()}`);
    resp = resp.filter((x) => asign.some((a) => { const [c, e] = a.split('||'); return c === (x.curso || '').trim() && (!e || e === (x.edicion || '').trim()); }));
  }

  // Agregación por actividad (por título)
  const salida = defs.map((d) => {
    const rs = resp.filter((x) => x.actividad === d.titulo);
    const totalResp = rs.length;
    const promedio = totalResp ? Math.round(rs.reduce((s, x) => s + (x.total ? x.puntaje / x.total : 0), 0) / totalResp * 100) : 0;
    const conTiempo = rs.filter((x) => x.dur > 0);
    const tiempoProm = conTiempo.length ? Math.round(conTiempo.reduce((s, x) => s + x.dur, 0) / conTiempo.length) : 0;
    const preguntas = d.preguntas.map((p, i) => {
      let respondidas = 0, aciertos = 0;
      rs.forEach((x) => {
        const elegido = x.r ? x.r[i] : undefined;
        if (elegido != null && elegido !== '') { respondidas++; if (Number(elegido) === Number(p.correcta)) aciertos++; }
      });
      return { pregunta: p.pregunta, respondidas, aciertos, pct: respondidas ? Math.round(aciertos / respondidas * 100) : 0 };
    });
    return { slug: d.slug, titulo: d.titulo, curso: d.curso, totalResp, promedio, tiempoProm, preguntas };
  }).filter((a) => a.totalResp > 0 || true); // incluimos todas, aunque tengan 0 respuestas

  // Cruce por curso: cuántos estudiantes distintos (por email) respondieron al menos una
  // actividad de ese curso, sobre el total de respuestas y su promedio — para comparar
  // después contra los inscriptos (que vienen de Fichas, no de acá). Se arma por email
  // único porque un mismo estudiante puede responder varias actividades del mismo curso.
  const cursosConResp = [...new Set(resp.map((x) => (x.curso || '').trim()).filter(Boolean))];
  const porCurso = cursosConResp.map((curso) => {
    const rs = resp.filter((x) => (x.curso || '').trim() === curso);
    const emailsUnicos = new Set(rs.filter((x) => x.email).map((x) => x.email));
    const totalRespuestas = rs.length;
    const promedio = totalRespuestas ? Math.round(rs.reduce((s, x) => s + (x.total ? x.puntaje / x.total : 0), 0) / totalRespuestas * 100) : 0;
    return { curso, estudiantesConActividad: emailsUnicos.size, totalRespuestas, promedio };
  });

  return NextResponse.json({ ok: true, actividades: salida, porCurso });
}
