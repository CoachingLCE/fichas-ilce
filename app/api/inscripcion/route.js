import { NextResponse } from 'next/server';
import { appendRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { validarFicha } from '../../../lib/validacion';
import { getCurso } from '../../../lib/fichas';
import { enviarConfirmacionInscripcion, enviarAvisoEquipo } from '../../../lib/mailer';
import { limitador, ipDe, MIN10 } from '../../../lib/limiteRitmo';
import { acotarForm, demasiadoGrande, pareceRobot } from '../../../lib/entradaPublica';
import { getPago, conTimeout } from '../../../lib/pagos';

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

  // ---- Frenos contra abuso (revisión de seguridad, octubre de 2026). Esta ruta es pública, escribe en la planilla y manda mails a la dirección que
  // venga en la ficha: sin frenos, alguien podía llenarla de fichas falsas, mandar mails en nombre de ILCE a terceros y agotar la cuota de Google/Gmail.
  if (demasiadoGrande(body)) return NextResponse.json({ ok: false, error: 'La ficha es demasiado grande.' }, { status: 413 });
  const { slug, token, trampa } = body;
  const formCrudo = body.form && typeof body.form === 'object' ? body.form : {};
  // Un programa (campo trampa con algo escrito, o enviada en menos de 2 segundos desde que empezó) recibe "ok" pero NO se guarda ni se manda nada.
  if (pareceRobot({ trampa, inicio: formCrudo._inicio })) {
    console.warn('[inscripcion] ficha descartada: parece enviada por un programa');
    return NextResponse.json({ ok: true, id: nuevoId(), emailOk: true });
  }
  const limiteIp = limitador.intentar('insc:ip:' + ipDe(req), 8, MIN10);
  if (!limiteIp.permitido) return NextResponse.json({ ok: false, error: 'Se enviaron demasiadas fichas desde tu conexión. Esperá unos minutos y volvé a intentar.' }, { status: 429, headers: { 'Retry-After': String(limiteIp.reintentarEnSeg) } });

  const curso = getCurso(slug);
  if (!curso) return NextResponse.json({ ok: false, error: 'Curso desconocido' }, { status: 400 });

  // Se recorta cada texto a su tope y se limpian los caracteres de control ANTES de validar y guardar.
  const form = acotarForm(formCrudo);

  // Revalidación server-side (nunca se confía en el cliente)
  const errores = validarFicha(form);
  if (Object.keys(errores).length) {
    return NextResponse.json({ ok: false, error: 'Faltan datos obligatorios', errores }, { status: 400 });
  }
  // Un mismo correo no puede recibir más de 3 confirmaciones en 10 minutos (evita usar ILCE para mandar mails a una persona).
  const limiteMail = limitador.intentar('insc:mail:' + String(form.email || '').trim().toLowerCase(), 3, MIN10);
  if (!limiteMail.permitido) return NextResponse.json({ ok: false, error: 'Ya recibimos varias fichas con este correo. Esperá unos minutos y volvé a intentar.' }, { status: 429, headers: { 'Retry-After': String(limiteMail.reintentarEnSeg) } });

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
      email: form.email, nombre: form.nom, curso: curso.nombre, edicion: edicionLabel, medio: form.medio, fecha: hoy(), id
    });
  } catch (e) {
    emailOk = false;
  }

  // Aviso al equipo (no bloquea el flujo si falla)
  try {
    await enviarAvisoEquipo({
      nombre: form.nom, apellido: form.ape, curso: curso.nombre, edicion: edicionLabel,
      email: form.email, whatsapp: form.wa, pais: form.pais, medio: form.medio, origen: form.origen || ''
    });
  } catch (e) { /* noop */ }

  // Botones de pago de la 1ª cuota según el país de la ficha (Argentina: Mercado Pago y débito; otro país: PayPal). Viajan en esta respuesta y no en una
  // ruta pública, así solo los recibe quien completó una ficha. Si falla o tarda (más de 2,5 s), la inscripción igual está guardada: simplemente no se muestra.
  let pago = null;
  try { pago = await conTimeout(getPago(slug, form.pais), 2500, null); } catch { pago = null; }
  return NextResponse.json({ ok: true, id, emailOk, pago });
}
