import { NextResponse } from 'next/server';
import { appendRow, readSheet } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { getActividad, corregir } from '../../../lib/actividades';
import { validarEmail } from '../../../lib/validacion';
import { enviarResultadoActividad, enviarAvisoActividadDocente } from '../../../lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { slug, email, nombre, edicion, respuestas, duracion } = body || {};
  if (!validarEmail(email)) return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });

  const act = await getActividad(slug);
  if (!act) return NextResponse.json({ ok: false, error: 'Actividad no encontrada' }, { status: 404 });
  if (act.estado !== 'Publicada') return NextResponse.json({ ok: false, error: 'La actividad no está disponible' }, { status: 403 });

  const { puntaje, total } = corregir(act.preguntas, respuestas || {});
  const id = 'A' + Date.now().toString(36).toUpperCase();
  try {
    await appendRow(TABS.RESPUESTAS_ACT, [
      id, new Date().toISOString(), act.titulo, act.curso, edicion || '',
      email, nombre || '', puntaje, total, JSON.stringify(respuestas || {}), (Number(duracion) > 0 ? Number(duracion) : '')
    ]);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 });
  }

  let emailOk = true;
  try { await enviarResultadoActividad({ email, nombre, curso: act.curso, actividad: act.titulo, puntaje, total }); } catch { emailOk = false; }

  // Avisar a los docentes asignados a este curso/edición (edición vacía del docente = todas las ediciones del curso).
  try {
    const edResp = String(edicion || '').trim();
    const docentes = (await readSheet(TABS.DOCENTES)).filter((d) => d.Email && (d.Curso || '') === act.curso);
    const yaAvisado = new Set();
    for (const d of docentes) {
      const edDoc = String(d['Edición'] || '').trim();
      if (edDoc && edDoc !== edResp) continue; // el docente es de otra edición
      const key = (d.Email || '').toLowerCase();
      if (yaAvisado.has(key)) continue;
      yaAvisado.add(key);
      try {
        await enviarAvisoActividadDocente({
          docenteEmail: d.Email, docenteNombre: d.Nombre,
          estudiante: nombre || '', estudianteEmail: email,
          actividad: act.titulo, curso: act.curso, edicion: edResp,
          puntaje, total
        });
      } catch { /* si falla un mail, seguimos con los demás */ }
    }
  } catch { /* no bloquear la respuesta del estudiante si falla el aviso a docentes */ }

  return NextResponse.json({ ok: true, puntaje, total, emailOk });
}
