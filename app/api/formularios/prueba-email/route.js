import { NextResponse } from 'next/server';
import { usuarioDeSolicitud, tienePermisoFormularios } from '../../../../lib/auth';
import { enviarConfirmacionFormulario } from '../../../../lib/mailer';
import { normalizarConfirmacion, errorConfirmacion } from '../../../../lib/formularioConfirmacion';
import { limitador, MIN10 } from '../../../../lib/limiteRitmo';

export const dynamic = 'force-dynamic';

// "Enviarme una prueba" del constructor de formularios: manda el correo automático tal como lo está escribiendo la persona (sin guardar nada)
// SIEMPRE a su propia dirección, nunca a otra. Así se puede ver cómo queda antes de publicar.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const usuario = await usuarioDeSolicitud(req, body && body.solicitanteEmail);
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const lim = limitador.intentar('formprueba:' + String(usuario.email).toLowerCase(), 5, MIN10);
  if (!lim.permitido) return NextResponse.json({ ok: false, error: 'Mandaste varias pruebas seguidas. Esperá unos minutos.' }, { status: 429 });

  const conf = normalizarConfirmacion({ email: { activo: true, asunto: body.asunto, cuerpo: body.cuerpo, botones: body.botones } });
  const msg = errorConfirmacion({ email: conf.email });
  if (msg) return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  const titulo = String(body.formulario || '').trim().slice(0, 120) || 'Formulario';
  try {
    await enviarConfirmacionFormulario({
      email: usuario.email, nombre: String(usuario.nombre || 'Nombre de ejemplo').slice(0, 80), formulario: titulo, curso: String(body.curso || '').slice(0, 80),
      asunto: '[PRUEBA] ' + conf.email.asunto, cuerpo: conf.email.cuerpo, botones: conf.email.botones
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo enviar la prueba. Probá de nuevo en un rato.' }, { status: 502 });
  }
  return NextResponse.json({ ok: true, para: usuario.email });
}
