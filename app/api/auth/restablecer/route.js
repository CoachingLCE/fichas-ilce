import { NextResponse } from 'next/server';
import { findUsuario } from '../../../../lib/auth';
import { claveEmail, ipDe, demoraTrasFallo } from '../../../../lib/limiteLogin';
import { limiteRestablecer, leerTokenRecuperacion, firmaValida, recuperacionDisponible } from '../../../../lib/recuperarPassword';
import { hashPassword, validarNuevaPassword } from '../../../../lib/passwords';
import { updateRow } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { registrarAccion } from '../../../../lib/auditoria';

export const dynamic = 'force-dynamic';
const ENLACE_INVALIDO = 'El enlace venció o ya se usó. Pedí uno nuevo desde "¿Olvidaste tu contraseña?".';

// POST /api/auth/restablecer -> { token, password }
export async function POST(request) {
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 }); }
  const ip = ipDe(request);
  const leido = leerTokenRecuperacion(body && body.token);
  const emailClave = claveEmail(leido ? leido.email : '');
  const estado = limiteRestablecer.verificar(emailClave, ip);
  if (estado.bloqueado) return NextResponse.json({ error: 'Demasiados intentos. Probá de nuevo en unos minutos.' }, { status: 429, headers: { 'Retry-After': String(estado.reintentarEnSeg) } });
  const fallar = async () => { limiteRestablecer.registrarFallo(emailClave, ip); await demoraTrasFallo(); return NextResponse.json({ error: ENLACE_INVALIDO }, { status: 400 }); };
  if (!leido || !recuperacionDisponible()) return fallar();
  let u; try { u = await findUsuario(leido.email); } catch { return NextResponse.json({ error: 'No se pudo verificar el enlace en este momento. Probá de nuevo en unos segundos.' }, { status: 503 }); }
  if (!u || !u.activo || !firmaValida(body.token, u.passwordHash)) return fallar();
  const problema = validarNuevaPassword(body.password, { email: u.email });
  if (problema) return NextResponse.json({ error: problema }, { status: 400 });   // el enlace sigue valiendo: puede elegir otra
  await updateRow(TABS.USUARIOS, u._rowIndex, [hashPassword(body.password)], 'D');    // solo la columna de la contraseña, ya protegida y definitiva (no temporal)
  limiteRestablecer.registrarExito(emailClave, ip);
  await registrarAccion(u.email, u.nombre, 'Restableció su contraseña con el enlace del correo', '');
  return NextResponse.json({ ok: true });
}
