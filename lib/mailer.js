import nodemailer from 'nodemailer';
import { APP_URL, WHATSAPP_URL, EQUIPO_NOTIF } from './constants';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_SENDER_EMAIL, pass: process.env.GMAIL_APP_PASSWORD }
  });
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
function plantillaConfirmacion({ nombre, curso, edicion, medio }) {
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
  await transporter.sendMail({
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: `\u00a1Recibimos tu inscripci\u00f3n a ${curso}! \ud83c\udf89 \u2014 Instituto ILCE`,
    html: plantillaConfirmacion({ nombre, curso, edicion, medio }),
    text: `\u00a1Recibimos tu inscripci\u00f3n! \ud83c\udf89\n\nHola${nombre ? `, ${nombre}` : ''}:\nGracias por completar tu ficha de inscripci\u00f3n para ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}.\n\nHabl\u00e1 con nosotros por WhatsApp: ${WHATSAPP_URL}\n\nInstituto ILCE`
  });
}

// ================= Aviso al EQUIPO =================
function plantillaAvisoEquipo({ nombre, apellido, curso, edicion, email, whatsapp, pais, medio }) {
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
  await transporter.sendMail({
    from: `Plataforma ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: EQUIPO_NOTIF.join(', '),
    subject: `\ud83d\udce5 Nueva ficha \u2014 ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}: ${nombre || ''} ${apellido || ''}`.trim(),
    html: plantillaAvisoEquipo({ nombre, apellido, curso, edicion, email, whatsapp, pais, medio }),
    text: `Nueva ficha de inscripci\u00f3n recibida.\nCurso: ${curso}${edicion ? ` (${edicionCorta(edicion)})` : ''}\nNombre: ${nombre || ''} ${apellido || ''}\nEmail: ${email || ''}\nWhatsApp: ${whatsapp || ''}\nPa\u00eds: ${pais || ''}\n\nVer en el panel: ${APP_URL}/panel`
  });
}
