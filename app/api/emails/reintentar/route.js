import { NextResponse } from 'next/server';
import { findUsuario, tienePermisoEmails } from '../../../../lib/auth';
import { puedeReintentar, reintentarEnvio } from '../../../../lib/mailer';

export const dynamic = 'force-dynamic';

// Reintenta un envío fallido reconstruyéndolo desde el Payload guardado en el log (columna
// "Payload" de la pestaña Emails). No modifica la fila original: si el reintento sale bien
// o vuelve a fallar, queda registrado como una fila nueva (así el historial no se pierde).
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { solicitanteEmail, tipo, payload } = body || {};

  const usuario = await findUsuario(solicitanteEmail);
  if (!usuario || !tienePermisoEmails(usuario)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }
  if (!tipo || !puedeReintentar(tipo)) {
    return NextResponse.json({ ok: false, error: 'Este tipo de correo no se puede reintentar automáticamente.' }, { status: 400 });
  }

  let datos = {};
  try { datos = payload ? JSON.parse(payload) : {}; } catch { /* payload vacío o corrupto: se intenta igual con {} */ }

  try {
    await reintentarEnvio(tipo, datos);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e && e.message ? e.message : 'No se pudo reenviar' }, { status: 500 });
  }
}
