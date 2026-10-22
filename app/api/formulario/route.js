import { NextResponse } from 'next/server';
import { appendRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { getFormulario } from '../../../lib/formularios';
import { cursoAGuardar } from '../../../lib/formularioCurso';
import { validarEmail, validarValorCampo } from '../../../lib/validacion';
import { limitador, ipDe, MIN10 } from '../../../lib/limiteRitmo';
import { enviarConfirmacionFormulario } from '../../../lib/mailer';
import { demasiadoGrande } from '../../../lib/entradaPublica';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  // Ruta pública que escribe en la planilla: límite por conexión y por tamaño (revisión de seguridad, octubre de 2026).
  if (demasiadoGrande(body)) return NextResponse.json({ ok: false, error: 'Las respuestas son demasiado grandes.' }, { status: 413 });
  const limiteIp = limitador.intentar('form:ip:' + ipDe(req), 20, MIN10);
  if (!limiteIp.permitido) return NextResponse.json({ ok: false, error: 'Se enviaron demasiadas respuestas desde tu conexión. Esperá unos minutos y volvé a intentar.' }, { status: 429, headers: { 'Retry-After': String(limiteIp.reintentarEnSeg) } });
  const { slug, respuestas } = body || {};
  const form = await getFormulario(slug);
  if (!form) return NextResponse.json({ ok: false, error: 'Formulario no encontrado' }, { status: 404 });
  if (form.estado !== 'Publicada') return NextResponse.json({ ok: false, error: 'El formulario no está disponible' }, { status: 403 });

  const r = respuestas || {};
  // v1.43.0: un formulario anónimo no pide ni guarda el correo (aunque alguien lo mande a mano, se descarta).
  if (form.anonimo) delete r.email;
  else if (!validarEmail(r.email)) return NextResponse.json({ ok: false, error: 'Email inválido' }, { status: 400 });
  // Validar obligatorios definidos
  for (const c of form.campos) {
    if (c.required && (r[c.key] == null || String(r[c.key]).trim() === '')) {
      return NextResponse.json({ ok: false, error: `Falta: ${c.label}` }, { status: 400 });
    }
    const msgCampo = validarValorCampo(c, r[c.key]);
    if (msgCampo) return NextResponse.json({ ok: false, error: msgCampo }, { status: 400 });
  }
  const id = 'FR' + Date.now().toString(36).toUpperCase();
  try {
    await appendRow(TABS.RESPUESTAS_FORM, [
      id, new Date().toISOString(), form.titulo, cursoAGuardar(form, r), r.email || '', r.nombre || '', r.edicion || '', JSON.stringify(r)
    ]);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar' }, { status: 500 });
  }
  // v1.86.0: correo automático de confirmación, si el formulario lo tiene activado. Nunca hace fallar el envío del formulario: la respuesta ya quedó guardada.
  // Como el correo sale de ILCE hacia una dirección que escribe cualquiera, hay dos topes (en memoria, mejor esfuerzo): por dirección y por formulario.
  // El tope por formulario cuida la cuota diaria de Gmail (ya se agotó una vez, el 03/10/2026, con un envío masivo).
  let correo = 'no';
  const em = form.confirmacion && form.confirmacion.email;
  if (em && em.activo && !form.anonimo && r.email) {
    const HORA = 6 * MIN10;
    const porDireccion = limitador.intentar(`formmail:${slug}:${String(r.email).toLowerCase()}`, 2, HORA);
    const porFormulario = porDireccion.permitido ? limitador.intentar(`formmail:todos:${slug}`, 300, HORA) : { permitido: false };
    if (!porDireccion.permitido || !porFormulario.permitido) correo = 'limitado';
    else {
      try {
        await enviarConfirmacionFormulario({ email: String(r.email).trim(), nombre: String(r.nombre || '').trim().slice(0, 80), formulario: form.titulo, curso: cursoAGuardar(form, r) || '', asunto: em.asunto, cuerpo: em.cuerpo, botones: em.botones });
        correo = 'enviado';
      } catch { correo = 'fallo'; }
    }
  }
  return NextResponse.json({ ok: true, correo });
}
