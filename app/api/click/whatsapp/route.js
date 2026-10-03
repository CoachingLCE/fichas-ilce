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

// Clic en "Hablar por WhatsApp" del mail de confirmación de inscripción: registra la fecha del
// clic (si encuentra la ficha por ID) y, pase lo que pase, redirige a WhatsApp — el registro
// nunca debe trabarle el paso a la persona que quiere escribirnos.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const id = (searchParams.get('id') || '').trim();

  if (id) {
    try {
      const filas = await readSheet(TABS.INSCRIPCIONES);
      const fila = filas.find((f) => f.ID === id);
      if (fila && !fila['Click WhatsApp']) {
        // Solo se guarda la PRIMERA vez (si ya hizo clic antes, no pisa la fecha original).
        await updateRow(TABS.INSCRIPCIONES, fila._rowIndex, [new Date().toISOString()], COL_CLICK_WHATSAPP);
      }
    } catch {
      // Si falla el registro (Sheet caída, ID no encontrado, columna todavía sin agregar,
      // etc.) no pasa nada grave: seguimos igual al WhatsApp de abajo.
    }
  }

  return NextResponse.redirect(WHATSAPP_URL, { status: 302 });
}
