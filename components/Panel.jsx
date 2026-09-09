'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from '../lib/useSession';
import { tienePermisoInscripciones, tienePermisoCambiarEstado, tienePermisoExportar, tienePermisoDashboard, tienePermisoConstructor, tienePermisoAccesos, tienePermisoActividades, tienePermisoGestionActividades, tienePermisoAsignarDocentes, tienePermisoEmails } from '../lib/permisos';
import { ESTADOS, nombreVisibleRoles } from '../lib/constants';
import { Isologo, IsologoDefs } from './Isologo';
import ThemeSelector from './ThemeSelector';
import Accesos from './Accesos';
import VersionBadge from './VersionBadge';
import FichasSection from './FichasSection';
import Constructor from './Constructor';
import Actividades from './Actividades';
import EmailsPanel from './EmailsPanel';
import Herramientas from './Herramientas';

const ALL_COLS = [
  ['nom', 'Nombre'], ['ape', 'Apellido'], ['em', 'Email'], ['curso', 'Curso'], ['ed', 'Edición'],
  ['pais', 'País'], ['prov', 'Provincia'], ['loc', 'Localidad'], ['wa', 'WhatsApp'], ['doc', 'Documento'],
  ['ig', 'Instagram'], ['prof', 'Profesión'], ['origen', 'Origen'], ['mod', 'Modalidad'],
  ['inscrito', 'Inscrito'], ['estado', 'Estado'], ['fecha', 'Fecha ficha']
];

function normaliza(f) {
  return {
    id: f.ID, nom: f.Nombre, ape: f.Apellido, em: f.Email, curso: f.Curso, ed: f['Edición'],
    pais: f['País'], prov: f['Provincia/Estado'], loc: f.Localidad, wa: f.WhatsApp, doc: f.Documento,
    ig: f.Instagram, prof: f['Profesión'], origen: f.Origen, mod: f.Modalidad, med: f['Medio contacto'],
    salud: f['Tema salud'], sobre: f['Sobre vos'], coment: f.Comentarios, cons: f.Consentimiento,
    inscrito: f.Inscrito, estado: f.Estado || 'Completa', fecha: (f['Fecha ficha'] || '').slice(0, 10)
  };
}
function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function digits(s) { return (s || '').toString().replace(/\D/g, ''); }

export default function Panel() {
  const { usuario, cargando: cargandoSesion, logout } = useSession();
  const [tab, setTab] = useState('fichas');
  const [toast, setToast] = useState('');
  const [constructorSlug, setConstructorSlug] = useState(null);
  const [masFiltros, setMasFiltros] = useState(false);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  // filtros
  const [q, setQ] = useState('');
  const [fEstado, setFEstado] = useState(''); const [fCurso, setFCurso] = useState('');
  const [fEd, setFEd] = useState(''); const [fPais, setFPais] = useState('');
  const [fDesde, setFDesde] = useState(''); const [fHasta, setFHasta] = useState('');
  const [visCols, setVisCols] = useState(new Set(['nom', 'ape', 'curso', 'ed', 'pais', 'wa', 'estado', 'fecha']));
  const [colModal, setColModal] = useState(false);
  const [sel, setSel] = useState(null); // registro abierto en drawer
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    if (cargandoSesion) return;
    if (!usuario) { window.location.href = '/panel/login'; return; }
    cargar();
  }, [usuario, cargandoSesion]);

  function showToast(m) { setToast(m); clearTimeout(showToast._t); showToast._t = setTimeout(() => setToast(''), 2400); }
  function editarFicha(slug) { setConstructorSlug(slug); setTab('constructor'); }
  function verInscripcionesDe(curso) { setFCurso(curso); setTab('inscripciones'); }

  async function cargar() {
    try {
      const res = await fetch('/api/inscripciones?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'Error al cargar'); return; }
      setRows(data.filas.map(normaliza).filter((r) => r.id));
    } catch { setError('Error de conexión'); }
  }


  const ediciones = useMemo(() => [...new Set((rows || []).map((r) => r.ed).filter(Boolean))].sort(), [rows]);
  const cursos = useMemo(() => [...new Set((rows || []).map((r) => r.curso).filter(Boolean))].sort(), [rows]);
  const paises = useMemo(() => [...new Set((rows || []).map((r) => r.pais).filter(Boolean))].sort(), [rows]);

  const filtradas = useMemo(() => {
    const qq = norm(q);
    return (rows || []).filter((r) => {
      if (fEstado && r.estado !== fEstado) return false;
      if (fCurso && r.curso !== fCurso) return false;
      if (fEd && r.ed !== fEd) return false;
      if (fPais && r.pais !== fPais) return false;
      if (fDesde && (r.fecha || '') < fDesde) return false;
      if (fHasta && (r.fecha || '') > fHasta) return false;
      if (qq) {
        const hay = [r.nom, r.ape, r.em, r.doc, digits(r.wa), r.curso, r.ed].map(norm).join(' ');
        if (!hay.includes(qq) && !digits(r.wa).includes(digits(qq))) return false;
      }
      return true;
    });
  }, [rows, q, fEstado, fCurso, fEd, fPais, fDesde, fHasta]);

  // Base para los smart chips: aplica todos los filtros MENOS el estado, así los contadores
  // reflejan el resto de los filtros activos.
  const baseParaChips = useMemo(() => {
    const qq = norm(q);
    return (rows || []).filter((r) => {
      if (fCurso && r.curso !== fCurso) return false;
      if (fEd && r.ed !== fEd) return false;
      if (fPais && r.pais !== fPais) return false;
      if (fDesde && (r.fecha || '') < fDesde) return false;
      if (fHasta && (r.fecha || '') > fHasta) return false;
      if (qq) {
        const hay = [r.nom, r.ape, r.em, r.doc, digits(r.wa), r.curso, r.ed].map(norm).join(' ');
        if (!hay.includes(qq) && !digits(r.wa).includes(digits(qq))) return false;
      }
      return true;
    });
  }, [rows, q, fCurso, fEd, fPais, fDesde, fHasta]);

  function limpiar() { setQ(''); setFEstado(''); setFCurso(''); setFEd(''); setFPais(''); setFDesde(''); setFHasta(''); }

  async function abrir(r) {
    setSel(r); setHistorial([]);
    try {
      const res = await fetch('/api/historial?id=' + encodeURIComponent(r.id) + '&solicitanteEmail=' + encodeURIComponent(usuario.email));
      const data = await res.json();
      if (data.ok) setHistorial(data.eventos);
    } catch {}
  }
  async function cambiarEstado(nuevo) {
    if (!sel) return;
    const res = await fetch('/api/inscripcion/estado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitanteEmail: usuario.email, id: sel.id, estado: nuevo }) });
    const data = await res.json();
    if (data.ok) {
      setRows((prev) => prev.map((x) => x.id === sel.id ? { ...x, estado: nuevo } : x));
      setSel((s) => ({ ...s, estado: nuevo })); abrir({ ...sel, estado: nuevo });
      showToast('✓ Estado actualizado');
    } else showToast(data.error || 'No se pudo cambiar');
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

  if (cargandoSesion) return <div className="spin" />;
  if (!usuario) return null;
  const puedeExportar = tienePermisoExportar(usuario);
  const puedeCambiar = tienePermisoCambiarEstado(usuario);

  return (
    <div className="appwrap">
      <IsologoDefs />
      <header className="topnav">
        <div className="topnav-brand">
          <Isologo size={28} />
          <div style={{ lineHeight: 1 }}>
            <div className="font-display" style={{ fontSize: 10, letterSpacing: 3, color: 'rgb(var(--textMuted))' }}>PLATAFORMA</div>
            <div className="font-display" style={{ fontSize: 17, fontWeight: 700 }}>ILCE</div>
          </div>
        </div>
        <nav className="topnav-tabs">
          <button className={'tnav' + (tab === 'fichas' ? ' on' : '')} onClick={() => setTab('fichas')}>Fichas</button>
          <button className={'tnav' + (tab === 'inscripciones' ? ' on' : '')} onClick={() => setTab('inscripciones')}>Inscripciones</button>
          {tienePermisoDashboard(usuario) && <button className={'tnav' + (tab === 'dashboard' ? ' on' : '')} onClick={() => setTab('dashboard')}>Dashboard</button>}
          {tienePermisoEmails(usuario) && <button className={'tnav' + (tab === 'emails' ? ' on' : '')} onClick={() => setTab('emails')}>Emails</button>}
          {tienePermisoActividades(usuario) && <button className={'tnav' + (tab === 'actividades' ? ' on' : '')} onClick={() => setTab('actividades')}>Actividades</button>}
          {tienePermisoConstructor(usuario) && <button className={'tnav' + (tab === 'constructor' ? ' on' : '')} onClick={() => setTab('constructor')}>Constructor</button>}
          <button className={'tnav' + (tab === 'herramientas' ? ' on' : '')} onClick={() => setTab('herramientas')}>Herramientas</button>
          {tienePermisoAccesos(usuario) && <button className={'tnav' + (tab === 'accesos' ? ' on' : '')} onClick={() => setTab('accesos')}>Accesos</button>}
        </nav>
        <div className="topnav-right">
          <ThemeSelector />
          <div className="topnav-user">
            <b>{usuario.nombre}</b>
            <span>{nombreVisibleRoles(usuario.roles)}</span>
          </div>
          <button className="btn-sm" onClick={() => { logout(); window.location.href = '/panel/login'; }}>Salir</button>
        </div>
      </header>

      <div className="main">
        <div className="topbar">
          <div><div className="crumb">PLATAFORMA ILCE / FICHAS</div><h1>{{ fichas: 'Fichas', inscripciones: 'Inscripciones', dashboard: 'Dashboard', emails: 'Emails', actividades: 'Actividades', constructor: 'Constructor de fichas', herramientas: 'Herramientas', accesos: 'Accesos' }[tab]}</h1></div>
          {tab === 'inscripciones' && <div className="search">🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, apellido, email, DNI, WhatsApp, edición…" /></div>}
        </div>

        {tab === 'fichas' && <FichasSection usuario={usuario} rows={rows} onEditar={editarFicha} onVerInscripciones={verInscripcionesDe} showToast={showToast} puedeEditar={tienePermisoConstructor(usuario)} />}
        {tab === 'herramientas' && <Herramientas />}
        {error && <div className="note" style={{ borderLeftColor: 'rgb(248 113 113)' }}>{error}</div>}
        {rows === null && !error && tab !== 'herramientas' && <div className="spin" />}

        {rows && tab === 'inscripciones' && (
          <>
            <div className="fchips">
              <button className={'fchip' + (fEstado === '' ? ' on' : '')} onClick={() => setFEstado('')}>Todas <span className="cnt">{baseParaChips.length}</span></button>
              {ESTADOS.filter((e) => baseParaChips.some((r) => r.estado === e)).map((e) => (
                <button key={e} className={'fchip' + (fEstado === e ? ' on' : '')} onClick={() => setFEstado(fEstado === e ? '' : e)}>{e} <span className="cnt">{baseParaChips.filter((r) => r.estado === e).length}</span></button>
              ))}
            </div>
            <div className="filters">
              <select className="fsel" value={fCurso} onChange={(e) => setFCurso(e.target.value)}><option value="">Curso: todos</option>{cursos.map((x) => <option key={x}>{x}</option>)}</select>
              <select className="fsel" value={fEd} onChange={(e) => setFEd(e.target.value)}><option value="">Edición: todas</option>{ediciones.map((x) => <option key={x}>{x}</option>)}</select>
              <button className="btn-sm" onClick={() => setMasFiltros(!masFiltros)}>{masFiltros ? '– Menos filtros' : '+ Más filtros'}</button>
              {masFiltros && (<>
                <select className="fsel" value={fPais} onChange={(e) => setFPais(e.target.value)}><option value="">País: todos</option>{paises.map((x) => <option key={x}>{x}</option>)}</select>
                <input type="date" className="fsel" value={fDesde} onChange={(e) => setFDesde(e.target.value)} title="Desde" />
                <input type="date" className="fsel" value={fHasta} onChange={(e) => setFHasta(e.target.value)} title="Hasta" />
              </>)}
              <span className="spacer" />
              <button className="btn-sm" onClick={() => setColModal(true)}>▦ Columnas</button>
              {puedeExportar && <><button className="btn-sm" onClick={exportCSV}>⬇ CSV</button><button className="btn-sm solid" onClick={exportXLSX}>⬇ Excel</button></>}
            </div>
            {(fCurso || fEd || fPais || fEstado || fDesde || fHasta) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                {fEstado && <FiltroChip label={`Estado: ${fEstado}`} onClear={() => setFEstado('')} />}
                {fCurso && <FiltroChip label={`Curso: ${fCurso}`} onClear={() => setFCurso('')} />}
                {fEd && <FiltroChip label={`Edición: ${fEd}`} onClear={() => setFEd('')} />}
                {fPais && <FiltroChip label={`País: ${fPais}`} onClear={() => setFPais('')} />}
                {(fDesde || fHasta) && <FiltroChip label={`Fecha: ${fDesde || '…'} → ${fHasta || '…'}`} onClear={() => { setFDesde(''); setFHasta(''); }} />}
                <button className="btn-sm" onClick={limpiar}>Limpiar filtros</button>
              </div>
            )}
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

        {rows && tab === 'dashboard' && tienePermisoDashboard(usuario) && <Dashboard rows={filtradas} allRows={rows}
          filtros={{ fEstado, setFEstado, fCurso, setFCurso, fEd, setFEd, fPais, setFPais, fDesde, setFDesde, fHasta, setFHasta, limpiar, cursos, ediciones, paises, irA: (estado) => { setFEstado(estado || ''); setTab('inscripciones'); } }} />}

        {tab === 'constructor' && tienePermisoConstructor(usuario) && <Constructor usuario={usuario} initialSlug={constructorSlug} showToast={showToast} />}
        {tab === 'emails' && tienePermisoEmails(usuario) && <EmailsPanel usuario={usuario} />}
        {tab === 'actividades' && tienePermisoActividades(usuario) && <Actividades usuario={usuario} showToast={showToast} puedeGestionar={tienePermisoGestionActividades(usuario)} puedeDocentes={tienePermisoAsignarDocentes(usuario)} />}
        {tab === 'accesos' && tienePermisoAccesos(usuario) && <Accesos usuario={usuario} />}
      </div>

      {/* drawer */}
      <div className={'ov' + (sel ? ' on' : '')} onClick={() => setSel(null)} />
      <aside className={'drawer' + (sel ? ' on' : '')}>
        {sel && (
          <>
            <div className="dr-head">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div className="dr-name">{(sel.nom + ' ' + sel.ape).trim() || '—'}</div>
                  <div style={{ fontSize: 12, color: 'rgb(var(--textMuted))', marginTop: 2 }}>{sel.curso}{sel.ed ? ` · ${sel.ed}` : ''} · ID {sel.id}</div>
                </div>
                <button className="btn-sm" onClick={() => setSel(null)}>✕</button>
              </div>
              <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={'badge b-' + (sel.estado || '').replace(/\s/g, '')}>{sel.estado}</span>
                <select className="sel-select" value={sel.estado} disabled={!puedeCambiar} onChange={(e) => cambiarEstado(e.target.value)} aria-label="Cambiar estado">
                  {ESTADOS.map((x) => <option key={x}>{x}</option>)}
                </select>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {sel.em && <button className="btn-sm" onClick={() => { navigator.clipboard?.writeText(sel.em); showToast('✓ Email copiado'); }}>✉ Copiar email</button>}
                {sel.wa && <button className="btn-sm" onClick={() => { navigator.clipboard?.writeText(sel.wa); showToast('✓ WhatsApp copiado'); }}>💬 Copiar WhatsApp</button>}
                {sel.wa && <a className="btn-sm" href={`https://wa.me/${digits(sel.wa)}`} target="_blank" rel="noreferrer">↗ Abrir WhatsApp</a>}
              </div>
            </div>
            <div className="dr-body">
              <DrawerSeccion titulo="Datos personales" campos={[['Nombre', `${sel.nom} ${sel.ape}`.trim()], ['Documento', sel.doc], ['País', sel.pais], ['Provincia', sel.prov], ['Localidad', sel.loc]]} />
              <DrawerSeccion titulo="Contacto" campos={[['Email', sel.em], ['WhatsApp', sel.wa], ['Instagram', sel.ig], ['Medio preferido', sel.med]]} />
              <DrawerSeccion titulo="Cursada" campos={[['Curso', sel.curso], ['Edición', sel.ed], ['Modalidad', sel.mod], ['Inscrito', sel.inscrito || '—']]} />
              <DrawerSeccion titulo="Sobre vos" campos={[['Profesión', sel.prof], ['Origen', sel.origen], ['Fecha ficha', sel.fecha]]} />
              {sel.sobre && <p style={{ fontSize: 13.5, marginTop: 4, color: 'rgb(var(--textSec))' }}>{sel.sobre}</p>}
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
      <VersionBadge />
      <div className={'toast' + (toast ? ' on' : '')}>{toast}</div>
    </div>
  );
}

function DrawerSeccion({ titulo, campos }) {
  const visibles = campos.filter(([, v]) => v);
  if (!visibles.length) return null;
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontFamily: 'Jost', fontSize: 11, letterSpacing: 1.5, color: 'rgb(var(--textMuted))', textTransform: 'uppercase', marginBottom: 6 }}>{titulo}</div>
      <div className="kv" style={{ margin: 0 }}>
        {visibles.map(([k, v]) => <div key={k} style={{ display: 'contents' }}><div className="k">{k}</div><div>{v}</div></div>)}
      </div>
    </div>
  );
}

function FiltroChip({ label, onClear }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(5,149,173,.12)', border: '1px solid rgba(5,149,173,.35)', color: 'rgb(var(--accentTeal))', borderRadius: 999, padding: '5px 10px', fontSize: 12.5, fontWeight: 700 }}>
      {label}
      <button onClick={onClear} aria-label="Quitar filtro" style={{ background: 'none', border: 0, color: 'inherit', cursor: 'pointer', fontSize: 14, lineHeight: 1 }}>×</button>
    </span>
  );
}

function celda(r, k) {
  if (k === 'estado') return <span className={'badge b-' + (r.estado || '').replace(/\s/g, '')}>{r.estado}</span>;
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
  const fichasActivas = new Set(rows.map((r) => r.curso).filter(Boolean)).size;
  const nuevas = est('Completa');
  const pendientes = est('Pendiente') + est('Iniciada');
  function periodo(tipo) {
    const hoy = new Date();
    const iso = (d) => d.toISOString().slice(0, 10);
    if (tipo === 'todo') { F.setFDesde(''); F.setFHasta(''); return; }
    if (tipo === 'mes') { F.setFDesde(iso(new Date(hoy.getFullYear(), hoy.getMonth(), 1))); F.setFHasta(iso(hoy)); return; }
    if (tipo === '30') { const d = new Date(hoy); d.setDate(d.getDate() - 30); F.setFDesde(iso(d)); F.setFHasta(iso(hoy)); return; }
    if (tipo === 'anio') { F.setFDesde(iso(new Date(hoy.getFullYear(), 0, 1))); F.setFHasta(iso(hoy)); return; }
  }

  return (
    <>
      <div className="fchips">
        <button className="fchip" onClick={() => periodo('mes')}>Este mes</button>
        <button className="fchip" onClick={() => periodo('30')}>Últimos 30 días</button>
        <button className="fchip" onClick={() => periodo('anio')}>Este año</button>
        <button className={'fchip' + (!F.fDesde && !F.fHasta ? ' on' : '')} onClick={() => periodo('todo')}>Todo</button>
      </div>
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
        <div className="kpi"><div className="n">{fichasActivas}</div><div className="l">Cursos con inscripciones</div></div>
        <div className="kpi" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => F.irA('')} onKeyDown={(e) => e.key === 'Enter' && F.irA('')}><div className="n teal">{rows.length}</div><div className="l">Inscripciones · ver</div></div>
        <div className="kpi" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => F.irA('Completa')}><div className="n mag">{nuevas}</div><div className="l">Nuevas (completas) · ver</div></div>
        <div className="kpi" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => F.irA('En revisión')}><div className="n warn">{est('En revisión')}</div><div className="l">En revisión · ver</div></div>
        <div className="kpi" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => F.irA('Aprobada')}><div className="n">{est('Aprobada')}</div><div className="l">Aprobadas · ver</div></div>
        <div className="kpi" role="button" tabIndex={0} style={{ cursor: 'pointer' }} onClick={() => F.irA('Pendiente')}><div className="n dim">{pendientes}</div><div className="l">Pendientes · ver</div></div>
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
