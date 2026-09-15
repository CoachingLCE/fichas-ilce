import nodemailer from 'nodemailer';
import { APP_URL, WHATSAPP_URL, EQUIPO_NOTIF, TABS } from './constants';
import { appendRow } from './sheets';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
  });
}

// Registra cada envío automático en la pestaña Emails (Fecha, Tipo, Para, Asunto, Estado, Detalle).
async function logEmail(tipo, para, asunto, estado, detalle = '') {
  try { await appendRow(TABS.EMAILS, [new Date().toISOString(), tipo, para || '', asunto || '', estado, detalle]); } catch { /* el log nunca rompe el envío */ }
}

// Envía y registra en el log. Si falla, registra "Falló" y relanza (el caller ya maneja el error).
async function enviarYlog(transporter, tipo, options) {
  try {
    await transporter.sendMail(options);
    await logEmail(tipo, options.to, options.subject, 'Enviado');
  } catch (e) {
    await logEmail(tipo, options.to, options.subject, 'Falló', e && e.message ? e.message : '');
    throw e;
  }
}

// "Edición 15 — Lunes 31 de agosto" -> "Edición 15"
function edicionCorta(edicion) {
  if (!edicion) return '';
  return edicion.split('\u2014')[0].split('-')[0].trim();
}

const WRAP_OPEN = `
<div style="background:#061424;margin:0;padding:0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#061424;padding:24px 0">
  <tr><td align="center">
    <table role="presentation" width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;background:#0c1e32;border:1px solid #1e3a58;border-radius:18px;overflow:hidden">`;
const WRAP_CLOSE = (footer) => `
    </table>
    <div style="color:#68809c;font-family:Arial,sans-serif;font-size:11px;margin-top:14px">${footer || 'Instituto ILCE \u00b7 Formando personas reflexivas'}</div>
  </td></tr>
</table></div>`;

function encabezado(curso) {
  return `
  <tr><td style="background:linear-gradient(120deg,#01233f 0%,#065f74 52%,#0595ad 100%);padding:26px 30px">
    <div style="font-family:'Jost',Arial,sans-serif;letter-spacing:4px;font-size:11px;color:#dbe7ef">INSTITUTO ILCE</div>
    <div style="font-family:'Jost',Arial,sans-serif;font-weight:700;font-size:25px;color:#fff;margin-top:6px">${curso}</div>
  </td></tr>`;
}

// ================= Email al ESTUDIANTE =================
export function plantillaConfirmacion({ nombre, curso, edicion, medio }) {
  const ed = edicionCorta(edicion);
  return `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:28px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:22px;font-weight:700;color:#fff;margin-bottom:6px">\u00a1Recibimos tu inscripci\u00f3n! \ud83c\udf89</div>
      <p style="margin:14px 0 4px">Hola${nombre ? `, ${nombre}` : ''}:</p>
      <p style="margin:0 0 16px">Gracias por completar tu ficha de inscripci\u00f3n para:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:12px;margin:0 0 20px">
        <tr><td style="padding:16px 18px">
          <div style="font-family:'Jost',Arial,sans-serif;font-size:18px;font-weight:700;color:#fff">${curso}</div>
          ${ed ? `<div style="font-size:14px;color:#0aa7c2;font-weight:700;margin-top:3px">${ed}</div>` : ''}
        </td></tr>
      </table>
      <p style="margin:0 0 18px">Nuestro equipo va a revisar tu ficha y te va a acompa\u00f1ar en los pr\u00f3ximos pasos${medio ? ` por <b>${medio}</b>` : ''}. Si quer\u00e9s adelantar cualquier consulta, escribinos directo por WhatsApp:</p>
      <div style="text-align:center;margin:8px 0 6px">
        <a href="${WHATSAPP_URL}" style="display:inline-block;background:#25D366;color:#0b2e18;text-decoration:none;font-size:15px;font-weight:700;padding:14px 30px;border-radius:999px;font-family:Arial,sans-serif">\ud83d\udcac HABLAR POR WHATSAPP</a>
      </div>
      <div style="text-align:center;margin:14px 0 0">
        <a href="${APP_URL}" style="color:#8fb3d4;text-decoration:none;font-size:13px;font-family:Arial,sans-serif">Instituto ILCE</a>
      </div>
      <p style="margin:20px 0 0;color:#96aac4;font-size:12px">Si no completaste esta ficha, pod\u00e9s ignorar este correo.</p>
    </td></tr>
  ${WRAP_CLOSE()}`;
}

export async function enviarConfirmacionInscripcion({ email, nombre, curso, edicion, medio }) {
  const transporter = getTransporter();
  await enviarYlog(transporter, 'Confirmación inscripción', {
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: `\u00a1Recibimos tu inscripci\u00f3n a ${curso}! \ud83c\udf89 \u2014 Instituto ILCE`,
    html: plantillaConfirmacion({ nombre, curso, edicion, medio }),
    text: `\u00a1Recibimos tu inscripci\u00f3n! \ud83c\udf89\n\nHola${nombre ? `, ${nombre}` : ''}:\nGracias por completar tu ficha de inscripci\u00f3n para ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}.\n\nHabl\u00e1 con nosotros por WhatsApp: ${WHATSAPP_URL}\n\nInstituto ILCE`
  });
}

// ================= Aviso al EQUIPO =================
export function plantillaAvisoEquipo({ nombre, apellido, curso, edicion, email, whatsapp, pais, medio }) {
  const ed = edicionCorta(edicion);
  const dato = (k, v) => v ? `<tr><td style="padding:5px 0;color:#96aac4;font-size:13px;width:120px">${k}</td><td style="padding:5px 0;color:#e7eef6;font-size:14px;font-weight:600">${v}</td></tr>` : '';
  return `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:26px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.5">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:4px">\ud83d\udce5 Nueva ficha recibida</div>
      <p style="margin:8px 0 16px">Se recibi\u00f3 una ficha de inscripci\u00f3n de <b>${(nombre || '') + ' ' + (apellido || '')}</b> para <b>${curso}</b>${ed ? ` \u2014 ${ed}` : ''}.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:12px;padding:6px 16px;margin:0 0 18px">
        ${dato('Nombre', `${nombre || ''} ${apellido || ''}`)}
        ${dato('Email', email)}
        ${dato('WhatsApp', whatsapp)}
        ${dato('Pa\u00eds', pais)}
        ${dato('Edici\u00f3n', ed)}
        ${dato('Prefiere', medio)}
      </table>
      <div style="text-align:center;margin:6px 0 0">
        <a href="${APP_URL}/panel" style="display:inline-block;background:linear-gradient(135deg,#4a128b,#96198f);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 26px;border-radius:999px;font-family:Arial,sans-serif">Ver en el panel</a>
      </div>
    </td></tr>
  ${WRAP_CLOSE('Aviso autom\u00e1tico \u00b7 Plataforma ILCE')}`;
}

export async function enviarAvisoEquipo({ nombre, apellido, curso, edicion, email, whatsapp, pais, medio }) {
  const transporter = getTransporter();
  await enviarYlog(transporter, 'Aviso equipo', {
    from: `Plataforma ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: EQUIPO_NOTIF.join(', '),
    subject: `\ud83d\udce5 Nueva ficha \u2014 ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}: ${nombre || ''} ${apellido || ''}`.trim(),
    html: plantillaAvisoEquipo({ nombre, apellido, curso, edicion, email, whatsapp, pais, medio }),
    text: `Nueva ficha de inscripci\u00f3n recibida.\nCurso: ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}\nNombre: ${nombre || ''} ${apellido || ''}\nEmail: ${email || ''}\nWhatsApp: ${whatsapp || ''}\nPa\u00eds: ${pais || ''}\n\nVer en el panel: ${APP_URL}/panel`
  });
}

// ================= Email de credenciales (Accesos) =================
export async function enviarMailContrasena(email, nombre, password) {
  const transporter = getTransporter();
  const html = `${WRAP_OPEN}
    ${encabezado('Plataforma ILCE')}
    <tr><td style="padding:28px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:6px">Tu acceso al panel</div>
      <p style="margin:12px 0 4px">Hola${nombre ? `, ${nombre}` : ''}:</p>
      <p style="margin:0 0 16px">Ya podés entrar al panel de gestión de fichas de ILCE con estos datos:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:12px;padding:6px 16px;margin:0 0 18px">
        <tr><td style="padding:6px 0;color:#96aac4;font-size:13px;width:110px">Usuario</td><td style="padding:6px 0;color:#e7eef6;font-size:14px;font-weight:700">${email}</td></tr>
        <tr><td style="padding:6px 0;color:#96aac4;font-size:13px">Contraseña</td><td style="padding:6px 0;color:#e7eef6;font-size:16px;font-weight:700;font-family:monospace">${password}</td></tr>
      </table>
      <div style="text-align:center;margin:6px 0 0">
        <a href="${APP_URL}/panel/login" style="display:inline-block;background:linear-gradient(135deg,#4a128b,#96198f);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 30px;border-radius:999px;font-family:Arial,sans-serif">Entrar al panel</a>
      </div>
      <p style="margin:18px 0 0;color:#96aac4;font-size:12px">Guardá este correo. Si tenés dudas, escribile a Diego.</p>
    </td></tr>
  ${WRAP_CLOSE('Plataforma ILCE \u00b7 Acceso del equipo')}`;
  await enviarYlog(transporter, 'Credenciales acceso', {
    from: `Plataforma ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: 'Tu acceso al panel de ILCE',
    html,
    text: `Hola${nombre ? `, ${nombre}` : ''}:\nTu acceso al panel de ILCE:\nUsuario: ${email}\nContraseña: ${password}\nEntrá en: ${APP_URL}/panel/login`
  });
}

// ================= Resultado de actividad al ESTUDIANTE =================
export async function enviarResultadoActividad({ email, nombre, curso, actividad, puntaje, total }) {
  const transporter = getTransporter();
  const pct = total ? Math.round((puntaje / total) * 100) : 0;
  const html = `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:28px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:6px">\u00a1Recibimos tu actividad! \u2705</div>
      <p style="margin:12px 0 4px">Hola${nombre ? `, ${nombre}` : ''}:</p>
      <p style="margin:0 0 16px">Registramos tu respuesta de <b>${actividad}</b>.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:12px;margin:0 0 18px">
        <tr><td style="padding:16px 18px;text-align:center">
          <div style="font-family:'Jost',Arial,sans-serif;font-size:30px;font-weight:700;color:#0aa7c2">${puntaje} / ${total}</div>
          <div style="font-size:13px;color:#96aac4;margin-top:2px">${pct}% de respuestas correctas</div>
        </td></tr>
      </table>
      <p style="margin:0;color:#96aac4;font-size:13px">\u00a1Segu\u00ed as\u00ed! Cualquier duda, escribinos.</p>
    </td></tr>
  ${WRAP_CLOSE('Instituto ILCE \u00b7 \u00c1rea acad\u00e9mica')}`;
  await enviarYlog(transporter, 'Resultado actividad', {
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: `Tu actividad: ${actividad} \u2014 ${puntaje}/${total}`,
    html,
    text: `Hola${nombre ? `, ${nombre}` : ''}:\nRegistramos tu actividad "${actividad}". Resultado: ${puntaje}/${total} (${pct}%).\nInstituto ILCE`
  });
}

// ============ Aviso al DOCENTE cuando un estudiante completa una actividad ============
export async function enviarAvisoActividadDocente({ docenteEmail, docenteNombre, estudiante, estudianteEmail, actividad, curso, edicion, puntaje, total }) {
  const transporter = getTransporter();
  const pct = total ? Math.round((puntaje / total) * 100) : 0;
  const html = `${WRAP_OPEN}
    ${encabezado(curso)}
    <tr><td style="padding:28px 30px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:20px;font-weight:700;color:#fff;margin-bottom:6px">Nueva actividad completada \u{1F4DD}</div>
      <p style="margin:12px 0 4px">Hola${docenteNombre ? `, ${docenteNombre}` : ''}:</p>
      <p style="margin:0 0 16px">Un estudiante complet\u00f3 <b>${actividad}</b>${edicion ? ` (Edici\u00f3n ${edicion})` : ''}.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:12px;margin:0 0 18px">
        <tr><td style="padding:16px 18px">
          <div style="font-size:15px;color:#fff;font-weight:700">${estudiante || estudianteEmail}</div>
          ${estudiante ? `<div style="font-size:13px;color:#96aac4">${estudianteEmail}</div>` : ''}
          <div style="font-family:'Jost',Arial,sans-serif;font-size:24px;font-weight:700;color:#0aa7c2;margin-top:8px">${puntaje} / ${total} <span style="font-size:13px;color:#96aac4;font-weight:400">(${pct}%)</span></div>
        </td></tr>
      </table>
      <p style="margin:0;color:#96aac4;font-size:13px">Pod\u00e9s ver el detalle en el panel, secci\u00f3n Actividades.</p>
    </td></tr>
  ${WRAP_CLOSE('Instituto ILCE \u00b7 \u00c1rea acad\u00e9mica')}`;
  await enviarYlog(transporter, 'Aviso actividad docente', {
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: docenteEmail,
    subject: `${estudiante || estudianteEmail} complet\u00f3 ${actividad} \u2014 ${puntaje}/${total}`,
    html,
    text: `Hola${docenteNombre ? `, ${docenteNombre}` : ''}:\n${estudiante || estudianteEmail} complet\u00f3 "${actividad}"${edicion ? ` (Edici\u00f3n ${edicion})` : ''}. Resultado: ${puntaje}/${total} (${pct}%).\nInstituto ILCE`
  });
}

// ================= Resumen de los viernes al EQUIPO ACADÉMICO =================
export async function enviarResumenActividades({ destinatarios, desde, hasta, filas }) {
  const transporter = getTransporter();
  const rows = filas.map((r) =>
    `<tr><td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.fecha || ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.nombre || ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.curso || ''}${r.edicion ? ' · ' + r.edicion : ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px">${r.actividad || ''}</td>
     <td style="padding:5px 8px;border-bottom:1px solid #1e3a58;font-size:13px;text-align:right;font-weight:700">${r.puntaje}/${r.total}</td></tr>`
  ).join('');
  const html = `${WRAP_OPEN}
    ${encabezado('Resumen de actividades')}
    <tr><td style="padding:24px 26px;color:#e7eef6;font-family:Arial,sans-serif;font-size:14px;line-height:1.5">
      <div style="font-family:'Jost',Arial,sans-serif;font-size:19px;font-weight:700;color:#fff;margin-bottom:4px">\ud83d\udcc5 Actividades respondidas</div>
      <p style="margin:6px 0 14px;color:#96aac4">Período: ${desde} a ${hasta} \u00b7 ${filas.length} respuesta(s).</p>
      ${filas.length ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#12233b;border:1px solid #1e3a58;border-radius:10px;border-collapse:collapse">
        <tr><td style="padding:6px 8px;color:#96aac4;font-size:12px">Fecha</td><td style="padding:6px 8px;color:#96aac4;font-size:12px">Estudiante</td><td style="padding:6px 8px;color:#96aac4;font-size:12px">Curso</td><td style="padding:6px 8px;color:#96aac4;font-size:12px">Actividad</td><td style="padding:6px 8px;color:#96aac4;font-size:12px;text-align:right">Puntaje</td></tr>
        ${rows}
      </table>` : '<p style="color:#96aac4">No hubo respuestas en el período.</p>'}
    </td></tr>
  ${WRAP_CLOSE('Plataforma ILCE \u00b7 Resumen autom\u00e1tico')}`;
  await enviarYlog(transporter, 'Resumen viernes', {
    from: `Plataforma ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: destinatarios.join(', '),
    subject: `\ud83d\udcc5 Resumen de actividades (${filas.length}) \u2014 ${hasta}`,
    html,
    text: `Resumen de actividades ${desde} a ${hasta}: ${filas.length} respuesta(s).`
  });
}
