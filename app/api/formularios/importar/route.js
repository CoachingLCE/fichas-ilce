import { NextResponse } from 'next/server';
import { appendRows, readSheet } from '../../../../lib/sheets';
import { TABS } from '../../../../lib/constants';
import { findUsuario, tienePermisoFormularios } from '../../../../lib/auth';
import { getFormulario } from '../../../../lib/formularios';
import { registrarAccion } from '../../../../lib/auditoria';

export const dynamic = 'force-dynamic';

const LIMITE_FILAS = 2000;

function buscarCampo(fila, patrones) {
  for (const k of Object.keys(fila)) {
    for (const p of patrones) if (p.test(k)) return fila[k];
  }
  return '';
}

// Importación de respuestas históricas (por ejemplo, encuestas viejas de Google Forms que
// nunca pasaron por el formulario de esta app). El archivo se parsea en el navegador (CSV o
// Excel, tal cual lo exportó Google Forms) y acá solo se reciben los datos ya parseados como
// filas de texto — nunca se transcribe nada a mano, así no hay riesgo de cargar mal un
// nombre, un email o una respuesta de un estudiante real.
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 }); }
  const { solicitanteEmail, slug, tituloManual, curso, edicion, filas } = body || {};
  const usuario = await findUsuario(solicitanteEmail);
  if (!usuario || !tienePermisoFormularios(usuario)) return NextResponse.json({ ok: false, error: 'Sin permiso' }, { status: 403 });

  // El formulario de destino puede ser uno ya definido en la app (se elige por slug), o —
  // como suele pasar con encuestas viejas que nunca pasaron por acá — un nombre libre que
  // Diego escribe a mano, sin necesidad de dar de alta un formulario nuevo en la Sheet solo
  // para poder importar sus respuestas históricas.
  let tituloFormulario = '';
  if (slug) {
    const form = await getFormulario(slug);
    if (!form) return NextResponse.json({ ok: false, error: 'Formulario no encontrado' }, { status: 404 });
    tituloFormulario = form.titulo;
  } else {
    tituloFormulario = (tituloManual || '').trim();
  }
  if (!tituloFormulario) return NextResponse.json({ ok: false, error: 'Falta elegir un formulario o escribir un nombre para esta encuesta histórica' }, { status: 400 });
  if (!Array.isArray(filas) || filas.length === 0) return NextResponse.json({ ok: false, error: 'No se recibieron filas para importar' }, { status: 400 });
  if (filas.length > LIMITE_FILAS) return NextResponse.json({ ok: false, error: `Demasiadas filas (máximo ${LIMITE_FILAS} por importación)` }, { status: 400 });

  // Para no importar la misma respuesta dos veces si Diego sube el mismo archivo de nuevo:
  // se arma una huella (email + fecha original) de lo que ya está cargado para este formulario.
  let existentes = new Set();
  try {
    const previas = await readSheet(TABS.RESPUESTAS_FORM);
    existentes = new Set(previas.filter((f) => f.Formulario === tituloFormulario).map((f) => `${(f.Email || '').toLowerCase().trim()}|${(f.Fecha || '').slice(0, 16)}`));
  } catch { /* si falla la lectura, seguimos igual: peor caso, puede haber algún duplicado */ }

  const nuevasFilas = [];
  let omitidasSinEmail = 0;
  let omitidasDuplicadas = 0;

  filas.forEach((fila, i) => {
    const email = String(buscarCampo(fila, [/correo|email/i]) || '').trim().toLowerCase();
    if (!email) { omitidasSinEmail++; return; }
    const marca = buscarCampo(fila, [/marca temporal|timestamp/i]);
    const nombre = buscarCampo(fila, [/nombre/i]);
    const edicionFila = buscarCampo(fila, [/edici[oó]n/i]) || edicion || '';
    let fechaISO;
    const dt = marca ? new Date(marca) : null;
    fechaISO = (dt && !isNaN(dt)) ? dt.toISOString() : new Date().toISOString();

    const huella = `${email}|${fechaISO.slice(0, 16)}`;
    if (existentes.has(huella)) { omitidasDuplicadas++; return; }
    existentes.add(huella);

    const id = 'FR' + Date.now().toString(36).toUpperCase() + i.toString(36).padStart(3, '0');
    // Se guarda la fila completa tal cual vino del archivo (todas las columnas originales
    // de Google Forms, con sus preguntas y respuestas exactas), más curso/edición
    // normalizados para que se puedan filtrar como cualquier otra respuesta.
    const respuestas = { ...fila, email, nombre, curso: curso || tituloFormulario, edicion: edicionFila, importadoDe: 'Google Forms (histórico)' };
    nuevasFilas.push([id, fechaISO, tituloFormulario, curso || '', email, nombre, edicionFila, JSON.stringify(respuestas)]);
  });

  if (nuevasFilas.length > 0) {
    try {
      await appendRows(TABS.RESPUESTAS_FORM, nuevasFilas);
    } catch (e) {
      return NextResponse.json({ ok: false, error: 'No se pudo guardar en la planilla: ' + (e.message || e) }, { status: 500 });
    }
  }

  if (nuevasFilas.length > 0) {
    await registrarAccion(usuario.email, usuario.nombre, 'Importó respuestas históricas', `${tituloFormulario}: ${nuevasFilas.length} respuesta(s)${curso ? ` · ${curso}` : ''}`);
  }

  return NextResponse.json({ ok: true, importadas: nuevasFilas.length, omitidasSinEmail, omitidasDuplicadas });
}
