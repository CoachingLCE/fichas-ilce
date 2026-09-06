import { NextResponse } from 'next/server';
import { appendRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { getActividad, corregir } from '../../../lib/actividades';
import { validarEmail } from '../../../lib/validacion';
import { enviarResultadoActividad } from '../../../lib/mailer';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { slug, email, nombre, edicion, respuestas } = body || {};
  if (!validarEmail(email)) return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });

  const act = await getActividad(slug);
  if (!act) return NextResponse.json({ ok: false, error: 'Actividad no encontrada' }, { status: 404 });
  if (act.estado !== 'Publicada') return NextResponse.json({ ok: false, error: 'La actividad no está disponible' }, { status: 403 });

  const { puntaje, total } = corregir(act.preguntas, respuestas || {});
  const id = 'A' + Date.now().toString(36).toUpperCase();
  try {
    await appendRow(TABS.RESPUESTAS_ACT, [
      id, new Date().toISOString(), act.titulo, act.curso, edicion || '',
      email, nombre || '', puntaje, total, JSON.stringify(respuestas || {})
    ]);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 });
  }
  let emailOk = true;
  try { await enviarResultadoActividad({ email, nombre, curso: act.curso, actividad: act.titulo, puntaje, total }); } catch { emailOk = false; }
  return NextResponse.json({ ok: true, puntaje, total, emailOk });
}
