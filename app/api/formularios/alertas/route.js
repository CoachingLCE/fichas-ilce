import { NextResponse } from 'next/server';
import { findUsuario, tienePermisoFormularios } from '../../../../lib/auth';
import { leerAlertasFormularios } from '../../../../lib/alertasFormulariosServer';

export const dynamic = 'force-dynamic';

// GET /api/formularios/alertas — formularios publicados que llevan más de 30 días sin recibir respuestas.
// Solo quienes gestionan formularios (son quienes pueden hacer algo al respecto). Devuelve la lista ya calculada: nunca el
// contenido de las respuestas, solo títulos, fechas y días.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const usuario = await findUsuario(searchParams.get('solicitanteEmail'));
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 403 });
  try {
    const r = await leerAlertasFormularios();
    return NextResponse.json({ ok: true, ...r });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message || 'No se pudieron calcular las alertas' }, { status: 500 });
  }
}
