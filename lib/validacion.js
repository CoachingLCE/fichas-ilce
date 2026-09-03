// Validadores compartidos entre cliente y servidor. El servidor SIEMPRE revalida
// (nunca se confía en lo que llega del navegador).

export function esArgentina(pais) {
  return (pais || 'Argentina') === 'Argentina';
}

export function validarEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim());
}

export function soloDigitos(v) {
  return (v || '').toString().replace(/\D/g, '');
}

export function validarWhatsapp(v) {
  return soloDigitos(v).length >= 8;
}

// AR: DNI (7-8 díg.) o CUIT (11 díg.). Otros países: documento de al menos 4 caracteres.
export function validarDoc(v, pais) {
  const d = soloDigitos(v);
  if (esArgentina(pais)) return (d.length >= 7 && d.length <= 8) || d.length === 11;
  return (v || '').trim().length >= 4;
}

// Devuelve un objeto { campo: mensaje } con los errores. Vacío = todo OK.
export function validarFicha(form) {
  const e = {};
  if (!validarEmail(form.email)) e.email = 'Ingresá un correo válido.';
  if (!form.edicion) e.edicion = 'Elegí una edición.';
  if (!(form.nom || '').trim()) e.nom = 'Completá tu nombre.';
  if (!(form.ape || '').trim()) e.ape = 'Completá tu apellido.';
  if (!(form.prov || '').trim()) e.prov = 'Completá este dato.';
  if (!validarDoc(form.doc, form.pais)) e.doc = 'Documento inválido.';
  if (!(form.loc || '').trim()) e.loc = 'Completá tu localidad.';
  if (!validarWhatsapp(form.wa)) e.wa = 'WhatsApp inválido (al menos 8 dígitos).';
  if (!form.modalidad) e.modalidad = 'Elegí una modalidad.';
  if (!form.origen) e.origen = 'Elegí una opción.';
  if (!form.medio) e.medio = 'Elegí una opción.';
  if (!(form.sobre || '').trim()) e.sobre = 'Contanos algo, aunque sea breve.';
  if (!form.cons) e.cons = 'Necesitamos tu consentimiento.';
  return e;
}
