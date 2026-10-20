import { NextResponse } from 'next/server';
import { findUsuario } from '../../../../lib/auth';
import { claveEmail, ipDe } from '../../../../lib/limiteLogin';
import { limiteOlvide, recuperacionDisponible, crearTokenRecuperacion, mensajeEspera, VIGENCIA_MIN } from '../../../../lib/recuperarPassword';
import { enviarMailRecuperacion } from '../../../../lib/mailer';
import { registrarAccion } from '../../../../lib/auditoria';
import { APP_URL } from '../../../../lib/constants';

export const dynamic = 'force-dynamic';

// La respuesta es SIEMPRE la misma exista o no el correo: así nadie puede usar esta pantalla para averiguar qué correos tienen acceso.
const MENSAJE = `Si ese correo tiene acceso al panel, te enviamos un enlace para elegir una contraseña nueva. Revisá tu bandeja de entrada (y el correo no deseado). El enlace sirve una sola vez y vence en ${VIGENCIA_MIN} minutos.`;

// POST /api/auth/olvide -> { email }
export async function POST(request) {
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 }); }
  const email = claveEmail(body && body.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Escribí un correo válido.' }, { status: 400 });
  if (!recuperacionDisponible()) return NextResponse.json({ error: 'Por ahora no se pueden enviar correos de recuperación. Pedile a un administrador que te restablezca la contraseña (Accesos → Restablecer).' }, { status: 503 });
  const ip = ipDe(request);
  const estado = limiteOlvide.verificar(email, ip);
  if (estado.bloqueado) return NextResponse.json({ error: mensajeEspera(estado.reintentarEnSeg) }, { status: 429, headers: { 'Retry-After': String(estado.reintentarEnSeg) } });
  limiteOlvide.registrarFallo(email, ip);   // cada pedido cuenta, exista o no el correo
  try {
    const u = await findUsuario(email);
    if (u && u.activo) {
      const token = crearTokenRecuperacion(u.email, u.passwordHash);
      await enviarMailRecuperacion(u.email, u.nombre, `${APP_URL}/restablecer?token=${encodeURIComponent(token)}`);
      await registrarAccion(u.email, u.nombre, 'Pidió un enlace para recuperar su contraseña', '');
    }
  } catch (err) { console.error('Recuperación de contraseña:', err && err.message); }   // un fallo no cambia lo que se le responde a quien lo pidió
  return NextResponse.json({ ok: true, mensaje: MENSAJE });
}
