'use client';
import { useEffect, useMemo, useState } from 'react';
import { CURSOS, APP_URL } from '../lib/constants';

const slugify = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
function Reportes({ usuario }) {
  const [acts, setActs] = useState(null);
  const [abierto, setAbierto] = useState(null);
  useEffect(() => { (async () => {
    const res = await fetch('/api/actividades/reporte?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setActs(d.ok ? d.actividades : []);
  })(); /* eslint-disable-next-line */ }, []);
  if (!acts) return <div className="spin" />;
  const conResp = acts.filter((a) => a.totalResp > 0);
  if (conResp.length === 0) return <div className="empty"><div className="ico">📊</div><h3>Todavía no hay datos para reportar</h3><p>Cuando los estudiantes respondan las actividades, vas a ver acá promedios y las preguntas que más se erran.</p></div>;

  const colorPct = (p) => p >= 70 ? 'rgb(74 222 128)' : p >= 40 ? 'rgb(251 191 36)' : 'rgb(248 113 113)';
  return (
    <div>
      {conResp.map((a) => {
        const peor = [...a.preguntas].filter((p) => p.respondidas > 0).sort((x, y) => x.pct - y.pct).slice(0, 3);
        const open = abierto === a.slug;
        return (
          <div className="panel" key={a.slug}>
            <div className="sechead" style={{ marginBottom: 6 }}>
              <div>
                <div className="htitle">{a.titulo}</div>
                <div className="muted" style={{ fontSize: 12 }}>{a.curso}</div>
              </div>
              <span className="grow" />
              <div style={{ textAlign: 'center' }}><div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 22, color: 'rgb(var(--accentTeal))' }}>{a.totalResp}</div><div className="muted" style={{ fontSize: 11 }}>respuestas</div></div>
              <div style={{ textAlign: 'center', marginLeft: 18 }}><div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 22, color: colorPct(a.promedio) }}>{a.promedio}%</div><div className="muted" style={{ fontSize: 11 }}>promedio</div></div>
              {a.tiempoProm > 0 && <div style={{ textAlign: 'center', marginLeft: 18 }}><div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 22 }}>{fmtTiempo(a.tiempoProm)}</div><div className="muted" style={{ fontSize: 11 }}>tiempo prom.</div></div>}
              <button className="btn-sm" style={{ marginLeft: 16 }} onClick={() => setAbierto(open ? null : a.slug)}>{open ? 'Ocultar detalle' : 'Ver por pregunta'}</button>
            </div>

            {peor.length > 0 && (
              <div style={{ background: 'rgba(248,113,113,.08)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 10, padding: '10px 12px', fontSize: 13 }}>
                <b style={{ color: 'rgb(248 113 113)' }}>Preguntas que más se erran:</b>
                <ol style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                  {peor.map((p, i) => <li key={i} style={{ marginBottom: 2 }}>{p.pregunta} <span className="muted">({p.pct}% acierto)</span></li>)}
                </ol>
              </div>
            )}

            {open && (
              <div style={{ marginTop: 12 }}>
                {a.preguntas.map((p, i) => (
                  <div className="bar" key={i} style={{ alignItems: 'flex-start' }}>
                    <span className="lb" style={{ width: 'auto', flex: 1, whiteSpace: 'normal', color: 'rgb(var(--text))' }}>{i + 1}. {p.pregunta}</span>
                    <span className="track" style={{ maxWidth: 160 }}><span className="fill" style={{ width: p.pct + '%', background: colorPct(p.pct) }} /></span>
                    <span className="vv" style={{ width: 90 }}>{p.pct}% · {p.aciertos}/{p.respondidas}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function fmtTiempo(seg) {
  seg = Number(seg) || 0;
  if (!seg) return '—';
  const m = Math.floor(seg / 60), s = seg % 60;
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}
const lbl = { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'rgb(var(--textSec))' };

export default function Actividades({ usuario, showToast, puedeGestionar, puedeDocentes }) {
  const [sub, setSub] = useState('lista');
  return (
    <div>
      <div className="subtabs">
        <button className={sub === 'lista' ? 'on' : ''} onClick={() => setSub('lista')}>Actividades</button>
        <button className={sub === 'respuestas' ? 'on' : ''} onClick={() => setSub('respuestas')}>Respuestas</button>
        <button className={sub === 'reportes' ? 'on' : ''} onClick={() => setSub('reportes')}>Reportes</button>
        {puedeDocentes && <button className={sub === 'docentes' ? 'on' : ''} onClick={() => setSub('docentes')}>Docentes</button>}
      </div>
      {sub === 'lista' && <Lista usuario={usuario} showToast={showToast} puedeGestionar={puedeGestionar} />}
      {sub === 'respuestas' && <Respuestas usuario={usuario} />}
      {sub === 'reportes' && <Reportes usuario={usuario} />}
      {sub === 'docentes' && puedeDocentes && <Docentes usuario={usuario} showToast={showToast} />}
    </div>
  );
}

function Lista({ usuario, showToast, puedeGestionar }) {
  const [acts, setActs] = useState(null);
  const [edit, setEdit] = useState(null);
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  async function cargar() {
    const res = await fetch('/api/actividades?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const data = await res.json();
    setActs(data.ok ? data.actividades : []);
  }
  const nuevaPreg = () => ({ pregunta: '', opciones: ['', '', ''], correcta: 0 });
  function nueva() { setEdit({ slug: '', curso: CURSOS[0].nombre, titulo: '', clase: '', estado: 'Publicada', preguntas: [nuevaPreg()], _nuevo: true }); }
  async function guardar() {
    const e = edit;
    const slug = e.slug || slugify(e.titulo);
    if (!e.titulo.trim()) { showToast('Poné un título'); return; }
    const res = await fetch('/api/actividades', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, slug, curso: e.curso, titulo: e.titulo, clase: e.clase, estado: e.estado, preguntas: e.preguntas })
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
          <div className="sechead">
            <button className="btn-sm" onClick={() => setEdit(null)}>← Volver</button>
            <span className="grow" />
            <button className="btn-sm solid" onClick={guardar}>Guardar</button>
          </div>
          <label style={lbl}>Título de la actividad</label>
          <input className="ctrl" value={e.titulo} onChange={(ev) => set({ titulo: ev.target.value })} placeholder="Ej: Postwork clase número 2" />
          <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}><label style={lbl}>Curso</label>
              <select className="fsel" style={{ width: '100%' }} value={e.curso} onChange={(ev) => set({ curso: ev.target.value })}>{CURSOS.map((c) => <option key={c.slug}>{c.nombre}</option>)}</select></div>
            <div style={{ minWidth: 120 }}><label style={lbl}>N° de clase</label>
              <input className="ctrl" value={e.clase || ''} onChange={(ev) => set({ clase: ev.target.value })} placeholder="Ej: 14" /></div>
            <div style={{ minWidth: 160 }}><label style={lbl}>Estado</label>
              <select className="fsel" style={{ width: '100%' }} value={e.estado} onChange={(ev) => set({ estado: ev.target.value })}><option>Publicada</option><option>Borrador</option></select></div>
          </div>
          {!e._nuevo && <p className="muted" style={{ fontSize: 12, marginTop: 8, fontFamily: 'monospace' }}>{APP_URL}/actividad/{e.slug}</p>}
        </div>
        {e.preguntas.map((p, i) => (
          <div className="panel" key={i}>
            <div className="sechead" style={{ marginBottom: 8 }}>
              <span className="htitle">Pregunta {i + 1}</span>
              <span className="grow" />
              <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => set({ preguntas: e.preguntas.filter((_, j) => j !== i) })}>🗑</button>
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
      <div className="sechead">
        <span className="hcount">{acts.length} actividad{acts.length === 1 ? '' : 'es'}</span>
        <span className="grow" />
        {puedeGestionar && <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 18px' }} onClick={nueva}>+ Nueva actividad</button>}
      </div>
      {acts.length === 0 ? (
        <div className="empty"><div className="ico">📝</div><h3>No hay actividades todavía</h3><p>{puedeGestionar ? 'Creá tu primera actividad (Postwork).' : 'Todavía no se cargaron actividades.'}</p></div>
      ) : (
        <div className="fgrid">
          {acts.map((a) => (
            <div className="fcard" key={a.slug}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className={'fstate ' + (a.estado === 'Publicada' ? 'pub' : 'bor')}><span className="d" />{a.estado}</span>
                <span className="tagchip">{a.preguntas.length} preguntas</span>
              </div>
              <div>
                <div className="ftitle" style={{ fontSize: 18 }}>{a.titulo}</div>
                <div className="fsub">{a.curso}{a.clase ? ` · Clase ${a.clase}` : ''}</div>
              </div>
              <div>
                <div className="acard-link-label">Enlace de actividad</div>
                <div className="flink"><span className="u">/actividad/{a.slug}</span>
                  <button onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/actividad/${a.slug}`); showToast('✓ Enlace copiado'); }}>Copiar</button></div>
              </div>
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

function Respuestas({ usuario }) {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [fCurso, setFCurso] = useState(''); const [fEd, setFEd] = useState(''); const [fAct, setFAct] = useState('');
  useEffect(() => { (async () => {
    const res = await fetch('/api/actividades/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setData(d.ok ? d : { respuestas: [] });
  })(); /* eslint-disable-next-line */ }, []);

  const r = data?.respuestas || [];
  const cursos = useMemo(() => [...new Set(r.map((x) => x.curso).filter(Boolean))].sort(), [r]);
  const ediciones = useMemo(() => [...new Set(r.map((x) => x.edicion).filter(Boolean))].sort(), [r]);
  const actividades = useMemo(() => [...new Set(r.map((x) => x.actividad).filter(Boolean))].sort(), [r]);
  const filtradas = useMemo(() => {
    const qq = norm(q);
    return r.filter((x) => {
      if (fCurso && x.curso !== fCurso) return false;
      if (fEd && x.edicion !== fEd) return false;
      if (fAct && x.actividad !== fAct) return false;
      if (qq && !norm(`${x.nombre} ${x.email}`).includes(qq)) return false;
      return true;
    });
  }, [r, q, fCurso, fEd, fAct]);
  const estudiantes = new Set(filtradas.map((x) => (x.email || '').toLowerCase())).size;
  const actsCount = new Set(filtradas.map((x) => x.actividad)).size;
  const promedio = filtradas.length
    ? Math.round(filtradas.reduce((s, x) => s + (Number(x.total) ? Number(x.puntaje) / Number(x.total) : 0), 0) / filtradas.length * 100)
    : 0;
  if (!data) return <div className="spin" />;

  return (
    <>
      <div className="minikpis">
        <div className="minikpi"><div className="n">{filtradas.length}</div><div className="l">Respuestas</div></div>
        <div className="minikpi"><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{estudiantes}</div><div className="l">Estudiantes</div></div>
        <div className="minikpi"><div className="n">{actsCount}</div><div className="l">Actividades</div></div>
        <div className="minikpi"><div className="n" style={{ color: '#d879d1' }}>{promedio}%</div><div className="l">Promedio</div></div>
      </div>
      <div className="filters">
        <div className="fsearch" style={{ maxWidth: 260 }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar estudiante…" /></div>
        <select className="fsel" value={fCurso} onChange={(e) => setFCurso(e.target.value)}><option value="">Curso: todos</option>{cursos.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={fEd} onChange={(e) => setFEd(e.target.value)}><option value="">Edición: todas</option>{ediciones.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={fAct} onChange={(e) => setFAct(e.target.value)}><option value="">Actividad: todas</option>{actividades.map((x) => <option key={x}>{x}</option>)}</select>
        {(q || fCurso || fEd || fAct) && <button className="btn-sm" onClick={() => { setQ(''); setFCurso(''); setFEd(''); setFAct(''); }}>Limpiar</button>}
      </div>
      {data.alcance === 'docente' && <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 10 }}>Mostrando solo tus cursos/ediciones asignados.</p>}
      {filtradas.length === 0 ? <div className="empty"><div className="ico">📭</div><h3>Sin respuestas</h3><p>No hay respuestas para estos filtros.</p></div> : (
        <div className="tablewrap"><table>
          <thead><tr>
            <th style={{ minWidth: 92 }}>Fecha</th><th style={{ minWidth: 150 }}>Estudiante</th><th style={{ minWidth: 180 }}>Email</th>
            <th style={{ minWidth: 130 }}>Curso</th><th style={{ minWidth: 78 }}>Edición</th><th style={{ minWidth: 160 }}>Actividad</th><th style={{ minWidth: 90 }}>Tiempo</th><th style={{ minWidth: 80, textAlign: 'right' }}>Puntaje</th>
          </tr></thead>
          <tbody>{filtradas.map((x) => (
            <tr key={x.id}>
              <td className="sec">{(x.fecha || '').slice(0, 10)}</td>
              <td><b>{x.nombre || '—'}</b></td>
              <td className="sec">{x.email}</td>
              <td>{x.curso}</td>
              <td>{x.edicion || '—'}</td>
              <td>{x.actividad}</td>
              <td className="sec">{fmtTiempo(x.duracion)}</td>
              <td style={{ textAlign: 'right' }}><b>{x.puntaje}/{x.total}</b></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}

function Docentes({ usuario, showToast }) {
  const [docs, setDocs] = useState(null);
  const [email, setEmail] = useState(''); const [nombre, setNombre] = useState('');
  const [curso, setCurso] = useState(CURSOS[0].nombre); const [edicion, setEdicion] = useState('');
  const [confirmar, setConfirmar] = useState(null);
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
    if (d.ok) {
      showToast(d.accesoCreado
        ? (d.emailEnviado ? '✓ Docente asignado y acceso enviado por mail' : '✓ Docente asignado (no se pudo enviar el mail)')
        : '✓ Docente asignado');
      setEmail(''); setNombre(''); setEdicion(''); cargar();
    } else showToast(d.error || 'No se pudo asignar');
  }
  async function quitar() {
    const res = await fetch('/api/docentes', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, rowIndex: confirmar._rowIndex }) });
    const d = await res.json();
    if (d.ok) { showToast('✓ Acceso quitado'); setConfirmar(null); cargar(); }
    else { showToast(d.error || 'No se pudo quitar'); setConfirmar(null); }
  }
  if (!docs) return <div className="spin" />;
  return (
    <div style={{ maxWidth: 780 }}>
      <div className="panel">
        <h3>Docentes con acceso a respuestas</h3>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -8 }}>Al asignar un docente se le crea el acceso (rol Docente) y se le envía la contraseña por mail automáticamente. Cada docente ve solo las respuestas de los cursos/ediciones que le asignes. Sin edición = todas las ediciones de ese curso.</p>
        {docs.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Todavía no asignaste docentes.</p> : (
          <div style={{ marginTop: 6 }}>
            {docs.map((d) => (
              <div key={d._rowIndex} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid rgb(var(--border))', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontWeight: 700 }}>{d.nombre || d.email}</div>
                  {d.nombre && <div className="muted" style={{ fontSize: 12 }}>{d.email}</div>}
                </div>
                <span className="tagchip">{d.curso}</span>
                <span className="tagchip">{d.edicion ? `Ed. ${d.edicion}` : 'Todas las ediciones'}</span>
                <button className="btn-sm" style={{ color: 'rgb(248 113 113)', borderColor: 'rgba(248,113,113,.3)' }} onClick={() => setConfirmar(d)}>🗑 Quitar</button>
              </div>
            ))}
          </div>
        )}
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
      {confirmar && (
        <div className="mwrap on">
          <div className="modal">
            <p style={{ fontWeight: 700, marginTop: 0 }}>¿Quitar el acceso de este docente?</p>
            <p style={{ color: 'rgb(var(--textSec))', fontSize: 14 }}>{confirmar.nombre || confirmar.email} · {confirmar.curso}{confirmar.edicion ? ` · Ed. ${confirmar.edicion}` : ''}. Dejará de ver esas respuestas.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmar(null)}>Cancelar</button>
              <button className="btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgb(248 113 113)', color: '#fff', borderColor: 'transparent' }} onClick={quitar}>Quitar acceso</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
