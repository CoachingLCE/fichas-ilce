import { NextResponse } from 'next/server';
import { findUsuario } from '../../../../lib/auth';
import { verifyPassword } from '../../../../lib/passwords';
import { registrarAccion } from '../../../../lib/auditoria';
import { clasificarErrorSheets } from '../../../../lib/erroresSheets';

export const dynamic = 'force-dynamic';

// POST /api/auth/login -> { email, password }
export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }); }
  // Si Google Sheets no responde a tiempo (lib/sheets.js ya reintenta una vez antes de
  // rendirse), esto antes quedaba sin capturar: Next.js devolvía un error 500 sin cuerpo JSON,
  // y como el navegador esperaba JSON, el login mostraba el mensaje genérico "Error de
  // conexión" en vez de explicar qué pasó de verdad. Se captura acá para devolver un mensaje
  // claro y un 503 (en vez de un 403/401, que harían pensar que el problema es la contraseña).
  let usuario;
  try {
    usuario = await findUsuario(body.email);
  } catch (err) {
    // Antes TODO error terminaba en el mismo cartel de "no respondió a tiempo", aunque la causa
    // real fuera otra (credenciales, permisos, cuota, pestaña inexistente). Ahora se clasifica, y
    // el error crudo queda en los Logs de Vercel para poder verlo completo.
    console.error('[login] falló la lectura de Usuarios:', err?.message || err, 'código:', err?.code || err?.status || '-');
    const { tipo, mensaje } = clasificarErrorSheets(err);
    return NextResponse.json({ error: mensaje, motivo: tipo }, { status: 503 });
  }
  if (!usuario) return NextResponse.json({ error: 'Email no autorizado' }, { status: 403 });
  if (!usuario.activo) {
    await registrarAccion(body.email, usuario.nombre, 'Intento de login rechazado', 'Usuario desactivado');
    return NextResponse.json({ error: 'Tu usuario está desactivado. Pedile a Diego que lo reactive.' }, { status: 403 });
  }
  if (!usuario.passwordHash) {
    return NextResponse.json({ error: 'Tu usuario todavía no tiene contraseña. Pedile a Diego que te la reenvíe desde Accesos.' }, { status: 403 });
  }
  if (!verifyPassword(body.password, usuario.passwordHash)) {
    await registrarAccion(body.email, usuario.nombre, 'Intento de login fallido', 'Contraseña incorrecta');
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
  }
  await registrarAccion(body.email, usuario.nombre, 'Inició sesión', '');
  return NextResponse.json({ usuario: { email: usuario.email, nombre: usuario.nombre, roles: usuario.roles } });
}
