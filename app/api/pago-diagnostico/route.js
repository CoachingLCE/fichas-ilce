import { NextResponse } from 'next/server';
import { tokenValido } from '../../../lib/accesoTecnico';
import { diagnosticarPago, leerParaDiagnostico } from '../../../lib/pagos';

export const dynamic = 'force-dynamic';

// Diagnóstico de los botones de pago de la pantalla final de la ficha. Protegido con la llave técnica (SETUP_TOKEN), igual que /estado:
//   /api/pago-diagnostico?token=LLAVE&slug=coaching-ontologico&pais=Argentina
// Lee la planilla en el momento (sin caché) y explica por qué se muestran o no los botones. En la pantalla del estudiante el motivo se oculta a propósito.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  if (!tokenValido(searchParams.get('token'))) return NextResponse.json({ ok: false, error: 'Falta la llave técnica (?token=)' }, { status: 401 });
  const slug = (searchParams.get('slug') || '').trim();
  const pais = searchParams.get('pais') || 'Argentina';
  const lectura = await leerParaDiagnostico();
  return NextResponse.json({ ok: true, ...diagnosticarPago(lectura, slug, pais) }, { headers: { 'Cache-Control': 'no-store' } });
}
