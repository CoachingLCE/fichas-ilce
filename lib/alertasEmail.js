// Bloque de "Formularios sin respuestas" para el correo automático de los viernes. Función pura SIN imports (se puede probar sola).
// Los títulos de los formularios son texto libre que escribió una persona: se ESCAPAN, para que un "&" o un "<" no rompa el HTML.
const esc = (v) => String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fechaCorta = (iso) => { const m = String(iso || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };

export function bloqueAlertasFormulariosHTML(alertas, { dias = 30, maxFilas = 15 } = {}) {
  const lista = Array.isArray(alertas) ? alertas : [];
  if (lista.length === 0) return '';
  const celda = 'padding:7px 10px;border-top:1px solid #5c4a1c;font-size:13px;color:#e7eef6;vertical-align:top';
  const filas = lista.slice(0, maxFilas).map((a) => {
    const cuando = a.sinFecha ? 'No se sabe desde cuándo' : `hace ${a.diasSin} días`;
    const ultima = a.nunca ? 'Nunca recibió respuestas' : `Última: ${fechaCorta(a.ultimaRespuesta)}`;
    return `<tr><td style="${celda}"><b>${esc(a.titulo)}</b>${a.curso ? `<div style="font-size:11.5px;color:#c9b27a">${esc(a.curso)}</div>` : ''}</td><td style="${celda};white-space:nowrap">${esc(ultima)}</td><td style="${celda};white-space:nowrap;text-align:right;font-weight:700;color:#f6c453">${esc(cuando)}</td></tr>`;
  }).join('');
  const resto = lista.length > maxFilas ? `<tr><td colspan="3" style="${celda};color:#c9b27a">…y ${lista.length - maxFilas} más (están todos en Reportes → Alertas)</td></tr>` : '';
  return `
      <div style="font-family:'Jost',Arial,sans-serif;font-size:15px;font-weight:700;color:#fff;margin:22px 0 8px">⏳ Formularios sin respuestas hace más de ${dias} días (${lista.length})</div>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;background:#2b2412;border:1px solid #5c4a1c;border-radius:12px;border-collapse:separate;margin:0 0 8px">
        ${filas}${resto}
      </table>
      <p style="margin:0 0 6px;font-size:12px;color:#96aac4">Son formularios publicados que no recibieron ninguna respuesta en ese tiempo: conviene revisar si siguen vigentes, si el enlace se compartió, o archivarlos.</p>`;
}
