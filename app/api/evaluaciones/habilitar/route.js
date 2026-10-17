import { NextResponse } from 'next/server';
import { readSheet, appendRow } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { usuarioDeSolicitud, tienePermisoHabilitarIntentos } from '../../../../lib/auth';
import { registrarAccion } from '../../../../lib/auditoria';
import { prepararPestanas, normEmail, normTitulo, elegibilidadDe, getEvaluacion } from '../../../../lib/evaluaciones';
import { validarEmail } from '../../../../lib/validacion';

export const dynamic = 'force-dynamic';

// Habilita UN intento extra a una persona que se quedó sin intentos. Queda registrado quién lo hizo y cuándo.
// El intento extra se puede rendir enseguida (no aplica la espera de días entre intentos).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const usuario = await usuarioDeSolicitud(req, body && body.solicitanteEmail);
  if (!usuario || !tienePermisoHabilitarIntentos(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso para habilitar intentos' }, { status: 403 });
  const email = normEmail(body.email);
  const slug = String(body.slug || '');
  if (!slug || !validarEmail(email)) return NextResponse.json({ ok: false, error: 'Faltan datos' }, { status: 400 });
  const ev = await getEvaluacion(slug);
  if (!ev) return NextResponse.json({ ok: false, error: 'Evaluación no encontrada' }, { status: 404 });
  await prepararPestanas();
  // Solo se habilita a quien realmente está sin intentos (evita sumar intentos "por las dudas" con un doble clic).
  const { res } = await elegibilidadDe(ev, email, Date.now());
  if (res.motivo !== 'sin_intentos') {
    const msg = res.motivo === 'aprobado_previo' ? 'Esa persona ya aprobó.' : 'Esa persona todavía tiene intentos disponibles.';
    return NextResponse.json({ ok: false, error: msg }, { status: 409 });
  }
  const motivo = String(body.motivo || '').trim().slice(0, 300);
  try {
    await appendRow(TABS.HABILITACIONES_EVAL, [new Date().toISOString(), ev.titulo, email, 1, usuario.nombre || usuario.email, motivo]);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar: ' + (e.message || e) }, { status: 500 });
  }
  try { await registrarAccion(usuario.email, usuario.nombre, 'Habilitó un intento extra', `${ev.titulo} · ${email}${motivo ? ' · ' + motivo : ''}`); } catch { /* */ }
  return NextResponse.json({ ok: true });
}
