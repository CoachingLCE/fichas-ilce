import { NextResponse } from 'next/server';
import { readSheet } from '../../../../lib/sheets';
import { TABS, EQUIPO_NOTIF } from '../../../../lib/constants';
import { enviarResumenInscripciones } from '../../../../lib/mailer';

export const dynamic = 'force-dynamic';

// Viernes 10:00 (hora de Argentina = 13:00 UTC, ver vercel.json): resumen de las fichas de inscripción de la semana.
// Protegido con CRON_SECRET. También se puede disparar a mano: /api/cron/resumen-inscripciones?token=CRON_SECRET
// (opcional &dias=N para cambiar la ventana; por defecto 7 días).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const auth = req.headers.get('authorization') || '';
  const tokenOk = process.env.CRON_SECRET &&
    (auth === `Bearer ${process.env.CRON_SECRET}` || searchParams.get('token') === process.env.CRON_SECRET);
  if (!tokenOk) return NextResponse.json({ ok: false, error: 'No autorizado' }, { status: 401 });

  const dias = Number(searchParams.get('dias') || 7);
  const corte = new Date(Date.now() - dias * 24 * 3600 * 1000);
  const filas = (await readSheet(TABS.INSCRIPCIONES, { noCache: true }))
    .filter((f) => f.ID && f['Fecha ficha'] && new Date(f['Fecha ficha']) >= corte)
    .sort((a, b) => String(b['Fecha ficha']).localeCompare(String(a['Fecha ficha'])))
    .map((f) => ({
      fecha: String(f['Fecha ficha'] || '').slice(0, 10),
      nombre: `${f.Nombre || ''} ${f.Apellido || ''}`.trim(),
      curso: f.Curso, edicion: f['Edición'], pais: f['País']
    }));

  const desde = corte.toISOString().slice(0, 10);
  const hasta = new Date().toISOString().slice(0, 10);
  let enviado = true;
  try { await enviarResumenInscripciones({ destinatarios: EQUIPO_NOTIF, desde, hasta, filas }); } catch { enviado = false; }
  return NextResponse.json({ ok: true, enviado, fichas: filas.length, desde, hasta });
}
