'use client';
import { useState, useRef, useEffect } from 'react';
import { validarEmail } from '../lib/validacion';

import { Isologo } from './Isologo';

// Las actividades se distinguen de los formularios por el color de acento: violeta/magenta (aprender) en vez de turquesa (completar).
const ESTILO_ACTIVIDAD = `.quizcard-act .quiz-band{background:linear-gradient(120deg,#1d0b3a 0%,#4a1a85 52%,#96198f 100%)}
.quizcard-act .quiz-count{color:rgb(var(--accentMagenta))}
.quizcard-act .quiz-opt:hover{border-color:rgb(var(--accentPurple))}
.quizcard-act .btn-teal{background:linear-gradient(90deg,rgb(var(--accentPurple)),rgb(var(--accentMagenta)));border-color:transparent;color:#fff}`;

// Íconos de redes en línea (trazo simple, sin reproducir el isotipo de marca de cada red)
// para el pie "AL FINALIZAR SIEMPRE" que pidió Diego.
function IconInstagram() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>);
}
function IconWhatsapp() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 20l1.3-3.9A8 8 0 1 1 8.3 19L4 20Z" /><path d="M8.5 9.3c.2-.5.5-.5.8-.5h.5c.2 0 .4 0 .6.5s.7 1.6.7 1.8-.1.3-.2.4l-.4.4c-.1.2-.3.3-.1.6.2.4.8 1.2 1.6 1.9.9.8 1.6 1.1 1.9 1.2.3.1.4.1.6-.1l.5-.6c.2-.2.4-.2.6-.1l1.5.7c.2.1.4.2.4.4 0 .6-.2 1.3-.6 1.6-.4.3-.9.6-1.6.6-1 0-2.5-.4-4.2-1.9-1.9-1.7-2.9-3.3-3.1-3.7-.2-.4-.9-1.4-.9-2.5 0-.6.2-1.1.4-1.4Z" fill="currentColor" stroke="none" /></svg>);
}
function IconYoutube() {
  return (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="M10.5 9.3v5.4l4.6-2.7-4.6-2.7Z" fill="currentColor" stroke="none" /></svg>);
}

// Enlaces del pie de las pantallas finales (pedido de Diego: dirección nueva del campus y del blog, en todas las pantallas finales).
const URL_CAMPUS = 'https://campus.institutoilce.com/';
const URL_BLOG = 'https://www.coachingeducativolider.com/blog';
const I_CAMPUS = '', I_BLOG = '', I_CHECK = '', I_X = '', I_RETRY = ''; // glifos de la fuente de íconos de la app

// Pie que se muestra en CUALQUIER pantalla final (actividad con feedback inmediato, actividad normal y "ya completada"): volver al campus, una
// invitación a leer una nota del blog y las redes de la comunidad.
function PieFinal() {
  return (
    <div className="quiz-postfoot">
      <a className="quiz-postlink" href={URL_CAMPUS} target="_blank" rel="noopener noreferrer">{I_CAMPUS} Volver al campus</a>
      <a className="quiz-postlink quiz-postlink-sec" href={URL_BLOG} target="_blank" rel="noopener noreferrer">{I_BLOG} Leer una nota en el blog</a>
      <div className="quiz-social">
        <a href="https://www.instagram.com/institutoilce/" target="_blank" rel="noopener noreferrer" title="Instagram" className="quiz-social-btn"><IconInstagram /></a>
        <a href="https://www.whatsapp.com/channel/0029VaBfdccGOj9tAv5s1A0G" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="quiz-social-btn"><IconWhatsapp /></a>
        <a href="https://www.youtube.com/channel/UCORUTxo5fMucj3gKqyyqoAQ" target="_blank" rel="noopener noreferrer" title="YouTube" className="quiz-social-btn"><IconYoutube /></a>
      </div>
    </div>
  );
}

// Ilustración propia (pulgar arriba) para la pantalla final de la práctica de repaso.
function PulgarArriba() {
  return (
    <svg width="84" height="84" viewBox="0 0 64 64" fill="none" aria-hidden="true" style={{ margin: '4px auto 0', display: 'block' }}>
      <circle cx="32" cy="32" r="30" fill="rgb(var(--accentPurple) / .14)" />
      <path d="M22 29v18h-5a2 2 0 0 1-2-2V31a2 2 0 0 1 2-2h5Z" stroke="rgb(var(--accentPurple))" strokeWidth="2.4" strokeLinejoin="round" />
      <path d="M22 29l6.5-12.2c.5-.9 1.5-1.4 2.5-1.1 1.9.5 3 2.5 2.4 4.4L32 26h12.3a3 3 0 0 1 2.9 3.7l-3 12.6A4 4 0 0 1 40.3 45H22" stroke="rgb(var(--accentPurple))" strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Estilos de la práctica de repaso (feedback inmediato). Usan los colores del tema; el verde y el rojo se reservan SOLO para correcto/incorrecto.
const ESTILO_PRACTICA = `.quizcard-pr{max-width:1100px;width:100%}
.pr-top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:0 0 14px}
.pr-cnt{font-size:15px;color:rgb(var(--textSec));white-space:nowrap}
.pr-n{color:rgb(var(--text));font-size:18px;text-decoration:underline;text-decoration-color:rgb(var(--accentMagenta));text-underline-offset:5px;text-decoration-thickness:2px}
.pr-seg{display:flex;gap:5px;flex:1;max-width:460px}
.pr-s{flex:1;height:7px;border-radius:99px;background:rgb(var(--border))}
.pr-s.on{background:linear-gradient(90deg,rgb(var(--accentPurple)),rgb(var(--accentMagenta)))}
.pr-bar{flex:1;height:7px;border-radius:99px;background:rgb(var(--border));overflow:hidden}
.pr-bar i{display:block;height:100%;background:linear-gradient(90deg,rgb(var(--accentPurple)),rgb(var(--accentMagenta)))}
.pr-card{background:rgb(var(--surface2));border:1px solid rgb(var(--border));border-radius:18px;box-shadow:0 6px 22px rgb(0 0 0 / .10);padding:20px 22px;margin:0 0 14px}
.pr-q{font-size:20px;line-height:1.35;margin:0;font-weight:600}
.pr-opt{display:flex;align-items:center;gap:18px;background:rgb(var(--surface2));border:2px solid rgb(var(--border));border-radius:18px;box-shadow:0 4px 16px rgb(0 0 0 / .07);padding:16px 20px;margin:0 0 12px;cursor:pointer;transition:border-color .12s,box-shadow .12s}
.pr-opt:hover{border-color:rgb(var(--accentPurple))}
.pr-opt:focus-visible{outline:2px solid rgb(var(--accentPurple));outline-offset:2px}
.pr-opt.sel{border-color:rgb(var(--accentPurple));box-shadow:0 0 0 3px rgb(var(--accentPurple) / .18)}
.pr-opt.lock{cursor:default}
.pr-opt.lock:hover{border-color:rgb(var(--border))}
.pr-opt.lock.sel:not(.ok):not(.bad){border-color:rgb(var(--accentPurple))}
.pr-opt.ok{border-color:rgb(74 222 128);box-shadow:0 0 0 3px rgb(74 222 128 / .2)}
.pr-opt.bad{border-color:rgb(248 113 113);box-shadow:0 0 0 3px rgb(248 113 113 / .18)}
.pr-num{font-size:34px;font-weight:600;line-height:1;color:rgb(var(--textMuted) / .55);min-width:30px;text-align:center}
.pr-txt{flex:1;font-size:16.5px;line-height:1.4}
.pr-radio{width:26px;height:26px;border-radius:99px;border:2px solid rgb(var(--border));display:flex;align-items:center;justify-content:center;flex:none;font-size:15px;color:#fff}
.pr-opt.sel .pr-radio{background:rgb(var(--accentPurple));border-color:rgb(var(--accentPurple))}
.pr-opt.ok .pr-radio{background:rgb(74 222 128);border-color:rgb(74 222 128)}
.pr-opt.bad .pr-radio{background:rgb(248 113 113);border-color:rgb(248 113 113)}
.pr-fb{display:flex;align-items:center;gap:10px;border-radius:14px;padding:14px 18px;margin:4px 0 6px;font-size:18px;font-weight:700}
.pr-fb.ok{color:rgb(34 197 94);background:rgb(74 222 128 / .12)}
.pr-fb.bad{color:rgb(239 68 68);background:rgb(248 113 113 / .12)}
.pr-fb small{font-weight:500;font-size:14px;color:rgb(var(--textSec))}
.pr-foot{display:flex;justify-content:flex-end;gap:10px;padding:6px 0 4px}
.pr-btn{border-radius:999px!important;padding:12px 28px!important;font-size:15px;font-weight:600;min-width:170px}
.pr-bien{font-size:30px;margin:6px 0 2px;font-weight:700}
.pr-hr{border:0;border-top:1px solid rgb(var(--border));margin:18px auto;max-width:420px}
.pr-nota{font-size:56px;font-weight:600;line-height:1.1;margin:2px 0 6px;color:rgb(var(--accentTeal));font-variant-numeric:tabular-nums}
.pr-link{background:none;border:0;color:rgb(var(--accentTeal));text-decoration:underline;font-size:14.5px;cursor:pointer;padding:6px}
.pr-det{text-align:left;max-width:760px;margin:18px auto 0;border:1px solid rgb(var(--border));border-radius:14px;padding:6px 16px}
.pr-det>summary{cursor:pointer;font-weight:600;padding:10px 0;list-style:none;text-align:center}
.pr-det>summary::-webkit-details-marker{display:none}
.pr-r{padding:12px 0;border-top:1px solid rgb(var(--border));font-size:14.5px;line-height:1.5}
.pr-r b{display:block;margin-bottom:3px}
.pr-r .i-ok{color:rgb(34 197 94);font-weight:700} .pr-r .i-bad{color:rgb(239 68 68);font-weight:700}
@media(max-width:640px){.pr-num{font-size:22px;min-width:20px}.pr-opt{gap:12px;padding:13px 14px}.pr-txt{font-size:15px}.pr-q{font-size:17.5px}.pr-card{padding:16px}.pr-top{flex-direction:column;align-items:stretch;gap:8px}.pr-seg{max-width:none}.pr-foot .pr-btn{width:100%}.pr-nota{font-size:46px}}`;

// Borrador en el navegador (NO en el servidor): lo único que resuelve es "no perder lo que
// ya tenías tipeado si se te cerró la pestaña o se cortó internet" — si entrás desde otro
// celu/PC no lo vas a tener. Por eso el estado que se le muestra al estudiante dice
// "Respuestas guardadas en este dispositivo", nunca solo "Guardado" a secas.
function draftKey(slug) { return 'ilce-actividad-draft-' + slug; }
function leerDraft(slug) {
  try { const raw = localStorage.getItem(draftKey(slug)); return raw ? JSON.parse(raw) : null; } catch { return null; }
}
function borrarDraft(slug) { try { localStorage.removeItem(draftKey(slug)); } catch { /* */ } }

// Corrección mínima, SOLO para la Vista previa del Constructor (modoPreview): no se puede
// importar lib/actividades.js acá (usa googleapis, server-only), así que se repite la cuenta
// más chica posible — nunca pisa ni duplica la lógica real de corrección del servidor, que
// sigue siendo la única que cuenta para una respuesta real.
function corregirLocal(preguntas, resp) {
  let puntaje = 0, total = 0;
  preguntas.forEach((p, i) => {
    if (p.tipo === 'abierta') return;
    total++;
    if (resp[i] != null && Number(resp[i]) === Number(p.correcta)) puntaje++;
  });
  return { puntaje, total };
}

// modoPreview: lo usa el Constructor de actividades para mostrar "cómo lo va a ver el
// estudiante" ANTES de publicar, con el componente real (misma estructura exacta) pero sin
// tocar la Sheet ni el localStorage del navegador: no verifica "ya completada", no envía nada
// al servidor (corrige localmente nomás, para mostrar una pantalla final de ejemplo) y no lee
// ni escribe ningún borrador real.
export default function ActividadForm({ act, modoPreview = false, pasoInicial = 0 }) {
  const draftInicial = useRef(null);
  if (draftInicial.current === null) draftInicial.current = modoPreview ? {} : (leerDraft(act.slug) || {});

  const [step, setStep] = useState(modoPreview ? Math.min(pasoInicial, act.preguntas.length) : (draftInicial.current.step || 0)); // 0 = datos, 1..N = preguntas (en la vista previa del constructor arranca en la pregunta que se está editando)
  const [email, setEmail] = useState(draftInicial.current.email || '');
  const [nombre, setNombre] = useState(draftInicial.current.nombre || '');
  // Si quien armó la actividad ya le puso una edición, no hace falta preguntársela
  // de nuevo al estudiante (y de paso se evita que la escriba mal).
  const [edicion, setEdicion] = useState(act.edicion || draftInicial.current.edicion || '');
  const [resp, setResp] = useState(draftInicial.current.resp || {});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(null); // null | 'ok' | 'guardando' | 'error'
  const [confirmarEnvio, setConfirmarEnvio] = useState(false);
  const [verificando, setVerificando] = useState(false);
  // Si el GET de abajo encuentra una respuesta previa con este correo, se corta acá: nunca
  // se le deja ver de nuevo el formulario (pedido de Diego — "ya completada" siempre gana).
  const [yaCompletada, setYaCompletada] = useState(null);
  const inicioRef = useRef(Date.now());

  // ---- Práctica de repaso (feedbackInmediato) ----
  // Una pregunta por pantalla: se responde, se ve si acertó, y se sigue (sin volver atrás). El envío al servidor es UNO solo, al terminar la
  // última pregunta, y cuenta el PRIMER intento: "Intentar de nuevo" reinicia solo en el navegador y no guarda nada más.
  const practica = act.feedbackInmediato === true;
  const [bloq, setBloq] = useState(draftInicial.current.bloq || {}); // preguntas ya respondidas: quedan bloqueadas, con su feedback
  const [intento, setIntento] = useState(1);                          // 1 = el que cuenta; 2 o más = práctica local
  const [falloEnvio, setFalloEnvio] = useState(false);

  const total = act.preguntas.length;
  const esDatos = step === 0;
  const qIndex = step - 1;

  function elegir(opt) { if (practica && bloq[qIndex]) return; setResp((r) => ({ ...r, [qIndex]: opt })); setError(''); }
  function escribir(texto) { setResp((r) => ({ ...r, [qIndex]: texto })); }

  // Cuántas preguntas de la actividad NO se autocorrigen (respuesta abierta) — se usa acá
  // para el mensaje de "se corrige al enviar" y en la pantalla final de resultado.
  const cantAbiertas = act.preguntas.filter((p) => p.tipo === 'abierta').length;

  // Autosave del borrador (debounced) — nunca antes de que el estudiante empiece a escribir
  // nada (step 0 recién abierto, sin draft previo) para no mostrar "Guardando…" de la nada.
  const autosavePrimerCambio = useRef(draftInicial.current && Object.keys(draftInicial.current).length > 0);
  useEffect(() => {
    if (modoPreview) return; // la vista previa nunca toca el localStorage real del navegador
    if (resultado || yaCompletada) return;
    if (intento > 1) return; // "Intentar de nuevo" no guarda borrador: el primer intento ya se envió
    if (step === 0 && !email && !nombre && Object.keys(resp).length === 0 && !autosavePrimerCambio.current) return;
    autosavePrimerCambio.current = true;
    setGuardado('guardando');
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(act.slug), JSON.stringify({ step, email, nombre, edicion, resp, bloq }));
        setGuardado('ok');
      } catch { setGuardado('error'); }
    }, 350);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [step, email, nombre, edicion, resp, bloq, intento, modoPreview]);

  async function siguiente() {
    if (esDatos) {
      if (!validarEmail(email)) { setError('Ingresá un correo válido.'); return; }
      setError('');
      if (modoPreview) { setStep(1); return; } // en preview nunca hay "ya completada" que chequear
      setVerificando(true);
      try {
        const res = await fetch(`/api/actividad?slug=${encodeURIComponent(act.slug)}&email=${encodeURIComponent(email)}`);
        const data = await res.json();
        if (data.ok && data.yaCompletada) { setYaCompletada(data); borrarDraft(act.slug); setVerificando(false); return; }
      } catch { /* si falla la verificación, no bloqueamos al estudiante — se revisa igual al enviar */ }
      setVerificando(false);
      setStep(1);
      return;
    }
    const esAbierta = act.preguntas[qIndex]?.tipo === 'abierta';
    if (esAbierta ? !String(resp[qIndex] || '').trim() : resp[qIndex] == null) {
      setError(esAbierta ? 'Escribí tu respuesta para continuar.' : 'Elegí una opción para continuar.');
      return;
    }
    setError('');
    if (step < total) setStep(step + 1);
    else setConfirmarEnvio(true); // última pregunta -> pantalla de confirmación, no envío directo
  }
  // Botón principal de una pregunta en modo práctica: "Enviar respuesta" (muestra el feedback y bloquea) y después "Continuar".
  // Las abiertas no tienen feedback inmediato: solo "Continuar", y no cuentan en la nota. Tras la última pregunta se envía todo (una sola vez).
  function accionPractica() {
    const q = act.preguntas[qIndex]; const esAb = q.tipo === 'abierta';
    if (!esAb && !bloq[qIndex]) {
      if (resp[qIndex] == null) return;
      setBloq((b) => ({ ...b, [qIndex]: true })); setError(''); return;
    }
    if (esAb && !String(resp[qIndex] || '').trim()) { setError('Escribí tu respuesta para continuar.'); return; }
    setError('');
    if (step < total) setStep(step + 1);
    else enviar();
  }
  function reintentar() {
    setIntento((n) => n + 1); setResultado(null); setResp({}); setBloq({}); setStep(1); setError(''); setFalloEnvio(false);
    inicioRef.current = Date.now();
  }
  function atras() {
    if (confirmarEnvio) { setConfirmarEnvio(false); return; }
    if (step > 0) { setError(''); setStep(step - 1); }
  }

  async function enviar() {
    setEnviando(true); setError(''); setFalloEnvio(false);
    if (modoPreview || intento > 1) {
      // Nunca se manda nada al servidor desde la vista previa — se corrige localmente nomás,
      // para que quien está armando la actividad vea una pantalla final representativa.
      const { puntaje, total } = corregirLocal(act.preguntas, resp);
      setResultado({ ok: true, puntaje, total, emailOk: modoPreview, local: true });
      setConfirmarEnvio(false);
      setEnviando(false);
      return;
    }
    try {
      const res = await fetch('/api/actividad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: act.slug, email, nombre, edicion, respuestas: resp, duracion: Math.round((Date.now() - inicioRef.current) / 1000) })
      });
      const data = await res.json();
      if (!data.ok) {
        // Si el servidor dice que ya la habías respondido (p. ej. la mandaste desde otra
        // pestaña mientras tanto), mostramos esa pantalla en vez de un error genérico.
        if (data.yaCompletada) { setYaCompletada({ yaCompletada: true }); setConfirmarEnvio(false); setEnviando(false); borrarDraft(act.slug); return; }
        setError(data.error || 'No se pudo enviar'); setFalloEnvio(true); setEnviando(false); return;
      }
      setResultado(data);
      setConfirmarEnvio(false);
      borrarDraft(act.slug);
    } catch { setError('Error de conexión'); setFalloEnvio(true); }
    setEnviando(false);
  }

  const IndicadorGuardado = ({ compacto }) => {
    if (!guardado) return null;
    const txt = guardado === 'guardando' ? 'Guardando…' : guardado === 'error' ? ' No se pudo guardar en este dispositivo' : ' Respuestas guardadas en este dispositivo';
    const color = guardado === 'error' ? 'rgb(248 113 113)' : guardado === 'guardando' ? 'rgb(var(--textMuted))' : 'rgb(74 222 128)';
    return <div style={{ fontSize: 12, color, textAlign: compacto ? 'right' : 'left', marginTop: compacto ? 0 : 8 }}>{txt}</div>;
  };

  // "Ya completada": gana siempre sobre cualquier otra pantalla — ni se le llega a mostrar
  // una sola pregunta. No hay forma de saber si Diego permite editar respuestas ya enviadas
  // (no existe ese dato en el sistema), así que el mensaje es honesto: no es editable.
  if (yaCompletada) {
    return (
      <div className="quizstage"><style>{ESTILO_ACTIVIDAD}</style><div className="quizcard quizcard-act">
        <div className="quiz-band">
          <div className="quiz-band-top"><div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}</div><Isologo size={20} /></div>
          <div className="ti">{act.titulo}</div>
        </div>
        <div className="quiz-body" style={{ textAlign: 'center', padding: '40px 30px 8px' }}>
          <div className="quiz-ring"></div>
          <h3 style={{ fontSize: 20, margin: '4px 0' }}>Ya completaste esta actividad</h3>
          {yaCompletada.fecha ? (
            <p className="muted" style={{ fontSize: 14 }}>La respondiste el {new Date(yaCompletada.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
          ) : null}
          {(act.mostrarResultado !== false && yaCompletada.total > 0) && (
            <div style={{ fontFamily: 'Jost', fontWeight: 500, fontSize: 40, color: 'rgb(var(--accentTeal))', margin: '10px 0' }}>{yaCompletada.puntaje} / {yaCompletada.total}</div>
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>Ya no podés volver a enviarla ni modificar tus respuestas.</p>
        </div>
        <PieFinal />
      </div></div>
    );
  }

  if (resultado && practica) {
    // Nota sobre 10 con dos decimales (puntaje / total * 10). Las abiertas no cuentan. Si no hay preguntas corregibles, no hay nota.
    const nota = resultado.total > 0 ? ((resultado.puntaje / resultado.total) * 10).toFixed(2) : null;
    return (
      <div className="quizstage"><style>{ESTILO_ACTIVIDAD}</style><style>{ESTILO_PRACTICA}</style><div className="quizcard quizcard-act quizcard-pr pr-final">
        <div className="quiz-band">
          <div className="quiz-band-top"><div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}</div><Isologo size={20} /></div>
          <div className="ti">{act.titulo}</div>
        </div>
        <div className="quiz-body" style={{ textAlign: 'center', padding: '30px 24px 8px' }}>
          <PulgarArriba />
          <h3 className="pr-bien">¡Muy bien!</h3>
          <p className="muted" style={{ fontSize: 15, margin: '0 0 4px' }}>Completaste tu práctica de repaso.</p>
          <hr className="pr-hr" />
          {act.mostrarResultado !== false && nota && (<>
            <p className="muted" style={{ fontSize: 15, margin: 0 }}>Tu resultado es:</p>
            <div className="pr-nota">{nota}</div>
            {cantAbiertas > 0 && <p className="muted" style={{ fontSize: 12.5, margin: '0 0 4px' }}>({cantAbiertas} pregunta{cantAbiertas === 1 ? '' : 's'} abierta{cantAbiertas === 1 ? '' : 's'} no entra{cantAbiertas === 1 ? '' : 'n'} en la nota)</p>}
          </>)}
          {intento > 1 && <p className="muted" style={{ fontSize: 12.5, margin: '4px 0' }}>Este intento fue solo de práctica y no se guarda: cuenta tu primer intento.</p>}
          <div><button type="button" className="pr-link" onClick={reintentar}>{I_RETRY} Intentar de nuevo</button></div>
          <div style={{ margin: '10px 0 4px' }}><a className="btn btn-teal pr-btn" href={URL_CAMPUS} target="_blank" rel="noopener noreferrer">Finalizar</a></div>
          <details className="pr-det">
            <summary>Ver las respuestas</summary>
            {act.preguntas.map((q, i) => {
              const abierta = q.tipo === 'abierta'; const r = resp[i];
              const elegida = abierta ? (String(r || '').trim() || '(sin responder)') : (r == null ? '(sin responder)' : (q.opciones || [])[r]);
              const hayClave = !abierta && q.correcta != null; const bien = hayClave && Number(r) === Number(q.correcta);
              return (
                <div key={i} className="pr-r">
                  <b>{i + 1}. {q.pregunta}</b>
                  <div>Tu respuesta: {elegida}{hayClave && <span className={bien ? 'i-ok' : 'i-bad'} aria-label={bien ? 'correcta' : 'incorrecta'}> {bien ? I_CHECK : I_X}</span>}</div>
                  {hayClave && !bien && <div>Correcta: {(q.opciones || [])[q.correcta]}</div>}
                  {abierta && <div className="muted">Pregunta abierta: la revisa el equipo.</div>}
                </div>
              );
            })}
          </details>
        </div>
        <PieFinal />
      </div></div>
    );
  }

  if (resultado) {
    const pct = resultado.total ? Math.round((resultado.puntaje / resultado.total) * 100) : 0;
    return (
      <div className="quizstage"><style>{ESTILO_ACTIVIDAD}</style><div className="quizcard quizcard-act">
        <div className="quiz-band">
          <div className="quiz-band-top"><div className="kd">ACTIVIDAD</div><Isologo size={20} /></div>
          <div className="ti">{act.curso}</div>
        </div>
        <div className="quiz-body" style={{ textAlign: 'center', padding: '40px 30px 8px' }}>
          <div className="quiz-ring"></div>
          <h3 style={{ fontSize: 22, margin: '4px 0' }}>¡Actividad completada! </h3>
          {act.mostrarResultado === false ? (
            <p className="muted" style={{ fontSize: 14 }}>Registramos tus respuestas de <b>{act.titulo}</b>{resultado.emailOk ? ` y te enviamos el detalle a ${email}` : ''}.</p>
          ) : (<>
            <p className="muted" style={{ fontSize: 14 }}>Tu resultado en <b>{act.titulo}</b>:</p>
            <div style={{ fontFamily: 'Jost', fontWeight: 500, fontSize: 48, color: 'rgb(var(--accentTeal))', margin: '6px 0' }}>{resultado.puntaje} / {resultado.total}</div>
            <p className="muted" style={{ fontSize: 14 }}>{pct}% correctas{resultado.emailOk ? ` · te enviamos el detalle a ${email}` : ''}</p>
            {cantAbiertas > 0 && <p className="muted" style={{ fontSize: 12.5 }}>({cantAbiertas} pregunta{cantAbiertas === 1 ? '' : 's'} de desarrollo no {cantAbiertas === 1 ? 'entra' : 'entran'} en este puntaje — el equipo la{cantAbiertas === 1 ? '' : 's'} revisa aparte.)</p>}
          </>)}
        </div>
        {/* Pie fijo al finalizar cualquier actividad, pedido por Diego: volver al campus,
            invitación a la nota del blog, y redes de la comunidad. */}
        <PieFinal />
      </div></div>
    );
  }

  const p = esDatos || confirmarEnvio ? null : act.preguntas[qIndex];
  const progreso = esDatos ? 0 : Math.round((step / (total + 1)) * 100);

  // Pantalla de UNA pregunta en modo práctica de repaso.
  let preguntaPractica = null;
  if (practica && !esDatos && p) {
    const bq = !!bloq[qIndex]; const esAb = p.tipo === 'abierta'; const sinClave = !esAb && p.correcta == null;
    const acerto = !esAb && !sinClave && resp[qIndex] != null && Number(resp[qIndex]) === Number(p.correcta);
    preguntaPractica = (
      <>
        <div className="pr-top">
          <div className="pr-cnt"><span className="pr-n">{step}</span> de {total}</div>
          {total <= 20 ? (
            <div className="pr-seg" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Pregunta ${step} de ${total}`}>
              {Array.from({ length: total }).map((_, k) => <span key={k} className={'pr-s' + (k < step ? ' on' : '')} />)}
            </div>
          ) : (
            <div className="pr-bar" role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={step} aria-label={`Pregunta ${step} de ${total}`}><i style={{ width: (step / total) * 100 + '%' }} /></div>
          )}
        </div>
        <div className="pr-card"><h3 className="pr-q">{p.pregunta}</h3></div>
        {esAb ? (
          <textarea className="ctrl" rows={5} value={resp[qIndex] || ''} onChange={(e) => escribir(e.target.value)}
            placeholder="Escribí tu respuesta…" style={{ resize: 'vertical', width: '100%' }} />
        ) : (
          <div role="radiogroup" aria-label="Opciones">
            {(p.opciones || []).map((op, j) => {
              const elegida = resp[qIndex] === j;
              const esCorrecta = bq && !sinClave && Number(p.correcta) === j;
              const esMala = bq && elegida && !sinClave && !esCorrecta;
              return (
                <div key={j} className={'pr-opt' + (elegida ? ' sel' : '') + (bq ? ' lock' : '') + (esCorrecta ? ' ok' : '') + (esMala ? ' bad' : '')}
                  onClick={() => elegir(j)} role="radio" aria-checked={elegida} aria-disabled={bq} tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), elegir(j))}>
                  <span className="pr-num">{j + 1}</span>
                  <div className="pr-txt">{op}</div>
                  <span className="pr-radio" aria-hidden="true">{esMala ? I_X : (elegida || esCorrecta) ? I_CHECK : ''}</span>
                </div>
              );
            })}
          </div>
        )}
        {bq && !esAb && !sinClave && (
          <div className={'pr-fb ' + (acerto ? 'ok' : 'bad')} role="status">
            <span aria-hidden="true">{acerto ? I_CHECK : I_X}</span> {acerto ? '¡Respuesta correcta!' : '¡Respuesta incorrecta!'}
          </div>
        )}
      </>
    );
  }

  return (
    <div className="quizstage"><style>{ESTILO_ACTIVIDAD}</style>{practica && <style>{ESTILO_PRACTICA}</style>}<div className={'quizcard quizcard-act' + (practica ? ' quizcard-pr' : '')}>
      <div className="quiz-band">
        <div className="quiz-band-top"><div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}{act.edicion ? ` · ED. ${act.edicion}` : ''}</div><Isologo size={20} /></div>
        <div className="ti">{act.titulo}</div>
      </div>
      {!(practica && !esDatos) && <div className="quiz-prog"><div className="quiz-prog-fill" style={{ width: (esDatos ? 4 : confirmarEnvio ? 100 : progreso) + '%' }} /></div>}

      <div className="quiz-body">
        {esDatos ? (
          <>
            <h3 style={{ fontSize: 18, margin: '0 0 4px' }}>Antes de empezar</h3>
            {act.intro && <p className="quiz-intro" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 10, whiteSpace: 'pre-line', color: 'rgb(var(--textSec))', lineHeight: 1.55 }}>{act.intro}</p>}
            <p className="muted" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 16 }}>
              Son {total} pregunta{total === 1 ? '' : 's'}.{' '}
              {practica
                ? `Vas a ver si acertaste apenas respondés cada una${cantAbiertas > 0 ? `; ${cantAbiertas} ${cantAbiertas === 1 ? 'es de desarrollo' : 'son de desarrollo'} y no tienen corrección inmediata` : ''}.`
                : cantAbiertas > 0
                ? `Las de opción se corrigen al enviar; ${cantAbiertas} ${cantAbiertas === 1 ? 'es de desarrollo' : 'son de desarrollo'} y las revisa el equipo.`
                : 'Se corrige al enviar.'}
              {act.fechaCierre ? ` Tenés tiempo hasta el ${new Date(act.fechaCierre + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}.` : ''}
            </p>
            <div className="quiz-field"><label>Correo <span className="req">*</span></label>
              <input className="ctrl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tunombre@correo.com" /></div>
            <div className="quiz-field"><label>Nombre y apellido</label>
              <input className="ctrl" value={nombre} onChange={(e) => setNombre(e.target.value.replace(/[0-9]/g, ''))} placeholder="Tu nombre" /></div>
            {act.edicion ? (
              <div className="quiz-field"><label>Edición</label>
                <div className="ctrl" style={{ color: 'rgb(var(--textSec))', display: 'flex', alignItems: 'center' }}>Edición {act.edicion}</div></div>
            ) : (
              <div className="quiz-field"><label>Número de edición</label>
                <input className="ctrl" value={edicion} onChange={(e) => setEdicion(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric" pattern="[0-9]*" placeholder="Ej: 15" /></div>
            )}
          </>
        ) : confirmarEnvio ? (
          <div style={{ textAlign: 'center', padding: '14px 0' }}>
            <h3 style={{ fontSize: 17, margin: '0 0 10px' }}>¿Querés enviar tus respuestas?</h3>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.5 }}>Respondiste las {total} preguntas. Una vez enviada, <b>no vas a poder modificarlas</b> — revisá antes de confirmar si querés volver atrás.</p>
          </div>
        ) : preguntaPractica ? preguntaPractica : (
          <>
            <div className="quiz-count">Pregunta {step} de {total}</div>
            <h3 style={{ fontSize: 18, margin: '4px 0 16px', lineHeight: 1.3 }}>{step}. {p.pregunta}</h3>
            {p.tipo === 'abierta' ? (
              <textarea className="ctrl" rows={5} value={resp[qIndex] || ''} onChange={(e) => escribir(e.target.value)}
                placeholder="Escribí tu respuesta…" style={{ resize: 'vertical', width: '100%' }} />
            ) : (p.opciones || []).map((op, j) => (
              <div key={j} className={'quiz-opt' + (resp[qIndex] === j ? ' sel' : '')} onClick={() => elegir(j)}
                role="radio" aria-checked={resp[qIndex] === j} tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && elegir(j)}>
                <span className="dot" /><div>{op}</div>
              </div>
            ))}
          </>
        )}
        {error && <div className="err" style={{ display: 'block', marginTop: 6 }}>{error}</div>}
        {!esDatos && <IndicadorGuardado />}
      </div>

      {practica && !esDatos ? (
        <div className="pr-foot">
          <button className="btn btn-teal pr-btn" onClick={accionPractica}
            disabled={enviando || (p && p.tipo !== 'abierta' && !bloq[qIndex] && resp[qIndex] == null)}>
            {enviando ? 'Enviando…' : falloEnvio ? 'Reintentar envío' : (p && p.tipo !== 'abierta' && !bloq[qIndex]) ? 'Enviar respuesta' : 'Continuar'}
          </button>
        </div>
      ) : (
      <div className="quiz-foot">
        {(step > 0 || confirmarEnvio) && <button className="btn btn-ghost" onClick={atras} disabled={enviando}>{confirmarEnvio ? 'Revisar' : 'Atrás'}</button>}
        <button className="btn btn-teal" style={{ flex: 1 }} onClick={confirmarEnvio ? enviar : siguiente} disabled={enviando || verificando}>
          {enviando ? 'Enviando…' : verificando ? 'Verificando…' : confirmarEnvio ? 'Sí, enviar' : esDatos ? 'Comenzar' : step < total ? 'Siguiente' : 'Enviar actividad'}
        </button>
      </div>
      )}
    </div></div>
  );
}
