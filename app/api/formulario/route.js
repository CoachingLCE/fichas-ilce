import { NextResponse } from 'next/server';
import { appendRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { getFormulario } from '../../../lib/formularios';
import { cursoAGuardar } from '../../../lib/formularioCurso';
import { validarEmail, validarValorCampo } from '../../../lib/validacion';
import { limitador, ipDe, MIN10 } from '../../../lib/limiteRitmo';
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
  return NextResponse.json({ ok: true });
}
