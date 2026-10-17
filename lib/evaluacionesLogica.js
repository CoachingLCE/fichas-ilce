// Lógica PURA de las "Evaluaciones finales" (sin imports: se puede probar sola y la usan tanto el servidor como el navegador).
//
// Una evaluación final es un examen con reglas propias: cronómetro (tiempo límite), cantidad de intentos, días de espera entre un
// intento y el siguiente, nota mínima para aprobar y orden aleatorio. Vive aparte de las Actividades (que no tienen nada de esto):
// su definición está en la pestaña "Evaluaciones" y cada intento en "IntentosEvaluaciones".

export const DIA_MS = 24 * 60 * 60 * 1000;
// Margen de tolerancia para el ENVÍO (red lenta, reloj del navegador): pasado el tiempo + este margen, el intento ya no se corrige.
export const GRACIA_ENVIO_SEG = 120;
// Sin tiempo límite no hay un "vencimiento" natural: un intento iniciado y nunca enviado se da por abandonado pasadas estas horas.
export const HORAS_ABANDONO_SIN_LIMITE = 6;

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const entero = (v, def, min, max) => {
  const n = Math.floor(Number(v));
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
};
const decimal = (v, def, min, max) => {
  const n = Number(String(v).replace(',', '.'));
  if (!Number.isFinite(n)) return def;
  return Math.min(max, Math.max(min, n));
};

// ---------- Definición ----------

export function normPreguntaEval(p) {
  const opciones = Array.isArray(p?.opciones) ? p.opciones.map((o) => String(o ?? '')) : [];
  const correcta = Math.floor(Number(p?.correcta));
  return {
    situacion: String(p?.situacion || ''),
    pregunta: String(p?.pregunta || ''),
    opciones: opciones.length ? opciones : ['', '', ''],
    correcta: Number.isFinite(correcta) && correcta >= 0 ? correcta : 0,
    justificacion: String(p?.justificacion || '')
  };
}

/** Lista de mails desde un texto (separado por coma, punto y coma o salto de línea) o un array. Sin repetidos, en minúscula. */
export function parseMails(v) {
  const lista = Array.isArray(v) ? v : String(v || '').split(/[\s,;]+/);
  const out = [];
  lista.forEach((m) => {
    const x = String(m || '').trim().toLowerCase();
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x) && !out.includes(x)) out.push(x);
  });
  return out;
}

/** Lee la columna "Definición JSON". Cualquier campo que falte cae en un valor por defecto seguro. */
export function parseEvalDef(raw) {
  let d;
  try { d = JSON.parse(raw || '{}'); } catch { d = {}; }
  if (!d || typeof d !== 'object' || Array.isArray(d)) d = {};
  return {
    intro: String(d.intro || ''),
    edicion: String(d.edicion || ''),
    fechaDisponible: String(d.fechaDisponible || ''),
    horaDisponible: String(d.horaDisponible || ''),
    fechaCierre: String(d.fechaCierre || ''),
    tiempoMin: entero(d.tiempoMin, 0, 0, 600),            // 0 = sin límite de tiempo
    intentos: entero(d.intentos, 1, 1, 20),               // intentos incluidos (sin habilitación manual)
    esperaDias: entero(d.esperaDias, 0, 0, 365),          // días a esperar entre un intento y el siguiente
    puntosPorPregunta: decimal(d.puntosPorPregunta, 1, 0.01, 100),
    puntajeAprobacion: decimal(d.puntajeAprobacion, 0, 0, 100000), // 0 = no cargado → 60% del total
    ordenAleatorio: d.ordenAleatorio !== false,
    revelarSiReintenta: d.revelarSiReintenta === true,   // false: quien no aprobó y todavía puede reintentar NO ve las respuestas correctas (se ven al aprobar o al agotar los intentos)
    mostrarRevision: d.mostrarRevision !== false,         // al terminar: respuesta correcta + justificación de cada pregunta
    mailsStaff: parseMails(d.mailsStaff),
    linkDiploma: String(d.linkDiploma || ''),
    contacto: String(d.contacto || ''),
    preguntas: Array.isArray(d.preguntas) ? d.preguntas.map(normPreguntaEval) : []
  };
}

export function totalPuntos(def) {
  return r2((def.preguntas || []).length * (def.puntosPorPregunta || 0));
}
export function puntajeMinimo(def) {
  const total = totalPuntos(def);
  return def.puntajeAprobacion > 0 ? r2(def.puntajeAprobacion) : r2(total * 0.6);
}

/** Corrige. respuestas = { [indiceOriginalDeLaPregunta]: indiceDeLaOpcionElegida }. */
export function corregirEval(def, respuestas) {
  const resp = respuestas && typeof respuestas === 'object' ? respuestas : {};
  let aciertos = 0;
  const detalle = (def.preguntas || []).map((p, i) => {
    const raw = resp[i];
    const elegido = raw == null || raw === '' ? null : Math.floor(Number(raw));
    const ok = elegido !== null && Number.isFinite(elegido) && elegido === p.correcta;
    if (ok) aciertos++;
    return { i, elegido: Number.isFinite(elegido) ? elegido : null, correcta: p.correcta, ok };
  });
  const puntaje = r2(aciertos * def.puntosPorPregunta);
  const total = totalPuntos(def);
  return { puntaje, total, aciertos, aprobado: puntaje >= puntajeMinimo(def) && total > 0, detalle };
}

/** Mensaje de error (texto) o null si la definición se puede guardar. */
export function validarDefEval(b) {
  if (!b || typeof b !== 'object') return 'Datos inválidos';
  if (!String(b.titulo || '').trim()) return 'Falta el título de la evaluación';
  if (!String(b.curso || '').trim()) return 'Elegí el curso';
  const n = Array.isArray(b.preguntas) ? b.preguntas.length : 0;
  if (n === 0) return 'Agregá al menos una pregunta';
  for (let i = 0; i < n; i++) {
    const p = b.preguntas[i] || {};
    if (!String(p.pregunta || '').trim()) return `La pregunta ${i + 1} no tiene texto`;
    const ops = Array.isArray(p.opciones) ? p.opciones : [];
    const llenas = ops.filter((o) => String(o || '').trim()).length;
    if (llenas < 2) return `La pregunta ${i + 1} necesita al menos 2 opciones`;
    const c = Math.floor(Number(p.correcta));
    if (!Number.isFinite(c) || c < 0 || c >= ops.length || !String(ops[c] || '').trim()) return `Marcá la respuesta correcta de la pregunta ${i + 1}`;
  }
  if (b.fechaDisponible && b.fechaCierre && b.fechaCierre < b.fechaDisponible) return 'La fecha de cierre no puede ser anterior a la de disponibilidad';
  const pp = decimal(b.puntosPorPregunta, NaN, 0, 100);
  if (!(pp > 0)) return 'Los puntos por pregunta tienen que ser mayores a 0';
  const total = r2(n * pp);
  const min = decimal(b.puntajeAprobacion, NaN, 0, 100000);
  if (!Number.isFinite(min)) return 'Cargá el puntaje mínimo para aprobar';
  if (min > total) return `El puntaje mínimo (${min}) no puede ser mayor al total de la evaluación (${total})`;
  if (b.mailsStaff && String(Array.isArray(b.mailsStaff) ? b.mailsStaff.join(' ') : b.mailsStaff).trim() && parseMails(b.mailsStaff).length === 0) return 'Los mails del equipo no son válidos';
  if (b.linkDiploma && !/^https?:\/\//i.test(String(b.linkDiploma).trim())) return 'El link del diploma tiene que empezar con http:// o https://';
  return null;
}

// ---------- Intentos ----------

/** Cuándo vence un intento "en curso" (después de eso se da por abandonado y gasta el intento). */
export function vencimientoEnCursoMs(def, inicioMs) {
  if (def.tiempoMin > 0) return inicioMs + def.tiempoMin * 60 * 1000 + GRACIA_ENVIO_SEG * 1000;
  return inicioMs + HORAS_ABANDONO_SIN_LIMITE * 60 * 60 * 1000;
}

/**
 * Estado real de un intento guardado: 'aprobado' | 'no_aprobado' | 'en_curso' | 'sin_enviar'.
 * fila = { estado: 'En curso' | 'Finalizado', inicioMs, finMs, aprobado }
 */
export function estadoIntento(fila, def, ahoraMs) {
  if (fila.estado === 'Finalizado') return fila.aprobado ? 'aprobado' : 'no_aprobado';
  return ahoraMs < vencimientoEnCursoMs(def, fila.inicioMs) ? 'en_curso' : 'sin_enviar';
}

/**
 * ¿Puede esta persona rendir ahora? Es la única regla de intentos del sistema (la usan el chequeo previo y el envío).
 *  - Si ya aprobó en algún intento: no rinde de nuevo.
 *  - Si tiene un intento en curso dentro del tiempo: lo retoma (no gasta otro).
 *  - Cuenta como usado todo intento finalizado, y también los iniciados y abandonados ("sin enviar").
 *  - Máximo = intentos de la evaluación + los que un administrador le habilitó a mano.
 *  - La espera entre intentos aplica solo dentro de los intentos incluidos; un intento extra habilitado a mano se puede rendir enseguida.
 * intentos = filas ya convertidas a { id, estado, inicioMs, finMs, aprobado }.
 */
export function calcularElegibilidad({ def, intentos, extra = 0, ahoraMs }) {
  const lista = (intentos || []).map((f) => ({ ...f, real: estadoIntento(f, def, ahoraMs) })).sort((a, b) => a.inicioMs - b.inicioMs);
  const maxIntentos = def.intentos + Math.max(0, Math.floor(Number(extra) || 0));
  if (lista.some((f) => f.real === 'aprobado')) return { permitido: false, motivo: 'aprobado_previo', usados: lista.length, maxIntentos };
  const activo = lista.find((f) => f.real === 'en_curso');
  if (activo) {
    return { permitido: true, motivo: 'en_curso', reanudar: true, intentoId: activo.id, inicioMs: activo.inicioMs, intento: lista.indexOf(activo) + 1, usados: lista.length - 1, maxIntentos };
  }
  const usados = lista.length;
  if (usados >= maxIntentos) return { permitido: false, motivo: 'sin_intentos', usados, maxIntentos };
  if (usados >= 1 && usados < def.intentos && def.esperaDias > 0) {
    const ultimo = lista[lista.length - 1];
    const terminoMs = ultimo.real === 'sin_enviar' ? vencimientoEnCursoMs(def, ultimo.inicioMs) : (ultimo.finMs || ultimo.inicioMs);
    const disponibleDesdeMs = terminoMs + def.esperaDias * DIA_MS;
    if (ahoraMs < disponibleDesdeMs) {
      return { permitido: false, motivo: 'esperar_dias', diasRestantes: Math.max(1, Math.ceil((disponibleDesdeMs - ahoraMs) / DIA_MS)), disponibleDesdeMs, usados, maxIntentos };
    }
  }
  return { permitido: true, motivo: 'ok', intento: usados + 1, usados, maxIntentos };
}

/** Texto corto de las reglas, para el resumen del constructor y la pantalla de inicio. */
export function textoReglas(def) {
  const partes = [];
  partes.push(def.tiempoMin > 0 ? `${def.tiempoMin} min` : 'sin límite de tiempo');
  partes.push(`${def.intentos} intento${def.intentos === 1 ? '' : 's'}`);
  if (def.intentos > 1) partes.push(def.esperaDias > 0 ? `${def.esperaDias} día${def.esperaDias === 1 ? '' : 's'} de espera entre intentos` : 'sin espera entre intentos');
  return partes.join(' · ');
}

export function formatoPuntos(n) {
  const x = r2(n);
  return String(x).replace('.', ',');
}

export function formatoDuracion(seg) {
  const s = Math.max(0, Math.round(Number(seg) || 0));
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} seg`;
}

// ---------- Disponibilidad ----------

/**
 * Estado que ve la persona: 'Borrador' | 'Programada' | 'Cerrada' | 'Publicada' (o el estado guardado, p. ej. 'Archivada').
 * Las fechas y la hora se interpretan en horario de Argentina (UTC-3): la evaluación abre a la hora cargada y cierra al terminar el día de cierre.
 */
export function estadoEfectivoEval(ev, ahoraMs) {
  const estado = ev.estado || 'Borrador';
  if (estado !== 'Publicada') return estado;
  if (ev.fechaDisponible) {
    const abre = Date.parse(`${ev.fechaDisponible}T${ev.horaDisponible || '00:00'}:00-03:00`);
    if (Number.isFinite(abre) && ahoraMs < abre) return 'Programada';
  }
  if (ev.fechaCierre) {
    const cierra = Date.parse(`${ev.fechaCierre}T23:59:59-03:00`);
    if (Number.isFinite(cierra) && ahoraMs > cierra) return 'Cerrada';
  }
  return 'Publicada';
}

// ---------- Orden de las preguntas ----------

function semilla(texto) {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) { h ^= texto.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function mulberry32(a) {
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** Orden de las preguntas para un intento: mezclado de forma estable (el mismo intento siempre da el mismo orden, así recargar la página no lo cambia). */
export function ordenParaIntento(intentoId, cantidad, aleatorio) {
  const orden = Array.from({ length: cantidad }, (_, i) => i);
  if (!aleatorio) return orden;
  const rnd = mulberry32(semilla(String(intentoId)));
  for (let i = orden.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [orden[i], orden[j]] = [orden[j], orden[i]]; }
  return orden;
}
