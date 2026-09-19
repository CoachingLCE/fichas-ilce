import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS, EQUIPO_ACADEMICO } from '../../../../lib/constants';
import { enviarResumenActividades } from '../../../../lib/mailer';

export const dynamic = 'force-dynamic';

// Protegido con CRON_SECRET. Vercel Cron lo llama los viernes (ver vercel.json).
// También se puede disparar manual: /api/cron/resumen-actividades?token=CRON_SECRET
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get('authorization') || '';
  const tokenOk = process.env.CRON_SECRET &&
    (auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get('token') === process.env.CRON_SECRET);
  if (!tokenOk) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const dias = Number(searchParams.get('dias') || 7);
  const corte = new Date(Date.now() - dias * 24 * 3600 * 1000);
  const filas = (await readSheet(TABS.RESPUESTAS_ACT)).filter((f) => f.ID && f.Fecha && new Date(f.Fecha) >= corte)
    .map((f) => ({ fecha: (f.Fecha || '').slice(0, 10), nombre: f.Nombre, email: f.Email, curso: f.Curso, edicion: f['Edición'], actividad: f.Actividad, puntaje: f['Puntuación'], total: f.Total }));

  const desde = corte.toISOString().slice(0, 10);
  const hasta = new Date().toISOString().slice(0, 10);
  let enviado = true;
  try { await enviarResumenActividades({ destinatarios: EQUIPO_ACADEMICO, desde, hasta, filas }); } catch { enviado = false; }
  return NextResponse.json({ ok: true, enviado, cantidad: filas.length, desde, hasta });
}
