import { NextResponse } from 'next/server';
import { appendRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { validarFicha } from '../../../lib/validacion';
import { getCurso } from '../../../lib/fichas';
import { enviarConfirmacionInscripcion, enviarAvisoEquipo } from '../../../lib/mailer';

export const dynamic = 'force-dynamic';

function ahoraISO() {
  return new Date().toISOString();
}
function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function nuevoId() {
  return 'F' + Date.now().toString(36).toUpperCase();
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON inválido' }, { status: 400 });
  }

  const { slug, token, form = {} } = body;
  const curso = getCurso(slug);
  if (!curso) return NextResponse.json({ ok: false, error: 'Curso desconocido' }, { status: 400 });

  // Revalidación server-side (nunca se confía en el cliente)
  const errores = validarFicha(form);
  if (Object.keys(errores).length) {
    return NextResponse.json({ ok: false, error: 'Faltan datos obligatorios', errores }, { status: 400 });
  }

  const id = nuevoId();
  const edicionLabel = form.edicion || '';
  const modalidad = form.modalidad === 'Otro' ? `Otro: ${form.modOtro || ''}` : (form.modalidad || '');

  // Orden EXACTO de HEADERS[Inscripciones] (30 columnas)
  const fila = [
    id,                                   // ID
    hoy(),                                // Fecha ficha
    curso.nombre,                         // Curso
    edicionLabel,                         // Edición
    form.nom || '',                       // Nombre
    form.ape || '',                       // Apellido
    form.email || '',                     // Email
    form.pais || 'Argentina',             // País
    form.prov || '',                      // Provincia/Estado
    form.loc || '',                       // Localidad
    form.wa || '',                        // WhatsApp
    form.doc || '',                       // Documento
    form.ig || '',                        // Instagram
    form.prof || '',                      // Profesión
    form.origen || '',                    // Origen
    modalidad,                            // Modalidad
    form.medio || '',                     // Medio contacto
    form.salud || '',                     // Tema salud
    form.sobre || '',                     // Sobre vos
    form.coment || '',                    // Comentarios
    form.cons ? 'Sí' : 'No',              // Consentimiento
    '',                                   // Inscrito (lo gestiona el equipo)
    'Completada',                         // Estado
    '',                                   // Responsable (se asigna luego)
    token || '',                          // Token
    form._inicio || '',                   // Fecha inicio
    ahoraISO(),                           // Fecha fin
    ahoraISO(),                           // Última actualización
    JSON.stringify(form),                 // Respuestas JSON (respaldo íntegro)
    'Formulario web'                      // Origen registro
  ];

  try {
    await appendRow(TABS.INSCRIPCIONES, fila);
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'No se pudo guardar: ' + e.message }, { status: 500 });
  }

  // Historial (no bloquea el flujo si falla)
  try {
    await appendRow(TABS.HISTORIAL, [ahoraISO(), id, form.email || '', 'Ficha enviada', `${curso.nombre} · ${edicionLabel}`]);
  } catch (e) { /* noop */ }

  // Email de confirmación al estudiante (no bloquea el guardado si falla)
  let emailOk = true;
  try {
    await enviarConfirmacionInscripcion({
      email: form.email, nombre: form.nom, curso: curso.nombre, edicion: edicionLabel, medio: form.medio
    });
  } catch (e) {
    emailOk = false;
  }

  // Aviso al equipo (no bloquea el flujo si falla)
  try {
    await enviarAvisoEquipo({
      nombre: form.nom, apellido: form.ape, curso: curso.nombre, edicion: edicionLabel,
      email: form.email, whatsapp: form.wa, pais: form.pais, medio: form.medio
    });
  } catch (e) { /* noop */ }

  return NextResponse.json({ ok: true, id, emailOk });
}
