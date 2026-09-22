'use client';
import { useState, useRef } from 'react';
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

export default function ActividadForm({ act }) {
  const [step, setStep] = useState(0); // 0 = datos, 1..N = preguntas
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  // Si quien armó la actividad ya le puso una edición, no hace falta preguntársela
  // de nuevo al estudiante (y de paso se evita que la escriba mal).
  const [edicion, setEdicion] = useState(act.edicion || '');
  const [resp, setResp] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const inicioRef = useRef(Date.now());

  const total = act.preguntas.length;
  const esDatos = step === 0;
  const qIndex = step - 1;

  function elegir(opt) { setResp((r) => ({ ...r, [qIndex]: opt })); setError(''); }

  function siguiente() {
    if (esDatos) {
      if (!validarEmail(email)) { setError('Ingresá un correo válido.'); return; }
      setError(''); setStep(1); return;
    }
    if (resp[qIndex] == null) { setError('Elegí una opción para continuar.'); return; }
    setError('');
    if (step < total) setStep(step + 1);
    else enviar();
  }
  function atras() { if (step > 0) { setError(''); setStep(step - 1); } }

  async function enviar() {
    setEnviando(true); setError('');
    try {
      const res = await fetch('/api/actividad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: act.slug, email, nombre, edicion, respuestas: resp, duracion: Math.round((Date.now() - inicioRef.current) / 1000) })
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'No se pudo enviar'); setEnviando(false); return; }
      setResultado(data);
    } catch { setError('Error de conexión'); }
    setEnviando(false);
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
          <h3 style={{ fontSize: 22, margin: '4px 0' }}>¡Actividad enviada!</h3>
          {act.mostrarResultado === false ? (
            <p className="muted" style={{ fontSize: 14 }}>Registramos tus respuestas de <b>{act.titulo}</b>{resultado.emailOk ? ` y te enviamos el detalle a ${email}` : ''}.</p>
          ) : (<>
            <p className="muted" style={{ fontSize: 14 }}>Tu resultado en <b>{act.titulo}</b>:</p>
            <div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 48, color: 'rgb(var(--accentTeal))', margin: '6px 0' }}>{resultado.puntaje} / {resultado.total}</div>
            <p className="muted" style={{ fontSize: 14 }}>{pct}% correctas{resultado.emailOk ? ` · te enviamos el detalle a ${email}` : ''}</p>
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

  const p = esDatos ? null : act.preguntas[qIndex];
  const progreso = esDatos ? 0 : Math.round((step / (total + 1)) * 100);

  return (
    <div className="quizstage"><div className="quizcard">
      <div className="quiz-band">
        <div className="quiz-band-top"><div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}</div><Isologo size={20} /></div>
        <div className="ti">{act.titulo}</div>
      </div>
      <div className="quiz-prog"><div className="quiz-prog-fill" style={{ width: (esDatos ? 4 : progreso) + '%' }} /></div>

      <div className="quiz-body">
        {esDatos ? (
          <>
            <h3 style={{ fontSize: 18, margin: '0 0 4px' }}>Antes de empezar</h3>
            {act.intro
              ? <p className="quiz-intro" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 16, whiteSpace: 'pre-line', color: 'rgb(var(--textSec))', lineHeight: 1.55 }}>{act.intro}</p>
              : <p className="muted" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 16 }}>Completá tus datos y respondé las {total} preguntas. Se corrige al enviar.</p>}
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
        ) : (
          <>
            <div className="quiz-count">Pregunta {step} de {total}</div>
            <h3 style={{ fontSize: 18, margin: '4px 0 16px', lineHeight: 1.3 }}>{p.pregunta}</h3>
            {(p.opciones || []).map((op, j) => (
              <div key={j} className={'quiz-opt' + (resp[qIndex] === j ? ' sel' : '')} onClick={() => elegir(j)}
                role="radio" aria-checked={resp[qIndex] === j} tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && elegir(j)}>
                <span className="dot" /><div>{op}</div>
              </div>
            ))}
          </>
        )}
        {error && <div className="err" style={{ display: 'block', marginTop: 6 }}>{error}</div>}
      </div>

      <div className="quiz-foot">
        {step > 0 && <button className="btn btn-ghost" onClick={atras} disabled={enviando}>Atrás</button>}
        <button className="btn btn-teal" style={{ flex: 1 }} onClick={siguiente} disabled={enviando}>
          {enviando ? 'Enviando…' : esDatos ? 'Comenzar' : step < total ? 'Siguiente' : 'Enviar actividad'}
        </button>
      </div>
    </div></div>
  );
}
