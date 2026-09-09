'use client';
import { useState, useRef } from 'react';
import { validarEmail } from '../lib/validacion';

export default function ActividadForm({ act }) {
  const [step, setStep] = useState(0); // 0 = datos, 1..N = preguntas
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [edicion, setEdicion] = useState('');
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
        <div className="quiz-band"><div className="kd">ACTIVIDAD</div><div className="ti">{act.curso}</div></div>
        <div className="quiz-body" style={{ textAlign: 'center', padding: '40px 30px' }}>
          <div className="quiz-ring">✓</div>
          <h3 style={{ fontSize: 22, margin: '4px 0' }}>¡Actividad enviada!</h3>
          <p className="muted" style={{ fontSize: 14 }}>Tu resultado en <b>{act.titulo}</b>:</p>
          <div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 48, color: 'rgb(var(--accentTeal))', margin: '6px 0' }}>{resultado.puntaje} / {resultado.total}</div>
          <p className="muted" style={{ fontSize: 14 }}>{pct}% correctas{resultado.emailOk ? ` · te enviamos el detalle a ${email}` : ''}</p>
        </div>
      </div></div>
    );
  }

  const p = esDatos ? null : act.preguntas[qIndex];
  const progreso = esDatos ? 0 : Math.round((step / (total + 1)) * 100);

  return (
    <div className="quizstage"><div className="quizcard">
      <div className="quiz-band">
        <div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}</div>
        <div className="ti">{act.titulo}</div>
      </div>
      <div className="quiz-prog"><div className="quiz-prog-fill" style={{ width: (esDatos ? 4 : progreso) + '%' }} /></div>

      <div className="quiz-body">
        {esDatos ? (
          <>
            <h3 style={{ fontSize: 18, margin: '0 0 4px' }}>Antes de empezar</h3>
            <p className="muted" style={{ fontSize: 13.5, marginTop: 0, marginBottom: 16 }}>Completá tus datos y respondé las {total} preguntas. Se corrige al enviar.</p>
            <div className="quiz-field"><label>Correo <span className="req">*</span></label>
              <input className="ctrl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tunombre@correo.com" /></div>
            <div className="quiz-field"><label>Nombre y apellido</label>
              <input className="ctrl" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" /></div>
            <div className="quiz-field"><label>Número de edición</label>
              <input className="ctrl" value={edicion} onChange={(e) => setEdicion(e.target.value)} placeholder="Ej: 15" /></div>
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
