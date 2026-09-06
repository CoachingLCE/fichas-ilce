import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoActividades, tienePermisoVerTodasRespuestas } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoActividades(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });

  const filas = (await readSheet(TABS.RESPUESTAS_ACT)).filter((f) => f.ID).map((f) => ({
    id: f.ID, fecha: f.Fecha, actividad: f.Actividad, curso: f.Curso, edicion: f['Edición'],
    email: f.Email, nombre: f.Nombre, puntaje: f['Puntuación'], total: f.Total
  }));

  // Los que ven todo, ven todo. Un Docente ve solo curso+edición donde está asignado.
  if (tienePermisoVerTodasRespuestas(usuario)) {
    return NextResponse.json({ ok: true, respuestas: filas, alcance: 'todas' });
  }
  const docs = await readSheet(TABS.DOCENTES);
  const misAsign = docs.filter((d) => (d.Email || '').toLowerCase() === usuario.email.toLowerCase())
    .map((d) => `${(d.Curso || '').trim()}||${(d.Edición || '').trim()}`);
  const permitido = (r) => misAsign.some((a) => {
    const [c, e] = a.split('||');
    return c === (r.curso || '').trim() && (!e || e === (r.edicion || '').trim());
  });
  return NextResponse.json({ ok: true, respuestas: filas.filter(permitido), alcance: 'docente' });
}
