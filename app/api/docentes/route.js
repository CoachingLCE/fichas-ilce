import { NextResponse } from 'next/server';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { TABS, PASSWORD_GENERICA } from '../../../lib/constants';
import { findUsuario, tienePermisoAsignarDocentes } from '../../../lib/auth';
import { encryptPassword } from '../../../lib/passwords';
import { enviarMailContrasena } from '../../../lib/mailer';
import { registrarAccion } from '../../../lib/auditoria';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoAsignarDocentes(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  const docs = (await readSheet(TABS.DOCENTES)).filter((d) => d.Email).map((d) => ({
    email: d.Email, nombre: d.Nombre, curso: d.Curso, edicion: d['Edición'], _rowIndex: d._rowIndex
  }));
  return NextResponse.json({ ok: true, docentes: docs });
}

export async function POST(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoAsignarDocentes(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const { email, nombre, curso, edicion } = body || {};
  if (!email || !curso) return NextResponse.json({ ok: false, error: 'Faltan email o curso' }, { status: 400 });

  await appendRow(TABS.DOCENTES, [email, nombre || '', curso, edicion || '']);

  // Si el docente todavía no tiene acceso, se le crea usuario rol Docente y se le envía la contraseña.
  let accesoCreado = false, emailEnviado = null;
  const existe = await findUsuario(email);
  if (!existe) {
    await appendRow(TABS.USUARIOS, [email, nombre || email.split('@')[0], 'Docente', encryptPassword(PASSWORD_GENERICA), 'TRUE']);
    accesoCreado = true;
    try { await enviarMailContrasena(email, nombre || '', PASSWORD_GENERICA); emailEnviado = true; } catch { emailEnviado = false; }
    await registrarAccion(usuario.email, usuario.nombre, 'Creó acceso de Docente', `${nombre || ''} (${email}) — ${curso}${edicion ? ' · Ed. ' + edicion : ''}`);
  }
  return NextResponse.json({ ok: true, accesoCreado, emailEnviado });
}

// Baja lógica: vaciamos la fila.
export async function DELETE(req) {
  const body = await req.json();
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoAsignarDocentes(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const docs = await readSheet(TABS.DOCENTES, { noCache: true });
  const t = docs.find((d) => d._rowIndex === body.rowIndex);
  if (!t) return NextResponse.json({ ok: false, error: 'No encontrado' }, { status: 404 });
  await updateRow(TABS.DOCENTES, body.rowIndex, ['', '', '', '']);
  await registrarAccion(usuario.email, usuario.nombre, 'Quitó acceso de Docente', `${t.Nombre || ''} (${t.Email || ''}) — ${t.Curso || ''}${t['Edición'] ? ' · Ed. ' + t['Edición'] : ''}`);
  return NextResponse.json({ ok: true });
}
