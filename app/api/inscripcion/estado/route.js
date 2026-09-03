import { NextResponse } from 'next/server';
import { readSheet, updateRow, appendRow, readHeaders } from '../../../../lib/sheets';
import { TABS, ESTADOS } from '../../../../lib/constants';
import { sesionDeRequest } from '../../../../lib/auth';
import { can } from '../../../../lib/permisos';

export const dynamic = 'force-dynamic';

// Columnas (1-indexed) según HEADERS[Inscripciones]: Estado=23, Responsable=24, Última actualización=28
function colLetra(nombreCol, headers) {
  const i = headers.indexOf(nombreCol);
  if (i < 0) return null;
  let n = i + 1, s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

export async function POST(req) {
  const ses = sesionDeRequest(req);
  if (!ses) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });
  if (!can(ses.rol, 'cambiarEstado')) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { id, estado, responsable } = body || {};
  if (!id) return NextResponse.json({ ok: false, error: 'Falta id' }, { status: 400 });
  if (estado && !ESTADOS.includes(estado)) return NextResponse.json({ ok: false, error: 'Estado inválido' }, { status: 400 });

  const filas = await readSheet(TABS.INSCRIPCIONES, { noCache: true });
  const fila = filas.find((f) => String(f.ID) === String(id));
  if (!fila) return NextResponse.json({ ok: false, error: 'Inscripción no encontrada' }, { status: 404 });

  const headers = await readHeaders(TABS.INSCRIPCIONES);
  const rowIndex = fila._rowIndex;

  const cambios = [];
  if (estado && estado !== fila.Estado) {
    const col = colLetra('Estado', headers);
    await updateRow(TABS.INSCRIPCIONES, rowIndex, [estado], col);
    cambios.push(`Estado → ${estado}`);
  }
  if (responsable != null && responsable !== fila.Responsable) {
    const col = colLetra('Responsable', headers);
    await updateRow(TABS.INSCRIPCIONES, rowIndex, [responsable], col);
    cambios.push(`Responsable → ${responsable || 'Sin asignar'}`);
  }
  // Última actualización
  const colUA = colLetra('Última actualización', headers);
  if (colUA) await updateRow(TABS.INSCRIPCIONES, rowIndex, [new Date().toISOString()], colUA);

  if (cambios.length) {
    try { await appendRow(TABS.HISTORIAL, [new Date().toISOString(), id, ses.email, 'Cambio', cambios.join(' · ')]); } catch {}
  }
  return NextResponse.json({ ok: true, cambios });
}
