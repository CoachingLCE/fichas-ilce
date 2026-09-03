import { NextResponse } from 'next/server';
import { readHeaders, setHeaders } from '../../../lib/sheets';
import { HEADERS } from '../../../lib/constants';

export const dynamic = 'force-dynamic';

// Inicializa (idempotente) la fila de encabezados de cada pestaña.
// Protegido con SETUP_TOKEN para que nadie más lo dispare.
// Uso: GET /api/setup?token=TU_SETUP_TOKEN   (agregá &force=1 para reescribir encabezados existentes)
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');
  const force = searchParams.get('force') === '1';

  if (!process.env.SETUP_TOKEN || token !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ ok: false, error: 'Token inválido' }, { status: 401 });
  }

  const resultado = [];
  for (const [tab, headers] of Object.entries(HEADERS)) {
    try {
      const actuales = await readHeaders(tab);
      if (actuales.length > 0 && !force) {
        resultado.push({ tab, accion: 'sin cambios (ya tenía encabezados)', columnas: actuales.length });
        continue;
      }
      await setHeaders(tab, headers);
      resultado.push({ tab, accion: force ? 'encabezados reescritos' : 'encabezados creados', columnas: headers.length });
    } catch (e) {
      resultado.push({ tab, accion: 'ERROR', error: e.message });
    }
  }

  const okGlobal = resultado.every((r) => r.accion !== 'ERROR');
  return NextResponse.json({ ok: okGlobal, resultado });
}
