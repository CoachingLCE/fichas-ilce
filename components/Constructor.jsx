'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { APP_URL } from '../lib/constants';

// Estructura estándar de la ficha ILCE (se muestra como bloques). La edición de campos con
// drag & drop llega en un lote siguiente; hoy el foco es título, bienvenida, ediciones y estado,
// que SÍ impactan en el formulario público.
const SECCIONES = [
  { titulo: 'Bienvenida', campos: [['Correo', 'Email', true]] },
  { titulo: 'Edición y horario', campos: [['Elegí día de cursada', 'Selección única', true]] },
  { titulo: 'Datos personales', campos: [
    ['Nombre', 'Texto', true], ['Apellido', 'Texto', true],
    ['País de residencia', 'País · activa DNI/Provincia', true],
    ['DNI / Pasaporte', 'Documento · condicional', true],
    ['Provincia / Estado', 'Condicional', true],
    ['Localidad', 'Texto', true], ['WhatsApp', 'WhatsApp', true],
    ['Fecha de nacimiento', 'Fecha', false], ['Modalidad de cursada', 'Selección única', true],
    ['Instagram', 'Texto', false], ['Profesión', 'Texto', false]
  ] },
  { titulo: 'Sobre vos', campos: [
    ['¿Cómo llegaste?', 'Selección única', true], ['Medio de contacto', 'Selección única', true],
    ['Tema de salud', 'Texto', false], ['Sobre vos', 'Texto largo', true],
    ['Comentarios', 'Texto largo', false], ['Consentimiento', 'Consentimiento', true]
  ] }
];

export default function Constructor({ usuario, initialSlug, showToast }) {
  const [defs, setDefs] = useState(null);
  const [sel, setSel] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoAt, setGuardadoAt] = useState(null);
  const [tick, setTick] = useState(0); // refresco del "hace X"
  const original = useRef(null);

  useEffect(() => { (async () => {
    const res = await fetch('/api/fichas?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const data = await res.json();
    if (data.ok) {
      setDefs(data.defs);
      const i = initialSlug ? Math.max(0, data.defs.findIndex((x) => x.slug === initialSlug)) : 0;
      setSel(i);
      original.current = JSON.stringify(data.defs[i]);
    }
  })(); /* eslint-disable-next-line */ }, []);

  // refresco del texto "guardado hace X"
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 15000); return () => clearInterval(t); }, []);

  // aviso al salir con cambios sin guardar
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!defs) return <div className="spin" />;
  const d = defs[sel];

  function upd(patch) {
    setDefs((arr) => arr.map((x, i) => i === sel ? { ...x, ...patch } : x));
    setDirty(true);
  }
  function seleccionar(i) {
    if (dirty && !confirm('Tenés cambios sin guardar. ¿Salir sin guardar?')) return;
    setSel(i); setDirty(false); original.current = JSON.stringify(defs[i]);
  }

  // ---- ediciones ----
  const eds = d.ediciones || [];
  function setEds(nuevas) { upd({ ediciones: nuevas }); }
  function addEd() { setEds([...eds, { id: String(Date.now()).slice(-4), label: 'Nueva edición', horarios: '' }]); }
  function updEd(i, patch) { setEds(eds.map((e, j) => j === i ? { ...e, ...patch } : e)); }
  function delEd(i) { setEds(eds.filter((_, j) => j !== i)); }
  function moveEd(i, dir) {
    const j = i + dir; if (j < 0 || j >= eds.length) return;
    const c = eds.slice(); [c[i], c[j]] = [c[j], c[i]]; setEds(c);
  }

  async function guardar() {
    setGuardando(true);
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: d.slug, def: d })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setDirty(false); setGuardadoAt(Date.now()); original.current = JSON.stringify(d);
      showToast?.('✓ Ficha guardada');
    } catch (e) {
      showToast?.('⚠ No pudimos guardar los cambios');
    }
    setGuardando(false);
  }

  const estadoGuardado = guardando
    ? { txt: 'Guardando…', cls: 'bor' }
    : dirty ? { txt: '● Cambios sin guardar', cls: 'cer' }
      : guardadoAt ? { txt: '✓ Guardado ' + haceTexto(guardadoAt), cls: 'pub' }
        : { txt: '✓ Sin cambios', cls: 'pub' };

  return (
    <div className="cons3">
      {/* IZQUIERDA — cursos */}
      <div className="panel" style={{ margin: 0 }}>
        <h3>Fichas</h3>
        <div className="cons-cursos">
          {defs.map((x, i) => (
            <button key={x.slug} className={'nav' + (i === sel ? ' on' : '')} onClick={() => seleccionar(i)}>
              {x.curso}
            </button>
          ))}
        </div>
        <p className="cons-note">Agregar cursos nuevos llega en el próximo lote.</p>
      </div>

      {/* CENTRO — editor */}
      <div>
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 13, fontFamily: 'monospace' }}>/inscripcion/{d.slug}</span>
            <span className={'fstate ' + estadoGuardado.cls} style={{ marginLeft: 'auto' }}><span className="d" />{estadoGuardado.txt}</span>
            <button className="btn-sm solid" onClick={guardar} disabled={guardando || !dirty}>Guardar</button>
          </div>
          <label style={lbl}>Título</label>
          <input className="ctrl" value={d.titulo || ''} onChange={(e) => upd({ titulo: e.target.value })} />
          <label style={{ ...lbl, marginTop: 12 }}>Mensaje de bienvenida</label>
          <textarea className="ctrl" value={d.bienvenida || ''} onChange={(e) => upd({ bienvenida: e.target.value })} />
          <label style={{ ...lbl, marginTop: 12 }}>Estado de la ficha</label>
          <select className="fsel" value={d.estado || 'Publicada'} onChange={(e) => upd({ estado: e.target.value })}>
            <option>Borrador</option><option>Publicada</option><option>Cerrada</option>
          </select>
          <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Solo <b>Publicada</b> deja completar el formulario público. Borrador y Cerrada muestran un aviso.</p>
        </div>

        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0 }}>Ediciones</h3>
            <button className="btn-sm" style={{ marginLeft: 'auto' }} onClick={addEd}>+ Agregar edición</button>
          </div>
          {eds.length === 0 && <p className="muted" style={{ fontSize: 13 }}>Sin ediciones. El formulario deja continuar y el equipo asigna la edición.</p>}
          {eds.map((e, i) => (
            <div key={i} className="cv-field" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input className="ctrl" style={{ fontWeight: 700 }} value={e.label} onChange={(ev) => updEd(i, { label: ev.target.value })} placeholder="Ej: Edición 17 — Lunes 5 de mayo" />
                <button className="btn-sm" onClick={() => moveEd(i, -1)} title="Subir" disabled={i === 0}>↑</button>
                <button className="btn-sm" onClick={() => moveEd(i, 1)} title="Bajar" disabled={i === eds.length - 1}>↓</button>
                <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => delEd(i)} title="Quitar">🗑</button>
              </div>
              <input className="ctrl" value={e.horarios || ''} onChange={(ev) => updEd(i, { horarios: ev.target.value })} placeholder="Horarios por país (opcional)" />
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Campos de la ficha</h3>
          {SECCIONES.map((s) => (
            <div key={s.titulo} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'Jost', fontSize: 11, letterSpacing: 1.5, color: 'rgb(var(--textMuted))', textTransform: 'uppercase', margin: '4px 0 8px' }}>{s.titulo}</div>
              {s.campos.map(([nm, tp, req]) => (
                <div className="cv-field" key={nm}>
                  <span style={{ color: 'rgb(var(--textMuted))' }}>☰</span>
                  <div><div className="nm">{nm}</div><div className="tp">{tp}</div></div>
                  {req && <span className="req">Obligatorio</span>}
                </div>
              ))}
            </div>
          ))}
          <p className="muted" style={{ fontSize: 11.5 }}>Agregar/quitar/reordenar campos con drag &amp; drop es el próximo incremento; hoy estos son los campos de la ficha estándar ILCE.</p>
        </div>
      </div>

      {/* DERECHA — vista previa */}
      <div style={{ position: 'sticky', top: 12 }}>
        <div style={{ fontFamily: 'Jost', fontSize: 11, letterSpacing: 2, color: 'rgb(var(--textMuted))', marginBottom: 8, textTransform: 'uppercase' }}>Vista previa</div>
        <div style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 24, overflow: 'hidden' }}>
          <div style={{ padding: '20px 18px', color: '#fff', background: 'linear-gradient(120deg,#01233f,#065f74 55%,#0595ad)' }}>
            <div style={{ fontFamily: 'Jost', letterSpacing: 4, fontSize: 10, opacity: .85 }}>FORMACIÓN EN</div>
            <div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 21, marginTop: 4 }}>{d.curso}</div>
          </div>
          <div style={{ padding: 16 }}>
            {d.estado !== 'Publicada' ? (
              <div style={{ textAlign: 'center', padding: '20px 6px', color: 'rgb(var(--textSec))', fontSize: 13.5 }}>
                {d.estado === 'Cerrada' ? '🔒 Inscripciones cerradas' : '📝 Ficha en borrador (no visible al público)'}
              </div>
            ) : (<>
              <div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.titulo || 'Ficha de inscripción'}</div>
              <div style={{ fontSize: 12.5, color: 'rgb(var(--textSec))', marginBottom: 12 }}>{d.bienvenida || '¡Nos alegra tenerte acá!'}</div>
              {eds.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Elegí día de cursada</div>
                  {eds.slice(0, 3).map((e, i) => (
                    <div key={i} style={{ border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface2))', borderRadius: 10, padding: '9px 11px', marginBottom: 6, fontSize: 12.5 }}>
                      <div style={{ fontWeight: 700 }}>{e.label || 'Edición'}</div>
                      {e.horarios && <div style={{ fontSize: 11, color: 'rgb(var(--textMuted))' }}>{e.horarios}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Correo *</div>
              <div style={{ border: '1px solid rgb(var(--border))', background: 'rgb(var(--surface2))', borderRadius: 10, padding: '9px 11px', fontSize: 12.5, color: 'rgb(var(--textMuted))', marginBottom: 12 }}>tunombre@correo.com</div>
              <div style={{ textAlign: 'center', color: '#fff', fontWeight: 700, fontSize: 13, padding: '10px', borderRadius: 10, background: 'linear-gradient(90deg,rgb(var(--accentPurple)),rgb(var(--accentMagenta)))' }}>Comenzar</div>
            </>)}
          </div>
        </div>
        <a className="btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} href={`${APP_URL}/inscripcion/${d.slug}`} target="_blank" rel="noreferrer">↗ Abrir ficha pública</a>
      </div>
    </div>
  );
}

const lbl = { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'rgb(var(--textSec))' };

function haceTexto(ts) {
  const seg = Math.round((Date.now() - ts) / 1000);
  if (seg < 10) return 'recién';
  if (seg < 60) return `hace ${seg}s`;
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  return 'hace un rato';
}
