'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CURSOS, APP_URL } from '../lib/constants';

const slugify = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Este archivo corre en el navegador; lib/actividades.js no se puede importar acá porque
// usa googleapis (server-only). Se duplica acá la única cuenta que hace falta del lado
// del cliente: derivar "Programada" a partir de Estado + fechaDisponible.
function estadoEfectivoCliente(a) {
  if (a.estado === 'Publicada' && a.fechaDisponible && a.fechaDisponible > new Date().toISOString().slice(0, 10)) return 'Programada';
  return a.estado || 'Publicada';
}
const ESTADO_ICO = {
  Publicada: { cls: 'pub', ico: '🟢' },
  Borrador: { cls: 'bor', ico: '⚪' },
  Programada: { cls: 'prog', ico: '🟠' },
  Archivada: { cls: 'arch', ico: '🔴' }
};

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

// Distintas formas de ordenar el listado de actividades (Diego pidió variantes,
// sobre todo poder ver por clase dentro de un mismo curso).
const ORDENES = [
  { v: 'clase', l: 'Curso y clase' },
  { v: 'nombre', l: 'Nombre (A-Z)' },
  { v: 'curso', l: 'Curso (A-Z)' },
  { v: 'estado', l: 'Estado' },
  { v: 'preguntas', l: 'Más preguntas primero' },
];
function ordenarActividades(lista, orden) {
  const arr = [...lista];
  const claseNum = (a) => { const n = parseInt(a.clase, 10); return Number.isFinite(n) ? n : 9999; };
  const porTitulo = (a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es', { sensitivity: 'base' });
  if (orden === 'nombre') arr.sort(porTitulo);
  else if (orden === 'curso') arr.sort((a, b) => (a.curso || '').localeCompare(b.curso || '', 'es') || porTitulo(a, b));
  else if (orden === 'estado') arr.sort((a, b) => (a.estado || '').localeCompare(b.estado || '', 'es') || porTitulo(a, b));
  else if (orden === 'preguntas') arr.sort((a, b) => (b.preguntas?.length || 0) - (a.preguntas?.length || 0) || porTitulo(a, b));
  else arr.sort((a, b) => (a.curso || '').localeCompare(b.curso || '', 'es') || claseNum(a) - claseNum(b) || porTitulo(a, b));
  return arr;
}

// ───────────────────────────────────────────────────────────────────────────
// Asistente de creación/edición (wizard de 4 pasos)
// ───────────────────────────────────────────────────────────────────────────
const PREG_TIPOS = [
  { v: 'multiple', l: 'Opción múltiple' },
  { v: 'vf', l: 'Verdadero / Falso' }
];
function nuevaPreg() { return { pregunta: '', tipo: 'multiple', opciones: ['', '', ''], correcta: 0 }; }
const PASOS = [
  { key: 'info', l: 'Información' },
  { key: 'preguntas', l: 'Preguntas' },
  { key: 'config', l: 'Configuración' },
  { key: 'revisar', l: 'Revisar' }
];
function validarInfo(e) { return !!(e.titulo || '').trim(); }
function validarPreguntas(e) {
  if (!e.preguntas.length) return 'Agregá al menos una pregunta.';
  for (const p of e.preguntas) {
    if (!(p.pregunta || '').trim()) return 'Hay una pregunta sin texto.';
    const ops = (p.opciones || []).filter((o) => (o || '').trim());
    if (ops.length < 2) return `«${(p.pregunta || '').slice(0, 40)}» necesita al menos 2 opciones.`;
    if (!(p.opciones[p.correcta] || '').trim()) return `«${(p.pregunta || '').slice(0, 40)}» necesita marcar cuál es la respuesta correcta.`;
  }
  return '';
}

function EditorActividad({ usuario, base, showToast, onGuardado, onCancelar }) {
  const [e, setE] = useState(base);
  const [paso, setPaso] = useState(0);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const dragIdx = useRef(null);

  const set = (patch) => setE((s) => ({ ...s, ...patch }));
  const preguntas = e.preguntas;
  const setPreg = (i, patch) => set({ preguntas: preguntas.map((p, j) => j === i ? { ...p, ...patch } : p) });

  function cambiarTipo(i, tipo) {
    if (tipo === 'vf') setPreg(i, { tipo, opciones: ['Verdadero', 'Falso'], correcta: preguntas[i].correcta <= 1 ? preguntas[i].correcta : 0 });
    else setPreg(i, { tipo, opciones: ['', '', ''], correcta: 0 });
  }
  function agregarPreg() { set({ preguntas: [...preguntas, nuevaPreg()] }); }
  function eliminarPreg(i) { if (preguntas.length <= 1) return; set({ preguntas: preguntas.filter((_, j) => j !== i) }); }
  function duplicarPreg(i) {
    const copia = { ...preguntas[i], opciones: [...preguntas[i].opciones] };
    const arr = preguntas.slice(); arr.splice(i + 1, 0, copia); set({ preguntas: arr });
  }
  function moverPreg(i, dir) { const j = i + dir; if (j < 0 || j >= preguntas.length) return; const arr = preguntas.slice(); [arr[i], arr[j]] = [arr[j], arr[i]]; set({ preguntas: arr }); }
  function reordenarPreg(desde, hasta) { if (desde === hasta) return; const arr = preguntas.slice(); const [item] = arr.splice(desde, 1); arr.splice(hasta, 0, item); set({ preguntas: arr }); }

  function irA(i) { setError(''); setPaso(i); }
  function siguiente() {
    if (paso === 0 && !validarInfo(e)) { setError('Poné un título para la actividad.'); return; }
    if (paso === 1) { const msg = validarPreguntas(e); if (msg) { setError(msg); return; } }
    setError(''); setPaso((p) => Math.min(PASOS.length - 1, p + 1));
  }
  function atras() { setError(''); setPaso((p) => Math.max(0, p - 1)); }

  async function guardar() {
    const msgInfo = !validarInfo(e) ? 'Poné un título para la actividad.' : '';
    const msgPreg = !msgInfo ? validarPreguntas(e) : '';
    if (msgInfo || msgPreg) { setError(msgInfo || msgPreg); setPaso(msgInfo ? 0 : 1); return; }
    setGuardando(true); setError('');
    const slug = e.slug || slugify(e.titulo);
    try {
      const res = await fetch('/api/actividades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitanteEmail: usuario.email, slug, curso: e.curso, titulo: e.titulo, clase: e.clase,
          estado: e.estado, edicion: e.edicion, fechaDisponible: e.fechaDisponible,
          mostrarResultado: e.mostrarResultado !== false, preguntas: e.preguntas
        })
      });
      const data = await res.json();
      if (data.ok) { showToast(e.estado === 'Publicada' ? '✓ Actividad publicada' : '✓ Actividad guardada'); onGuardado(); }
      else setError(data.error || 'No se pudo guardar');
    } catch { setError('Error de conexión'); }
    setGuardando(false);
  }

  return (
    <div className="wiz-wrap">
      <div className="wiz-topbar">
        <button className="btn-sm" onClick={onCancelar} disabled={guardando}>← Volver</button>
        <div className="wiz-stepper" style={{ flex: 1 }}>
          {PASOS.map((p, i) => (
            <div key={p.key} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && <span className="wiz-step-arrow">›</span>}
              <div className={'wiz-step' + (i === paso ? ' current' : i < paso ? ' done' : '')} onClick={() => irA(i)}>
                <span className="wiz-step-ico">{i < paso ? '✓' : i + 1}</span>
                <span className="wiz-step-lbl">{p.l}</span>
              </div>
            </div>
          ))}
        </div>
        {!e._nuevo && <p className="muted" style={{ fontSize: 11.5, fontFamily: 'monospace', margin: 0, whiteSpace: 'nowrap' }}>{APP_URL}/actividad/{e.slug}</p>}
      </div>

      {paso === 0 && (
        <div className="wiz-panel">
          <label style={lbl}>Título de la actividad</label>
          <input className="ctrl" value={e.titulo} onChange={(ev) => set({ titulo: ev.target.value })} placeholder="Ej: Postwork clase número 2" autoFocus />
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}><label style={lbl}>Curso</label>
              <select className="fsel" style={{ width: '100%' }} value={e.curso} onChange={(ev) => set({ curso: ev.target.value })}>{CURSOS.map((c) => <option key={c.slug}>{c.nombre}</option>)}</select></div>
            <div style={{ minWidth: 130 }}><label style={lbl}>Edición (opcional)</label>
              <input className="ctrl" value={e.edicion || ''} onChange={(ev) => set({ edicion: ev.target.value.replace(/\D/g, '') })} placeholder="Ej: 15" /></div>
            <div style={{ minWidth: 120 }}><label style={lbl}>N° de clase</label>
              <input className="ctrl" value={e.clase || ''} onChange={(ev) => set({ clase: ev.target.value })} placeholder="Ej: 14" /></div>
            <div style={{ minWidth: 160 }}><label style={lbl}>Estado</label>
              <select className="fsel" style={{ width: '100%' }} value={e.estado} onChange={(ev) => set({ estado: ev.target.value })}>
                <option>Publicada</option><option>Borrador</option><option>Archivada</option>
              </select></div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            {e.edicion
              ? 'Al fijar la edición acá, el estudiante ya no la va a tener que escribir al responder.'
              : 'Si dejás la edición vacía, se le va a seguir pidiendo al estudiante que la escriba al responder.'}
          </p>
        </div>
      )}

      {paso === 1 && (
        <div className="wiz-panel">
          {preguntas.map((p, i) => (
            <div className="preg-card" key={i}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => { if (dragIdx.current !== null) reordenarPreg(dragIdx.current, i); dragIdx.current = null; }}>
              <div className="preg-card-head">
                <span className="preg-drag-handle" draggable onDragStart={() => { dragIdx.current = i; }} title="Arrastrar para reordenar">☰</span>
                <b>Pregunta {i + 1}</b>
                <select className="fsel" value={p.tipo} onChange={(ev) => cambiarTipo(i, ev.target.value)}>
                  {PREG_TIPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
                <span className="grow" />
                <button className="btn-sm" onClick={() => moverPreg(i, -1)} disabled={i === 0} title="Subir">↑</button>
                <button className="btn-sm" onClick={() => moverPreg(i, 1)} disabled={i === preguntas.length - 1} title="Bajar">↓</button>
                <button className="btn-sm" onClick={() => duplicarPreg(i)} title="Duplicar pregunta">Duplicar</button>
                <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => eliminarPreg(i)} title="Eliminar" disabled={preguntas.length <= 1}>🗑</button>
              </div>
              <input className="ctrl" value={p.pregunta} onChange={(ev) => setPreg(i, { pregunta: ev.target.value })} placeholder="Texto de la pregunta" />
              <p className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>Marcá la opción correcta ✓</p>
              {p.tipo === 'vf' ? (
                p.opciones.map((op, j) => (
                  <div key={j} className="preg-vf-row">
                    <input type="radio" name={'correcta-' + i} checked={p.correcta === j} onChange={() => setPreg(i, { correcta: j })} style={{ accentColor: 'rgb(var(--accentMagenta))' }} />
                    {op}
                  </div>
                ))
              ) : (<>
                {p.opciones.map((op, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <input type="radio" name={'correcta-' + i} checked={p.correcta === j} onChange={() => setPreg(i, { correcta: j })} title="Correcta" style={{ accentColor: 'rgb(var(--accentMagenta))' }} />
                    <input className="ctrl" value={op} onChange={(ev) => setPreg(i, { opciones: p.opciones.map((x, k) => k === j ? ev.target.value : x) })} placeholder={`Opción ${j + 1}`} />
                    <button className="btn-sm" onClick={() => setPreg(i, { opciones: p.opciones.filter((_, k) => k !== j), correcta: p.correcta >= p.opciones.length - 1 ? 0 : p.correcta })} disabled={p.opciones.length <= 2}>✕</button>
                  </div>
                ))}
                <button className="btn-sm" onClick={() => setPreg(i, { opciones: [...p.opciones, ''] })}>+ Opción</button>
              </>)}
            </div>
          ))}
          <button className="btn-sm solid" onClick={agregarPreg}>+ Agregar pregunta</button>
        </div>
      )}

      {paso === 2 && (
        <div className="wiz-panel">
          <label style={lbl}>Fecha de disponibilidad (opcional)</label>
          <input className="ctrl" type="date" style={{ maxWidth: 200 }} value={e.fechaDisponible || ''} onChange={(ev) => set({ fechaDisponible: ev.target.value })} />
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Vacío = disponible apenas la publiques. Con una fecha futura, la actividad figura como <b>Programada</b> hasta ese día (nadie puede responderla antes).</p>
          <label className="wiz-check-inline" style={{ marginTop: 18 }}>
            <input type="checkbox" checked={e.mostrarResultado !== false} onChange={(ev) => set({ mostrarResultado: ev.target.checked })} />
            Mostrarle el puntaje al estudiante al terminar
          </label>
          <p className="muted" style={{ fontSize: 12, marginTop: 6, marginLeft: 26 }}>Si lo desmarcás, igual se corrige y se guarda todo — solo no se le muestra el número en pantalla.</p>
          <details className="wiz-avanzado">
            <summary>⚙ Próximamente</summary>
            <p className="muted" style={{ fontSize: 12.5 }}>Límite de intentos y tiempo límite por actividad quedan para una próxima etapa: necesitan su propia lógica de control (contar intentos previos, cronómetro con envío automático) para no arriesgar respuestas de estudiantes ya en curso.</p>
          </details>
        </div>
      )}

      {paso === 3 && (
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div className="wiz-panel" style={{ flex: 1, minWidth: 280 }}>
            <div className="wiz-grupo-lbl">Resumen</div>
            <div className="detalle-meta" style={{ marginBottom: 14 }}>
              <div><div className="k">Curso</div><div className="v">{e.curso}</div></div>
              <div><div className="k">Edición</div><div className="v">{e.edicion || '—'}</div></div>
              <div><div className="k">Clase</div><div className="v">{e.clase || '—'}</div></div>
              <div><div className="k">Estado</div><div className="v">{e.estado}</div></div>
              <div><div className="k">Preguntas</div><div className="v">{preguntas.length}</div></div>
              <div><div className="k">Muestra resultado</div><div className="v">{e.mostrarResultado !== false ? 'Sí' : 'No'}</div></div>
            </div>
            <div className="wiz-grupo-lbl">Preguntas</div>
            {preguntas.map((p, i) => (
              <div className="detalle-preg" key={i}>
                <b style={{ fontSize: 13.5 }}>{i + 1}. {p.pregunta || <span className="muted">(sin texto)</span>}</b>
                {p.opciones.map((op, j) => <div key={j} className={'detalle-op' + (p.correcta === j ? ' ok' : '')}>{p.correcta === j ? '✓ ' : ''}{op || <span className="muted">(vacía)</span>}</div>)}
              </div>
            ))}
          </div>
          <div>
            <div className="wiz-grupo-lbl" style={{ marginBottom: 8 }}>Vista previa</div>
            <div className="wiz-preview-shell">
              <div className="wiz-preview-hero">
                <div className="wiz-preview-eyebrow">ACTIVIDAD · {(e.curso || '').toUpperCase()}</div>
                <div className="wiz-preview-title">{e.titulo || 'Título de la actividad'}</div>
              </div>
              <div className="wiz-preview-body">
                <div style={{ fontSize: 12.5, color: 'rgb(var(--textSec))', marginBottom: 12 }}>Completá tus datos y respondé las {preguntas.length} pregunta{preguntas.length === 1 ? '' : 's'}. Se corrige al enviar.</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Correo *</div>
                <div className="wiz-preview-input">tunombre@correo.com</div>
                {e.edicion && <div className="wiz-preview-ed"><div style={{ fontWeight: 700 }}>Edición {e.edicion}</div></div>}
                <div className="wiz-preview-cta">Comenzar</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && <div className="err" style={{ display: 'block', margin: '10px 0' }}>{error}</div>}

      <div className="wiz-nav-btns">
        {paso > 0 && <button className="btn-sm" onClick={atras} disabled={guardando}>← Atrás</button>}
        <span className="grow" />
        {paso < PASOS.length - 1
          ? <button className="btn-sm solid" onClick={siguiente}>Siguiente →</button>
          : <button className="btn-sm solid" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : e.estado === 'Publicada' ? '✓ Publicar actividad' : '✓ Guardar'}</button>}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Agrupado por curso → edición (para la vista "Agrupar")
// ───────────────────────────────────────────────────────────────────────────
function agruparPorCurso(lista) {
  const ordenCursos = CURSOS.map((c) => c.nombre);
  const cursos = [...new Set(lista.map((a) => a.curso || 'Sin curso'))].sort((a, b) => {
    const ia = ordenCursos.indexOf(a), ib = ordenCursos.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'es');
    if (ia === -1) return 1; if (ib === -1) return -1;
    return ia - ib;
  });
  return cursos.map((curso) => {
    const items = lista.filter((a) => (a.curso || 'Sin curso') === curso);
    const ediciones = [...new Set(items.map((a) => a.edicion || ''))].sort((a, b) => {
      if (a === '' && b === '') return 0;
      if (a === '') return 1; if (b === '') return -1;
      return (Number(a) - Number(b)) || a.localeCompare(b);
    });
    return { curso, items, porEdicion: ediciones.map((ed) => ({ edicion: ed, items: items.filter((a) => (a.edicion || '') === ed) })) };
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Tabla / Tarjetas (usadas tal cual estén agrupadas o no)
// ───────────────────────────────────────────────────────────────────────────
function TablaActividades({ items, puedeGestionar, onEditar, onDuplicar, onDetalle }) {
  return (
    <div className="tablewrap"><table>
      <thead><tr><th>Actividad</th><th>Curso</th><th>Edición</th><th>Clase</th><th>Estado</th><th>Preguntas</th><th></th></tr></thead>
      <tbody>{items.map((a) => {
        const efectivo = estadoEfectivoCliente(a);
        const badge = ESTADO_ICO[efectivo] || ESTADO_ICO.Publicada;
        return (
          <tr key={a.slug}>
            <td className="ins-name"><button className="acts-titlelink" onClick={() => onDetalle(a)}>{a.titulo}</button></td>
            <td>{a.curso ? <span className="cchip">{a.curso}</span> : ''}</td>
            <td className="sec">{a.edicion || '—'}</td>
            <td className="sec">{a.clase || '—'}</td>
            <td><span className={'fstate ' + badge.cls}><span className="d" />{efectivo}</span></td>
            <td className="sec">{a.preguntas.length}</td>
            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <a className="btn-sm" href={`${APP_URL}/actividad/${a.slug}`} target="_blank" rel="noreferrer" title="Abrir actividad">👁</a>{' '}
              {puedeGestionar && <button className="btn-sm" onClick={() => onDuplicar(a)} title="Duplicar">⧉</button>}{' '}
              {puedeGestionar && <button className="btn-sm solid" onClick={() => onEditar(a)} title="Editar">✎</button>}
            </td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

function GridActividades({ items, puedeGestionar, onEditar, onDuplicar, onDetalle, showToast }) {
  return (
    <div className="fgrid">
      {items.map((a) => {
        const efectivo = estadoEfectivoCliente(a);
        const badge = ESTADO_ICO[efectivo] || ESTADO_ICO.Publicada;
        return (
          <div className="fcard" key={a.slug}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className={'fstate ' + badge.cls}><span className="d" />{efectivo}</span>
              <span className="tagchip">{a.preguntas.length} preguntas</span>
            </div>
            <div>
              <button className="acts-titlelink ftitle" style={{ fontSize: 18 }} onClick={() => onDetalle(a)}>{a.titulo}</button>
              <div className="fsub">{a.curso}{a.edicion ? ` · Ed. ${a.edicion}` : ''}{a.clase ? ` · Clase ${a.clase}` : ''}</div>
            </div>
            <div>
              <div className="acard-link-label">Enlace de actividad</div>
              <div className="flink"><span className="u">/actividad/{a.slug}</span>
                <button onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/actividad/${a.slug}`); showToast('✓ Enlace copiado'); }}>Copiar</button></div>
            </div>
            <div className="factions">
              <a className="btn-sm" href={`${APP_URL}/actividad/${a.slug}`} target="_blank" rel="noreferrer">👁 Ver</a>
              {puedeGestionar && <button className="btn-sm" onClick={() => onDuplicar(a)}>⧉ Duplicar</button>}
              {puedeGestionar && <button className="btn-sm solid" onClick={() => onEditar(a)}>✎ Editar</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Ficha de detalle de una actividad (solo lectura + acciones)
// ───────────────────────────────────────────────────────────────────────────
function DetalleActividad({ a, puedeGestionar, showToast, onEditar, onDuplicar, onVolver }) {
  const efectivo = estadoEfectivoCliente(a);
  const badge = ESTADO_ICO[efectivo] || ESTADO_ICO.Publicada;
  return (
    <div style={{ maxWidth: 780 }}>
      <div className="panel">
        <div className="sechead">
          <button className="btn-sm" onClick={onVolver}>← Volver</button>
          <span className="grow" />
          <button className="btn-sm" onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/actividad/${a.slug}`); showToast('✓ Enlace copiado'); }}>Copiar enlace</button>
          <a className="btn-sm" href={`${APP_URL}/actividad/${a.slug}`} target="_blank" rel="noreferrer">↗ Abrir actividad</a>
          {puedeGestionar && <button className="btn-sm" onClick={() => onDuplicar(a)}>⧉ Duplicar</button>}
          {puedeGestionar && <button className="btn-sm solid" onClick={() => onEditar(a)}>✎ Editar</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
          <span className={'fstate ' + badge.cls}><span className="d" />{efectivo}</span>
          <span className="tagchip">{a.preguntas.length} pregunta{a.preguntas.length === 1 ? '' : 's'}</span>
          {a.clase && <span className="tagchip">Clase {a.clase}</span>}
        </div>
        <div className="htitle" style={{ fontSize: 21, marginTop: 10 }}>{a.titulo}</div>
        <div className="muted" style={{ fontSize: 13 }}>{a.curso}{a.edicion ? ` · Edición ${a.edicion}` : ''}</div>
      </div>

      <div className="panel">
        <div className="wiz-grupo-lbl">Configuración</div>
        <div className="detalle-meta">
          <div><div className="k">Curso</div><div className="v">{a.curso}</div></div>
          <div><div className="k">Edición</div><div className="v">{a.edicion || 'Se la pide al estudiante'}</div></div>
          <div><div className="k">Clase</div><div className="v">{a.clase || '—'}</div></div>
          <div><div className="k">Estado</div><div className="v">{a.estado}</div></div>
          <div><div className="k">Fecha de disponibilidad</div><div className="v">{a.fechaDisponible || 'Inmediata'}</div></div>
          <div><div className="k">Muestra resultado</div><div className="v">{a.mostrarResultado === false ? 'No' : 'Sí'}</div></div>
          <div><div className="k">Última actualización</div><div className="v">{a.actualizado ? new Date(a.actualizado).toLocaleString('es-AR') : '—'}</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="wiz-grupo-lbl">Preguntas</div>
        {a.preguntas.map((p, i) => (
          <div className="detalle-preg" key={i}>
            <b style={{ fontSize: 13.5 }}>{i + 1}. {p.pregunta}</b>
            {(p.opciones || []).map((op, j) => <div key={j} className={'detalle-op' + (Number(p.correcta) === j ? ' ok' : '')}>{Number(p.correcta) === j ? '✓ ' : ''}{op}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Listado principal
// ───────────────────────────────────────────────────────────────────────────
function Lista({ usuario, showToast, puedeGestionar }) {
  const [acts, setActs] = useState(null);
  const [modo, setModo] = useState(null); // null | {tipo:'editor', base} | {tipo:'detalle', act}
  const [q, setQ] = useState('');
  const [vista, setVista] = useState('lista');
  const [orden, setOrden] = useState('clase');
  const [agrupar, setAgrupar] = useState(false);
  const [fCurso, setFCurso] = useState(''); const [fEd, setFEd] = useState(''); const [fEstado, setFEstado] = useState('');
  const [mostrarArch, setMostrarArch] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('ilce-actividades-vista'); if (v === 'cards' || v === 'lista') setVista(v);
      const o = localStorage.getItem('ilce-actividades-orden'); if (ORDENES.some((x) => x.v === o)) setOrden(o);
      const g = localStorage.getItem('ilce-actividades-agrupar'); if (g === '1') setAgrupar(true);
    } catch { /* */ }
  }, []);
  const cambiarVista = (v) => { setVista(v); try { localStorage.setItem('ilce-actividades-vista', v); } catch { /* */ } };
  const cambiarOrden = (v) => { setOrden(v); try { localStorage.setItem('ilce-actividades-orden', v); } catch { /* */ } };
  const toggleAgrupar = () => { const v = !agrupar; setAgrupar(v); try { localStorage.setItem('ilce-actividades-agrupar', v ? '1' : '0'); } catch { /* */ } };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  async function cargar() {
    const res = await fetch('/api/actividades?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const data = await res.json();
    setActs(data.ok ? data.actividades : []);
  }

  function nueva() {
    setModo({ tipo: 'editor', base: { slug: '', curso: CURSOS[0].nombre, titulo: '', clase: '', edicion: '', fechaDisponible: '', mostrarResultado: true, estado: 'Publicada', preguntas: [nuevaPreg()], _nuevo: true } });
  }
  function editar(a) { setModo({ tipo: 'editor', base: { ...a, _nuevo: false } }); }
  function duplicar(a) {
    const claseTxt = String(a.clase || '').trim();
    const claseNum = parseInt(claseTxt, 10);
    const claseNueva = Number.isFinite(claseNum) && String(claseNum) === claseTxt ? String(claseNum + 1) : (claseTxt ? claseTxt + ' (copia)' : '');
    setModo({
      tipo: 'editor', base: {
        slug: '', curso: a.curso, edicion: a.edicion || '', clase: claseNueva, titulo: (a.titulo || '') + ' (copia)',
        estado: 'Borrador', fechaDisponible: '', mostrarResultado: a.mostrarResultado !== false,
        preguntas: (a.preguntas || []).map((p) => ({ ...p, opciones: [...(p.opciones || [])] })), _nuevo: true
      }
    });
  }
  function verDetalle(a) { setModo({ tipo: 'detalle', act: a }); }
  function cerrarModo() { setModo(null); }
  function guardado() { setModo(null); cargar(); }

  if (!acts) return <div className="spin" />;

  if (modo?.tipo === 'editor') {
    return <EditorActividad usuario={usuario} base={modo.base} showToast={showToast} onGuardado={guardado} onCancelar={cerrarModo} />;
  }
  if (modo?.tipo === 'detalle') {
    const actual = acts.find((x) => x.slug === modo.act.slug) || modo.act;
    return <DetalleActividad a={actual} puedeGestionar={puedeGestionar} showToast={showToast} onEditar={editar} onDuplicar={duplicar} onVolver={cerrarModo} />;
  }

  const qq = (q || '').trim().toLowerCase();
  const cursosDisp = [...new Set(acts.map((a) => a.curso).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const edicionesDisp = [...new Set(acts.map((a) => a.edicion).filter(Boolean))].sort((a, b) => (Number(a) - Number(b)) || a.localeCompare(b));

  const base = acts.filter((a) => {
    const efectivo = estadoEfectivoCliente(a);
    if (fEstado) { if (efectivo !== fEstado) return false; }
    else if (efectivo === 'Archivada' && !mostrarArch) return false;
    if (fCurso && a.curso !== fCurso) return false;
    if (fEd && (a.edicion || '') !== fEd) return false;
    return true;
  });
  const filtradasSinOrden = qq ? base.filter((a) => [a.titulo, a.curso, a.clase, a.edicion, a.estado, a.slug].filter(Boolean).join(' ').toLowerCase().includes(qq)) : base;
  const filtradas = ordenarActividades(filtradasSinOrden, orden);
  const archivadasOcultas = (!fEstado && !mostrarArch) ? acts.filter((a) => estadoEfectivoCliente(a) === 'Archivada').length : 0;
  const hayFiltros = q || fCurso || fEd || fEstado;

  return (
    <div>
      <div className="sechead">
        <span className="hcount">{filtradas.length} actividad{filtradas.length === 1 ? '' : 'es'}</span>
        <span className="grow" />
        <div className="fsearch" style={{ maxWidth: 220 }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" /></div>
        <select className="fsel" value={fCurso} onChange={(e) => setFCurso(e.target.value)}><option value="">Curso: todos</option>{cursosDisp.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="fsel" value={fEd} onChange={(e) => setFEd(e.target.value)}><option value="">Edición: todas</option>{edicionesDisp.map((ed) => <option key={ed}>{ed}</option>)}</select>
        <select className="fsel" value={fEstado} onChange={(e) => setFEstado(e.target.value)}>
          <option value="">Estado: todos</option>
          {['Publicada', 'Programada', 'Borrador', 'Archivada'].map((s) => <option key={s}>{s}</option>)}
        </select>
        {hayFiltros && <button className="btn-sm" onClick={() => { setQ(''); setFCurso(''); setFEd(''); setFEstado(''); }}>Limpiar</button>}
        <select className="fsel" title="Ordenar por" value={orden} onChange={(e) => cambiarOrden(e.target.value)}>
          {ORDENES.map((o) => <option key={o.v} value={o.v}>Ordenar: {o.l}</option>)}
        </select>
        <button className={'btn-sm' + (agrupar ? ' solid' : '')} onClick={toggleAgrupar} title="Agrupar por curso y edición">▤ Agrupar</button>
        <div className="vista-toggle">
          <button className={vista === 'cards' ? 'on' : ''} onClick={() => cambiarVista('cards')} title="Ver en tarjetas">▦</button>
          <button className={vista === 'lista' ? 'on' : ''} onClick={() => cambiarVista('lista')} title="Ver en lista">☰</button>
        </div>
        {puedeGestionar && <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 18px' }} onClick={nueva}>+ Nueva actividad</button>}
      </div>

      {archivadasOcultas > 0 && (
        <label className="acts-toggle-arch" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={mostrarArch} onChange={(e) => setMostrarArch(e.target.checked)} />
          Mostrar {archivadasOcultas} archivada{archivadasOcultas === 1 ? '' : 's'}
        </label>
      )}

      {acts.length === 0 ? (
        <div className="empty"><div className="ico">📝</div><h3>No hay actividades todavía</h3><p>{puedeGestionar ? 'Creá tu primera actividad (Postwork).' : 'Todavía no se cargaron actividades.'}</p></div>
      ) : filtradas.length === 0 ? (
        <div className="empty"><div className="ico">🔎</div><h3>Sin resultados</h3><p>Probá con otro filtro.</p></div>
      ) : agrupar ? (
        agruparPorCurso(filtradas).map((g) => (
          <details className="acts-grupo" key={g.curso} open>
            <summary><span className="arw">▶</span><span className="nm">{g.curso}</span><span className="muted">{g.items.length} actividad{g.items.length === 1 ? '' : 'es'}</span></summary>
            <div className="acts-grupo-body">
              {g.porEdicion.map((sg) => (
                <div key={sg.edicion || '_sin'}>
                  <div className="acts-subgrupo-lbl">{sg.edicion ? `Edición ${sg.edicion}` : 'Sin edición asignada'}</div>
                  {vista === 'lista'
                    ? <TablaActividades items={sg.items} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} />
                    : <GridActividades items={sg.items} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} showToast={showToast} />}
                </div>
              ))}
            </div>
          </details>
        ))
      ) : vista === 'lista' ? (
        <TablaActividades items={filtradas} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} />
      ) : (
        <GridActividades items={filtradas} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} showToast={showToast} />
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
