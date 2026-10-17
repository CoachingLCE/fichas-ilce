import { NextResponse } from 'next/server';
import { readSheet, readHeaders, updateRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { findUsuario, usuarioDeSolicitud, tienePermisoInscripciones } from '../../../lib/auth';
import { tienePermisoEliminarFichas } from '../../../lib/permisos';
import { registrarAccion } from '../../../lib/auditoria';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await usuarioDeSolicitud(req, searchParams.get('solicitanteEmail'));
  if (!usuario || !usuario.activo || !tienePermisoInscripciones(usuario)) {
    return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  }
  // Las fichas eliminadas quedan como fila vacía (ver DELETE): no se devuelven.
  const filas = (await readSheet(TABS.INSCRIPCIONES)).filter((f) => f.ID);
  return NextResponse.json({ ok: true, filas });
}

// DELETE /api/inscripciones  { solicitanteEmail, id }  — elimina una ficha completa. Solo quien tiene tienePermisoEliminarFichas (lib/permisos.js).
// Baja lógica, igual que las respuestas de actividades y formularios: se vacía la fila (la app no borra filas de la planilla) y el resto de la app ya ignora las filas sin ID.
// Como no se puede deshacer, la ficha completa queda escrita en el Historial de acciones para poder reconstruirla.
export async function DELETE(req) {
  let body = {};
  try { body = await req.json(); } catch { /* cuerpo vacío */ }
  const usuario = await usuarioDeSolicitud(req, body.solicitanteEmail);
  if (!usuario || !usuario.activo || !tienePermisoEliminarFichas(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });
  const id = String(body.id || '').trim();
  if (!id) return NextResponse.json({ ok: false, error: 'Falta el id' }, { status: 400 });
  const filas = await readSheet(TABS.INSCRIPCIONES, { noCache: true });
  const f = filas.find((x) => x.ID === id);
  if (!f) return NextResponse.json({ ok: false, error: 'No encontrada (puede que ya se haya eliminado)' }, { status: 404 });
  const headers = await readHeaders(TABS.INSCRIPCIONES);
  const copia = headers.filter(Boolean).map((h) => `${h}: ${String(f[h] == null ? '' : f[h]).replace(/\s+/g, ' ').trim()}`).filter((x) => !x.endsWith(': ')).join(' | ');
  await updateRow(TABS.INSCRIPCIONES, f._rowIndex, headers.map(() => ''));
  await registrarAccion(usuario.email, usuario.nombre, 'Eliminó ficha', `${`${f.Nombre || ''} ${f.Apellido || ''}`.trim() || f.Email || id} — ${f.Curso || ''}${f['Edición'] ? ' · ' + f['Edición'] : ''} · ID ${id} || copia: ${copia}`.slice(0, 2000));
  return NextResponse.json({ ok: true });
}
