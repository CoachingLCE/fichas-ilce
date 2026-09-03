import nodemailer from 'nodemailer';
import { APP_URL } from './constants';

function getTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_SENDER_EMAIL,
      pass: process.env.GMAIL_APP_PASSWORD
    }
  });
}

function plantillaConfirmacion({ nombre, curso, edicion, medio }) {
  const saludo = nombre ? `Hola ${nombre},` : 'Hola,';
  return `
  <div style="background:#061424;padding:0;margin:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#061424;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;background:#0c1e32;border:1px solid #1e3a58;border-radius:16px;overflow:hidden">
        <tr><td style="background:linear-gradient(120deg,#01233f 0%,#065f74 52%,#0595ad 100%);padding:26px 28px">
          <div style="font-family:'Jost',Arial,sans-serif;letter-spacing:4px;font-size:11px;color:#dbe7ef">INSTITUTO ILCE</div>
          <div style="font-family:'Jost',Arial,sans-serif;font-weight:700;font-size:24px;color:#fff;margin-top:6px">${curso}</div>
        </td></tr>
        <tr><td style="padding:26px 28px;color:#e7eef6;font-family:Arial,sans-serif;font-size:15px;line-height:1.55">
          <p style="margin:0 0 12px"><b>¡Recibimos tu inscripción!</b></p>
          <p style="margin:0 0 12px">${saludo} gracias por completar tu ficha de la formación en <b>${curso}</b>${edicion ? ` (${edicion})` : ''}.</p>
          <p style="margin:0 0 12px">El equipo de ILCE va a contactarte por <b>${medio || 'el medio que elegiste'}</b> a la brevedad para coordinar los próximos pasos.</p>
          <div style="text-align:center;margin:24px 0 6px">
            <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#4a128b,#96198f);color:#fff;text-decoration:none;font-size:14px;font-weight:700;padding:12px 28px;border-radius:999px;font-family:Arial,sans-serif">Instituto ILCE</a>
          </div>
          <p style="margin:16px 0 0;color:#96aac4;font-size:13px">Si no completaste esta ficha, podés ignorar este correo.</p>
        </td></tr>
      </table>
      <div style="color:#68809c;font-family:Arial,sans-serif;font-size:11px;margin-top:14px">Instituto ILCE · Formando personas reflexivas</div>
    </td></tr>
  </table></div>`;
}

export async function enviarConfirmacionInscripcion({ email, nombre, curso, edicion, medio }) {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `Instituto ILCE <${process.env.GMAIL_SENDER_EMAIL}>`,
    to: email,
    subject: `¡Recibimos tu inscripción a ${curso}! — Instituto ILCE`,
    html: plantillaConfirmacion({ nombre, curso, edicion, medio }),
    text: `¡Recibimos tu inscripción a ${curso}!\n\nHola ${nombre || ''}, gracias por completar tu ficha${edicion ? ` (${edicion})` : ''}. El equipo de ILCE va a contactarte por ${medio || 'el medio que elegiste'} a la brevedad.\n\nInstituto ILCE`
  });
}
