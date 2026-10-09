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

// Nombre/Apellido: no puede estar vacío, no puede ser solo números (o tener números mezclados
// — "Juan123"), y tiene que tener al menos una letra real.
export function validarNombre(v) {
  const s = (v || '').toString().trim();
  if (!s) return false;
  return /[a-zA-ZÀ-ÿ]/.test(s) && !/[0-9]/.test(s);
}

// Para WhatsApp/teléfono escritos a mano: deja pasar dígitos y el formato típico
// ("+54 9 11 5555 1234" — signo +, espacios, guiones, paréntesis) pero bloquea letras.
export function filtrarTelefono(v) {
  return (v || '').toString().replace(/[^\d+()\-\s]/g, '');
}

// ---- Formularios dinámicos (Constructor de Formularios) ----
// Los campos de un Formulario todavía no tienen un "tipo" explícito para número/teléfono/
// nombre (se arman escribiendo el "Campos JSON" a mano en la Sheet) — así que el tipo se
// infiere del label/key. Si en algún momento se agrega un tipo explícito, esta función lo
// respeta y no reinterpreta nada (solo infiere cuando el tipo es el genérico "texto").
function normTxt(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

export function inferirTipoCampo(c) {
  if (!c) return null;
  if (c.tipo && c.tipo !== 'texto') return null; // email/select/textarea/escala se manejan aparte
  const t = normTxt((c.label || '') + ' ' + (c.key || ''));
  if (/whatsapp|telefono|celular/.test(t)) return 'telefono';
  if (/numero|edicion|dni|documento|cuit/.test(t)) return 'numero';
  if (/nombre|apellido/.test(t)) return 'nombre';
  return null;
}

// Opción múltiple (varias casillas): la respuesta se guarda como un solo texto con las opciones marcadas separadas por ", "
// y en el orden de la lista (igual que en Google Forms). Como una opción puede llevar coma ("Sí, en mis redes"), se separa
// buscando combinaciones exactas de opciones, no cortando por comas. Devuelve la lista de opciones marcadas, o null si el
// texto no se puede armar con las opciones de la pregunta.
export function partirMultiple(valor, opciones) {
  const v = (valor == null ? '' : String(valor)).trim();
  if (!v) return [];
  const ops = Array.isArray(opciones) ? opciones : [];
  const rec = (pos) => {
    if (pos >= v.length) return [];
    for (const o of ops) {
      if (!v.startsWith(o, pos)) continue;
      const fin = pos + o.length;
      if (fin === v.length) return [o];
      if (v.startsWith(', ', fin)) { const resto = rec(fin + 2); if (resto) return [o, ...resto]; }
    }
    return null;
  };
  return rec(0);
}

// Solo valida la FORMA del dato (no si es obligatorio, eso se controla aparte). Devuelve un
// mensaje de error o null si está bien.
export function validarValorCampo(c, valor) {
  const v = (valor == null ? '' : String(valor)).trim();
  if (!v) return null;
  if (c && c.tipo === 'grilla') {
    // Solo combinaciones fila + columna que existen en la grilla (el servidor no confía en lo que manda el navegador).
    const validas = new Set((c.filas || []).flatMap((f) => (c.columnas || []).map((co) => `${f} ${co}`)));
    if (v.split(', ').some((x) => !validas.has(x))) return `${c.label}: hay una opción que no existe.`;
    return null;
  }
  if (c && c.tipo === 'multiple') {
    const marc = partirMultiple(v, c.opciones);
    if (marc === null || new Set(marc).size !== marc.length) return `${c.label}: hay una opción que no existe.`;
    return null;
  }
  const tipo = inferirTipoCampo(c);
  if (tipo === 'numero' && !/^\d+$/.test(v)) return `${c.label} solo puede tener números.`;
  if (tipo === 'telefono' && soloDigitos(v).length < 6) return `${c.label} no parece un número de teléfono.`;
  if (tipo === 'nombre' && !validarNombre(v)) return `${c.label} no puede tener números.`;
  return null;
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
  else if (!validarNombre(form.nom)) e.nom = 'El nombre no puede tener números.';
  if (!(form.ape || '').trim()) e.ape = 'Completá tu apellido.';
  else if (!validarNombre(form.ape)) e.ape = 'El apellido no puede tener números.';
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
