import nodemailer from 'nodemailer';
import { APP_URL, WHATSAPP_URL, EQUIPO_NOTIF, EQUIPO_ACADEMICO, TABS } from './constants';
import { appendRow } from './sheets';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
  });
}

// Registra cada envío automático en la pestaña Emails (Fecha, Tipo, Para, Asunto, Estado,
// Detalle, Payload). El Payload es lo que permite "Reintentar" un correo fallido sin tener
// que rearmarlo a mano — para Credenciales de acceso se manda vacío a propósito (ver abajo),
// para no guardar una contraseña en texto plano dos veces.
async function logEmail(tipo, para, asunto, estado, detalle = '', payload = null) {
  try {
    await appendRow(TABS.EMAILS, [
      new Date().toISOString(), tipo, para || '', asunto || '', estado, detalle,
      payload ? JSON.stringify(payload) : ''
    ]);
  } catch { /* el log nunca rompe el envío */ }
}

// Envía y registra en el log. Si falla, registra "Falló" y relanza (el caller ya maneja el error).
async function enviarYlog(transporter, tipo, options, payload = null) {
  try {
    await transporter.sendMail(options);
    await logEmail(tipo, options.to, options.subject, 'Enviado', '', payload);
  } catch (e) {
    await logEmail(tipo, options.to, options.subject, 'Falló', e && e.message ? e.message : '', payload);
    throw e;
  }
}

// "Edición 15 — Lunes 31 de agosto" -> "Edición 15"
function edicionCorta(edicion) {
  if (!edicion) return '';
  return edicion.split('—')[0].split('-')[0].trim();
}

// "2026-09-19" -> "19 de septiembre de 2026"
function fechaLarga(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha.length === 10 ? `${fecha}T00:00:00` : fecha);
  if (isNaN(d)) return fecha;
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ===================== Identidad visual compartida =====================
// Estructura común a los 6 mails (pedido explícito: "todos los mails deberían compartir una
// misma identidad visual"): franja INSTITUTO ILCE + título -> saludo -> mensaje -> bloque de
// info -> acción principal -> info secundaria -> pie. Todo con estilos inline y tablas, para
// que se vea bien en Gmail (web/Android/iPhone) y Outlook. Nada de flexbox/grid/box-shadow.
const WRAP_OPEN = `
<div style="background:#061424;margin:0;padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#061424;padding:24px 0">
  <tr><td align="center">
    <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#0c1e32;border:1px solid #1e3a58;border-radius:18px;overflow:hidden">`;
const WRAP_CLOSE = (footer) => `
    </table>
    <div style="color:#68809c;font-family:Arial,sans-serif;font-size:11px;margin-top:14px">${footer || 'Instituto ILCE · Formando personas reflexivas'}</div>
  </td></tr>
</table></div>`;

function encabezado(curso) {
  return `
  <tr><td style="background:linear-gradient(120deg,#01233f 0%,#065f74 52%,#0595ad 100%);padding:26px 30px">
    <div style="font-family:'Jost',Arial,sans-serif;letter-spacing:4px;font-size:11px;color:#dbe7ef">INSTITUTO ILCE</div>
    <div style="font-family:'Jost',Arial,sans-serif;font-weight:700;font-size:25px;color:#fff;margin-top:6px">${curso}</div>
  </td></tr>`;
}

// "Hola, {nombre}:" — el saludo del cuerpo del mail, para las plantillas dirigidas a una persona.
function saludo(nombre) {
  return `<p style="margin:0 0 14px">Hola${nombre ? `, ${nombre}` : ''}:</p>`;
}

// El bloque de "información relevante" que se repite en casi todos los mails (datos en
// filas de dos columnas, dentro de una caja). titulo es opcional (algunos mails no lo llevan).
function infoBox(titulo, filas) {
  const visibles = (filas || []).filter(([, v]) => v);
  if (visibles.length === 0) return '';
  const rows = visibles.map(([k, v]) => `<tr><td style="padding:6px 0;color:#96aac4;font-size:13px;width:150px;vertical-align:top">${k}</td><td style="padding:6px 0;color:#e7eef6;font-size:14px;font-weight:600">${v}</td></tr>`).join('');
  return `
      ${titulo ? `<div style="font-family:'Jost',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#7fa0bd;margin:4px 0 8px">${titulo}</div>` : ''}
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:12px;padding:6px 16px;margin:0 0 18px">
        ${rows}
      </table>`;
}

// Botón de acción principal (degradé violeta/magenta, el mismo de los botones sólidos del
// panel). El de WhatsApp es aparte porque usa el verde de la marca — se mantiene así a propósito.
function botonAccion(href, label) {
  return `<div style="text-align:center;margin:8px 0 0"><a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#4a128b,#96198f);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:999px;font-family:Arial,sans-serif">${label}</a></div>`;
}
function botonWhatsapp(href, label) {
  return `<div style="text-align:center;margin:8px 0 0"><a href="${href}" style="display:inline-block;background:#25D366;color:#0b2e18;text-decoration:none;font-size:15px;font-weight:700;padding:14px 30px;border-radius:999px;font-family:Arial,sans-serif">${label}</a></div>`;
}

// ================= 1) Confirmación de inscripción — al ESTUDIANTE =================
export function asuntoConfirmacion({ curso }) {
  return `¡Recibimos tu inscripción a ${curso}! 🎉`;
}
export function plantillaConfirmacion({ nombre, curso, edicion, medio, fecha }) {
  const ed = edicionCorta(edicion);
  return `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:28px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:10px">¡Gracias por inscribirte${nombre ? `, ${nombre}` : ''}! 🎉</div>
      <p style="margin:0 0 18px">Recibimos correctamente tu inscripción a <b>${curso}</b>.</p>
      ${infoBox('Tu inscripción', [['Programa', curso], ['Edición', ed], ['Fecha de inscripción', fechaLarga(fecha)]])}
      <div style="font-family:'Jost',Arial,sans-serif;font-size:16px;font-weight:700;color:#fff;margin:4px 0 8px">¿Qué sigue?</div>
      <p style="margin:0 0 18px">Nuestro equipo va a revisar tu inscripción y te va a contactar para indicarte los próximos pasos${medio ? ` por <b>${medio}</b>` : ''}. Si querés adelantar cualquier consulta, escribinos directo:</p>
      ${botonWhatsapp(WHATSAPP_URL, '💬 Hablar por WhatsApp')}
      <p style="margin:22px 0 0;color:#96aac4;font-size:12px">Si no completaste esta ficha, podés ignorar este correo.</p>
    </td></tr>
  ${WRAP_CLOSE()}`;
}
export async function enviarConfirmacionInscripcion({ email, nombre, curso, edicion, medio, fecha }) {
  const transporter = getTransporter();
  const payload = { nombre, curso, edicion, medio, fecha };
  await enviarYlog(transporter, 'Confirmación inscripción', {
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: asuntoConfirmacion({ curso }),
    html: plantillaConfirmacion(payload),
    text: `¡Gracias por inscribirte${nombre ? `, ${nombre}` : ''}! 🎉\n\nRecibimos tu inscripción a ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}.\n\nNuestro equipo la va a revisar y te va a contactar con los próximos pasos.\nHablá con nosotros por WhatsApp: ${WHATSAPP_URL}\n\nInstituto ILCE`
  }, { ...payload, email });
}

// ================= 2) Aviso interno de nueva inscripción — al EQUIPO =================
export function asuntoAvisoEquipo({ nombre, apellido, curso }) {
  return `📥 Nueva inscripción · ${`${nombre || ''} ${apellido || ''}`.trim()} · ${curso}`;
}
export function plantillaAvisoEquipo({ nombre, apellido, curso, edicion, email, whatsapp, pais, medio, origen }) {
  const ed = edicionCorta(edicion);
  const medioOrigen = origen && medio && origen !== medio ? `${origen} · ${medio}` : (origen || medio || '');
  return `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:26px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.5">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:14px">📥 Nueva inscripción</div>
      ${infoBox(null, [
        ['Nombre', `${nombre || ''} ${apellido || ''}`.trim()],
        ['Curso', curso],
        ['Edición', ed],
        ['Email', email],
        ['WhatsApp', whatsapp],
        ['País', pais],
        ['Medio/origen', medioOrigen]
      ])}
      ${botonAccion(`${APP_URL}/panel?tab=inscripciones&q=${encodeURIComponent(email || '')}`, 'Ver inscripción en el panel →')}
    </td></tr>
  ${WRAP_CLOSE('Aviso automático · Plataforma ILCE')}`;
}
export async function enviarAvisoEquipo({ nombre, apellido, curso, edicion, email, whatsapp, pais, medio, origen }) {
  const transporter = getTransporter();
  const payload = { nombre, apellido, curso, edicion, email, whatsapp, pais, medio, origen };
  await enviarYlog(transporter, 'Aviso equipo', {
    from: `Plataforma ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: EQUIPO_NOTIF.join(', '),
    subject: asuntoAvisoEquipo({ nombre, apellido, curso }),
    html: plantillaAvisoEquipo(payload),
    text: `Nueva inscripción.\nNombre: ${nombre || ''} ${apellido || ''}\nCurso: ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}\nEmail: ${email || ''}\nWhatsApp: ${whatsapp || ''}\nPaís: ${pais || ''}\n\nVer en el panel: ${APP_URL}/panel?tab=inscripciones&q=${encodeURIComponent(email || '')}`
  }, payload);
}

// ================= 3) Credenciales de acceso =================
// Por seguridad esta NO guarda payload reintentable (incluiría la contraseña en texto plano
// una segunda vez en la planilla). Si falla, se genera un acceso nuevo desde Accesos.
export function plantillaCredenciales({ nombre, email, password }) {
  return `${WRAP_OPEN}
    ${encabezado('Plataforma ILCE')}
    <tr><td style="padding:28px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:8px">Tu acceso al panel</div>
      ${saludo(nombre)}
      <p style="margin:0 0 16px">Ya podés entrar al panel de gestión de fichas de ILCE con estos datos:</p>
      ${infoBox(null, [['Usuario', email], ['Contraseña', `<span style="font-family:monospace;font-size:16px">${password}</span>`]])}
      ${botonAccion(`${APP_URL}/panel/login`, 'Entrar al panel →')}
      <p style="margin:20px 0 0;color:#96aac4;font-size:12px">Guardá este correo. Si tenés dudas, escribile a Diego.</p>
    </td></tr>
  ${WRAP_CLOSE('Plataforma ILCE · Acceso del equipo')}`;
}
export async function enviarMailContrasena(email, nombre, password) {
  const transporter = getTransporter();
  const asunto = 'Tu acceso al panel de ILCE';
  await enviarYlog(transporter, 'Credenciales acceso', {
    from: `Plataforma ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: asunto,
    html: plantillaCredenciales({ nombre, email, password }),
    text: `Hola${nombre ? `, ${nombre}` : ''}:\nTu acceso al panel de ILCE:\nUsuario: ${email}\nContraseña: ${password}\nEntrá en: ${APP_URL}/panel/login`
  } /* sin payload: no reintentable automáticamente, ver comentario arriba */);
}

// ================= 4) Resultado de actividad — al ESTUDIANTE =================
function mensajePorPuntaje(pct) {
  if (pct >= 90) return '¡Excelente trabajo!';
  if (pct >= 70) return '¡Muy buen trabajo!';
  if (pct >= 50) return 'Buen comienzo.';
  return 'Te recomendamos revisar el contenido y volver a intentarlo.';
}
export function asuntoResultadoActividad({ actividad }) {
  return `Resultado de tu actividad · ${actividad}`;
}
export function plantillaResultadoActividad({ nombre, curso, actividad, puntaje, total, slug }) {
  const pct = total ? Math.round((puntaje / total) * 100) : 0;
  return `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:28px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:6px">Resultado de tu actividad ✅</div>
      ${saludo(nombre)}
      <p style="margin:0 0 16px">Así te fue en <b>${actividad}</b>:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:12px;margin:0 0 14px">
        <tr><td style="padding:18px;text-align:center">
          <div style="font-family:'Jost',Arial,sans-serif;font-size:32px;font-weight:700;color:#0aa7c2">${puntaje} / ${total}</div>
          <div style="font-size:13px;color:#96aac4;margin-top:2px">${pct}% correctas</div>
        </td></tr>
      </table>
      <p style="margin:0 0 20px;font-weight:700;color:#fff">${mensajePorPuntaje(pct)}</p>
      ${slug ? botonAccion(`${APP_URL}/actividad/${slug}`, 'Volver a la actividad →') : ''}
    </td></tr>
  ${WRAP_CLOSE('Instituto ILCE · Área académica')}`;
}
export async function enviarResultadoActividad({ email, nombre, curso, actividad, puntaje, total, slug }) {
  const transporter = getTransporter();
  const pct = total ? Math.round((puntaje / total) * 100) : 0;
  const payload = { nombre, curso, actividad, puntaje, total, slug };
  await enviarYlog(transporter, 'Resultado actividad', {
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: asuntoResultadoActividad({ actividad }),
    html: plantillaResultadoActividad(payload),
    text: `Hola${nombre ? `, ${nombre}` : ''}:\nResultado de "${actividad}": ${puntaje}/${total} (${pct}%). ${mensajePorPuntaje(pct)}\nInstituto ILCE`
  }, { ...payload, email });
}

// ============ 5) Aviso al DOCENTE cuando un estudiante completa una actividad ============
export function asuntoAvisoActividadDocente({ estudiante, estudianteEmail, actividad, puntaje, total }) {
  return `📝 ${estudiante || estudianteEmail} completó “${actividad}” · ${puntaje}/${total}`;
}
export function plantillaAvisoActividadDocente({ estudiante, estudianteEmail, actividad, curso, edicion, puntaje, total }) {
  const pct = total ? Math.round((puntaje / total) * 100) : 0;
  return `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:24px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:18px;font-weight:700;color:#fff;margin-bottom:14px">📝 Actividad completada</div>
      ${infoBox(null, [
        ['Estudiante', estudiante || estudianteEmail],
        ['Actividad', actividad],
        ['Curso', curso],
        ['Edición', edicion],
        ['Resultado', `${puntaje}/${total} (${pct}%)`]
      ])}
      ${botonAccion(`${APP_URL}/panel?tab=actividades`, 'Ver actividad en el panel →')}
    </td></tr>
  ${WRAP_CLOSE('Instituto ILCE · Área académica')}`;
}
export async function enviarAvisoActividadDocente({ docenteEmail, docenteNombre, estudiante, estudianteEmail, actividad, curso, edicion, puntaje, total }) {
  const transporter = getTransporter();
  const pct = total ? Math.round((puntaje / total) * 100) : 0;
  const payload = { docenteNombre, estudiante, estudianteEmail, actividad, curso, edicion, puntaje, total };
  await enviarYlog(transporter, 'Aviso actividad docente', {
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: docenteEmail,
    subject: asuntoAvisoActividadDocente({ estudiante, estudianteEmail, actividad, puntaje, total }),
    html: plantillaAvisoActividadDocente(payload),
    text: `Hola${docenteNombre ? `, ${docenteNombre}` : ''}:\n${estudiante || estudianteEmail} completó "${actividad}"${edicion ? ` (Edición ${edicion})` : ''}. Resultado: ${puntaje}/${total} (${pct}%).\nInstituto ILCE`
  }, { ...payload, docenteEmail });
}

// ================= 6) Resumen académico semanal — al EQUIPO ACADÉMICO =================
export function asuntoResumenActividades({ filas }) {
  return `📊 Resumen académico · ${(filas || []).length} respuestas esta semana`;
}
export function plantillaResumenActividades({ desde, hasta, filas }) {
  filas = filas || [];
  const estudiantes = new Set(filas.map((f) => (f.email || f.nombre || '').toLowerCase()).filter(Boolean)).size;
  const cursos = new Set(filas.map((f) => f.curso).filter(Boolean)).size;

  const rows = filas.map((r) =>
    `<tr><td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.fecha || ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.nombre || ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.curso || ''}${r.edicion ? ' · ' + r.edicion : ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.actividad || ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px;text-align:right;font-weight:700">${r.puntaje}/${r.total}</td></tr>`
  ).join('');

  // "Para revisar": solo si hay algo que señalar (pedido: "si los datos están disponibles").
  // Bajo resultado individual (<50%), actividades con promedio bajo (<60%) y hasta 5
  // estudiantes que conviene seguir de cerca — todo calculado de los datos reales de la
  // semana, nada inventado.
  const bajos = filas.filter((f) => f.total && (f.puntaje / f.total) < 0.5);
  const porActividad = {};
  filas.forEach((f) => {
    const k = f.actividad || '—';
    if (!porActividad[k]) porActividad[k] = { suma: 0, tot: 0 };
    if (f.total) { porActividad[k].suma += Number(f.puntaje) || 0; porActividad[k].tot += Number(f.total) || 0; }
  });
  const actividadesBajoPromedio = Object.entries(porActividad)
    .filter(([, v]) => v.tot > 0 && (v.suma / v.tot) < 0.6)
    .map(([k, v]) => ({ actividad: k, prom: Math.round((v.suma / v.tot) * 100) }));
  const seguimiento = bajos.slice(0, 5).map((f) => ({ nombre: f.nombre || '—', actividad: f.actividad, pct: f.total ? Math.round((f.puntaje / f.total) * 100) : 0 }));

  const hayParaRevisar = bajos.length > 0 || actividadesBajoPromedio.length > 0;
  const bloqueRevisar = !hayParaRevisar ? '' : `
      <div style="font-family:'Jost',Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;margin:22px 0 8px">🔎 Para revisar</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#2a1730;border:1px solid #4a2a55;border-radius:12px;padding:4px 16px;margin:0 0 8px">
        ${bajos.length ? `<tr><td style="padding:8px 0;font-size:13px;color:#e7eef6">${bajos.length} respuesta${bajos.length === 1 ? '' : 's'} con menos del 50% de aciertos</td></tr>` : ''}
        ${actividadesBajoPromedio.map((a) => `<tr><td style="padding:8px 0;font-size:13px;color:#e7eef6;border-top:1px solid #4a2a55">Promedio bajo en <b>${a.actividad}</b>: ${a.prom}%</td></tr>`).join('')}
        ${seguimiento.map((s) => `<tr><td style="padding:8px 0;font-size:12.5px;color:#c7b3cc;border-top:1px solid #4a2a55">${s.nombre} — ${s.actividad} (${s.pct}%): conviene hacer seguimiento</td></tr>`).join('')}
      </table>`;

  return `${WRAP_OPEN}
    ${encabezado('Resumen académico semanal')}
    <tr><td style="padding:24px 26px;color:#e7eef6;font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:4px">📊 Resumen académico semanal</div>
      <p style="margin:6px 0 14px;color:#96aac4">Período: ${desde} a ${hasta}</p>

      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 18px">
        <tr>
          <td width="33%" style="background:#12233b;border:1px solid #1e3a58;border-radius:10px;padding:12px;text-align:center">
            <div style="font-family:'Jost',Arial,sans-serif;font-size:22px;font-weight:700;color:#0aa7c2">${filas.length}</div>
            <div style="font-size:11px;color:#96aac4">Actividades respondidas</div>
          </td>
          <td width="4"></td>
          <td width="33%" style="background:#12233b;border:1px solid #1e3a58;border-radius:10px;padding:12px;text-align:center">
            <div style="font-family:'Jost',Arial,sans-serif;font-size:22px;font-weight:700;color:#fff">${estudiantes}</div>
            <div style="font-size:11px;color:#96aac4">Estudiantes</div>
          </td>
          <td width="4"></td>
          <td width="33%" style="background:#12233b;border:1px solid #1e3a58;border-radius:10px;padding:12px;text-align:center">
            <div style="font-family:'Jost',Arial,sans-serif;font-size:22px;font-weight:700;color:#fff">${cursos}</div>
            <div style="font-size:11px;color:#96aac4">Cursos</div>
          </td>
        </tr>
      </table>

      ${filas.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:10px;border-collapse:collapse">
        <tr><td style="padding:6px 8px;color:#96aac4;font-size:12px">Fecha</td><td style="padding:6px 8px;color:#96aac4;font-size:12px">Estudiante</td><td style="padding:6px 8px;color:#96aac4;font-size:12px">Curso</td><td style="padding:6px 8px;color:#96aac4;font-size:12px">Actividad</td><td style="padding:6px 8px;color:#96aac4;font-size:12px;text-align:right">Puntaje</td></tr>
        ${rows}
      </table>` : '<p style="color:#96aac4">No hubo respuestas en el período.</p>'}

      ${bloqueRevisar}

      ${botonAccion(`${APP_URL}/panel?tab=reportes`, 'Ver análisis completo en la plataforma →')}
    </td></tr>
  ${WRAP_CLOSE('Plataforma ILCE · Resumen automático')}`;
}
export async function enviarResumenActividades({ destinatarios, desde, hasta, filas }) {
  const transporter = getTransporter();
  const payload = { desde, hasta, filas };
  await enviarYlog(transporter, 'Resumen viernes', {
    from: `Plataforma ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: destinatarios.join(', '),
    subject: asuntoResumenActividades({ filas }),
    html: plantillaResumenActividades(payload),
    text: `Resumen académico semanal ${desde} a ${hasta}: ${(filas || []).length} respuesta(s).`
  }, payload);
}

// ================= Reintentar un envío fallido =================
// Dispatch por tipo, reconstruyendo el envío desde el Payload guardado en el log. No incluye
// "Credenciales acceso" a propósito (ver enviarMailContrasena).
const REINTENTOS = {
  'Confirmación inscripción': (p) => enviarConfirmacionInscripcion({ ...p, email: p.email }),
  'Aviso equipo': (p) => enviarAvisoEquipo(p),
  'Resultado actividad': (p) => enviarResultadoActividad({ ...p, email: p.email }),
  'Aviso actividad docente': (p) => enviarAvisoActividadDocente({ ...p, docenteEmail: p.docenteEmail }),
  // El payload guardado no incluye destinatarios (es siempre la misma lista fija) — se usa
  // EQUIPO_ACADEMICO salvo que el payload traiga una lista explícita.
  'Resumen viernes': (p) => enviarResumenActividades({ ...p, destinatarios: (p.destinatarios && p.destinatarios.length) ? p.destinatarios : EQUIPO_ACADEMICO })
};
export function puedeReintentar(tipo) {
  return Object.prototype.hasOwnProperty.call(REINTENTOS, tipo);
}
export async function reintentarEnvio(tipo, payload) {
  const fn = REINTENTOS[tipo];
  if (!fn) throw new Error('Este tipo de correo no se puede reintentar automáticamente.');
  return fn(payload || {});
}
