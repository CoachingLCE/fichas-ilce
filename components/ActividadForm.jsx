'use client';
import { useState } from 'react';
import { validarEmail } from '../lib/validacion';

export default function ActividadForm({ act }) {
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [edicion, setEdicion] = useState('');
  const [resp, setResp] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  function elegir(i, opt) { setResp((r) => ({ ...r, [i]: opt })); setError(''); }

  async function enviar() {
    if (!validarEmail(email)) { setError('Ingresá un correo válido.'); return; }
    if (act.preguntas.some((_, i) => resp[i] == null)) { setError('Respondé todas las preguntas.'); return; }
    setEnviando(true); setError('');
    try {
      const res = await fetch('/api/actividad', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: act.slug, email, nombre, edicion, respuestas: resp })
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
      <div className="stage"><div className="phone">
        <div className="f-band"><div className="kd">ACTIVIDAD</div><div className="ti">{act.curso}</div></div>
        <div className="success">
          <div className="ring">✓</div>
          <h3 style={{ fontSize: 20 }}>¡Actividad enviada!</h3>
          <p className="f-lead">Tu resultado en <b>{act.titulo}</b>:</p>
          <div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 40, color: 'rgb(var(--accentTeal))' }}>{resultado.puntaje} / {resultado.total}</div>
          <p className="f-lead" style={{ marginTop: 4 }}>{pct}% correctas{resultado.emailOk ? ` · te enviamos el detalle a ${email}` : ''}</p>
        </div>
      </div></div>
    );
  }

  return (
    <div className="stage"><div className="phone">
      <div className="f-band"><div className="kd">ACTIVIDAD · {act.curso.toUpperCase()}</div><div className="ti">{act.titulo}</div></div>
      <div className="f-body">
        <div className="field"><label>Correo <span className="req">*</span></label>
          <input className="ctrl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tunombre@correo.com" /></div>
        <div className="field"><label>Nombre y apellido</label>
          <input className="ctrl" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Tu nombre" /></div>
        <div className="field"><label>Número de edición</label>
          <input className="ctrl" value={edicion} onChange={(e) => setEdicion(e.target.value)} placeholder="Ej: 15" /></div>

        {act.preguntas.map((p, i) => (
          <div className="field" key={i}>
            <label>{i + 1}. {p.pregunta} <span className="req">*</span></label>
            {(p.opciones || []).map((op, j) => (
              <div key={j} className={'opt' + (resp[i] === j ? ' sel' : '')} onClick={() => elegir(i, j)} role="radio" aria-checked={resp[i] === j} tabIndex={0}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && elegir(i, j)}>
                <span className="dot" /><div>{op}</div>
              </div>
            ))}
          </div>
        ))}
        {error && <div className="err" style={{ display: 'block' }}>{error}</div>}
      </div>
      <div className="f-foot">
        <button className="btn btn-teal" style={{ flex: 1 }} onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar actividad'}</button>
      </div>
    </div></div>
  );
}
