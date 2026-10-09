// Lógica PURA del constructor de formularios (sin imports a propósito: la usan el componente de cliente y la API).
//
// Pedido de Diego: un formulario puede NO estar relacionado con ningún curso o programa. Hay tres modos:
//   - 'ninguno' → sin curso (las respuestas quedan "Sin curso"). Es el valor por defecto.
//   - 'fijo'    → un curso fijo: todas las respuestas quedan asociadas a ese curso sin preguntarlo (cursoFijo).
//   - 'elige'   → quien responde elige el curso: se agrega una pregunta "Curso" (key 'curso', lista de cursos).
// El correo SIEMPRE se pide (lo dibuja el formulario público): no es una pregunta más y no se puede quitar.

export const TIPOS_UI = [['texto', 'Texto corto'], ['parrafo', 'Párrafo'], ['lista', 'Lista de opciones'], ['escala', 'Escala del 1 al 5'], ['grilla', 'Casillas por fila y columna']];
const TIPO_JSON = { texto: 'texto', parrafo: 'textarea', lista: 'select', escala: 'escala', grilla: 'grilla' };
const TIPOS_VALIDOS_JSON = ['texto', 'textarea', 'select', 'escala', 'email', 'grilla'];
// Keys con significado propio para el servidor (se guardan en columnas): no se pueden reutilizar en otra pregunta.
export const KEYS_RESERVADAS = ['email', 'nombre', 'edicion', 'curso'];
export const LIMITES = { titulo: 120, intro: 1200, etiqueta: 40, pregunta: 200, opcion: 120, opciones: 60, filas: 14, columnas: 12, preguntas: 60, ayuda: 300, slug: 60 };

export function slugify(t) {
  return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, LIMITES.slug);
}

/** Clave estable de una pregunta nueva, única dentro del formulario. NUNCA se regenera en una pregunta que ya existe
 *  (cambiarla rompería la lectura de las respuestas ya guardadas con esa clave). */
export function claveDe(label, usadas) {
  let base = String(label || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30);
  if (!base) base = 'pregunta';
  if (/^[0-9]/.test(base)) base = 'p_' + base;
  if (KEYS_RESERVADAS.includes(base)) base = base + '_2';
  const set = new Set(usadas || []);
  let k = base, n = 2;
  while (set.has(k) || KEYS_RESERVADAS.includes(k)) { k = `${base}_${n++}`; }
  return k;
}

export function tipoUiDe(campo) {
  const t = campo && campo.tipo;
  if (t === 'textarea') return 'parrafo';
  if (t === 'select') return 'lista';
  if (t === 'escala') return 'escala';
  if (t === 'grilla') return 'grilla';
  return 'texto';
}

let _id = 0;
const nuevoId = () => ++_id;

/** Estado inicial de un formulario NUEVO: sin curso, y con la pregunta "Nombre y apellido" como punto de partida. */
export function estadoNuevo() {
  return {
    editando: false, slug: '', slugEditado: false, titulo: '', intro: '', tipo: '', estado: 'Borrador',
    modo: 'ninguno', cursoFijo: '', cursoReq: true, cursoCampoOrig: null,
    preguntas: [{ id: nuevoId(), key: 'nombre', label: 'Nombre y apellido', tipoUi: 'texto', tipoCambiado: false, orig: null, req: true, ops: '', filas: '', cols: '' }]
  };
}

// ---- Actividades especiales (v1.41.0): Laboratorio, Masterclass, Caja de ideas, u otra --------------------------------
// Son formularios comunes con la etiqueta (Tipo) ya cargada y una plantilla de preguntas; no dependen de las cursadas.
export const MARCA_COMPLETAR = '[Completar';
export const ACTIVIDADES_ESPECIALES = [
  { key: 'Laboratorio', desc: 'Inscripción a un laboratorio.', inscripcion: true },
  { key: 'Masterclass', desc: 'Inscripción a una masterclass.', inscripcion: true },
  { key: 'Caja de ideas', desc: 'Recibir ideas y sugerencias.', inscripcion: false },
  { key: 'Otra actividad', desc: 'Escribís vos el nombre del tipo (ej: Taller, Charla abierta).', inscripcion: true }
];
const preguntaBase = (key, label, tipoUi, req, extra = {}) => ({ id: nuevoId(), key, label, tipoUi, tipoCambiado: false, orig: null, req, ops: '', filas: '', cols: '', ...extra });

/** Formulario nuevo de una actividad especial. `tipo` es la etiqueta (Laboratorio, Masterclass…), `nombre` el título y
 *  `modo`/`cursoFijo` cómo se maneja el curso (por defecto: lo elige quien se inscribe; en Caja de ideas, sin curso). */
export function estadoActividadEspecial({ tipo, nombre = '', modo, cursoFijo = '' }) {
  const def = ACTIVIDADES_ESPECIALES.find((a) => a.key === tipo);
  const inscripcion = def ? def.inscripcion : true;
  const base = estadoNuevo();
  const t = String(tipo || 'Actividad').trim();
  base.tipo = t.slice(0, LIMITES.etiqueta);
  base.titulo = String(nombre || '').trim();
  base.estado = 'Borrador';
  base.modo = modo || (inscripcion ? 'elige' : 'ninguno');
  base.cursoFijo = base.modo === 'fijo' ? cursoFijo : '';
  base.cursoReq = false;
  if (inscripcion) {
    base.intro = `Completá tus datos para inscribirte. ${MARCA_COMPLETAR}: fecha, horario y modalidad de la actividad antes de publicar.]`;
    base.preguntas = [
      preguntaBase('nombre', 'Nombre y apellido', 'texto', true),
      preguntaBase('telefono', 'Teléfono / WhatsApp', 'texto', true),
      preguntaBase('modalidad', 'Modalidad en la que vas a participar', 'lista', true, { ops: 'Presencial\nOnline' }),
      preguntaBase('comentarios', 'Comentarios (opcional)', 'parrafo', false)
    ];
  } else {
    base.intro = 'Contanos tu idea o sugerencia. Nos sirve todo lo que se te ocurra.';
    base.preguntas = [
      preguntaBase('nombre', 'Nombre y apellido (opcional)', 'texto', false),
      preguntaBase('idea', 'Tu idea o sugerencia', 'parrafo', true),
      preguntaBase('area', '¿Sobre qué tema o área es?', 'texto', false)
    ];
  }
  return base;
}

/** Pasa un formulario ya guardado (como lo devuelve GET /api/formularios) al estado del editor, sin perder nada. */
export function aEstado(def) {
  const campos = Array.isArray(def.campos) ? def.campos : [];
  const campoCurso = campos.find((c) => c && c.key === 'curso') || null;
  const modo = def.cursoFijo ? 'fijo' : (campoCurso ? 'elige' : 'ninguno');
  return {
    editando: true, slug: def.slug, slugEditado: true, titulo: def.titulo || '', intro: def.intro || '', tipo: def.tipo || '',
    estado: def.estado || 'Publicada', modo, cursoFijo: def.cursoFijo || '',
    cursoReq: campoCurso ? !!campoCurso.required : true, cursoCampoOrig: campoCurso,
    preguntas: campos.filter((c) => c && !(modo === 'elige' && c.key === 'curso')).map((c) => ({
      id: nuevoId(), key: c.key, label: c.label || '', tipoUi: tipoUiDe(c), tipoCambiado: false, orig: c, req: !!c.required,
      ops: Array.isArray(c.opciones) ? c.opciones.join('\n') : '',
      filas: Array.isArray(c.filas) ? c.filas.join('\n') : '', cols: Array.isArray(c.columnas) ? c.columnas.join('\n') : ''
    }))
  };
}

const opcionesDe = (ops) => String(ops || '').split('\n').map((x) => x.trim()).filter(Boolean);
// Un formulario viejo puede tener una lista SIN opciones propias (el formulario público la completa con los cursos): hay que
// poder volver a guardarlo sin romperla ni obligar a inventarle opciones.
const listaConOpcionesPorDefecto = (q) => !!(q.orig && q.orig.tipo === 'select' && !q.tipoCambiado && !(q.orig.opciones || []).length);

// Pregunta de casillas por fila y columna (ej.: días y horarios). La respuesta se guarda como texto: "Lunes 10 a 11, Martes 19 a 20".
// Por eso las filas y columnas no pueden tener comas, ni repetirse, ni formar el mismo texto al combinarse.
export function errorGrilla(filas, cols) {
  if (!filas.length) return 'Escribí al menos una fila (una por línea).';
  if (!cols.length) return 'Escribí al menos una columna (una por línea).';
  if (filas.length > LIMITES.filas) return `Demasiadas filas (máximo ${LIMITES.filas}).`;
  if (cols.length > LIMITES.columnas) return `Demasiadas columnas (máximo ${LIMITES.columnas}).`;
  if ([...filas, ...cols].some((x) => x.includes(','))) return 'Las filas y columnas no pueden tener comas.';
  if (new Set(filas).size !== filas.length || new Set(cols).size !== cols.length) return 'Hay filas o columnas repetidas.';
  const items = filas.flatMap((f) => cols.map((c) => `${f} ${c}`));
  if (new Set(items).size !== items.length) return 'Esas filas y columnas se confunden al combinarse: cambiá los nombres.';
  return '';
}

/** Errores por campo para mostrar en rojo. `slugsExistentes`: slugs ya usados (solo se mira al crear). */
export function validar(est, { slugsExistentes = [], cursosValidos = null } = {}) {
  const e = {};
  if (!est.titulo.trim()) e.titulo = 'Falta el título del formulario.';
  else if (est.titulo.trim().length > LIMITES.titulo) e.titulo = `El título es muy largo (máximo ${LIMITES.titulo} caracteres).`;
  const slug = est.slugEditado ? est.slug : slugify(est.titulo);
  if (!slug) e.slug = 'Falta el enlace (se arma con el título).';
  else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) e.slug = 'El enlace solo puede tener letras minúsculas, números y guiones.';
  else if (!est.editando && slugsExistentes.map((s) => String(s).toLowerCase()).includes(slug)) e.slug = 'Ya existe un formulario con ese enlace: cambiale el título o el enlace.';
  if (est.estado === 'Publicada' && String(est.intro || '').includes(MARCA_COMPLETAR)) e.intro = 'La introducción todavía tiene el texto "[Completar…]": escribí la fecha, el horario y la modalidad antes de publicar (o dejalo en Borrador).';
  if (est.modo === 'fijo') {
    if (!est.cursoFijo) e.curso = 'Elegí el curso, o cambiá a "Sin curso ni programa".';
    else if (cursosValidos && !cursosValidos.includes(est.cursoFijo)) e.curso = 'Ese curso no existe en la lista.';
  }
  if (est.preguntas.length > LIMITES.preguntas) e.preguntas = `Demasiadas preguntas (máximo ${LIMITES.preguntas}).`;
  est.preguntas.forEach((q) => {
    if (!q.label.trim()) e['q' + q.id] = 'Escribí la pregunta.';
    else if (q.label.trim().length > LIMITES.pregunta) e['q' + q.id] = `La pregunta es muy larga (máximo ${LIMITES.pregunta} caracteres).`;
    else if (q.tipoUi === 'lista' && !listaConOpcionesPorDefecto(q) && opcionesDe(q.ops).length < 2) e['q' + q.id] = 'Una lista necesita al menos 2 opciones (una por línea).';
    else if (q.tipoUi === 'grilla') { const m = errorGrilla(opcionesDe(q.filas), opcionesDe(q.cols)); if (m) e['q' + q.id] = m; }
  });
  return e;
}

/** Arma lo que se manda a la API y se guarda. Conserva todo lo que el formulario ya tenía (ayudas, placeholders, tipos que
 *  este editor no maneja) salvo lo que la persona cambió a propósito. */
export function aPayload(est) {
  const usadas = est.preguntas.map((q) => q.key).filter(Boolean);
  const campos = est.preguntas.map((q) => {
    const base = { ...(q.orig || {}) };
    base.key = q.key || claveDe(q.label, usadas.concat(est.preguntas.map((x) => x.key).filter(Boolean)));
    q.key = base.key;
    base.label = q.label.trim();
    base.required = !!q.req;
    if (q.tipoCambiado || !q.orig) base.tipo = TIPO_JSON[q.tipoUi] || 'texto';
    if ((base.tipo || 'texto') === 'select') { const ops = opcionesDe(q.ops); if (ops.length) base.opciones = ops; else delete base.opciones; } else delete base.opciones;
    if (base.tipo === 'grilla') { base.filas = opcionesDe(q.filas); base.columnas = opcionesDe(q.cols); } else { delete base.filas; delete base.columnas; }
    return base;
  });
  if (est.modo === 'elige') {
    const c = { ...(est.cursoCampoOrig || { key: 'curso', label: 'Curso', tipo: 'select' }) };
    c.key = 'curso'; c.required = !!est.cursoReq; if (!c.tipo) c.tipo = 'select';
    campos.unshift(c);
  }
  return {
    slug: est.slugEditado ? est.slug : slugify(est.titulo),
    titulo: est.titulo.trim(), tipo: est.tipo.trim(), estado: est.estado,
    cursoFijo: est.modo === 'fijo' ? est.cursoFijo : '', intro: est.intro.trim(), campos
  };
}

/** Cómo se guarda en la celda "Campos JSON": el formato viejo (lista) si no hay curso fijo ni introducción, y el nuevo
 *  ({cursoFijo, intro, campos}) si los hay. parseCampos (lib/formularios.js) lee los dos. */
export function serializarCampos({ campos, cursoFijo, intro }) {
  return (cursoFijo || intro) ? JSON.stringify({ cursoFijo: cursoFijo || '', intro: intro || '', campos }) : JSON.stringify(campos);
}

/** Lo que se le pasa al formulario público real para la vista previa. */
export function paraVistaPrevia(est) {
  const p = aPayload({ ...est, preguntas: est.preguntas.map((q) => ({ ...q })) });
  return {
    slug: p.slug || 'vista-previa', titulo: p.titulo || 'Título del formulario', cursoFijo: p.cursoFijo, intro: p.intro,
    campos: p.campos.map((c) => (c.label ? c : { ...c, label: '(pregunta sin escribir)' }))
  };
}

const sTxt = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/**
 * Validación y limpieza en el SERVIDOR (no se confía en lo que manda el navegador). Devuelve { ok:true, limpio } o
 * { ok:false, error }. Solo deja pasar las propiedades que el formulario público realmente lee.
 */
export function validarPayloadServidor(body, { cursosValidos = [] } = {}) {
  const b = body || {};
  const titulo = sTxt(b.titulo, LIMITES.titulo + 1);
  if (!titulo) return { ok: false, error: 'Falta el título' };
  if (titulo.length > LIMITES.titulo) return { ok: false, error: 'El título es muy largo' };
  const slug = sTxt(b.slug, LIMITES.slug + 1);
  if (!slug || slug.length > LIMITES.slug || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) return { ok: false, error: 'Enlace inválido (solo minúsculas, números y guiones)' };
  const estado = ['Borrador', 'Publicada', 'Archivada'].includes(b.estado) ? b.estado : 'Borrador';
  const cursoFijo = sTxt(b.cursoFijo, 80);
  if (cursoFijo && !cursosValidos.includes(cursoFijo)) return { ok: false, error: 'El curso no existe' };
  if (!Array.isArray(b.campos)) return { ok: false, error: 'Faltan las preguntas' };
  if (b.campos.length > LIMITES.preguntas + 1) return { ok: false, error: 'Demasiadas preguntas' };
  const keys = new Set(); const campos = [];
  for (const c of b.campos) {
    if (!c || typeof c !== 'object') return { ok: false, error: 'Pregunta inválida' };
    const key = sTxt(c.key, 41); const label = sTxt(c.label, LIMITES.pregunta + 1);
    if (!key || !/^[a-z0-9_]{1,40}$/.test(key)) return { ok: false, error: 'Clave de pregunta inválida' };
    if (keys.has(key)) return { ok: false, error: `Pregunta repetida (${key})` };
    if (!label) return { ok: false, error: 'Hay una pregunta sin escribir' };
    if (label.length > LIMITES.pregunta) return { ok: false, error: 'Hay una pregunta demasiado larga' };
    keys.add(key);
    const limpio = { key, label, required: !!c.required };
    if (c.tipo != null && c.tipo !== '') {
      if (!TIPOS_VALIDOS_JSON.includes(c.tipo)) return { ok: false, error: `Tipo de pregunta no permitido (${String(c.tipo).slice(0, 20)})` };
      limpio.tipo = c.tipo;
    }
    if (c.help) limpio.help = sTxt(c.help, LIMITES.ayuda);
    if (c.placeholder) limpio.placeholder = sTxt(c.placeholder, LIMITES.opcion);
    if (limpio.tipo === 'select' && Array.isArray(c.opciones) && c.opciones.length > 0) {
      // Sin opciones, el formulario público muestra la lista de cursos (así funciona el "Curso" y los formularios viejos).
      const ops = c.opciones.map((o) => sTxt(o, LIMITES.opcion)).filter(Boolean);
      if (ops.length < 2 || ops.length > LIMITES.opciones) return { ok: false, error: 'Una lista necesita entre 2 y 60 opciones' };
      limpio.opciones = ops;
    }
    if (limpio.tipo === 'grilla') {
      const lista = (v) => (Array.isArray(v) ? v.map((x) => sTxt(x, LIMITES.opcion)).filter(Boolean) : []);
      const filas = lista(c.filas); const columnas = lista(c.columnas);
      const m = errorGrilla(filas, columnas);
      if (m) return { ok: false, error: m };
      limpio.filas = filas; limpio.columnas = columnas;
    }
    campos.push(limpio);
  }
  return { ok: true, limpio: { slug, titulo, tipo: sTxt(b.tipo, LIMITES.etiqueta), estado, cursoFijo, intro: sTxt(b.intro, LIMITES.intro), campos } };
}
