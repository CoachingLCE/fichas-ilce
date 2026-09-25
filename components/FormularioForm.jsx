'use client';
import { useState } from 'react';
import { CURSOS } from '../lib/constants';
import { validarEmail, inferirTipoCampo, validarValorCampo, filtrarTelefono } from '../lib/validacion';
import { Isologo } from './Isologo';

export default function FormularioForm({ form }) {
  const [val, setVal] = useState({ curso: CURSOS[0].nombre });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => { setVal((s) => ({ ...s, [k]: v })); setError(''); };

  async function enviar() {
    if (!validarEmail(val.email)) { setError('Ingresá un correo válido.'); return; }
    for (const c of form.campos) {
      if (c.required && (val[c.key] == null || String(val[c.key]).trim() === '')) { setError('Completá: ' + c.label); return; }
      const msgCampo = validarValorCampo(c, val[c.key]);
      if (msgCampo) { setError(msgCampo); return; }
    }
    setEnviando(true); setError('');
    try {
      const res = await fetch('/api/formulario', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: form.slug, respuestas: val })
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'No se pudo enviar'); setEnviando(false); return; }
      setEnviado(true);
    } catch { setError('Error de conexión'); }
    setEnviando(false);
  }

  if (enviado) {
    return (
      <div className="quizstage"><div className="quizcard quizcard-form">
        <div className="quiz-band"><div className="quiz-band-top"><div className="kd">FORMULARIO</div><Isologo size={20} /></div><div className="ti">{form.titulo}</div></div>
        <div className="quiz-body" style={{ padding: '36px 30px 30px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="quiz-ring">✓</div>
            <h3 style={{ fontSize: 22, margin: '4px 0' }}>¡Gracias por responder!</h3>
            <p className="muted" style={{ fontSize: 14 }}>Registramos tus respuestas correctamente.</p>
          </div>
          <div className="cta-title">¿Qué te gustaría hacer ahora?</div>
          <div className="cta-cards">
            <div className="cta-card">
              <div className="cta-emoji">📚</div>
              <div className="cta-h">Seguir aprendiendo</div>
              <div className="cta-d">Leé una nota recomendada de nuestro blog.</div>
              <a className="cta-btn" href="https://www.coachingeducativolider.com/blog" target="_blank" rel="noopener noreferrer">Ir al Blog</a>
            </div>
            <div className="cta-card">
              <div className="cta-emoji">🎓</div>
              <div className="cta-h">Volver al Campus</div>
              <div className="cta-d">Continuá con tus clases, actividades y materiales.</div>
              <a className="cta-btn cta-btn-primary" href="http://campus.institutoilce.com/" target="_blank" rel="noopener noreferrer">Volver al Campus</a>
            </div>
            <div className="cta-card">
              <div className="cta-emoji">📱</div>
              <div className="cta-h">Seguinos en Instagram</div>
              <div className="cta-d">Conocé novedades, eventos, recursos y contenidos nuevos.</div>
              <a className="cta-btn" href="https://www.instagram.com/institutoilce" target="_blank" rel="noopener noreferrer">Ir a Instagram</a>
            </div>
          </div>
        </div>
      </div></div>
    );
  }

  function campo(c) {
    if (c.tipo === 'escala') {
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          <div className="escala">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={'escala-b' + (Number(val[c.key]) === n ? ` on on-${n}` : '')} onClick={() => set(c.key, n)}>{n}</button>
            ))}
          </div>
        </div>
      );
    }
    if (c.tipo === 'select') {
      const ops = c.opciones && c.opciones.length ? c.opciones : CURSOS.map((x) => x.nombre);
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          <select className="ctrl" value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value)}>
            {!c.opciones && <option value="">Elegí…</option>}
            {ops.map((o) => <option key={o}>{o}</option>)}
          </select>
        </div>
      );
    }
    if (c.tipo === 'textarea') {
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          {c.help && <div className="quiz-help">{c.help}</div>}
          <textarea className="ctrl" style={{ minHeight: 84, resize: 'vertical' }} value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value)} />
        </div>
      );
    }
    // El campo no trae un "tipo" explícito para número/teléfono/nombre (los Formularios se
    // arman escribiendo el JSON a mano) — se infiere del label para no dejar pasar libremente
    // cosas como un nombre con números o un WhatsApp con letras.
    const inferido = inferirTipoCampo(c);
    if (inferido === 'numero') {
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          {c.help && <div className="quiz-help">{c.help}</div>}
          <input className="ctrl" type="text" inputMode="numeric" pattern="[0-9]*" value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value.replace(/\D/g, ''))} placeholder={c.placeholder || ''} />
        </div>
      );
    }
    if (inferido === 'telefono') {
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          {c.help && <div className="quiz-help">{c.help}</div>}
          <input className="ctrl" type="text" inputMode="tel" value={val[c.key] || ''} onChange={(e) => set(c.key, filtrarTelefono(e.target.value))} placeholder={c.placeholder || ''} />
        </div>
      );
    }
    if (inferido === 'nombre') {
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          {c.help && <div className="quiz-help">{c.help}</div>}
          <input className="ctrl" type="text" value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value.replace(/[0-9]/g, ''))} placeholder={c.placeholder || ''} />
        </div>
      );
    }
    // texto / email
    return (
      <div className="quiz-field" key={c.key}>
        <label>{c.label}{c.required && <span className="req"> *</span>}</label>
        {c.help && <div className="quiz-help">{c.help}</div>}
        <input className="ctrl" type={c.tipo === 'email' ? 'email' : 'text'} value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder || ''} />
      </div>
    );
  }

  const escalas = form.campos.filter((c) => c.tipo === 'escala');
  const otros = form.campos.filter((c) => c.tipo !== 'escala');
  return (
    <div className="quizstage"><div className="quizcard quizcard-form">
      <div className="quiz-band">
        <div className="quiz-band-top"><div className="kd">FORMULARIO</div><Isologo size={22} /></div>
        <div className="ti">{form.titulo}</div>
        {form.cursoFijo && <div className="quiz-band-sub">{form.cursoFijo}</div>}
      </div>
      <div className="quiz-body">
        {form.intro && <div className="quiz-intro-box">{form.intro}</div>}
        {/* Correo siempre primero */}
        <div className="quiz-field">
          <label>Correo <span className="req">*</span></label>
          <input className="ctrl" type="email" value={val.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="tunombre@correo.com" />
        </div>
        {otros.map((c) => campo(c))}
        {escalas.length > 0 && (
          <div className="quiz-section">
            <div className="quiz-section-h">Tu experiencia hasta ahora</div>
            <div className="quiz-section-hint">Realizá una valoración siendo <b>1</b> el puntaje más bajo y <b>5</b> el más alto.</div>
            {escalas.map((c) => campo(c))}
          </div>
        )}
        {error && <div className="err" style={{ display: 'block', marginTop: 6 }}>{error}</div>}
      </div>
      <div className="quiz-foot">
        <button className="btn btn-teal quiz-submit" onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar respuestas'}</button>
      </div>
    </div></div>
  );
}
