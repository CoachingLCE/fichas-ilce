// Utilidades LIVIANAS del WhatsApp (sin la librería de teléfonos): sirven al panel y a los mails. Ver lib/whatsapp.js para validar y normalizar.

/** El WhatsApp guardado en formato internacional completo (E.164: "+5491155551234"): lo único que se puede abrir en WhatsApp con seguridad. */
export function esE164(valor) {
  return /^\+[1-9]\d{7,14}$/.test(String(valor == null ? '' : valor).trim());
}

/** Enlace que abre el chat de WhatsApp (https://wa.me/<número>), o null si el valor no es un número internacional completo (por ejemplo, las inscripciones viejas, cargadas a mano). */
export function enlaceWhatsapp(valor) {
  const v = String(valor == null ? '' : valor).trim();
  return esE164(v) ? `https://wa.me/${v.slice(1)}` : null;
}

// País de residencia de la ficha (lib/constants.js PAISES) -> código ISO del país del número. "Otro" no tiene país: ahí el desplegable queda VACÍO y la persona tiene que elegir
// (si quedara Argentina por defecto, alguien de otro país escribiría su número y se guardaría como argentino). El orden es el de PAISES: son los que van primero en la lista.
export const PAIS_POR_NOMBRE = {
  Argentina: 'AR', Bolivia: 'BO', Brasil: 'BR', Chile: 'CL', Colombia: 'CO', 'Costa Rica': 'CR', Cuba: 'CU', Ecuador: 'EC',
  'El Salvador': 'SV', 'España': 'ES', Guatemala: 'GT', Honduras: 'HN', 'México': 'MX', Nicaragua: 'NI', 'Panamá': 'PA',
  Paraguay: 'PY', 'Perú': 'PE', 'Puerto Rico': 'PR', Uruguay: 'UY', Venezuela: 'VE', 'República Dominicana': 'DO'
};
export function isoDeResidencia(nombre) { return PAIS_POR_NOMBRE[nombre] || null; }
