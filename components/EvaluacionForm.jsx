'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Isologo } from './Isologo';
import { PieFinal } from './PieFinal';
import ControlLetraPublico from './ControlLetraPublico';
import { letra } from '../lib/escalaLetra';
import { formatoPuntos, formatoDuracion } from '../lib/evaluacionesLogica';

// Pantalla pública de una Evaluación final. El servidor manda el reloj (hora de inicio guardada) y corrige: acá solo se muestra.
//   datos (mail) → intro (reglas + nombre/edición) → examen (una pregunta por pantalla, cronómetro) → confirmar → resultado

const ESTILO = `
.quizcard-ev .quiz-opt:hover{border-color:rgb(var(--accentPurple))}
.ev-timer{display:inline-flex;align-items:center;gap:6px;font-family:'Dosis';font-weight:600;font-size:17px;letter-spacing:.5px;padding:4px 12px;border-radius:999px;background:rgba(255,255,255,.16);color:#fff;font-variant-numeric:tabular-nums}
.ev-timer.poco{background:rgba(248,113,113,.9);animation:evpulse 1s infinite}
@keyframes evpulse{50%{opacity:.7}}
.ev-reglas{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}
.ev-regla{background:rgb(var(--surface2));border:1px solid rgb(var(--border));border-radius:12px;padding:10px 12px}
.ev-regla b{display:block;font-size:17px;font-family:'Dosis';font-weight:600}
.ev-regla span{font-size:12px;color:rgb(var(--textMuted))}
.ev-score{width:112px;height:112px;margin:0 auto 12px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;border:4px solid rgb(var(--accentTeal));font-family:'Dosis'}
.ev-score.no{border-color:rgb(248 113 113)}
.ev-score b{font-size:30px;line-height:1}
.ev-score span{font-size:12px;color:rgb(var(--textMuted))}
.ev-chip{display:inline-block;padding:3px 12px;border-radius:999px;font-size:13px;font-weight:600}
.ev-chip.ok{background:rgba(34,211,238,.16);color:rgb(var(--accentTeal))}
.ev-chip.no{background:rgba(248,113,113,.16);color:rgb(248 113 113)}
.ev-rev{text-align:left;border:1px solid rgb(var(--border));border-left-width:3px;border-radius:12px;padding:12px 14px;margin-bottom:10px;background:rgb(var(--surface2))}
.ev-rev.ok{border-left-color:rgb(var(--accentTeal))}
.ev-rev.no{border-left-color:rgb(248 113 113)}
.ev-rev .q{font-weight:600;font-size:14px;margin-bottom:6px;line-height:1.35}
.ev-rev .o{font-size:13px;line-height:1.4;margin:2px 0}
.ev-rev .j{font-size:12.5px;color:rgb(var(--textSec));margin-top:8px;line-height:1.5;border-top:1px dashed rgb(var(--border));padding-top:8px}
.ev-situ{background:rgb(var(--surface2));border:1px solid rgb(var(--border));border-radius:12px;padding:12px 14px;font-size:13.5px;line-height:1.55;color:rgb(var(--textSec));margin-bottom:14px;white-space:pre-line}
.ev-aviso{background:rgba(251,191,36,.10);border:1px solid rgba(251,191,36,.4);border-radius:12px;padding:10px 13px;font-size:13px;line-height:1.5;margin:12px 0}
.ev-prueba{background:rgba(192,38,211,.14);color:rgb(var(--accentMagenta));font-size:11px;font-weight:700;letter-spacing:1px;text-align:center;padding:4px}
.ev-btn-diploma{display:block;text-align:center;text-decoration:none;margin:14px 0 4px}
`;

const mmss = (seg) => `${String(Math.floor(seg / 60)).padStart(2, '0')}:${String(seg % 60).padStart(2, '0')}`;
const fechaLarga = (ms) => new Date(ms).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Argentina/Buenos_Aires' });

async function llamar(cuerpo) {
  const res = await fetch('/api/evaluacion', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
  let d = null; try { d = await res.json(); } catch { /* */ }
  if (!d) throw new Error('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
  return d;
}

// ejemploFinal: 'aprobada' | 'no_aprobada' → solo para la pestaña Emails del panel (muestra la pantalla de resultado con datos de ejemplo).
export default function EvaluacionForm({ slug, titulo, curso, ejemploFinal = '' }) {
  const [fase, setFase] = useState(ejemploFinal ? 'resultado' : 'datos');
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [edicion, setEdicion] = useState('');
  const [reglas, setReglas] = useState(null);
  const [bloqueo, setBloqueo] = useState(null); // respuesta de la API cuando no puede rendir
  const [reanuda, setReanuda] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(null); // { intentoId, intento, maxIntentos, preguntas, prueba }
  const [paso, setPaso] = useState(0);
  const [resp, setResp] = useState({}); // { [índice original]: opción }
  const [finMs, setFinMs] = useState(null); // hora (del navegador) en que se acaba el tiempo
  const [restante, setRestante] = useState(null);
  const [resultado, setResultado] = useState(ejemploFinal ? {
    ok: true, enviado: true, prueba: false, puntaje: ejemploFinal === 'aprobada' ? 8 : 5, total: 10, minimo: 6, aprobado: ejemploFinal === 'aprobada', fueraDeTiempo: false,
    intento: 1, maxIntentos: 2, duracionSeg: 1260, emailOk: true, proximo: { permitido: ejemploFinal !== 'aprobada', motivo: 'ok' }, linkDiploma: ejemploFinal === 'aprobada' ? '#' : '', contacto: '',
    revision: [
      { i: 0, pregunta: 'Pregunta de ejemplo con respuesta correcta', elegido: 0, correcta: 0, ok: true, opciones: ['Opción correcta', 'Otra opción'], justificacion: 'Acá se explica por qué esa es la respuesta correcta.' },
      { i: 1, pregunta: 'Pregunta de ejemplo con respuesta incorrecta', elegido: 1, correcta: 0, ok: false, opciones: ['Opción correcta', 'Opción elegida'], justificacion: 'La justificación aparece debajo de cada pregunta.' }
    ]
  } : null);
  const enviandoRef = useRef(false);
  const claveStorage = intento ? `ilce-eval:${slug}:${intento.intentoId}` : null;

  // Respuestas y paso a salvo si se recarga la página (se borran al enviar).
  useEffect(() => {
    if (!claveStorage || fase === 'resultado') return;
    try { sessionStorage.setItem(claveStorage, JSON.stringify({ resp, paso })); } catch { /* */ }
  }, [resp, paso, claveStorage, fase]);

  // Cronómetro: se calcula contra una hora de fin fija (no restando de a uno), así no se desfasa si la pestaña queda en segundo plano.
  useEffect(() => {
    if (!finMs || (fase !== 'examen' && fase !== 'confirmar')) return undefined;
    const tick = () => {
      const s = Math.max(0, Math.round((finMs - Date.now()) / 1000));
      setRestante(s);
      if (s <= 0) enviar(true);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finMs, fase]);

  // Aviso del navegador si intenta cerrar la pestaña en pleno examen.
  useEffect(() => {
    if (fase !== 'examen' && fase !== 'confirmar') return undefined;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [fase]);

  const total = intento ? intento.preguntas.length : 0;
  const sinResponder = useMemo(() => (intento ? intento.preguntas.filter((p) => resp[p.i] == null).length : 0), [intento, resp]);

  async function verificar() {
    setError('');
    const e = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) { setError('Ingresá un correo válido.'); return; }
    setCargando(true);
    try {
      const d = await llamar({ accion: 'verificar', slug, email: e });
      if (!d.ok) { setError(d.error || 'No se pudo verificar.'); return; }
      setReglas(d.reglas || null);
      if (d.permitido) { setBloqueo(null); setReanuda(d.motivo === 'en_curso'); if (d.reglas?.edicion) setEdicion(d.reglas.edicion); setFase('intro'); }
      else { setBloqueo(d); setFase('bloqueo'); }
    } catch (x) { setError(x.message); } finally { setCargando(false); }
  }

  async function comenzar() {
    setError('');
    if (!nombre.trim()) { setError('Ingresá tu nombre completo.'); return; }
    if (/\d/.test(nombre)) { setError('El nombre no puede tener números.'); return; }
    if (!reglas?.edicion && !/^\d+$/.test(edicion.trim())) { setError('Ingresá tu número de edición (solo números).'); return; }
    setCargando(true);
    try {
      const d = await llamar({ accion: 'iniciar', slug, email: email.trim().toLowerCase(), nombre: nombre.trim(), edicion: edicion.trim() });
      if (!d.ok) { setError(d.error || 'No se pudo iniciar.'); return; }
      if (d.permitido === false) { setBloqueo(d); setFase('bloqueo'); return; }
      let guardado = {};
      try { guardado = JSON.parse(sessionStorage.getItem(`ilce-eval:${slug}:${d.intentoId}`) || '{}'); } catch { /* */ }
      setIntento(d);
      setResp(guardado.resp && typeof guardado.resp === 'object' ? guardado.resp : {});
      setPaso(Math.min(Math.max(0, Number(guardado.paso) || 0), d.preguntas.length - 1));
      setFinMs(d.segundosRestantes != null ? Date.now() + d.segundosRestantes * 1000 : null);
      setFase('examen');
    } catch (x) { setError(x.message); } finally { setCargando(false); }
  }

  async function enviar(porTiempo = false) {
    if (enviandoRef.current) return;
    enviandoRef.current = true; setError(''); setCargando(true);
    try {
      const d = await llamar({
        accion: 'enviar', slug, email: email.trim().toLowerCase(), intentoId: intento.intentoId, respuestas: resp,
        duracion: finMs && intento.prueba ? Math.max(0, (reglas.tiempoMin * 60) - Math.max(0, Math.round((finMs - Date.now()) / 1000))) : 0
      });
      if (!d.ok) {
        if (d.yaEnviado) { setError(''); }
        setError(d.error || 'No se pudo enviar.');
        if (porTiempo) setFase('confirmar'); // sigue mostrando el error con el botón de reintento
        return;
      }
      try { sessionStorage.removeItem(claveStorage); } catch { /* */ }
      setResultado(d); setFase('resultado');
    } catch (x) { setError(x.message); if (porTiempo) setFase('confirmar'); } finally { enviandoRef.current = false; setCargando(false); }
  }

  function otroIntento() {
    setIntento(null); setResultado(null); setResp({}); setPaso(0); setFinMs(null); setRestante(null); setError(''); setBloqueo(null); setFase('datos');
  }

  const banda = (
    <div className="quiz-band">
      <div className="quiz-band-top"><div className="kd">EVALUACIÓN FINAL · {curso.toUpperCase()}</div><Isologo size={20} /></div>
      <div className="ti">{titulo}</div>
      {(fase === 'examen' || fase === 'confirmar') && restante != null && (
        <div style={{ marginTop: 10 }}><span className={'ev-timer' + (restante <= 60 && (reglas?.tiempoMin || 0) > 2 ? ' poco' : '')}>⏱ {mmss(restante)}</span></div>
      )}
      <ControlLetraPublico />
    </div>
  );
  const envoltorio = (hijos, pie) => (
    <div className="quizstage"><style dangerouslySetInnerHTML={{ __html: ESTILO }} /><div className="quizcard quizcard-act quizcard-ev">
      {intento?.prueba && <div className="ev-prueba">MODO PRUEBA · no se guarda nada</div>}
      {banda}{hijos}{pie}
    </div></div>
  );

  // ── Datos: solo el mail (con eso se sabe si puede rendir)
  if (fase === 'datos') {
    return envoltorio(
      <div className="quiz-body">
        <h3 style={{ fontSize: letra(18), margin: '0 0 4px' }}>Evaluación final</h3>
        <p className="muted" style={{ fontSize: letra(13.5), marginTop: 0, marginBottom: 16 }}>Ingresá tu correo para empezar. Es el mismo con el que te inscribiste.</p>
        <div className="quiz-field"><label>Correo <span className="req">*</span></label>
          <input className="ctrl" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verificar()} placeholder="tunombre@correo.com" />
        </div>
        {error && <div className="err" style={{ display: 'block' }}>{error}</div>}
      </div>,
      <div className="quiz-foot"><button className="btn btn-teal" style={{ flex: 1 }} onClick={verificar} disabled={cargando}>{cargando ? 'Verificando…' : 'Continuar'}</button></div>
    );
  }

  // ── No puede rendir
  if (fase === 'bloqueo' && bloqueo) {
    const m = bloqueo.motivo;
    const contacto = reglas?.contacto;
    let tit = 'No podés rendir ahora', txt = '', emoji = '⏳';
    if (m === 'esperar_dias') { tit = 'Todavía no podés volver a rendir'; txt = `Podés hacer tu próximo intento a partir del ${fechaLarga(bloqueo.disponibleDesdeMs)} (en ${bloqueo.diasRestantes} día${bloqueo.diasRestantes === 1 ? '' : 's'}). Usaste ${bloqueo.usados} de ${bloqueo.maxIntentos} intentos.`; }
    else if (m === 'sin_intentos') { tit = 'Agotaste tus intentos'; txt = `Usaste los ${bloqueo.maxIntentos} intentos de esta evaluación. Si necesitás uno más, pedilo al equipo del instituto${contacto ? `: ${contacto}` : ''} y lo evaluamos.`; emoji = '🔒'; }
    else if (m === 'aprobado_previo') { tit = '¡Ya aprobaste esta evaluación!'; txt = 'No hace falta que la rindas de nuevo. Revisá tu correo: ahí te enviamos tu resultado.'; emoji = '🎉'; }
    else if (m === 'programada') { tit = 'Todavía no disponible'; txt = `Esta evaluación abre el ${bloqueo.fechaDisponible}${bloqueo.horaDisponible ? ` a las ${bloqueo.horaDisponible}` : ''}.`; }
    else if (m === 'cerrada') { tit = 'Evaluación cerrada'; txt = `El período para rendirla finalizó el ${bloqueo.fechaCierre}.`; emoji = '🔒'; }
    return envoltorio(
      <div className="quiz-body" style={{ textAlign: 'center', padding: '36px 26px 10px' }}>
        <div className="quiz-ring" style={{ background: 'rgb(var(--surface2))' }}>{emoji}</div>
        <h3 style={{ fontSize: letra(18), margin: '0 0 8px' }}>{tit}</h3>
        <p className="muted" style={{ fontSize: letra(14), lineHeight: 1.55 }}>{txt}</p>
      </div>,
      <><div className="quiz-foot"><button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => { setFase('datos'); setBloqueo(null); }}>Volver</button></div><PieFinal /></>
    );
  }

  // ── Reglas + nombre y edición
  if (fase === 'intro' && reglas) {
    const hayTiempo = reglas.tiempoMin > 0;
    return envoltorio(
      <div className="quiz-body">
        <h3 style={{ fontSize: letra(18), margin: '0 0 4px' }}>{reanuda ? 'Retomá tu intento' : 'Antes de empezar'}</h3>
        {reglas.intro && <p style={{ fontSize: letra(13.5), marginTop: 0, marginBottom: 6, whiteSpace: 'pre-line', color: 'rgb(var(--textSec))', lineHeight: 1.55 }}>{reglas.intro}</p>}
        <div className="ev-reglas" style={{ fontSize: letra(13) }}>
          <div className="ev-regla"><b>{reglas.cantidadPreguntas}</b><span>pregunta{reglas.cantidadPreguntas === 1 ? '' : 's'}</span></div>
          <div className="ev-regla"><b>{hayTiempo ? `${reglas.tiempoMin} min` : 'Sin límite'}</b><span>de tiempo</span></div>
          <div className="ev-regla"><b>{formatoPuntos(reglas.minimo)} de {formatoPuntos(reglas.total)}</b><span>puntos para aprobar</span></div>
          <div className="ev-regla"><b>{reglas.intentos}</b><span>intento{reglas.intentos === 1 ? '' : 's'}{reglas.intentos > 1 && reglas.esperaDias > 0 ? ` · ${reglas.esperaDias} día${reglas.esperaDias === 1 ? '' : 's'} de espera` : ''}</span></div>
        </div>
        {reanuda
          ? <div className="ev-aviso">Tenés un intento en curso. Al retomarlo, <b>el tiempo sigue corriendo desde que lo empezaste</b>.</div>
          : <div className="ev-aviso">{hayTiempo ? <>Cuando toques <b>Comenzar</b> arranca el cronómetro y <b>no se puede pausar</b>. </> : null}Una vez enviado, <b>no podés modificar tus respuestas</b>. Si cerrás la página sin enviar, el intento cuenta como usado.</div>}
        <div className="quiz-field"><label>Nombre y apellido <span className="req">*</span></label>
          <input className="ctrl" type="text" autoComplete="name" value={nombre} onChange={(e) => setNombre(e.target.value.replace(/[0-9]/g, ''))} placeholder="Como figura en tu certificado" />
        </div>
        {!reglas.edicion && (
          <div className="quiz-field"><label>Número de edición <span className="req">*</span></label>
            <input className="ctrl" type="text" inputMode="numeric" value={edicion} onChange={(e) => setEdicion(e.target.value.replace(/\D/g, ''))} placeholder="Ej: 35" />
          </div>
        )}
        {error && <div className="err" style={{ display: 'block' }}>{error}</div>}
      </div>,
      <div className="quiz-foot">
        <button className="btn btn-ghost" onClick={() => setFase('datos')} disabled={cargando}>Atrás</button>
        <button className="btn btn-teal" style={{ flex: 1 }} onClick={comenzar} disabled={cargando}>{cargando ? 'Iniciando…' : reanuda ? 'Retomar' : 'Comenzar'}</button>
      </div>
    );
  }

  // ── Examen
  if ((fase === 'examen' || fase === 'confirmar') && intento) {
    const p = intento.preguntas[paso];
    const progreso = fase === 'confirmar' ? 100 : Math.round((paso / total) * 100);
    return (
      <div className="quizstage"><style dangerouslySetInnerHTML={{ __html: ESTILO }} /><div className="quizcard quizcard-act quizcard-ev">
        {intento.prueba && <div className="ev-prueba">MODO PRUEBA · no se guarda nada</div>}
        {banda}
        <div className="quiz-prog"><div className="quiz-prog-fill" style={{ width: progreso + '%' }} /></div>
        <div className="quiz-body">
          {fase === 'confirmar' ? (
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <h3 style={{ fontSize: letra(17), margin: '0 0 10px' }}>¿Querés enviar tus respuestas?</h3>
              <p className="muted" style={{ fontSize: letra(13.5), lineHeight: 1.5 }}>
                {sinResponder > 0 ? <>Te quedan <b>{sinResponder}</b> pregunta{sinResponder === 1 ? '' : 's'} sin responder (cuentan como incorrectas). </> : <>Respondiste las {total} preguntas. </>}
                Una vez enviada, <b>no vas a poder modificarlas</b>.
              </p>
              {restante != null && <p className="muted" style={{ fontSize: letra(13) }}>Tiempo restante: <b>{mmss(restante)}</b></p>}
            </div>
          ) : (
            <>
              <div className="quiz-count">Pregunta {paso + 1} de {total}</div>
              {p.situacion && <div className="ev-situ" style={{ fontSize: letra(13.5), marginTop: 8 }}>{p.situacion}</div>}
              <h3 style={{ fontSize: letra(18), margin: '8px 0 16px', lineHeight: 1.3 }}>{paso + 1}. {p.pregunta}</h3>
              {p.opciones.map((op, j) => (String(op).trim() ? (
                <div key={j} className={'quiz-opt' + (resp[p.i] === j ? ' sel' : '')} onClick={() => setResp((r) => ({ ...r, [p.i]: j }))}
                  role="radio" aria-checked={resp[p.i] === j} tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setResp((r) => ({ ...r, [p.i]: j }))}>
                  <span className="dot" /><div>{op}</div>
                </div>
              ) : null))}
            </>
          )}
          {error && <div className="err" style={{ display: 'block', marginTop: 6 }}>{error}</div>}
        </div>
        <div className="quiz-foot">
          {(paso > 0 || fase === 'confirmar') && <button className="btn btn-ghost" onClick={() => (fase === 'confirmar' ? setFase('examen') : setPaso(paso - 1))} disabled={cargando}>{fase === 'confirmar' ? 'Revisar' : 'Atrás'}</button>}
          {fase === 'confirmar'
            ? <button className="btn btn-teal" style={{ flex: 1 }} onClick={() => enviar(false)} disabled={cargando}>{cargando ? 'Enviando…' : error ? 'Reintentar envío' : 'Sí, enviar'}</button>
            : <button className="btn btn-teal" style={{ flex: 1 }} onClick={() => (paso < total - 1 ? setPaso(paso + 1) : setFase('confirmar'))}>{paso < total - 1 ? 'Siguiente' : 'Revisar y enviar'}</button>}
        </div>
      </div></div>
    );
  }

  // ── Resultado
  if (fase === 'resultado' && resultado) {
    const r = resultado;
    const px = r.proximo || {};
    return (
      <div className="quizstage"><style dangerouslySetInnerHTML={{ __html: ESTILO }} /><div className="quizcard quizcard-act quizcard-ev">
        {r.prueba && <div className="ev-prueba">MODO PRUEBA · no se guardó nada</div>}
        {banda}
        <div className="quiz-body" style={{ textAlign: 'center' }}>
          <div className={'ev-score' + (r.aprobado ? '' : ' no')}><b>{formatoPuntos(r.puntaje)}</b><span>de {formatoPuntos(r.total)}</span></div>
          <span className={'ev-chip ' + (r.aprobado ? 'ok' : 'no')}>{r.aprobado ? '¡Aprobaste!' : r.fueraDeTiempo ? 'Fuera de tiempo' : 'No aprobaste'}</span>
          <p className="muted" style={{ fontSize: letra(13.5), lineHeight: 1.55, margin: '12px 0 4px' }}>
            {r.fueraDeTiempo
              ? 'El tiempo se terminó antes de que se enviaran tus respuestas, así que este intento no se pudo corregir.'
              : <>Necesitabas {formatoPuntos(r.minimo)} puntos para aprobar. Intento {r.intento} de {r.maxIntentos} · {formatoDuracion(r.duracionSeg)}.</>}
          </p>
          {!r.prueba && <p className="muted" style={{ fontSize: letra(12.5), margin: '0 0 6px' }}>{r.emailOk ? 'Te enviamos el resultado por correo.' : 'No pudimos enviarte el correo con el resultado, pero tu intento quedó guardado.'}</p>}
          {r.aprobado && r.linkDiploma && <a className="btn btn-teal ev-btn-diploma" href={r.linkDiploma} target="_blank" rel="noopener noreferrer">Ver mi diploma</a>}
          {!r.aprobado && px.permitido && <div className="ev-aviso" style={{ textAlign: 'left' }}>Podés volver a intentarlo. Te {r.maxIntentos - r.intento === 1 ? 'queda 1 intento' : `quedan ${r.maxIntentos - r.intento} intentos`}.</div>}
          {!r.aprobado && px.motivo === 'esperar_dias' && <div className="ev-aviso" style={{ textAlign: 'left' }}>Podés volver a rendir en <b>{px.diasRestantes} día{px.diasRestantes === 1 ? '' : 's'}</b>. Te avisamos por correo.</div>}
          {!r.aprobado && px.motivo === 'sin_intentos' && <div className="ev-aviso" style={{ textAlign: 'left' }}>Usaste todos tus intentos. Si necesitás uno más, escribinos{r.contacto ? `: ${r.contacto}` : ''}.</div>}
          {r.revisionPendiente && <p className="muted" style={{ fontSize: letra(12.5), marginTop: 14 }}>La revisión de tus respuestas (con las correctas y su justificación) se muestra cuando aprobás o cuando usás todos tus intentos.</p>}
          {r.revision && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ fontSize: letra(16), margin: '0 0 10px', textAlign: 'left' }}>Revisión de tus respuestas</h3>
              {r.revision.map((x, k) => (
                <div key={x.i} className={'ev-rev ' + (x.ok ? 'ok' : 'no')} style={{ fontSize: letra(13) }}>
                  <div className="q">{k + 1}. {x.pregunta}</div>
                  <div className="o">{x.ok ? '✓' : '✗'} Tu respuesta: {x.elegido == null ? <i>sin responder</i> : x.opciones[x.elegido]}</div>
                  {!x.ok && <div className="o" style={{ color: 'rgb(var(--accentTeal))' }}>✓ Correcta: {x.opciones[x.correcta]}</div>}
                  {x.justificacion && <div className="j">{x.justificacion}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="quiz-foot">
          {!r.aprobado && px.permitido && <button className="btn btn-teal" style={{ flex: 1 }} onClick={otroIntento}>Volver a intentar</button>}
        </div>
        <PieFinal />
      </div></div>
    );
  }
  return null;
}
