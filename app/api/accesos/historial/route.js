import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoAccesos } from '../../../../lib/auth';

export const dynamic = 'force-dynamic';

// Devuelve del Historial solo las acciones sobre accesos/usuarios/docentes (no las de inscripciones).
const CLAVES = ['usuario', 'roles', 'contraseña', 'acceso', 'docente', 'sesión', 'reactiv', 'desactiv', 'elimin'];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoAccesos(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });

  const filas = await readSheet(TABS.HISTORIAL);
  const eventos = filas
    .filter((f) => f.Fecha && f['Acción'])
    .filter((f) => { const a = (f['Acción'] || '').toLowerCase(); return CLAVES.some((k) => a.includes(k)); })
    .map((f) => ({ fecha: f.Fecha, autor: f.Usuario, accion: f['Acción'], detalle: f.Detalle }))
    .reverse(); // más reciente primero
  return NextResponse.json({ ok: true, eventos });
}
