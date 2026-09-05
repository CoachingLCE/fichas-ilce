import { NextResponse } from 'next/server';
import { readSheet, updateRow, readHeaders } from '../../../../lib/sheets';
import { TABS, ESTADOS } from '../../../../lib/constants';
import { findUsuario, tienePermisoCambiarEstado } from '../../../../lib/auth';
import { registrarAccion } from '../../../../lib/auditoria';

export const dynamic = 'force-dynamic';

function colLetra(nombreCol, headers) {
  const i = headers.indexOf(nombreCol);
  if (i < 0) return null;
  let n = i + 1, s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const usuario = await findUsuario(body.solicitanteEmail);
  if (!usuario || !tienePermisoCambiarEstado(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });

  const { id, estado, responsable } = body || {};
  if (!id) return NextResponse.json({ ok: false, error: 'Falta id' }, { status: 400 });
  if (estado && !ESTADOS.includes(estado)) return NextResponse.json({ ok: false, error: 'Estado inválido' }, { status: 400 });

  const filas = await readSheet(TABS.INSCRIPCIONES, { noCache: true });
  const fila = filas.find((f) => String(f.ID) === String(id));
  if (!fila) return NextResponse.json({ ok: false, error: 'Inscripción no encontrada' }, { status: 404 });

  const headers = await readHeaders(TABS.INSCRIPCIONES);
  const rowIndex = fila._rowIndex;
  const cambios = [];
  if (estado && estado !== fila.Estado) { await updateRow(TABS.INSCRIPCIONES, rowIndex, [estado], colLetra('Estado', headers)); cambios.push(`Estado → ${estado}`); }
  if (responsable != null && responsable !== fila.Responsable) { await updateRow(TABS.INSCRIPCIONES, rowIndex, [responsable], colLetra('Responsable', headers)); cambios.push(`Responsable → ${responsable || 'Sin asignar'}`); }
  const colUA = colLetra('Última actualización', headers);
  if (colUA) await updateRow(TABS.INSCRIPCIONES, rowIndex, [new Date().toISOString()], colUA);

  if (cambios.length) await registrarAccion(body.solicitanteEmail, usuario.nombre, 'Cambió una inscripción', `${fila.Nombre} ${fila.Apellido} · ${cambios.join(' · ')}`);
  return NextResponse.json({ ok: true, cambios });
}
