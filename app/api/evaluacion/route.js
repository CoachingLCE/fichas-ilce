import { NextResponse } from 'next/server';
import { appendRow, updateRow } from '../../../lib/sheets';
import { TABS } from '../../../lib/constants';
import { getEvaluacion, elegibilidadDe, intentosDeEvaluacion, nuevoIdIntento, normEmail, normTitulo } from '../../../lib/evaluaciones';
import {
  estadoEfectivoEval, corregirEval, puntajeMinimo, ordenParaIntento, calcularElegibilidad, formatoPuntos, formatoDuracion,
  vencimientoEnCursoMs, GRACIA_ENVIO_SEG
} from '../../../lib/evaluacionesLogica';
import { validarEmail, validarNombre, soloDigitos } from '../../../lib/validacion';
import { enviarResultadoEvaluacion, enviarAvisoEvaluacionEquipo } from '../../../lib/mailer';
import { limitador, ipDe, MIN10 } from '../../../lib/limiteRitmo';
import { demasiadoGrande } from '../../../lib/entradaPublica';

export const dynamic = 'force-dynamic';

// Ruta PÚBLICA del examen. Tres acciones, todas por POST (el mail del estudiante no viaja en la URL):
//   verificar → ¿puede rendir ahora? (intentos, días de espera, ya aprobó…)
//   iniciar   → registra el intento "En curso" y arranca el reloj EN EL SERVIDOR; devuelve las preguntas SIN la respuesta correcta
//   enviar    → corrige en el servidor, guarda el resultado y manda los mails
// Seguridad: la respuesta correcta nunca viaja al navegador antes de enviar; el tiempo se mide con la hora del intento guardada, no con lo que diga el navegador.

const EMAIL_PRUEBA = 'diegolernerdl@gmail.com'; // modo prueba: no guarda nada ni manda mails, y puede rendir las veces que quiera

const err = (error, status = 400, extra = {}) => NextResponse.json({ ok: false, error, ...extra }, { status });

function fechaAR(ms) {
  return new Date(ms).toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', day: 'numeric', month: 'numeric', year: 'numeric' });
}

function preguntasPublicas(ev, orden) {
  return orden.map((i) => {
    const p = ev.preguntas[i];
    return { i, situacion: p.situacion, pregunta: p.pregunta, opciones: p.opciones };
  });
}

function resumenReglas(ev) {
  return {
    titulo: ev.titulo, curso: ev.curso, edicion: ev.edicion, intro: ev.intro,
    tiempoMin: ev.tiempoMin, intentos: ev.intentos, esperaDias: ev.esperaDias,
    cantidadPreguntas: ev.preguntas.length, puntosPorPregunta: ev.puntosPorPregunta,
    total: corregirEval(ev, {}).total, minimo: puntajeMinimo(ev),
    ordenAleatorio: ev.ordenAleatorio, mostrarRevision: ev.mostrarRevision, contacto: ev.contacto
  };
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return err('JSON inválido'); }
  if (demasiadoGrande(body)) return err('Las respuestas son demasiado grandes.', 413);
  const limite = limitador.intentar('eval:ip:' + ipDe(req), 60, MIN10);
  if (!limite.permitido) return err('Se hicieron demasiados pedidos desde tu conexión. Esperá unos minutos y volvé a intentar.', 429);

  const { accion, slug } = body || {};
  const email = normEmail(body.email);
  if (!slug || !validarEmail(email)) return err('Ingresá un mail válido.');
  const ev = await getEvaluacion(slug);
  if (!ev) return err('Evaluación no encontrada', 404);
  const ahora = Date.now();
  const esPrueba = email === EMAIL_PRUEBA;

  // ¿Está abierta? (no se aplica a "enviar": quien ya empezó puede terminar aunque la evaluación cierre mientras rinde)
  if (accion !== 'enviar') {
    const efectivo = estadoEfectivoEval(ev, ahora);
    if (efectivo !== 'Publicada') {
      const motivo = efectivo === 'Programada' ? 'programada' : efectivo === 'Cerrada' ? 'cerrada' : 'no_disponible';
      return NextResponse.json({ ok: true, permitido: false, motivo, fechaDisponible: ev.fechaDisponible, horaDisponible: ev.horaDisponible, fechaCierre: ev.fechaCierre, reglas: resumenReglas(ev) });
    }
  }

  if (accion === 'verificar') {
    if (esPrueba) return NextResponse.json({ ok: true, permitido: true, motivo: 'ok', intento: 1, maxIntentos: ev.intentos, reglas: resumenReglas(ev), prueba: true });
    const { res } = await elegibilidadDe(ev, email, ahora);
    return NextResponse.json({ ok: true, ...res, reglas: resumenReglas(ev) });
  }

  if (accion === 'iniciar') {
    const nombre = String(body.nombre || '').replace(/\s+/g, ' ').trim();
    const edicion = ev.edicion || String(body.edicion || '').trim();
    if (!nombre) return err('Ingresá tu nombre completo.');
    if (!validarNombre(nombre)) return err('El nombre no puede tener números.');
    if (nombre.length > 120) return err('El nombre es demasiado largo.');
    if (!edicion) return err('Ingresá tu número de edición.');
    if (soloDigitos(edicion) !== edicion) return err('El número de edición solo puede tener números.');

    if (esPrueba) {
      const orden = ordenParaIntento('PRUEBA' + ahora, ev.preguntas.length, ev.ordenAleatorio);
      return NextResponse.json({
        ok: true, intentoId: 'PRUEBA', intento: 1, maxIntentos: ev.intentos, inicioMs: ahora,
        segundosRestantes: ev.tiempoMin > 0 ? ev.tiempoMin * 60 : null, preguntas: preguntasPublicas(ev, orden), prueba: true
      });
    }

    const { res } = await elegibilidadDe(ev, email, ahora);
    if (!res.permitido) return NextResponse.json({ ok: true, ...res, reglas: resumenReglas(ev) });

    let intentoId, inicioMs, intento;
    if (res.reanudar) {
      // Recargó la página con un intento en curso: sigue el MISMO intento y el MISMO reloj (no se gasta otro).
      intentoId = res.intentoId; inicioMs = res.inicioMs; intento = res.intento;
    } else {
      intentoId = nuevoIdIntento(); inicioMs = ahora; intento = res.intento;
      try {
        await appendRow(TABS.INTENTOS_EVAL, [intentoId, new Date(inicioMs).toISOString(), '', ev.titulo, ev.curso, edicion, email, nombre, intento, 'En curso', '', '', '', '', '']);
      } catch { return err('No se pudo registrar el inicio del intento. Probá de nuevo en un momento.', 500); }
    }
    const orden = ordenParaIntento(intentoId, ev.preguntas.length, ev.ordenAleatorio);
    const segundosRestantes = ev.tiempoMin > 0 ? Math.max(0, Math.round((inicioMs + ev.tiempoMin * 60000 - ahora) / 1000)) : null;
    return NextResponse.json({
      ok: true, intentoId, intento, maxIntentos: res.maxIntentos, inicioMs, reanudado: !!res.reanudar,
      segundosRestantes, preguntas: preguntasPublicas(ev, orden)
    });
  }

  if (accion === 'enviar') {
    const respuestas = body.respuestas && typeof body.respuestas === 'object' && !Array.isArray(body.respuestas) ? body.respuestas : {};
    const intentoId = String(body.intentoId || '');
    if (!intentoId) return err('Falta el intento.');

    // Modo prueba: se corrige y se muestra, sin guardar nada.
    if (esPrueba && intentoId === 'PRUEBA') {
      const c = corregirEval(ev, respuestas);
      return NextResponse.json(armarRespuesta(ev, c, { intento: 1, maxIntentos: ev.intentos, duracionSeg: Number(body.duracion) || 0, proximo: { permitido: true, motivo: 'ok' }, prueba: true }));
    }

    const filas = await intentosDeEvaluacion(ev.titulo, { noCache: true });
    const f = filas.find((x) => x.ID === intentoId && normEmail(x.Email) === email);
    if (!f) return err('No encontramos ese intento. Volvé a ingresar con tu mail.', 404);
    if (f.Estado === 'Finalizado') return err('Este intento ya fue enviado.', 409, { yaEnviado: true });

    const inicioMs = Date.parse(f.Inicio) || ahora;
    const transcurridoSeg = Math.max(0, Math.round((ahora - inicioMs) / 1000));
    // Pasado el tiempo + el margen, ya no se corrige: el intento queda registrado como "fuera de tiempo" (0 puntos).
    const fueraDeTiempo = ev.tiempoMin > 0 && ahora > vencimientoEnCursoMs(ev, inicioMs);
    const c = fueraDeTiempo ? corregirEval(ev, {}) : corregirEval(ev, respuestas);
    const duracionSeg = ev.tiempoMin > 0 ? Math.min(transcurridoSeg, ev.tiempoMin * 60) : transcurridoSeg;
    const finISO = new Date(ahora).toISOString();
    const guardado = {};
    if (!fueraDeTiempo) ev.preguntas.forEach((_, i) => { if (respuestas[i] != null && respuestas[i] !== '') guardado[i] = Math.floor(Number(respuestas[i])); });
    if (fueraDeTiempo) guardado._fueraDeTiempo = 1;
    const fila = [
      f.ID, f.Inicio, finISO, ev.titulo, ev.curso, f['Edición'] || ev.edicion || '', email, f.Nombre || '', Number(f.Intento) || 1, 'Finalizado',
      c.puntaje, c.total, c.aprobado ? 'Aprobado' : (fueraDeTiempo ? 'No aprobado (fuera de tiempo)' : 'No aprobado'), duracionSeg, JSON.stringify(guardado)
    ];
    try { await updateRow(TABS.INTENTOS_EVAL, f._rowIndex, fila); } catch { return err('No se pudo guardar tu resultado. No cierres esta página y probá de nuevo.', 500); }

    // ¿Y ahora? (para decirle si puede volver a rendir y cuándo)
    let proximo = { permitido: false, motivo: 'sin_intentos' };
    try { proximo = (await elegibilidadDe(ev, email, Date.now())).res; } catch { /* no bloquea el resultado */ }

    const datosMail = {
      nombre: f.Nombre || '', curso: ev.curso, evaluacion: ev.titulo, edicion: f['Edición'] || ev.edicion || '', intento: Number(f.Intento) || 1, maxIntentos: proximo.maxIntentos || ev.intentos,
      puntaje: formatoPuntos(c.puntaje), total: formatoPuntos(c.total), minimo: formatoPuntos(puntajeMinimo(ev)), aprobado: c.aprobado,
      fecha: fechaAR(ahora), duracion: formatoDuracion(duracionSeg), linkDiploma: ev.linkDiploma, contacto: ev.contacto,
      proximo: { permitido: !!proximo.permitido, motivo: proximo.motivo, diasRestantes: proximo.diasRestantes }
    };
    let emailOk = true;
    try { await enviarResultadoEvaluacion({ ...datosMail, email }); } catch { emailOk = false; }
    for (const dest of ev.mailsStaff) {
      try { await enviarAvisoEvaluacionEquipo({ destinatario: dest, ...datosMail, estudiante: f.Nombre || '', estudianteEmail: email }); } catch { /* si falla uno, seguimos con los demás */ }
    }
    return NextResponse.json({ ...armarRespuesta(ev, c, { intento: Number(f.Intento) || 1, maxIntentos: proximo.maxIntentos || ev.intentos, duracionSeg, proximo, fueraDeTiempo, emailOk }) });
  }

  return err('Acción desconocida');
}

function armarRespuesta(ev, c, { intento, maxIntentos, duracionSeg, proximo, fueraDeTiempo = false, emailOk = true, prueba = false }) {
  // Con más intentos por delante, las respuestas correctas no se muestran (se podrían copiar al siguiente intento) salvo que la evaluación lo permita.
  const puedeVerRevision = prueba || c.aprobado || !proximo?.permitido || ev.revelarSiReintenta;
  return {
    ok: true, enviado: true, prueba,
    puntaje: c.puntaje, total: c.total, minimo: puntajeMinimo(ev), aprobado: c.aprobado, fueraDeTiempo,
    intento, maxIntentos, duracionSeg, emailOk,
    proximo: { permitido: !!proximo?.permitido, motivo: proximo?.motivo, diasRestantes: proximo?.diasRestantes },
    linkDiploma: c.aprobado ? ev.linkDiploma : '', contacto: ev.contacto,
    // La revisión (respuesta correcta + justificación) viaja SOLO ahora, después de enviar, y solo si la evaluación la tiene activada.
    revisionPendiente: ev.mostrarRevision && !fueraDeTiempo && !puedeVerRevision,
    revision: ev.mostrarRevision && !fueraDeTiempo && puedeVerRevision
      ? c.detalle.map((d) => ({ i: d.i, pregunta: ev.preguntas[d.i].pregunta, elegido: d.elegido, correcta: d.correcta, ok: d.ok, opciones: ev.preguntas[d.i].opciones, justificacion: ev.preguntas[d.i].justificacion }))
      : null
  };
}
