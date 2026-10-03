import { NextResponse } from 'next/server';
import { readSheet, updateRow } from '../../../../lib/sheets';
import { TABS, WHATSAPP_URL } from '../../../../lib/constants';

export const dynamic = 'force-dynamic';

// A dónde queda escrito el clic: una columna NUEVA al final de Inscripciones, "Click WhatsApp"
// (columna 31 = AE, justo después de "Origen registro" que hoy es la última, columna 30 = AD).
// IMPORTANTE: esta columna todavía no existe en la Sheet real — hay que agregarle a Diego el
// encabezado "Click WhatsApp" en AE1 para que el valor que este endpoint escribe se vea en
// "Fichas completadas" (columna 'Clic en "hablar por whatsapp"'). Hasta que esté ese encabezado,
// el clic igual queda guardado en la celda (no se pierde), simplemente no tiene nombre todavía.
const COL_CLICK_WHATSAPP = 'AE';

// Freno de emergencia (3/10/2026): un mail masivo con este link generó muchos clics juntos, y
// como cada clic leía toda la pestaña Inscripciones con la MISMA cuenta de servicio de Google
// que usa el login, se agotó la cuota de lecturas por minuto de esa cuenta — y nadie podía
// entrar a la app. Este endpoint es público y de bajo valor (solo registra una fecha de clic
// para una métrica), así que no puede competir por esa cuota con el login. Límite por minuto,
// por instancia del servidor — pasado el límite, el clic sigue yendo a WhatsApp con total
// normalidad, simplemente esa vez no queda registrada la fecha (no es grave).
const LIMITE_LECTURAS_POR_MINUTO = 15;
let ventana = { inicio: Date.now(), conteo: 0 };
function hayCupoParaLeerSheet() {
  const ahora = Date.now();
  if (ahora - ventana.inicio > 60000) ventana = { inicio: ahora, conteo: 0 };
  if (ventana.conteo >= LIMITE_LECTURAS_POR_MINUTO) return false;
  ventana.conteo++;
  return true;
}

// Clic en "Hablar por WhatsApp" del mail de confirmación de inscripción: redirige a WhatsApp
// DE INMEDIATO (sin esperar a Google Sheets — la persona no debe notar ninguna demora), y de
// fondo, si hay cupo, intenta registrar la fecha del clic (si encuentra la ficha por ID y es
// la primera vez). Si el registro falla o no hay cupo, no pasa nada: el clic ya redirigió igual.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || '').trim();

  if (id && hayCupoParaLeerSheet()) {
    (async () => {
      try {
        const filas = await readSheet(TABS.INSCRIPCIONES);
        const fila = filas.find((f) => f.ID === id);
        if (fila && !fila['Click WhatsApp']) {
          // Solo se guarda la PRIMERA vez (si ya hizo clic antes, no pisa la fecha original).
          await updateRow(TABS.INSCRIPCIONES, fila._rowIndex, [new Date().toISOString()], COL_CLICK_WHATSAPP);
        }
      } catch {
        // Sheet caída, ID no encontrado, columna todavía sin agregar, cuota agotada, etc.: no pasa nada.
      }
    })();
  }

  return NextResponse.redirect(WHATSAPP_URL, { status: 302 });
}
