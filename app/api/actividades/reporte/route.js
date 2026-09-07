import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoActividades, tienePermisoVerTodasRespuestas } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoActividades(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });

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
    return { actividad: f.Actividad, curso: f.Curso, edicion: f['Edición'], puntaje: Number(f['Puntuación']) || 0, total: Number(f.Total) || 0, r };
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
    const preguntas = d.preguntas.map((p, i) => {
      let respondidas = 0, aciertos = 0;
      rs.forEach((x) => {
        const elegido = x.r ? x.r[i] : undefined;
        if (elegido != null && elegido !== '') { respondidas++; if (Number(elegido) === Number(p.correcta)) aciertos++; }
      });
      return { pregunta: p.pregunta, respondidas, aciertos, pct: respondidas ? Math.round(aciertos / respondidas * 100) : 0 };
    });
    return { slug: d.slug, titulo: d.titulo, curso: d.curso, totalResp, promedio, preguntas };
  }).filter((a) => a.totalResp > 0 || true); // incluimos todas, aunque tengan 0 respuestas

  return NextResponse.json({ ok: true, actividades: salida });
}
