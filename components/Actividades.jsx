'use client';
import { useEffect, useState } from 'react';
import { CURSOS, APP_URL } from '../lib/constants';

const slugify = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default function Actividades({ usuario, showToast, puedeGestionar, puedeDocentes }) {
  const [sub, setSub] = useState('lista');
  return (
    <div>
      <div className="tabs">
        <button className={sub === 'lista' ? 'on' : ''} data-t="lista" onClick={() => setSub('lista')}>Actividades</button>
        <button className={sub === 'respuestas' ? 'on' : ''} data-t="respuestas" onClick={() => setSub('respuestas')}>Respuestas</button>
        {puedeDocentes && <button className={sub === 'docentes' ? 'on' : ''} data-t="docentes" onClick={() => setSub('docentes')}>Docentes</button>}
      </div>
      {sub === 'lista' && <Lista usuario={usuario} showToast={showToast} puedeGestionar={puedeGestionar} />}
      {sub === 'respuestas' && <Respuestas usuario={usuario} />}
      {sub === 'docentes' && puedeDocentes && <Docentes usuario={usuario} showToast={showToast} />}
    </div>
  );
}

/* ---------- Lista + editor de quiz ---------- */
function Lista({ usuario, showToast, puedeGestionar }) {
  const [acts, setActs] = useState(null);
  const [edit, setEdit] = useState(null); // actividad en edición

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  async function cargar() {
    const res = await fetch('/api/actividades?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const data = await res.json();
    setActs(data.ok ? data.actividades : []);
  }
  function nueva() {
    setEdit({ slug: '', curso: CURSOS[0].nombre, titulo: '', estado: 'Publicada', preguntas: [nuevaPreg()], _nuevo: true });
  }
  function nuevaPreg() { return { pregunta: '', opciones: ['', '', ''], correcta: 0 }; }

  async function guardar() {
    const e = edit;
    const slug = e.slug || slugify(e.titulo);
    if (!e.titulo.trim()) { showToast('Poné un título'); return; }
    const res = await fetch('/api/actividades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, slug, curso: e.curso, titulo: e.titulo, estado: e.estado, preguntas: e.preguntas })
    });
    const data = await res.json();
    if (data.ok) { showToast('✓ Actividad guardada'); setEdit(null); cargar(); }
    else showToast(data.error || 'No se pudo guardar');
  }

  if (edit) {
    const e = edit;
    const set = (patch) => setEdit({ ...e, ...patch });
    const setPreg = (i, patch) => set({ preguntas: e.preguntas.map((p, j) => j === i ? { ...p, ...patch } : p) });
    return (
      <div style={{ maxWidth: 760 }}>
        <div className="panel">
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
            <button className="btn-sm" onClick={() => setEdit(null)}>← Volver</button>
            <span style={{ marginLeft: 'auto' }} />
            <button className="btn-sm solid" onClick={guardar}>Guardar</button>
          </div>
          <label style={lbl}>Título de la actividad</label>
          <input className="ctrl" value={e.titulo} onChange={(ev) => set({ titulo: ev.target.value })} placeholder="Ej: Postwork clase número 2" />
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}><label style={lbl}>Curso</label>
              <select className="fsel" style={{ width: '100%' }} value={e.curso} onChange={(ev) => set({ curso: ev.target.value })}>{CURSOS.map((c) => <option key={c.slug}>{c.nombre}</option>)}</select></div>
            <div style={{ minWidth: 160 }}><label style={lbl}>Estado</label>
              <select className="fsel" style={{ width: '100%' }} value={e.estado} onChange={(ev) => set({ estado: ev.target.value })}><option>Publicada</option><option>Borrador</option></select></div>
          </div>
          {!e._nuevo && <p className="muted" style={{ fontSize: 12, marginTop: 8, fontFamily: 'monospace' }}>{APP_URL}/actividad/{e.slug}</p>}
        </div>

        {e.preguntas.map((p, i) => (
          <div className="panel" key={i}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <span style={{ fontWeight: 700 }}>Pregunta {i + 1}</span>
              <button className="btn-sm" style={{ marginLeft: 'auto', color: 'rgb(248 113 113)' }} onClick={() => set({ preguntas: e.preguntas.filter((_, j) => j !== i) })}>🗑</button>
            </div>
            <input className="ctrl" value={p.pregunta} onChange={(ev) => setPreg(i, { pregunta: ev.target.value })} placeholder="Texto de la pregunta" />
            <p className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>Marcá la opción correcta ✓</p>
            {p.opciones.map((op, j) => (
              <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                <input type="radio" name={'correcta-' + i} checked={p.correcta === j} onChange={() => setPreg(i, { correcta: j })} title="Correcta" style={{ accentColor: 'rgb(var(--accentMagenta))' }} />
                <input className="ctrl" value={op} onChange={(ev) => setPreg(i, { opciones: p.opciones.map((x, k) => k === j ? ev.target.value : x) })} placeholder={`Opción ${j + 1}`} />
                <button className="btn-sm" onClick={() => setPreg(i, { opciones: p.opciones.filter((_, k) => k !== j), correcta: p.correcta >= p.opciones.length - 1 ? 0 : p.correcta })}>✕</button>
              </div>
            ))}
            <button className="btn-sm" onClick={() => setPreg(i, { opciones: [...p.opciones, ''] })}>+ Opción</button>
          </div>
        ))}
        <button className="btn-sm" onClick={() => set({ preguntas: [...e.preguntas, nuevaPreg()] })}>+ Agregar pregunta</button>
      </div>
    );
  }

  if (!acts) return <div className="spin" />;
  return (
    <div>
      <div style={{ display: 'flex', marginBottom: 14 }}>
        {puedeGestionar && <button className="btn-sm solid" style={{ marginLeft: 'auto' }} onClick={nueva}>+ Nueva actividad</button>}
      </div>
      {acts.length === 0 ? (
        <div className="empty"><div className="ico">📝</div><h3>No hay actividades todavía</h3><p>{puedeGestionar ? 'Creá tu primera actividad (Postwork).' : 'Todavía no se cargaron actividades.'}</p></div>
      ) : (
        <div className="fgrid">
          {acts.map((a) => (
            <div className="fcard" key={a.slug}>
              <span className={'fstate ' + (a.estado === 'Publicada' ? 'pub' : 'bor')}><span className="d" />{a.estado}</span>
              <div className="ftitle" style={{ fontSize: 17 }}>{a.titulo}</div>
              <div className="fsub">{a.curso} · {a.preguntas.length} preguntas</div>
              <div className="flink"><span className="u">/actividad/{a.slug}</span>
                <button onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/actividad/${a.slug}`); showToast('✓ Enlace copiado'); }}>Copiar</button></div>
              <div className="factions">
                <a className="btn-sm" href={`${APP_URL}/actividad/${a.slug}`} target="_blank" rel="noreferrer">👁 Ver</a>
                {puedeGestionar && <button className="btn-sm solid" onClick={() => setEdit({ ...a, _nuevo: false })}>✎ Editar</button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------- Respuestas ---------- */
function Respuestas({ usuario }) {
  const [data, setData] = useState(null);
  useEffect(() => { (async () => {
    const res = await fetch('/api/actividades/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setData(d.ok ? d : { respuestas: [] });
  })(); /* eslint-disable-next-line */ }, []);
  if (!data) return <div className="spin" />;
  const r = data.respuestas || [];
  return (
    <>
      <p className="count">{r.length} respuesta(s){data.alcance === 'docente' ? ' · según tus cursos/ediciones asignados' : ''}</p>
      {r.length === 0 ? <div className="empty"><div className="ico">📭</div><h3>Sin respuestas</h3><p>Todavía no hay actividades respondidas.</p></div> : (
        <div className="tablewrap"><table>
          <thead><tr><th>Fecha</th><th>Estudiante</th><th>Email</th><th>Curso</th><th>Edición</th><th>Actividad</th><th>Puntaje</th></tr></thead>
          <tbody>{r.map((x) => (
            <tr key={x.id}><td className="sec">{(x.fecha || '').slice(0, 10)}</td><td><b>{x.nombre || '—'}</b></td>
              <td className="sec">{x.email}</td><td>{x.curso}</td><td>{x.edicion || '—'}</td><td>{x.actividad}</td>
              <td><b>{x.puntaje}/{x.total}</b></td></tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}

/* ---------- Docentes ---------- */
function Docentes({ usuario, showToast }) {
  const [docs, setDocs] = useState(null);
  const [email, setEmail] = useState(''); const [nombre, setNombre] = useState('');
  const [curso, setCurso] = useState(CURSOS[0].nombre); const [edicion, setEdicion] = useState('');
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  async function cargar() {
    const res = await fetch('/api/docentes?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setDocs(d.ok ? d.docentes : []);
  }
  async function agregar(e) {
    e.preventDefault();
    if (!email || !curso) { showToast('Completá email y curso'); return; }
    const res = await fetch('/api/docentes', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, email, nombre, curso, edicion }) });
    const d = await res.json();
    if (d.ok) { showToast('✓ Docente asignado'); setEmail(''); setNombre(''); setEdicion(''); cargar(); }
    else showToast(d.error || 'No se pudo asignar');
  }
  async function quitar(rowIndex) {
    const res = await fetch('/api/docentes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, rowIndex }) });
    const d = await res.json();
    if (d.ok) { showToast('✓ Acceso quitado'); cargar(); }
  }
  if (!docs) return <div className="spin" />;
  return (
    <div style={{ maxWidth: 760 }}>
      <div className="panel">
        <h3>Docentes con acceso a respuestas</h3>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -8 }}>Cada docente ve solo las respuestas de los cursos/ediciones que le asignes. Sin edición = todas las ediciones de ese curso.</p>
        {docs.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Todavía no asignaste docentes.</p> : docs.map((d) => (
          <div key={d._rowIndex} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgb(var(--border))', fontSize: 14 }}>
            <div style={{ flex: 1 }}><b>{d.nombre || d.email}</b><div className="muted" style={{ fontSize: 12 }}>{d.email}</div></div>
            <div>{d.curso}{d.edicion ? ` · Ed. ${d.edicion}` : ' · todas'}</div>
            <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => quitar(d._rowIndex)}>🗑</button>
          </div>
        ))}
      </div>
      <div className="panel">
        <h3>Asignar docente</h3>
        <form onSubmit={agregar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div><label style={lbl}>Email del docente</label><input className="ctrl" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="docente@..." /></div>
          <div><label style={lbl}>Nombre</label><input className="ctrl" value={nombre} onChange={(e) => setNombre(e.target.value)} /></div>
          <div><label style={lbl}>Curso</label><select className="fsel" style={{ width: '100%' }} value={curso} onChange={(e) => setCurso(e.target.value)}>{CURSOS.map((c) => <option key={c.slug}>{c.nombre}</option>)}</select></div>
          <div><label style={lbl}>Edición (opcional)</label><input className="ctrl" value={edicion} onChange={(e) => setEdicion(e.target.value)} placeholder="Ej: 15 (vacío = todas)" /></div>
          <div style={{ gridColumn: 'span 2' }}><button className="btn btn-primary" style={{ flex: 'none', padding: '10px 20px' }}>+ Asignar acceso</button></div>
        </form>
      </div>
    </div>
  );
}

const lbl = { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'rgb(var(--textSec))' };
