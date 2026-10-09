'use client';
import { useState } from 'react';
import { CURSOS } from '../lib/constants';
import { cursoInicial } from '../lib/formularioCurso';
import { validarEmail, inferirTipoCampo, validarValorCampo, filtrarTelefono, partirMultiple } from '../lib/validacion';
import { Isologo } from './Isologo';


// Texto de ayuda de una pregunta: respeta los saltos de línea (una línea debajo de la otra) y convierte los links
// (http/https) en enlaces que se pueden tocar. Se arma con elementos de React, no con HTML crudo.
function Ayuda({ texto }) {
  if (!texto) return null;
  const partes = String(texto).split(/(https?:\/\/[^\s]+)/g);
  return (
    <div className="quiz-help" style={{ whiteSpace: 'pre-line' }}>
      {partes.map((p, i) => {
        if (!/^https?:\/\//.test(p)) return <span key={i}>{p}</span>;
        const m = p.match(/^(.*?)([).,;:!?]*)$/);
        return <span key={i}><a href={m[1]} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline', wordBreak: 'break-all' }}>{m[1]}</a>{m[2]}</span>;
      })}
    </div>
  );
}

export default function FormularioForm({ form, vistaPrevia = false }) {
  const [val, setVal] = useState({ curso: cursoInicial(form) }); // '' = sin curso (ver cursoInicial)
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => { setVal((s) => ({ ...s, [k]: v })); setError(''); };

  async function enviar() {
    if (vistaPrevia) return; // en la vista previa del constructor no se envía nada
    if (!form.anonimo && !validarEmail(val.email)) { setError('Ingresá un correo válido.'); return; }
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
            <div className="quiz-ring"></div>
            <h3 style={{ fontSize: 22, margin: '4px 0' }}>¡Gracias por responder!</h3>
            <p className="muted" style={{ fontSize: 14 }}>Registramos tus respuestas correctamente.</p>
          </div>
          <div className="cta-title">¿Qué te gustaría hacer ahora?</div>
          <div className="cta-cards">
            <div className="cta-card">
              <div className="cta-emoji"></div>
              <div className="cta-h">Seguir aprendiendo</div>
              <div className="cta-d">Leé una nota recomendada de nuestro blog.</div>
              <a className="cta-btn" href="https://www.coachingeducativolider.com/blog" target="_blank" rel="noopener noreferrer">Ir al Blog</a>
            </div>
            <div className="cta-card">
              <div className="cta-emoji"></div>
              <div className="cta-h">Volver al Campus</div>
              <div className="cta-d">Continuá con tus clases, actividades y materiales.</div>
              <a className="cta-btn cta-btn-primary" href="http://campus.institutoilce.com/" target="_blank" rel="noopener noreferrer">Volver al Campus</a>
            </div>
            <div className="cta-card">
              <div className="cta-emoji"></div>
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
          <Ayuda texto={c.help} />
          <div className="escala" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 10, width: '100%' }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" className={'escala-b' + (Number(val[c.key]) === n ? ` on on-${n}` : '')} style={{ width: '100%', height: 50 }} onClick={() => set(c.key, n)}>{n}</button>
            ))}
          </div>
        </div>
      );
    }
    if (c.tipo === 'grilla') {
      // Casillas por fila y columna (ej.: disponibilidad por día y horario). Se guarda como un solo texto
      // ("Lunes 10 a 11, Martes 19 a 20"), en el orden de la grilla, así se lee igual en Respuestas y en las exportaciones.
      const filas = c.filas || []; const cols = c.columnas || [];
      const marcadas = new Set(String(val[c.key] || '').split(', ').filter(Boolean));
      const alternar = (item) => {
        const s = new Set(marcadas); if (s.has(item)) s.delete(item); else s.add(item);
        set(c.key, filas.flatMap((f) => cols.map((co) => `${f} ${co}`)).filter((x) => s.has(x)).join(', '));
      };
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          <Ayuda texto={c.help} />
          <div className="grilla-wrap">
            <table className="grilla" data-sin-tarjetas>
              <thead><tr><th scope="col"><span className="sr-only">Día</span></th>{cols.map((co) => <th scope="col" key={co}>{co}</th>)}</tr></thead>
              <tbody>{filas.map((f) => (
                <tr key={f}><th scope="row">{f}</th>{cols.map((co) => {
                  const item = `${f} ${co}`;
                  return <td key={co}><input type="checkbox" aria-label={`${f}, ${co}`} checked={marcadas.has(item)} onChange={() => alternar(item)} /></td>;
                })}</tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      );
    }
    if (c.tipo === 'multiple') {
      // Opción múltiple: se pueden marcar varias. Se guarda como un solo texto, en el orden de la lista ("Sí, en mis redes, No").
      const ops = c.opciones || [];
      const marcadas = new Set(partirMultiple(val[c.key], ops) || []);
      const alternar = (o) => {
        const s = new Set(marcadas); if (s.has(o)) s.delete(o); else s.add(o);
        set(c.key, ops.filter((x) => s.has(x)).join(', '));
      };
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          <Ayuda texto={c.help} />
          <div role="group" aria-label={c.label} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
            {ops.map((o) => (
              <label key={o} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.35, cursor: 'pointer', margin: 0, padding: '10px 12px', borderRadius: 10, border: '1px solid rgb(var(--border))', background: marcadas.has(o) ? 'rgb(var(--accentTeal) / .12)' : 'rgb(var(--surface2))' }}><input type="checkbox" checked={marcadas.has(o)} onChange={() => alternar(o)} style={{ marginTop: 3, flex: 'none' }} /> <span>{o}</span></label>
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
          <Ayuda texto={c.help} />
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
          <Ayuda texto={c.help} />
          <input className="ctrl" type="text" inputMode="numeric" pattern="[0-9]*" value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value.replace(/\D/g, ''))} placeholder={c.placeholder || ''} />
        </div>
      );
    }
    if (inferido === 'telefono') {
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          <Ayuda texto={c.help} />
          <input className="ctrl" type="text" inputMode="tel" value={val[c.key] || ''} onChange={(e) => set(c.key, filtrarTelefono(e.target.value))} placeholder={c.placeholder || ''} />
        </div>
      );
    }
    if (inferido === 'nombre') {
      return (
        <div className="quiz-field" key={c.key}>
          <label>{c.label}{c.required && <span className="req"> *</span>}</label>
          <Ayuda texto={c.help} />
          <input className="ctrl" type="text" value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value.replace(/[0-9]/g, ''))} placeholder={c.placeholder || ''} />
        </div>
      );
    }
    // texto / email
    return (
      <div className="quiz-field" key={c.key}>
        <label>{c.label}{c.required && <span className="req"> *</span>}</label>
        <Ayuda texto={c.help} />
        <input className="ctrl" type={c.tipo === 'email' ? 'email' : 'text'} value={val[c.key] || ''} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder || ''} />
      </div>
    );
  }

  // La sección "Tu experiencia hasta ahora" agrupa varias escalas (feedback). Si el formulario tiene una sola, va en su lugar, sin título de sección.
  const agrupar = form.campos.filter((c) => c.tipo === 'escala').length >= 2;
  const escalas = agrupar ? form.campos.filter((c) => c.tipo === 'escala') : [];
  const otros = agrupar ? form.campos.filter((c) => c.tipo !== 'escala') : form.campos;
  return (
    <div className="quizstage"><div className="quizcard quizcard-form">
      <div className="quiz-band">
        <div className="quiz-band-top"><div className="kd">FORMULARIO</div><Isologo size={22} /></div>
        <div className="ti">{form.titulo}</div>
        {form.cursoFijo && <div className="quiz-band-sub">{form.cursoFijo}</div>}
      </div>
      <div className="quiz-body">
        {form.intro && <div className="quiz-intro-box">{form.intro}</div>}
        {/* Correo siempre primero (salvo en los formularios anónimos) */}
        {!form.anonimo && (
          <div className="quiz-field">
            <label>Correo <span className="req">*</span></label>
            <input className="ctrl" type="email" value={val.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="tunombre@correo.com" />
          </div>
        )}
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
        <button className="btn btn-teal quiz-submit" onClick={enviar} disabled={enviando || vistaPrevia}>{enviando ? 'Enviando…' : 'Enviar respuestas'}</button>
      </div>
    </div></div>
  );
}
