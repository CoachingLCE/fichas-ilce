'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { PAISES, PROVINCIAS_AR } from '../lib/constants';
import { validarEmail, validarWhatsapp, validarDoc, esArgentina } from '../lib/validacion';

const STEP_NAMES = ['Bienvenida', 'Edición y horario', 'Datos personales', 'Sobre vos', 'Revisión', '¡Listo!'];

export default function FichaWizard({ def }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ pais: 'Argentina' });
  const [errs, setErrs] = useState({});
  const [saved, setSaved] = useState('');      // texto del chip
  const [saving, setSaving] = useState(false);
  const [token, setToken] = useState('');
  const [recover, setRecover] = useState(null); // {ts} si hay borrador
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null); // {ok, emailOk} tras enviar
  const saveTimer = useRef(null);
  const inicioRef = useRef(null);

  const draftKey = useCallback((t) => `ilce_draft_${def.slug}_${t}`, [def.slug]);

  // --- init: token desde la URL o generado; recuperar borrador del navegador ---
  useEffect(() => {
    const url = new URL(window.location.href);
    let t = url.searchParams.get('token');
    if (!t) {
      t = 'CD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
      url.searchParams.set('token', t);
      window.history.replaceState(null, '', url.toString());
    }
    setToken(t);
    try {
      const raw = localStorage.getItem(draftKey(t));
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.form && Object.keys(d.form).length > 1) {
          setForm(d.form); setStep(d.step || 0); setRecover({ ts: d.ts });
          setSaved(chipHora(new Date(d.ts)));
        }
      }
    } catch {}
  }, [draftKey]);

  function chipHora(dt) {
    return '✓ Guardado ' + dt.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  // --- autoguardado en el navegador (sin costo), con debounce ---
  const persist = useCallback((f, s) => {
    if (!token) return;
    const payload = { form: f, step: s, ts: Date.now() };
    try { localStorage.setItem(draftKey(token), JSON.stringify(payload)); } catch {}
    setSaving(false); setSaved(chipHora(new Date()));
  }, [token, draftKey]);

  function set(k, v) {
    setForm((prev) => {
      const next = { ...prev, [k]: v };
      if (!inicioRef.current) { inicioRef.current = new Date().toISOString(); next._inicio = inicioRef.current; }
      setSaving(true);
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => persist(next, step), 500);
      return next;
    });
    setErrs((e) => { if (!e[k]) return e; const c = { ...e }; delete c[k]; return c; });
  }

  function copiarEnlace() {
    const url = new URL(window.location.href);
    url.searchParams.set('token', token);
    navigator.clipboard?.writeText(url.toString());
    alert('Enlace copiado. Con ese link retomás la ficha donde la dejaste (en este dispositivo).');
  }

  // --- validación por paso ---
  function validarPaso(s) {
    const e = {};
    const arg = esArgentina(form.pais);
    if (s === 0 && !validarEmail(form.email)) e.email = 'Ingresá un correo válido.';
    if (s === 1 && def.ediciones.length && !form.edicion) e.edicion = 'Elegí una edición.';
    if (s === 2) {
      if (!(form.nom || '').trim()) e.nom = 'Completá tu nombre.';
      if (!(form.ape || '').trim()) e.ape = 'Completá tu apellido.';
      if (!(form.prov || '').trim()) e.prov = 'Completá este dato.';
      if (!validarDoc(form.doc, form.pais)) e.doc = arg ? 'DNI (7-8) o CUIT (11) válido.' : 'Documento inválido.';
      if (!(form.loc || '').trim()) e.loc = 'Completá tu localidad.';
      if (!validarWhatsapp(form.wa)) e.wa = 'WhatsApp inválido.';
      if (!form.modalidad) e.modalidad = 'Elegí una modalidad.';
    }
    if (s === 3) {
      if (!form.origen) e.origen = 'Elegí una opción.';
      if (!form.medio) e.medio = 'Elegí una opción.';
      if (!(form.sobre || '').trim()) e.sobre = 'Contanos algo, aunque sea breve.';
      if (!form.cons) e.cons = 'Necesitamos tu consentimiento.';
    }
    return e;
  }
  function next() {
    const e = validarPaso(step);
    setErrs(e);
    if (Object.keys(e).length) return;
    const s = step + 1; setStep(s); persist(form, s);
  }
  function prev() { const s = step - 1; setStep(s); persist(form, s); }
  function go(s) { setStep(s); }

  async function enviar() {
    setEnviando(true);
    try {
      const res = await fetch('/api/inscripcion', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: def.slug, token, form })
      });
      const data = await res.json();
      if (!data.ok) {
        if (data.errores) setErrs(data.errores);
        alert(data.error || 'No se pudo enviar. Revisá los datos.');
        setEnviando(false);
        return;
      }
      try { localStorage.removeItem(draftKey(token)); } catch {}
      setResultado(data); setStep(5);
    } catch (err) {
      alert('Error de conexión al enviar. Probá de nuevo.');
    }
    setEnviando(false);
  }
  function nuevaFicha() {
    const url = new URL(window.location.href);
    url.searchParams.delete('token'); window.history.replaceState(null, '', url.toString());
    const t = 'CD-' + Math.random().toString(36).slice(2, 8).toUpperCase();
    url.searchParams.set('token', t); window.history.replaceState(null, '', url.toString());
    setToken(t); setForm({ pais: 'Argentina' }); setStep(0); setErrs({}); setResultado(null); setRecover(null); inicioRef.current = null;
  }

  const arg = esArgentina(form.pais);
  const Radio = ({ k, val, label, sub }) => (
    <div className={'opt' + (form[k] === val ? ' sel' : '')} onClick={() => set(k, val)}>
      <span className="dot" /><div><span>{label}</span>{sub && <span className="sub">{sub}</span>}</div>
    </div>
  );

  return (
    <div className={'stage' + (step === 5 ? ' stage-done' : '')}>
      <div className={'phone' + ((step === 2 || step === 3) ? ' phone-wide' : '')}>
        <div className="f-band">
          <div className="kd">FORMACIÓN EN</div>
          <div className="ti">{def.curso}</div>
        </div>

        {recover && step < 5 && (
          <div className="recover">📄 <b>Recuperamos tu ficha</b> guardada el {new Date(recover.ts).toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}. Seguimos donde la dejaste.
            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
              <button className="btn-ghost btn" style={{ padding: '7px 12px', fontSize: 13 }} onClick={() => setRecover(null)}>Continuar</button>
              <button className="btn-ghost btn" style={{ padding: '7px 12px', fontSize: 13 }} onClick={() => { try { localStorage.removeItem(draftKey(token)); } catch {}; setForm({ pais: 'Argentina' }); setStep(0); setRecover(null); }}>Empezar de nuevo</button>
            </div>
          </div>
        )}

        {step < 5 && (
          <div className="f-progress">
            <div className="f-steps">{[0, 1, 2, 3, 4].map((i) => <span key={i} className={i < step ? 'done' : (i === step ? 'cur' : '')} />)}</div>
            <div className="f-meta">
              <span className="st">Paso {step + 1} de 5 · {STEP_NAMES[step]}</span>
              <span className={'saved' + (saving ? ' saving' : '')}>{saving ? 'Guardando…' : (saved ? '✓ Guardado automáticamente' : '✓ Guardado')}</span>
            </div>
          </div>
        )}

        <div className="f-body">
          {step === 0 && (<>
            <h3>{def.titulo}</h3>
            <p className="f-lead">{def.bienvenida}</p>
            <div className={'field' + (errs.email ? ' bad' : '')}>
              <label>Correo <span className="req">*</span></label>
              <input className="ctrl" type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} placeholder="tunombre@correo.com" />
              {errs.email && <div className="err">{errs.email}</div>}
            </div>
          </>)}

          {step === 1 && (<>
            <h3>Seleccioná tu edición y horario</h3>
            <p className="f-lead">Elegí el día de cursada que mejor te queda.</p>
            <div className={'field' + (errs.edicion ? ' bad' : '')}>
              {def.ediciones.length
                ? def.ediciones.map((ed) => <Radio key={ed.id} k="edicion" val={ed.label} label={ed.label} sub={ed.horarios} />)
                : <p className="f-lead">Todavía no hay ediciones abiertas para elegir. Podés continuar y el equipo te asignará la edición al contactarte.</p>}
              {errs.edicion && <div className="err">{errs.edicion}</div>}
            </div>
          </>)}

          {step === 2 && (<>
            <div className="f-section">Datos personales</div>
            <div className="f-grid">
              <Campo err={errs.nom}><label>Nombre <span className="req">*</span></label>
                <input className="ctrl" value={form.nom || ''} onChange={(e) => set('nom', e.target.value)} placeholder="Ej.: María" /></Campo>
              <Campo err={errs.ape}><label>Apellido <span className="req">*</span></label>
                <input className="ctrl" value={form.ape || ''} onChange={(e) => set('ape', e.target.value)} placeholder="Ej.: González" /></Campo>
            </div>

            <div className="f-section">Residencia</div>
            <div className="f-grid">
              <div className="field"><label>País de residencia <span className="req">*</span></label>
                <select className="ctrl" value={form.pais || 'Argentina'} onChange={(e) => set('pais', e.target.value)}>
                  {PAISES.map((p) => <option key={p}>{p}</option>)}
                </select></div>
              <Campo err={errs.prov}><label>{arg ? 'Provincia' : 'Provincia / Estado'} <span className="req">*</span></label>
                {arg
                  ? <select className="ctrl" value={form.prov || ''} onChange={(e) => set('prov', e.target.value)}><option value="">Elegí…</option>{PROVINCIAS_AR.map((p) => <option key={p}>{p}</option>)}</select>
                  : <input className="ctrl" value={form.prov || ''} onChange={(e) => set('prov', e.target.value)} placeholder="Provincia o estado" />}
              </Campo>
              <Campo err={errs.loc} full><label>Localidad <span className="req">*</span></label>
                <input className="ctrl" value={form.loc || ''} onChange={(e) => set('loc', e.target.value)} placeholder="Ej.: La Plata" /></Campo>
            </div>

            <div className="f-section">Identificación y contacto</div>
            <div className="f-grid">
              <Campo err={errs.doc}><label>{arg ? 'DNI / CUIT' : 'Pasaporte / Documento'} <span className="req">*</span></label>
                <input className="ctrl" value={form.doc || ''} onChange={(e) => set('doc', e.target.value)} placeholder={arg ? 'Ej.: 30123456' : 'Número de documento'} />
                {!arg && <div className="help">México: INE · Bolivia, Chile, Costa Rica, Ecuador, Uruguay, Paraguay, Venezuela: cédula de identidad</div>}</Campo>
              <Campo err={errs.wa}><label>Número de WhatsApp <span className="req">*</span></label>
                <input className="ctrl" value={form.wa || ''} onChange={(e) => set('wa', e.target.value)} placeholder="Ej.: +54 9 11 5555 1234" /></Campo>
              <div className="field"><label>Fecha de nacimiento</label>
                <input className="ctrl" type="date" value={form.fnac || ''} onChange={(e) => set('fnac', e.target.value)} /></div>
              <div className="field"><label>Instagram</label>
                <input className="ctrl" value={form.ig || ''} onChange={(e) => set('ig', e.target.value)} placeholder="@usuario" /></div>
              <div className="field span2"><label>Profesión</label>
                <input className="ctrl" value={form.prof || ''} onChange={(e) => set('prof', e.target.value)} placeholder="Tu profesión" /></div>
            </div>

            <div className="f-section">Modalidad de cursada</div>
            <Campo err={errs.modalidad}>
              <Radio k="modalidad" val="Principalmente en vivo / sincrónico" label="Principalmente en vivo / sincrónico" sub="Participación principalmente en clases en tiempo real." />
              <Radio k="modalidad" val="Principalmente grabaciones / asincrónico" label="Principalmente grabaciones / asincrónico" sub="Cursada principalmente mediante contenidos grabados." />
              <Radio k="modalidad" val="Otro" label="Otro" sub="Otra modalidad de cursada." />
              {form.modalidad === 'Otro' && <input className="ctrl" style={{ marginTop: 6 }} value={form.modOtro || ''} onChange={(e) => set('modOtro', e.target.value)} placeholder="Contanos cuál" />}
            </Campo>
          </>)}

          {step === 3 && (<>
            <h3>Contanos un poco sobre vos</h3>
            <Campo err={errs.origen}><label>¿Cómo llegaste a nosotros? <span className="req">*</span></label>
              {['Facebook', 'Google', 'Instagram', 'LinkedIn', 'Recomendación', 'Otro'].map((o) => <Radio key={o} k="origen" val={o} label={o} />)}
            </Campo>
            <Campo err={errs.medio}><label>¿Por qué medio querés que te contactemos? <span className="req">*</span></label>
              {['Mail', 'WhatsApp', 'Otro'].map((o) => <Radio key={o} k="medio" val={o} label={o} />)}
            </Campo>
            <div className="field"><label>¿Hay algún tema de salud que sea importante que sepamos?</label>
              <input className="ctrl" value={form.salud || ''} onChange={(e) => set('salud', e.target.value)} placeholder="Opcional" /></div>
            <Campo err={errs.sobre}><label>¿Nos contás algo sobre vos? <span className="req">*</span></label>
              <textarea className="ctrl" value={form.sobre || ''} onChange={(e) => set('sobre', e.target.value)} placeholder="Tu motivación, experiencia, expectativas…" /></Campo>
            <div className="field"><label>Comentarios adicionales</label>
              <textarea className="ctrl" value={form.coment || ''} onChange={(e) => set('coment', e.target.value)} placeholder="Opcional" /></div>
            <Campo err={errs.cons}>
              <div className="cons"><input type="checkbox" id="cons1" checked={!!form.cons} onChange={(e) => set('cons', e.target.checked)} />
                <label htmlFor="cons1" style={{ fontWeight: 500, margin: 0 }}>Acepto los términos y el tratamiento de mis datos personales para gestionar mi inscripción. <span className="req">*</span></label></div>
            </Campo>
          </>)}

          {step === 4 && (<>
            <h3>Revisá antes de enviar</h3>
            <p className="f-lead">Verificá que esté todo bien. Podés editar cualquier sección.</p>
            {[
              ['Curso', def.curso], ['Edición', form.edicion || '—'], ['Email', form.email || '—'],
              ['Nombre', `${form.nom || ''} ${form.ape || ''}`.trim() || '—'], ['País', form.pais || 'Argentina'],
              ['Provincia', form.prov || '—'], ['Documento', form.doc || '—'], ['Localidad', form.loc || '—'],
              ['WhatsApp', form.wa || '—'], ['Modalidad', form.modalidad === 'Otro' ? `Otro: ${form.modOtro || ''}` : (form.modalidad || '—')],
              ['Nos conociste por', form.origen || '—'], ['Contacto', form.medio || '—']
            ].map(([k, v]) => <div className="rev-row" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>)}
            <div style={{ marginTop: 10 }}>
              <button className="rev-edit" onClick={() => go(2)}>Editar datos personales</button> · <button className="rev-edit" onClick={() => go(3)}>Editar respuestas</button>
            </div>
          </>)}

          {step === 5 && (
            <div className="success">
              <div className="ring">✓</div>
              <h3 className="success-title">¡Inscripción enviada con éxito!</h3>
              <p className="success-sub">Guardamos tu ficha correctamente.</p>
              {resultado?.emailOk
                ? <p className="success-email">Te enviamos un correo de confirmación a <b>{form.email}</b>.</p>
                : <p className="success-email">El correo de confirmación a <b>{form.email}</b> puede demorar unos minutos.</p>}
              <div className="success-actions">
                <a className="btn btn-wa" href={`https://api.whatsapp.com/send?phone=5491163245246&text=${encodeURIComponent(`Hola, ya cargué la ficha de inscripción de la edición de ${def.curso}.`)}`} target="_blank" rel="noreferrer">💬 Consultar por WhatsApp</a>
                <button className="btn btn-ghost btn-block" onClick={nuevaFicha}>Cargar otra ficha</button>
              </div>
              <a className="success-home" href="/">Volver al inicio</a>
            </div>
          )}
        </div>

        {step > 0 && step < 5 && <button className="linkbtn" onClick={copiarEnlace}>🔗 Copiar enlace para continuar después</button>}

        {step < 5 && (
          <div className="f-foot">
            {step === 0 && <button className="btn btn-primary" onClick={next}>Comenzar</button>}
            {step > 0 && step < 4 && (<>
              <button className="btn btn-ghost" onClick={prev}>← Atrás</button>
              <button className="btn btn-primary" onClick={next}>{step === 3 ? 'Revisar →' : 'Siguiente →'}</button>
            </>)}
            {step === 4 && (<>
              <button className="btn btn-ghost" onClick={prev} disabled={enviando}>← Atrás</button>
              <button className="btn btn-teal" style={{ flex: 1 }} onClick={enviar} disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar inscripción'}</button>
            </>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Campo({ err, full, children }) {
  return <div className={'field' + (err ? ' bad' : '') + (full ? ' span2' : '')}>{children}{err && <div className="err">{err}</div>}</div>;
}
