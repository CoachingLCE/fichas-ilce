import { NextResponse } from 'next/server';
import { findUsuario, tienePermisoEmails } from '../../../../lib/auth';
import { plantillaConfirmacion, plantillaAvisoEquipo } from '../../../../lib/mailer';

export const dynamic = 'force-dynamic';

// Datos de ejemplo SOLO para la vista previa. No se envía ningún correo.
const EJEMPLO = {
  nombre: 'María', apellido: 'González', curso: 'Coaching de Equipos',
  edicion: 'Edición 20 — Jueves 29 de octubre de 2026',
  email: 'maria.gonzalez@correo.com', whatsapp: '+54 9 11 5555 1234',
  pais: 'Argentina', medio: 'WhatsApp'
};

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoEmails(usuario)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }

  const tipo = searchParams.get('tipo') || '';
  const e = EJEMPLO;
  let asunto = '', html = '';

  if (tipo === 'Confirmación inscripción') {
    // El asunto debe coincidir con enviarConfirmacionInscripcion() en lib/mailer.js
    asunto = `¡Recibimos tu inscripción a ${e.curso}! 🎉 — Instituto ILCE`;
    html = plantillaConfirmacion(e);
  } else if (tipo === 'Aviso equipo') {
    const edCorta = (e.edicion || '').split('—')[0].split('-')[0].trim();
    // El asunto debe coincidir con enviarAvisoEquipo() en lib/mailer.js
    asunto = `📥 Nueva ficha — ${e.curso}${e.edicion ? ` (${edCorta})` : ''}: ${e.nombre} ${e.apellido}`.trim();
    html = plantillaAvisoEquipo(e);
  } else {
    return NextResponse.json({ ok: false, error: 'Ese correo todavía no tiene vista previa' }, { status: 400 });
  }

  return NextResponse.json({ ok: true, asunto, html, ejemplo: true });
}
