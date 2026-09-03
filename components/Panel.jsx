'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession, cerrarSesion, authFetch, leerSesion } from '../lib/useSession';
import { can } from '../lib/permisos';
import { ESTADOS } from '../lib/constants';
import { Isologo, IsologoDefs } from './Isologo';

const RESPS = ['Sin asignar', 'Vero', 'Macarena', 'Jennifer', 'Sofía', 'Alexander', 'Jesabel'];
const ALL_COLS = [
  ['nom', 'Nombre'], ['ape', 'Apellido'], ['em', 'Email'], ['curso', 'Curso'], ['ed', 'Edición'],
  ['pais', 'País'], ['prov', 'Provincia'], ['loc', 'Localidad'], ['wa', 'WhatsApp'], ['doc', 'Documento'],
  ['ig', 'Instagram'], ['prof', 'Profesión'], ['origen', 'Origen'], ['mod', 'Modalidad'],
  ['inscrito', 'Inscrito'], ['estado', 'Estado'], ['resp', 'Responsable'], ['fecha', 'Fecha ficha']
];

function normaliza(f) {
  return {
    id: f.ID, nom: f.Nombre, ape: f.Apellido, em: f.Email, curso: f.Curso, ed: f['Edición'],
    pais: f['País'], prov: f['Provincia/Estado'], loc: f.Localidad, wa: f.WhatsApp, doc: f.Documento,
    ig: f.Instagram, prof: f['Profesión'], origen: f.Origen, mod: f.Modalidad, med: f['Medio contacto'],
    salud: f['Tema salud'], sobre: f['Sobre vos'], coment: f.Comentarios, cons: f.Consentimiento,
    inscrito: f.Inscrito, estado: f.Estado || 'Completa', resp: f.Responsable || 'Sin asignar', fecha: (f['Fecha ficha'] || '').slice(0, 10)
  };
}
function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function digits(s) { return (s || '').toString().replace(/\D/g, ''); }

export default function Panel() {
  const sesion = useSession();
  const [tab, setTab] = useState('inscripciones');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  // filtros
  const [q, setQ] = useState('');
  const [fEstado, setFEstado] = useState(''); const [fCurso, setFCurso] = useState('');
  const [fEd, setFEd] = useState(''); const [fResp, setFResp] = useState(''); const [fPais, setFPais] = useState('');
  const [fDesde, setFDesde] = useState(''); const [fHasta, setFHasta] = useState('');
  const [visCols, setVisCols] = useState(new Set(['nom', 'ape', 'curso', 'ed', 'pais', 'wa', 'estado', 'resp', 'fecha']));
  const [colModal, setColModal] = useState(false);
  const [sel, setSel] = useState(null); // registro abierto en drawer
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    if (sesion === null) { window.location.href = '/panel/login'; return; }
    if (sesion) cargar();
  }, [sesion]);

  async function cargar() {
    try {
      const res = await authFetch('/api/inscripciones');
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'Error al cargar'); return; }
      setRows(data.filas.map(normaliza).filter((r) => r.id));
    } catch { setError('Error de conexión'); }
  }

  const rol = sesion?.usuario?.rol || 'Consulta';

  const ediciones = useMemo(() => [...new Set((rows || []).map((r) => r.ed).filter(Boolean))].sort(), [rows]);
  const cursos = useMemo(() => [...new Set((rows || []).map((r) => r.curso).filter(Boolean))].sort(), [rows]);
  const paises = useMemo(() => [...new Set((rows || []).map((r) => r.pais).filter(Boolean))].sort(), [rows]);

  const filtradas = useMemo(() => {
    const qq = norm(q);
    return (rows || []).filter((r) => {
      if (fEstado && r.estado !== fEstado) return false;
      if (fCurso && r.curso !== fCurso) return false;
      if (fEd && r.ed !== fEd) return false;
      if (fResp && r.resp !== fResp) return false;
      if (fPais && r.pais !== fPais) return false;
      if (fDesde && (r.fecha || '') < fDesde) return false;
      if (fHasta && (r.fecha || '') > fHasta) return false;
      if (qq) {
        const hay = [r.nom, r.ape, r.em, r.doc, digits(r.wa), r.curso, r.ed].map(norm).join(' ');
        if (!hay.includes(qq) && !digits(r.wa).includes(digits(qq))) return false;
      }
      return true;
    });
  }, [rows, q, fEstado, fCurso, fEd, fResp, fPais, fDesde, fHasta]);

  function limpiar() { setQ(''); setFEstado(''); setFCurso(''); setFEd(''); setFResp(''); setFPais(''); setFDesde(''); setFHasta(''); }

  async function abrir(r) {
    setSel(r); setHistorial([]);
    try {
      const res = await authFetch('/api/historial?id=' + encodeURIComponent(r.id));
      const data = await res.json();
      if (data.ok) setHistorial(data.eventos);
    } catch {}
  }
  async function cambiarEstado(nuevo) {
    if (!sel) return;
    const res = await authFetch('/api/inscripcion/estado', { method: 'POST', body: JSON.stringify({ id: sel.id, estado: nuevo }) });
    const data = await res.json();
    if (data.ok) {
      setRows((prev) => prev.map((x) => x.id === sel.id ? { ...x, estado: nuevo } : x));
      setSel((s) => ({ ...s, estado: nuevo })); abrir({ ...sel, estado: nuevo });
    } else alert(data.error || 'No se pudo cambiar');
  }
  async function cambiarResp(nuevo) {
    if (!sel) return;
    const res = await authFetch('/api/inscripcion/estado', { method: 'POST', body: JSON.stringify({ id: sel.id, responsable: nuevo }) });
    const data = await res.json();
    if (data.ok) {
      setRows((prev) => prev.map((x) => x.id === sel.id ? { ...x, resp: nuevo } : x));
      setSel((s) => ({ ...s, resp: nuevo }));
    }
  }

  // ---- export ----
  function datosExport() {
    const cols = ALL_COLS.filter((c) => visCols.has(c[0]));
    const data = filtradas.map((r) => { const o = {}; cols.forEach(([k, lbl]) => o[lbl] = r[k] || ''); return o; });
    return { cols: cols.map((c) => c[1]), data };
  }
  function exportCSV() {
    const { cols, data } = datosExport();
    const body = data.map((o) => cols.map((c) => { const v = ('' + (o[c] ?? '')).replace(/"/g, '""'); return /[",\n]/.test(v) ? `"${v}"` : v; }).join(',')).join('\n');
    descargar('inscripciones.csv', '\ufeff' + cols.join(',') + '\n' + body, 'text/csv;charset=utf-8');
  }
  async function exportXLSX() {
    const { cols, data } = datosExport();
    try {
      const XLSX = await import('xlsx');
      const ws = XLSX.utils.json_to_sheet(data, { header: cols });
      const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Inscripciones');
      XLSX.writeFile(wb, 'inscripciones.xlsx');
    } catch { exportCSV(); }
  }
  function descargar(nombre, contenido, tipo) {
    const blob = new Blob([contenido], { type: tipo });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; a.click();
  }

  if (sesion === undefined) return <div className="spin" />;
  if (sesion === null) return null;

  return (
    <div className="appwrap">
      <IsologoDefs />
      <aside className="rail">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 14px' }}>
          <Isologo size={30} />
          <div style={{ lineHeight: 1 }}>
            <div className="font-display" style={{ fontSize: 11, letterSpacing: 3, color: 'rgb(var(--textMuted))' }}>PLATAFORMA</div>
            <div className="font-display" style={{ fontSize: 19, fontWeight: 700 }}>ILCE</div>
          </div>
        </div>
        <div className="plat">FICHAS DE INSCRIPCIÓN</div>
        <button className={'nav' + (tab === 'inscripciones' ? ' on' : '')} onClick={() => setTab('inscripciones')}><span className="ic">📋</span>Inscripciones</button>
        {can(rol, 'verDashboard') && <button className={'nav' + (tab === 'dashboard' ? ' on' : '')} onClick={() => setTab('dashboard')}><span className="ic">📊</span>Dashboard</button>}
        {can(rol, 'constructor') && <button className={'nav' + (tab === 'constructor' ? ' on' : '')} onClick={() => setTab('constructor')}><span className="ic">🧩</span>Constructor</button>}
        <div className="div" />
        <div className="plat">PRÓXIMOS MÓDULOS</div>
        <button className="nav soon"><span className="ic">✅</span>Presentismo <span className="pill">PRONTO</span></button>
        <button className="nav soon"><span className="ic">📈</span>Balance <span className="pill">PRONTO</span></button>
        <div className="user">
          <b>{sesion.usuario?.nombre}</b>{sesion.usuario?.rol}
          <button className="btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </aside>

      <div className="main">
        <div className="topbar">
          <div><div className="crumb">PLATAFORMA ILCE / FICHAS</div><h1>{{ inscripciones: 'Inscripciones', dashboard: 'Dashboard', constructor: 'Constructor de fichas' }[tab]}</h1></div>
          {tab === 'inscripciones' && <div className="search">🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, apellido, email, DNI, WhatsApp, edición…" /></div>}
        </div>

        {error && <div className="note" style={{ borderLeftColor: 'rgb(248 113 113)' }}>{error}</div>}
        {rows === null && !error && <div className="spin" />}

        {rows && tab === 'inscripciones' && (
          <>
            <div className="filters">
              <select className="fsel" value={fEstado} onChange={(e) => setFEstado(e.target.value)}><option value="">Estado: todos</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="fsel" value={fCurso} onChange={(e) => setFCurso(e.target.value)}><option value="">Curso: todos</option>{cursos.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="fsel" value={fEd} onChange={(e) => setFEd(e.target.value)}><option value="">Edición: todas</option>{ediciones.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="fsel" value={fResp} onChange={(e) => setFResp(e.target.value)}><option value="">Responsable: todos</option>{RESPS.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="fsel" value={fPais} onChange={(e) => setFPais(e.target.value)}><option value="">País: todos</option>{paises.map((x) => <option key={x}>{x}</option>)}</select>
              <input type="date" className="fsel" value={fDesde} onChange={(e) => setFDesde(e.target.value)} title="Desde" />
              <input type="date" className="fsel" value={fHasta} onChange={(e) => setFHasta(e.target.value)} title="Hasta" />
              <button className="btn-sm" onClick={limpiar}>Limpiar</button>
              <span className="spacer" />
              <button className="btn-sm" onClick={() => setColModal(true)}>▦ Columnas</button>
              {can(rol, 'exportar') && <><button className="btn-sm" onClick={exportCSV}>⬇ CSV</button><button className="btn-sm solid" onClick={exportXLSX}>⬇ Excel</button></>}
            </div>
            <p className="count">Mostrando <b>{Math.min(300, filtradas.length)}</b> de <b>{filtradas.length}</b> inscripciones{filtradas.length > 300 ? ' (afiná la búsqueda para ver el resto)' : ''}</p>
            <div className="tablewrap">
              <table>
                <thead><tr>{ALL_COLS.filter((c) => visCols.has(c[0])).map((c) => <th key={c[0]}>{c[1]}</th>)}</tr></thead>
                <tbody>
                  {filtradas.slice(0, 300).map((r) => (
                    <tr key={r.id} onClick={() => abrir(r)}>
                      {ALL_COLS.filter((c) => visCols.has(c[0])).map(([k]) => <td key={k}>{celda(r, k)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {rows && tab === 'dashboard' && can(rol, 'verDashboard') && <Dashboard rows={filtradas} allRows={rows}
          filtros={{ fEstado, setFEstado, fCurso, setFCurso, fEd, setFEd, fPais, setFPais, fDesde, setFDesde, fHasta, setFHasta, limpiar, cursos, ediciones, paises }} />}

        {tab === 'constructor' && can(rol, 'constructor') && <Constructor />}
      </div>

      {/* drawer */}
      <div className={'ov' + (sel ? ' on' : '')} onClick={() => setSel(null)} />
      <aside className={'drawer' + (sel ? ' on' : '')}>
        {sel && (
          <>
            <div className="dr-head">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="dr-name">{(sel.nom + ' ' + sel.ape).trim() || '—'}</div>
                <button className="btn-sm" onClick={() => setSel(null)}>✕</button>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span>Estado:</span>
                <select className="sel-select" value={sel.estado} disabled={!can(rol, 'cambiarEstado')} onChange={(e) => cambiarEstado(e.target.value)}>
                  {ESTADOS.map((x) => <option key={x}>{x}</option>)}
                </select>
                <select className="sel-select" value={sel.resp} disabled={!can(rol, 'cambiarEstado')} onChange={(e) => cambiarResp(e.target.value)}>
                  {RESPS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
            </div>
            <div className="dr-body">
              <div className="kv">
                {[['Curso', sel.curso], ['Edición', sel.ed], ['Email', sel.em], ['País', sel.pais], ['Provincia', sel.prov],
                ['Localidad', sel.loc], ['WhatsApp', sel.wa], ['Documento', sel.doc], ['Instagram', sel.ig], ['Profesión', sel.prof],
                ['Modalidad', sel.mod], ['Origen', sel.origen], ['Medio', sel.med], ['Inscrito', sel.inscrito || '—'], ['Fecha', sel.fecha]]
                  .map(([k, v]) => <div key={k} style={{ display: 'contents' }}><div className="k">{k}</div><div>{v || '—'}</div></div>)}
              </div>
              {sel.sobre && <><div style={{ fontSize: 12, color: 'rgb(var(--textMuted))', marginTop: 8 }}>Sobre vos</div><p style={{ fontSize: 13.5, marginTop: 4 }}>{sel.sobre}</p></>}
              <h3 style={{ fontSize: 14, margin: '18px 0 10px' }}>Historial</h3>
              <div className="tl">
                {historial.length ? historial.slice().reverse().map((ev, i) => (
                  <div className="ev" key={i}><div className="t">{fmtFecha(ev.fecha)}</div><div className="d">{ev.accion}{ev.detalle ? ` · ${ev.detalle}` : ''}{ev.usuario ? ` (${ev.usuario})` : ''}</div></div>
                )) : <p className="muted" style={{ fontSize: 13 }}>Sin eventos registrados.</p>}
              </div>
            </div>
          </>
        )}
      </aside>

      {/* modal columnas */}
      <div className={'mwrap' + (colModal ? ' on' : '')}>
        <div className="modal">
          <h3>Columnas visibles</h3>
          {ALL_COLS.map((c) => (
            <label className="colrow" key={c[0]}>
              <input type="checkbox" checked={visCols.has(c[0])} onChange={(e) => {
                setVisCols((prev) => { const n = new Set(prev); e.target.checked ? n.add(c[0]) : n.delete(c[0]); return n; });
              }} />{c[1]}
            </label>
          ))}
          <button className="btn-sm solid" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} onClick={() => setColModal(false)}>Listo</button>
        </div>
      </div>
    </div>
  );
}

function celda(r, k) {
  if (k === 'estado') return <span className={'badge b-' + (r.estado || '').replace(/\s/g, '')}>{r.estado}</span>;
  if (k === 'resp') return r.resp === 'Sin asignar' ? <span className="muted">Sin asignar</span> : <span className="who"><span className="av">{(r.resp || '?')[0]}</span>{r.resp}</span>;
  if (k === 'wa') return <span className="sec">{r.wa}</span>;
  if (k === 'fecha') return <span className="sec">{r.fecha}</span>;
  return r[k] || '';
}
function fmtFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ===================== DASHBOARD ===================== */
function Dashboard({ rows, filtros }) {
  const est = (k) => rows.filter((r) => r.estado === k).length;
  const mesActual = new Date().toISOString().slice(0, 7);
  const delMes = rows.filter((r) => (r.fecha || '').startsWith(mesActual)).length;
  const group = (fn) => { const m = {}; rows.forEach((r) => { const k = fn(r) || '—'; m[k] = (m[k] || 0) + 1; }); return m; };
  const bars = (map, mag) => {
    const arr = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const max = Math.max(1, ...arr.map((a) => a[1]));
    return arr.map(([k, v]) => (
      <div className="bar" key={k}><span className="lb" title={k}>{k}</span><span className="track"><span className={'fill' + (mag ? ' m' : '')} style={{ width: (v / max * 100) + '%' }} /></span><span className="vv">{v}</span></div>
    ));
  };
  const completadas = rows.filter((r) => ['Completa', 'En revisión', 'Aprobada'].includes(r.estado)).length;
  const enRev = rows.filter((r) => ['En revisión', 'Aprobada'].includes(r.estado)).length;
  const aprob = est('Aprobada');
  const fu = [['Abierta', rows.length, '#065f74,#0595ad'], ['Iniciada', rows.length, '#03738b,#0595ad'],
  ['Completada', completadas, '#4a128b,#70168d'], ['En revisión', enRev, '#70168d,#96198f'], ['Aprobada', aprob, '#96198f,#c026d3']];
  const mx = Math.max(1, rows.length);
  const F = filtros;

  return (
    <>
      <div className="filters">
        <select className="fsel" value={F.fCurso} onChange={(e) => F.setFCurso(e.target.value)}><option value="">Curso: todos</option>{F.cursos.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={F.fEd} onChange={(e) => F.setFEd(e.target.value)}><option value="">Edición: todas</option>{F.ediciones.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={F.fPais} onChange={(e) => F.setFPais(e.target.value)}><option value="">País: todos</option>{F.paises.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={F.fEstado} onChange={(e) => F.setFEstado(e.target.value)}><option value="">Estado: todos</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select>
        <input type="date" className="fsel" value={F.fDesde} onChange={(e) => F.setFDesde(e.target.value)} title="Desde" />
        <input type="date" className="fsel" value={F.fHasta} onChange={(e) => F.setFHasta(e.target.value)} title="Hasta" />
        <button className="btn-sm" onClick={F.limpiar}>Limpiar</button>
      </div>
      <div className="kpis">
        <div className="kpi"><div className="n">{rows.length}</div><div className="l">Inscripciones (filtradas)</div></div>
        <div className="kpi"><div className="n teal">{delMes}</div><div className="l">Del período (este mes)</div></div>
        <div className="kpi"><div className="n mag">{est('En revisión')}</div><div className="l">En revisión</div></div>
        <div className="kpi"><div className="n">{est('Aprobada')}</div><div className="l">Aprobadas</div></div>
        <div className="kpi"><div className="n">{est('Completa')}</div><div className="l">Completadas</div></div>
        <div className="kpi"><div className="n warn">{est('Observada') + est('Rechazada')}</div><div className="l">Observadas / Rechazadas</div></div>
      </div>
      <div className="grid2">
        <div>
          <div className="panel"><h3>Por curso</h3>{bars(group((r) => r.curso), true)}</div>
          <div className="panel"><h3>Por edición</h3>{bars(group((r) => r.ed))}</div>
          <div className="panel"><h3>Por país</h3>{bars(group((r) => r.pais))}</div>
          <div className="panel"><h3>Por origen</h3>{bars(group((r) => r.origen))}</div>
        </div>
        <div>
          <div className="panel"><h3>Embudo</h3>
            <div className="funnel">
              {fu.map(([l, v, g], i) => (
                <div key={l} style={{ width: '100%', textAlign: 'center' }}>
                  <div className="stg" style={{ width: Math.max(30, v / mx * 100) + '%', margin: '0 auto', background: `linear-gradient(90deg,${g})` }}>{l} · {v}</div>
                  {i < fu.length - 1 && <div className="cap">▼ {fu[i][1] ? Math.round(fu[i + 1][1] / fu[i][1] * 100) : 0}%</div>}
                </div>
              ))}
            </div>
          </div>
          <div className="panel"><h3>Por estado</h3>{bars(group((r) => r.estado), true)}</div>
        </div>
      </div>
    </>
  );
}

/* ===================== CONSTRUCTOR (v1) ===================== */
function Constructor() {
  const [defs, setDefs] = useState(null);
  const [sel, setSel] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { (async () => {
    const res = await authFetch('/api/fichas'); const data = await res.json();
    if (data.ok) setDefs(data.defs);
  })(); }, []);

  if (!defs) return <div className="spin" />;
  const d = defs[sel];
  const upd = (k, v) => setDefs((prev) => prev.map((x, i) => i === sel ? { ...x, [k]: v } : x));

  async function guardar() {
    setGuardando(true); setMsg('');
    const res = await authFetch('/api/fichas', { method: 'POST', body: JSON.stringify({ slug: d.slug, def: d }) });
    const data = await res.json();
    setGuardando(false); setMsg(data.ok ? '✓ Guardado' : (data.error || 'Error'));
    setTimeout(() => setMsg(''), 2500);
  }

  const CAMPOS_STD = [
    ['Correo', 'Email', true], ['Elegí día de cursada', 'Selección única', true], ['Nombre', 'Texto', true],
    ['Apellido', 'Texto', true], ['País de residencia', 'País · lógica condicional', true],
    ['DNI / Pasaporte', 'Documento · condicional', true], ['Provincia / Estado', 'Condicional', true],
    ['Localidad', 'Texto', true], ['WhatsApp', 'WhatsApp', true], ['Fecha de nacimiento', 'Fecha', false],
    ['Modalidad de cursada', 'Selección única', true], ['Instagram', 'Texto', false], ['Profesión', 'Texto', false],
    ['¿Cómo llegaste?', 'Selección única', true], ['Medio de contacto', 'Selección única', true],
    ['Tema de salud', 'Texto', false], ['Sobre vos', 'Texto largo', true], ['Consentimiento', 'Consentimiento', true]
  ];

  return (
    <div className="builder" style={{ display: 'grid', gridTemplateColumns: '210px 1fr', gap: 14, alignItems: 'start' }}>
      <div className="panel" style={{ margin: 0 }}>
        <h3>Cursos</h3>
        {defs.map((x, i) => (
          <button key={x.slug} className={'nav' + (i === sel ? ' on' : '')} style={{ width: '100%', marginBottom: 4 }} onClick={() => setSel(i)}>{x.curso}</button>
        ))}
      </div>
      <div>
        <div className="panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <span className={'badge b-' + (d.estado === 'Publicada' ? 'Aprobada' : 'Pendiente')}>{(d.estado || 'Publicada').toUpperCase()}</span>
            <span className="muted" style={{ fontSize: 13 }}>/inscripcion/{d.slug}</span>
            <span className="spacer" style={{ marginLeft: 'auto' }} />
            {msg && <span className="teal" style={{ fontSize: 13, marginRight: 8 }}>{msg}</span>}
            <button className="btn-sm solid" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</button>
          </div>
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5 }}>Título</label>
          <input className="ctrl" value={d.titulo || ''} onChange={(e) => upd('titulo', e.target.value)} />
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', margin: '12px 0 5px' }}>Bienvenida</label>
          <textarea className="ctrl" value={d.bienvenida || ''} onChange={(e) => upd('bienvenida', e.target.value)} />
          <label style={{ fontSize: 12, fontWeight: 700, display: 'block', margin: '12px 0 5px' }}>Estado de la ficha</label>
          <select className="fsel" value={d.estado || 'Publicada'} onChange={(e) => upd('estado', e.target.value)}>
            <option>Borrador</option><option>Publicada</option><option>Cerrada</option>
          </select>
        </div>
        <div className="panel">
          <h3>Campos de la ficha</h3>
          {CAMPOS_STD.map(([nm, tp, req]) => (
            <div className="cv-field" key={nm}><div><div className="nm">{nm}</div><div className="tp">{tp}</div></div>{req && <span className="req">Obligatorio</span>}</div>
          ))}
          <div className="note">Constructor v1: ya podés editar título, bienvenida, estado y (próximamente) las ediciones por curso, y se guardan en la pestaña <b>Fichas</b>. El armado visual de campos con drag &amp; drop es el siguiente incremento; hoy el formulario público usa la ficha estándar ILCE.</div>
        </div>
      </div>
    </div>
  );
}
