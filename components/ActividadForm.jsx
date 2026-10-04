'use client';
import { useState, useRef, useEffect } from 'react';
import { validarEmail } from '../lib/validacion';
import { Isologo } from './Isologo';

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
export default function ActividadForm({ act, modoPreview = false }) {
  const draftInicial = useRef(null);
  if (draftInicial.current === null) draftInicial.current = modoPreview ? {} : (leerDraft(act.slug) || {});

  const [step, setStep] = useState(draftInicial.current.step || 0); // 0 = datos, 1..N = preguntas
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

  const total = act.preguntas.length;
  const esDatos = step === 0;
  const qIndex = step - 1;

  function elegir(opt) { setResp((r) => ({ ...r, [qIndex]: opt })); setError(''); }
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
    if (step === 0 && !email && !nombre && Object.keys(resp).length === 0 && !autosavePrimerCambio.current) return;
    autosavePrimerCambio.current = true;
    setGuardado('guardando');
    const t = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(act.slug), JSON.stringify({ step, email, nombre, edicion, resp }));
        setGuardado('ok');
      } catch { setGuardado('error'); }
    }, 350);
    return () => clearTimeout(t);
    /* eslint-disable-next-line */
  }, [step, email, nombre, edicion, resp, modoPreview]);

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
  function atras() {
    if (confirmarEnvio) { setConfirmarEnvio(false); return; }
    if (step > 0) { setError(''); setStep(step - 1); }
  }

  async function enviar() {
    setEnviando(true); setError('');
    if (modoPreview) {
      // Nunca se manda nada al servidor desde la vista previa — se corrige localmente nomás,
      // para que quien está armando la actividad vea una pantalla final representativa.
      const { puntaje, total } = corregirLocal(act.preguntas, resp);
      setResultado({ ok: true, puntaje, total, emailOk: true });
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
        setError(data.error || 'No se pudo enviar'); setEnviando(false); return;
      }
      setResultado(data);
      setConfirmarEnvio(false);
      borrarDraft(act.slug);
    } catch { setError('Error de conexión'); }
    setEnviando(false);
  }

  const IndicadorGuardado = ({ compacto }) => {
    if (!guardado) return null;
    const txt = guardado === 'guardando' ? 'Guardando…' : guardado === 'error' ? '⚠ No se pudo guardar en este dispositivo' : '✓ Respuestas guardadas en este dispositivo';
    const color = guardado === 'error' ? 'rgb(248 113 113)' : guardado === 'guardando' ? 'rgb(var(--textMuted))' : 'rgb(74 222 128)';
    return <div style={{ fontSize: 12, color, textAlign: compacto ? 'right' : 'left', marginTop: compacto ? 0 : 8 }}>{txt}</div>;
  };

  // "Ya completada": gana siempre sobre cualquier otra pantalla — ni se le llega a mostrar
  // una sola pregunta. No hay forma de saber si Diego permite editar respuestas ya enviadas
  // (no existe ese dato en el sistema), así que el mensaje es honesto: no es editable.
  if (yaCompletada) {
    return (
      <div className="quizstage"><div className="quizcard">
        <div className="quiz-band">
          <div className="quiz-band-top"><div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}</div><Isologo size={20} /></div>
          <div className="ti">{act.titulo}</div>
        </div>
        <div className="quiz-body" style={{ textAlign: 'center', padding: '40px 30px 8px' }}>
          <div className="quiz-ring">✓</div>
          <h3 style={{ fontSize: 20, margin: '4px 0' }}>Ya completaste esta actividad</h3>
          {yaCompletada.fecha ? (
            <p className="muted" style={{ fontSize: 14 }}>La respondiste el {new Date(yaCompletada.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}.</p>
          ) : null}
          {(act.mostrarResultado !== false && yaCompletada.total > 0) && (
            <div style={{ fontFamily: 'Jost', fontWeight: 500, fontSize: 40, color: 'rgb(var(--accentTeal))', margin: '10px 0' }}>{yaCompletada.puntaje} / {yaCompletada.total}</div>
          )}
          <p className="muted" style={{ fontSize: 13, marginTop: 14 }}>Ya no podés volver a enviarla ni modificar tus respuestas.</p>
        </div>
        <div className="quiz-postfoot">
          <a className="quiz-postlink" href="http://campus.institutoilce.com/" target="_blank" rel="noopener noreferrer">← Volver al campus</a>
        </div>
      </div></div>
    );
  }

  if (resultado) {
    const pct = resultado.total ? Math.round((resultado.puntaje / resultado.total) * 100) : 0;
    return (
      <div className="quizstage"><div className="quizcard">
        <div className="quiz-band">
          <div className="quiz-band-top"><div className="kd">ACTIVIDAD</div><Isologo size={20} /></div>
          <div className="ti">{act.curso}</div>
        </div>
        <div className="quiz-body" style={{ textAlign: 'center', padding: '40px 30px 8px' }}>
          <div className="quiz-ring">✓</div>
          <h3 style={{ fontSize: 22, margin: '4px 0' }}>¡Actividad completada! 🎉</h3>
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
        <div className="quiz-postfoot">
          <a className="quiz-postlink" href="http://campus.institutoilce.com/" target="_blank" rel="noopener noreferrer">← Volver al campus</a>
          <a className="quiz-postlink quiz-postlink-sec" href="https://www.coachingeducativolider.com/blog" target="_blank" rel="noopener noreferrer">☕ Tomate un descanso y leé una nota</a>
          <div className="quiz-social">
            <a href="https://www.instagram.com/institutoilce/" target="_blank" rel="noopener noreferrer" title="Instagram" className="quiz-social-btn"><IconInstagram /></a>
            <a href="https://www.whatsapp.com/channel/0029VaBfdccGOj9tAv5s1A0G" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="quiz-social-btn"><IconWhatsapp /></a>
            <a href="https://www.youtube.com/channel/UCORUTxo5fMucj3gKqyyqoAQ" target="_blank" rel="noopener noreferrer" title="YouTube" className="quiz-social-btn"><IconYoutube /></a>
          </div>
        </div>
      </div></div>
    );
  }

  const p = esDatos || confirmarEnvio ? null : act.preguntas[qIndex];
  const progreso = esDatos ? 0 : Math.round((step / (total + 1)) * 100);

  return (
    <div className="quizstage"><div className="quizcard">
      <div className="quiz-band">
        <div className="quiz-band-top"><div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}{act.edicion ? ` · ED. ${act.edicion}` : ''}</div><Isologo size={20} /></div>
        <div className="ti">{act.titulo}</div>
      </div>
      <div className="quiz-prog"><div className="quiz-prog-fill" style={{ width: (esDatos ? 4 : confirmarEnvio ? 100 : progreso) + '%' }} /></div>

      <div className="quiz-body">
        {esDatos ? (
          <>
            <h3 style={{ fontSize: 18, margin: '0 0 4px' }}>Antes de empezar</h3>
            {act.intro && <p className="quiz-intro" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 10, whiteSpace: 'pre-line', color: 'rgb(var(--textSec))', lineHeight: 1.55 }}>{act.intro}</p>}
            <p className="muted" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 16 }}>
              Son {total} pregunta{total === 1 ? '' : 's'}.{' '}
              {cantAbiertas > 0
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
        ) : (
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

      <div className="quiz-foot">
        {(step > 0 || confirmarEnvio) && <button className="btn btn-ghost" onClick={atras} disabled={enviando}>{confirmarEnvio ? 'Revisar' : 'Atrás'}</button>}
        <button className="btn btn-teal" style={{ flex: 1 }} onClick={confirmarEnvio ? enviar : siguiente} disabled={enviando || verificando}>
          {enviando ? 'Enviando…' : verificando ? 'Verificando…' : confirmarEnvio ? 'Sí, enviar' : esDatos ? 'Comenzar' : step < total ? 'Siguiente' : 'Enviar actividad'}
        </button>
      </div>
    </div></div>
  );
}
