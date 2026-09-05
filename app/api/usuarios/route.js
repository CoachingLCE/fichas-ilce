import { NextResponse } from 'next/server';
import { findUsuario } from '../../../lib/auth';
import { readSheet, appendRow, updateRow } from '../../../lib/sheets';
import { encryptPassword, decryptPassword } from '../../../lib/passwords';
import { enviarMailContrasena } from '../../../lib/mailer';
import { registrarAccion } from '../../../lib/auditoria';
import { PASSWORD_GENERICA, TABS } from '../../../lib/constants';

export const dynamic = 'force-dynamic';

async function esAdmin(email) {
  const u = await findUsuario(email);
  return u && u.roles.includes('Admin') ? u : null;
}

// GET /api/usuarios?list=true&solicitanteEmail=...  -> lista con contraseña visible (solo Admin)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get('list') !== 'true') return NextResponse.json({ error: 'Parámetro inválido' }, { status: 400 });
  const admin = await esAdmin(searchParams.get('solicitanteEmail'));
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const usuarios = await readSheet(TABS.USUARIOS);
  return NextResponse.json({
    usuarios: usuarios.map((u) => ({
      Email: u.Email, Nombre: u.Nombre, Roles: u.Roles,
      Activo: (u.Activo || '') !== 'FALSE' && (u.Activo || '').toLowerCase() !== 'no',
      passwordActual: u.PasswordHash ? decryptPassword(u.PasswordHash) : null
    }))
  });
}

// POST -> alta de usuario. body: { solicitanteEmail, nuevoEmail, nombre, roles:[], password? }
export async function POST(request) {
  const body = await request.json();
  const admin = await esAdmin(body.solicitanteEmail);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const yaExiste = await findUsuario(body.nuevoEmail);
  if (yaExiste) return NextResponse.json({ error: 'Ese email ya existe' }, { status: 409 });

  const password = (body.password || '').trim() || PASSWORD_GENERICA;
  await appendRow(TABS.USUARIOS, [body.nuevoEmail, body.nombre, (body.roles || []).join(','), encryptPassword(password), 'TRUE']);

  let emailEnviado = true;
  try { await enviarMailContrasena(body.nuevoEmail, body.nombre, password); } catch { emailEnviado = false; }

  await registrarAccion(body.solicitanteEmail, admin.nombre, 'Dio de alta un usuario', `${body.nombre} (${body.nuevoEmail}) — ${(body.roles || []).join(', ')}`);
  return NextResponse.json({ ok: true, emailEnviado });
}

// PATCH -> editar. body: { solicitanteEmail, targetEmail, nuevaPassword?, nuevosRoles?, activo? }
export async function PATCH(request) {
  const body = await request.json();
  const admin = await esAdmin(body.solicitanteEmail);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const usuarios = await readSheet(TABS.USUARIOS, { noCache: true });
  const target = usuarios.find((u) => (u.Email || '').toLowerCase() === (body.targetEmail || '').toLowerCase());
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  // Proteger al último Admin
  const tocaQuitarAdmin =
    (body.nuevosRoles !== undefined && !body.nuevosRoles.includes('Admin') && (target.Roles || '').includes('Admin')) ||
    (body.activo === false && (target.Roles || '').includes('Admin'));
  if (tocaQuitarAdmin) {
    const admins = usuarios.filter((u) => (u.Roles || '').includes('Admin') && (u.Activo || '') !== 'FALSE');
    if (admins.length <= 1) return NextResponse.json({ error: 'No se puede desactivar/sacarle el rol al último administrador.' }, { status: 400 });
  }

  let passwordFinal = target.PasswordHash;
  let emailEnviado = null;
  if (body.nuevaPassword !== undefined) {
    const nueva = (body.nuevaPassword || '').trim() || PASSWORD_GENERICA;
    passwordFinal = encryptPassword(nueva);
    try { await enviarMailContrasena(target.Email, target.Nombre, nueva); emailEnviado = true; } catch { emailEnviado = false; }
  }
  const rolesFinal = body.nuevosRoles !== undefined ? body.nuevosRoles.join(',') : target.Roles;
  const activoFinal = body.activo !== undefined ? (body.activo ? 'TRUE' : 'FALSE') : ((target.Activo || '') !== 'FALSE' ? 'TRUE' : 'FALSE');

  await updateRow(TABS.USUARIOS, target._rowIndex, [target.Email, target.Nombre, rolesFinal, passwordFinal, activoFinal]);

  const cambios = [];
  if (body.nuevaPassword !== undefined) cambios.push('Restableció contraseña');
  if (body.nuevosRoles !== undefined) cambios.push(`Cambió roles a: ${rolesFinal}`);
  if (body.activo !== undefined) cambios.push(body.activo ? 'Reactivó el usuario' : 'Desactivó el usuario');
  await registrarAccion(body.solicitanteEmail, admin.nombre, cambios.join(' · ') || 'Editó un usuario', `${target.Nombre} (${target.Email})`);

  return NextResponse.json({ ok: true, emailEnviado });
}

// DELETE -> borrar (marca fila vacía). body: { solicitanteEmail, targetEmail }
export async function DELETE(request) {
  const body = await request.json();
  const admin = await esAdmin(body.solicitanteEmail);
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 403 });

  const usuarios = await readSheet(TABS.USUARIOS, { noCache: true });
  const target = usuarios.find((u) => (u.Email || '').toLowerCase() === (body.targetEmail || '').toLowerCase());
  if (!target) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });

  if ((target.Roles || '').includes('Admin')) {
    const admins = usuarios.filter((u) => (u.Roles || '').includes('Admin'));
    if (admins.length <= 1) return NextResponse.json({ error: 'No se puede eliminar al último administrador.' }, { status: 400 });
  }
  // Sin deleteRows en este proyecto: vaciamos la fila (queda ignorada por findUsuario).
  await updateRow(TABS.USUARIOS, target._rowIndex, ['', '', '', '', 'FALSE']);
  await registrarAccion(body.solicitanteEmail, admin.nombre, 'Eliminó un usuario', `${target.Nombre} (${target.Email})`);
  return NextResponse.json({ ok: true });
}
