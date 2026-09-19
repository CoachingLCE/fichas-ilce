'use client';
import { useState, useEffect, useMemo } from 'react';
import { useSession } from '../lib/useSession';
import { tienePermisoInscripciones, tienePermisoCambiarEstado, tienePermisoExportar, tienePermisoDashboard, tienePermisoConstructor, tienePermisoAccesos, tienePermisoActividades, tienePermisoGestionActividades, tienePermisoAsignarDocentes, tienePermisoEmails, tienePermisoAuditoria, tienePermisoFormularios, puedeVerComoOtro } from '../lib/permisos';
import { ESTADOS, normalizarEstado, nombreVisibleRoles } from '../lib/constants';
import { Isologo, IsologoDefs } from './Isologo';
import ThemeSelector from './ThemeSelector';
import Accesos from './Accesos';
import VersionBadge from './VersionBadge';
import FichasSection from './FichasSection';
import Actividades from './Actividades';
import EmailsPanel from './EmailsPanel';
import Herramientas from './Herramientas';
import Auditoria from './Auditoria';
import AccesoDenegado from './AccesoDenegado';
import Formularios from './Formularios';
import PausaSemanal from './PausaSemanal';

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
    inscrito: f.Inscrito, estado: normalizarEstado(f.Estado), fecha: (f['Fecha ficha'] || '').slice(0, 10)
  };
}
function norm(s) { return (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim(); }
function digits(s) { return (s || '').toString().replace(/\D/g, ''); }

export default function Panel() {
  const { usuario: usuarioReal, cargando: cargandoSesion, logout } = useSession();
  const [verComo, setVerComo] = useState(null); // persona que se está "viendo como" (solo Admin)
  const [personas, setPersonas] = useState([]);
  const usuario = verComo || usuarioReal;
  // El tab activo se refleja en la URL (?tab=...) para que el link de cada página sea
  // compartible y funcione el botón "atrás" del navegador — antes quedaba siempre en /panel.
  const TABS_VALIDOS = ['fichas', 'inscripciones', 'dashboard', 'emails', 'actividades', 'formularios', 'accesos', 'auditoria'];
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'fichas';
    const t = new URLSearchParams(window.location.search).get('tab');
    return TABS_VALIDOS.includes(t) ? t : 'fichas';
  });
  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get('tab') !== tab) {
      url.searchParams.set('tab', tab);
      window.history.replaceState(null, '', url.toString());
    }
  }, [tab]);
  useEffect(() => {
    function onPop() {
      const t = new URLSearchParams(window.location.search).get('tab');
      if (TABS_VALIDOS.includes(t)) setTab(t);
    }
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [toast, setToast] = useState('');
  const [constructorSlug, setConstructorSlug] = useState(null);
  const [masFiltros, setMasFiltros] = useState(false);
  const [fExterior, setFExterior] = useState(false);
  const [navMenu, setNavMenu] = useState(null);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  // filtros
  const [q, setQ] = useState('');
  const [fEstado, setFEstado] = useState(''); const [fCurso, setFCurso] = useState('');
  const [fEd, setFEd] = useState(''); const [fPais, setFPais] = useState('');
  const [fDesde, setFDesde] = useState(''); const [fHasta, setFHasta] = useState('');
  const [visCols, setVisCols] = useState(new Set(['nom', 'curso', 'ed', 'pais', 'wa', 'estado', 'fecha']));
  const [colModal, setColModal] = useState(false);
  const [sel, setSel] = useState(null); // registro abierto en drawer
  const [historial, setHistorial] = useState([]);

  useEffect(() => {
    if (cargandoSesion) return;
    if (!usuario) { window.location.href = '/'; return; }
    cargar();
  }, [usuario, cargandoSesion]);

  function showToast(m) { setToast(m); clearTimeout(showToast._t); showToast._t = setTimeout(() => setToast(''), 2400); }
  function editarFicha(slug) { setConstructorSlug(slug); setTab('constructor'); }
  function verInscripcionesDe(curso) { setFCurso(curso); setTab('inscripciones'); }
  async function cargarPersonas() {
    if (personas.length || !usuarioReal) return;
    try {
      const res = await fetch('/api/personas-vista?solicitanteEmail=' + encodeURIComponent(usuarioReal.email));
      const d = await res.json();
      if (d.ok) setPersonas(d.personas || []);
    } catch { /* silencioso */ }
  }

  async function cargar() {
    try {
      const res = await fetch('/api/inscripciones?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'Error al cargar'); return; }
      setRows(data.filas.map(normaliza).filter((r) => r.id));
    } catch { setError('Error de conexión'); }
  }


  const ediciones = useMemo(() => [...new Set((rows || []).map((r) => r.ed).filter(Boolean))].sort((a, b) => { const na = parseInt(a, 10), nb = parseInt(b, 10); if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb; return String(a).localeCompare(String(b), 'es', { numeric: true }); }), [rows]);
  const cursos = useMemo(() => [...new Set((rows || []).map((r) => r.curso).filter(Boolean))].sort(), [rows]);
  const paises = useMemo(() => [...new Set((rows || []).map((r) => r.pais).filter(Boolean))].sort(), [rows]);

  const filtradas = useMemo(() => {
    const qq = norm(q);
    return (rows || []).filter((r) => {
      if (fEstado && r.estado !== fEstado) return false;
      if (fCurso && r.curso !== fCurso) return false;
      if (fEd && r.ed !== fEd) return false;
      if (fPais && r.pais !== fPais) return false;
      if (fExterior && (r.pais || '').toLowerCase() === 'argentina') return false;
      if (fDesde && (r.fecha || '') < fDesde) return false;
      if (fHasta && (r.fecha || '') > fHasta) return false;
      if (qq) {
        const hay = [r.nom, r.ape, r.em, r.doc, digits(r.wa), r.curso, r.ed].map(norm).join(' ');
        if (!hay.includes(qq) && !digits(r.wa).includes(digits(qq))) return false;
      }
      return true;
    });
  }, [rows, q, fEstado, fCurso, fEd, fPais, fExterior, fDesde, fHasta]);

  // Base para los smart chips: aplica todos los filtros MENOS el estado, así los contadores
  // reflejan el resto de los filtros activos.
  const baseParaChips = useMemo(() => {
    const qq = norm(q);
    return (rows || []).filter((r) => {
      if (fCurso && r.curso !== fCurso) return false;
      if (fEd && r.ed !== fEd) return false;
      if (fPais && r.pais !== fPais) return false;
      if (fExterior && (r.pais || '').toLowerCase() === 'argentina') return false;
      if (fDesde && (r.fecha || '') < fDesde) return false;
      if (fHasta && (r.fecha || '') > fHasta) return false;
      if (qq) {
        const hay = [r.nom, r.ape, r.em, r.doc, digits(r.wa), r.curso, r.ed].map(norm).join(' ');
        if (!hay.includes(qq) && !digits(r.wa).includes(digits(qq))) return false;
      }
      return true;
    });
  }, [rows, q, fCurso, fEd, fPais, fExterior, fDesde, fHasta]);

  function limpiar() { setQ(''); setFEstado(''); setFCurso(''); setFEd(''); setFPais(''); setFExterior(false); setFDesde(''); setFHasta(''); }

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
      {navMenu && <div className="navoverlay" onClick={() => setNavMenu(null)} />}
      <header className="topnav">
        <div className="topnav-brand">
          <Isologo size={32} />
        </div>
        <nav className="topnav-tabs">
          {/* Pestañas atenuadas cuando el rol de la persona no tiene acceso a esa sección
              (igual siguen siendo clickeables: si entran ven el cartel de Acceso denegado). */}
          <button className={'tnav' + (tab === 'fichas' ? ' on' : '')} onClick={() => setTab('fichas')}>Fichas de inscripción</button>
          <button className={'tnav' + (tab === 'inscripciones' ? ' on' : '') + (tienePermisoInscripciones(usuario) ? '' : ' dim')} onClick={() => setTab('inscripciones')}>Fichas completadas</button>
          <button className={'tnav' + (tab === 'dashboard' ? ' on' : '') + (tienePermisoDashboard(usuario) ? '' : ' dim')} onClick={() => setTab('dashboard')}>Dashboard</button>
          <div className="navgroup">
            <span className="navgroup-label">Gestión</span>
            <button className={'tnav' + (tab === 'emails' ? ' on' : '') + (tienePermisoEmails(usuario) ? '' : ' dim')} onClick={() => setTab('emails')}>Emails</button>
            <button className={'tnav' + (tab === 'actividades' ? ' on' : '') + (tienePermisoActividades(usuario) ? '' : ' dim')} onClick={() => setTab('actividades')}>Actividades</button>
            <button className={'tnav' + (tab === 'formularios' ? ' on' : '') + (tienePermisoFormularios(usuario) ? '' : ' dim')} onClick={() => setTab('formularios')}>Formularios</button>
            {/* El Constructor de fichas ya no es una pestaña aparte: se abre desde "Fichas de
                inscripción" (✎ Editar / + Cargar edición en cada ficha), para que todo lo de fichas
                quede junto en una sola hoja. */}
          </div>
          <div className="navgroup">
            <span className="navgroup-label">Configuración</span>
            <button className={'tnav' + (tab === 'accesos' ? ' on' : '') + (tienePermisoAccesos(usuario) ? '' : ' dim')} onClick={() => setTab('accesos')}>Accesos</button>
            <button className={'tnav' + (tab === 'auditoria' ? ' on' : '') + (tienePermisoAuditoria(usuario) ? '' : ' dim')} onClick={() => setTab('auditoria')}>Historial de acciones</button>
          </div>
        </nav>
        <div className="topnav-right">
          <button className="iconbtn" title="Buscar inscripciones" aria-label="Buscar" onClick={() => { setTab('inscripciones'); setTimeout(() => document.getElementById('ins-search')?.focus(), 60); }}>🔎</button>
          <ThemeSelector />
          {puedeVerComoOtro(usuarioReal) && (verComo
            ? <div className="vercomo-chip">👁 {verComo.nombre}<button onClick={() => setVerComo(null)} title="Salir del modo vista">✕</button></div>
            : <select className="fsel vercomo-sel" value="" onFocus={cargarPersonas} onChange={(e) => { const p = personas.find((x) => x.email === e.target.value); if (p) setVerComo(p); }}>
                <option value="">👁 Ver como…</option>
                {personas.map((p) => <option key={p.email} value={p.email}>{p.nombre} — {nombreVisibleRoles(p.roles)}</option>)}
              </select>)}
          <div className="topnav-user">
            <b>{usuario.nombre}</b>
            <span>{nombreVisibleRoles(usuario.roles)}</span>
          </div>
          <button className="btn-sm" onClick={() => { logout(); window.location.href = '/'; }}>Salir</button>
        </div>
      </header>
      {verComo && <div className="vercomo-banner">👁 Modo vista — estás viendo la app como <b>{verComo.nombre}</b> ({nombreVisibleRoles(verComo.roles)}), en solo lectura. <button onClick={() => setVerComo(null)}>Salir del modo vista</button></div>}

      <div className="main">
        <div className="topbar">
          <div><div className="crumb">ILCE / FICHAS</div><h1>{{ fichas: 'Fichas de inscripción', inscripciones: 'Fichas completadas', dashboard: 'Dashboard', emails: 'Emails', actividades: 'Actividades', formularios: 'Formularios', constructor: 'Constructor de fichas', herramientas: 'Herramientas', accesos: 'Accesos', auditoria: 'Historial de acciones' }[tab]}</h1></div>
          {tab === 'inscripciones' && <div className="search">🔎 <input id="ins-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, apellido, email, DNI, WhatsApp, edición…" /></div>}
        </div>

        <PausaSemanal />

        {tab === 'fichas' && <FichasSection usuario={usuario} rows={rows} onEditar={editarFicha} onVerInscripciones={verInscripcionesDe} showToast={showToast} puedeEditar={tienePermisoConstructor(usuario)} />}
        {tab === 'herramientas' && <Herramientas />}
        {error && <div className="note" style={{ borderLeftColor: 'rgb(248 113 113)' }}>{error}</div>}
        {rows === null && !error && tab !== 'herramientas' && <div className="spin" />}

        {rows && tab === 'inscripciones' && (
          <>
            {(() => {
              const iso = (d) => d.toISOString().slice(0, 10);
              const hace = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
              const hoy = iso(new Date());
              const sem = rows.filter((r) => (r.fecha || '') >= hace(7)).length;
              const pend = rows.filter((r) => ['Pendiente', 'Iniciada'].includes(r.estado)).length;
              const enRev = rows.filter((r) => r.estado === 'En revisión').length;
              const comp = rows.filter((r) => ['Completada', 'En revisión', 'Inscrito'].includes(r.estado)).length;
              const tasa = rows.length ? Math.round(comp / rows.length * 100) : 0;
              const setPeriodo = (t) => {
                if (t === 'hoy') { setFDesde(hoy); setFHasta(hoy); }
                else if (t === 'sem') { setFDesde(hace(7)); setFHasta(hoy); }
                else if (t === 'mes') { const d = new Date(); setFDesde(iso(new Date(d.getFullYear(), d.getMonth(), 1))); setFHasta(hoy); }
                setMasFiltros(true);
              };
              return (<>
                <div className="ins-kpis">
                  <div className="ins-kpi kpi-total"><div className="ic">📋</div><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{rows.length}</div><div className="l">Total</div></div>
                  <div className="ins-kpi kpi-week"><div className="ic">📈</div><div className="n">{sem}</div><div className="l">Últimos 7 días</div></div>
                  <div className="ins-kpi kpi-pend"><div className="ic">⏳</div><div className="n" style={{ color: 'rgb(251 191 36)' }}>{pend}</div><div className="l">Pendientes</div></div>
                  <div className="ins-kpi kpi-rev"><div className="ic">👁</div><div className="n" style={{ color: '#d879d1' }}>{enRev}</div><div className="l">En revisión</div></div>
                  <div className="ins-kpi kpi-comp"><div className="ic">✅</div><div className="n" style={{ color: 'rgb(74 222 128)' }}>{tasa}%</div><div className="l">Completadas</div></div>
                </div>
                <div className="fgroup-label">Filtros rápidos</div>
                <div className="fchips" style={{ marginBottom: 10 }}>
                  <button className="pill" onClick={() => setPeriodo('hoy')}>Hoy</button>
                  <button className="pill" onClick={() => setPeriodo('sem')}>Esta semana</button>
                  <button className="pill" onClick={() => setPeriodo('mes')}>Este mes</button>
                  <button className={'pill' + (fPais === 'Argentina' ? ' on' : '')} onClick={() => setFPais(fPais === 'Argentina' ? '' : 'Argentina')}>Argentina</button>
                  <button className={'pill' + (fExterior ? ' on' : '')} onClick={() => { setFExterior(!fExterior); setFPais(''); }}>Exterior</button>
                </div>
              </>);
            })()}
            <div className="fgroup-label">Estado</div>
            <div className="fchips">
              <button className={'fchip' + (fEstado === '' ? ' on' : '')} onClick={() => setFEstado('')}>Todas <span className="cnt">{baseParaChips.length}</span></button>
              {ESTADOS.filter((e) => baseParaChips.some((r) => r.estado === e)).map((e) => (
                <button key={e} className={'fchip' + (fEstado === e ? ' on' : '')} onClick={() => setFEstado(fEstado === e ? '' : e)}>{e} <span className="cnt">{baseParaChips.filter((r) => r.estado === e).length}</span></button>
              ))}
            </div>
            {ediciones.length > 0 && (<>
              <div className="fgroup-label">Edición</div>
              <div className="fchips">
                <button className={'pill' + (fEd === '' ? ' on' : '')} onClick={() => setFEd('')}>Todas</button>
                {ediciones.map((x) => <button key={x} className={'pill' + (fEd === x ? ' on' : '')} onClick={() => setFEd(fEd === x ? '' : x)}>Ed. {x}</button>)}
              </div>
            </>)}
            <div className="fgroup-label">Filtros</div>
            <div className="filters">
              <select className="fsel" value={fCurso} onChange={(e) => setFCurso(e.target.value)}><option value="">Curso: todos</option>{cursos.map((x) => <option key={x}>{x}</option>)}</select>
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
                {(() => { const n = [fEstado, fCurso, fEd, fPais, (fDesde || fHasta)].filter(Boolean).length; return <span style={{ fontSize: 12.5, color: 'rgb(var(--textMuted))', fontWeight: 700 }}>{n} {n === 1 ? 'filtro activo' : 'filtros activos'}</span>; })()}
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
                <thead><tr>{ALL_COLS.filter((c) => visCols.has(c[0])).map((c) => <th key={c[0]} className={'col-' + c[0]}>{c[1]}</th>)}</tr></thead>
                <tbody>
                  {filtradas.slice(0, 300).map((r) => (
                    <tr key={r.id} onClick={() => abrir(r)}>
                      {ALL_COLS.filter((c) => visCols.has(c[0])).map(([k]) => <td key={k} className={'col-' + k}>{celda(r, k)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'dashboard' && (tienePermisoDashboard(usuario)
          ? (rows && <Dashboard rows={filtradas} allRows={rows}
              filtros={{ fEstado, setFEstado, fCurso, setFCurso, fEd, setFEd, fPais, setFPais, fDesde, setFDesde, fHasta, setFHasta, limpiar, cursos, ediciones, paises, irA: (estado) => { setFEstado(estado || ''); setTab('inscripciones'); } }} />)
          : <AccesoDenegado seccion="Dashboard" />)}

        {tab === 'emails' && (tienePermisoEmails(usuario) ? <EmailsPanel usuario={usuario} /> : <AccesoDenegado seccion="Emails" />)}
        {tab === 'actividades' && (tienePermisoActividades(usuario) ? <Actividades usuario={usuario} showToast={showToast} puedeGestionar={tienePermisoGestionActividades(usuario)} puedeDocentes={tienePermisoAsignarDocentes(usuario)} /> : <AccesoDenegado seccion="Actividades" />)}
        {tab === 'formularios' && (tienePermisoFormularios(usuario) ? <Formularios usuario={usuario} showToast={showToast} /> : <AccesoDenegado seccion="Formularios" />)}
        {tab === 'accesos' && (tienePermisoAccesos(usuario) ? <Accesos usuario={usuario} /> : <AccesoDenegado seccion="Accesos" />)}
        {tab === 'auditoria' && (tienePermisoAuditoria(usuario) ? <Auditoria usuario={usuario} /> : <AccesoDenegado seccion="Historial de acciones" />)}
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

function esArgentina(p) { return (p || '').trim().toLowerCase() === 'argentina'; }
function fechaAmigable(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (isNaN(d)) return iso;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const diff = Math.round((hoy - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  if (diff > 1 && diff < 7) return `Hace ${diff} días`;
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${d.getDate()} ${meses[d.getMonth()]} ${d.getFullYear()}`;
}
function celda(r, k) {
  if (k === 'nom') return <span className="ins-name">{[r.nom, r.ape].filter(Boolean).join(' ') || '—'}</span>;
  if (k === 'estado') return <span className={'badge b-' + (r.estado || '').replace(/\s/g, '')}>{r.estado}</span>;
  if (k === 'pais') return r.pais ? <span className="pchip">{esArgentina(r.pais) ? '🇦🇷' : '🌎'} {r.pais}</span> : '';
  if (k === 'ed') return r.ed ? <span className="edchip">Ed. {r.ed}</span> : '';
  if (k === 'curso') return r.curso ? <span className="cchip">{r.curso}</span> : '';
  if (k === 'wa') return <span className="sec">{r.wa}</span>;
  if (k === 'fecha') return <span className="sec" title={r.fecha}>{fechaAmigable(r.fecha)}</span>;
  return r[k] || '';
}
function fmtFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ===================== DASHBOARD ===================== */
function Dashboard({ rows, filtros }) {
  const F = filtros;
  const est = (k) => rows.filter((r) => r.estado === k).length;
  const iso = (d) => d.toISOString().slice(0, 10);
  const hoyISO = iso(new Date());
  const hace = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
  const hoy = rows.filter((r) => (r.fecha || '') === hoyISO).length;
  const semana = rows.filter((r) => (r.fecha || '') >= hace(7)).length;
  const mesActual = new Date().toISOString().slice(0, 7);
  const delMes = rows.filter((r) => (r.fecha || '').startsWith(mesActual)).length;
  const completadas = rows.filter((r) => ['Completada', 'En revisión', 'Inscrito'].includes(r.estado)).length;
  const tasa = rows.length ? Math.round(completadas / rows.length * 100) : 0;

  const group = (fn) => { const m = {}; rows.forEach((r) => { const k = fn(r) || '—'; m[k] = (m[k] || 0) + 1; }); return m; };
  const top = (map, n) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
  const minibars = (map, n = 6) => {
    const arr = top(map, n); const max = Math.max(1, ...arr.map((a) => a[1]));
    return arr.map(([k, v]) => (
      <div className="minibar" key={k}><span className="lb" title={k}>{k}</span><span className="tr"><span className="fl" style={{ width: (v / max * 100) + '%' }} /></span><span className="vv">{v}</span></div>
    ));
  };
  const cloud = (map, n = 8) => (
    <div className="tagcloud">{top(map, n).map(([k, v]) => <span className="tc" key={k}>{k} <b>{v}</b></span>)}</div>
  );

  const periodoActivo = !F.fDesde && !F.fHasta ? 'todo' : '';
  function periodo(tipo) {
    if (tipo === 'todo') { F.setFDesde(''); F.setFHasta(''); return; }
    if (tipo === 'hoy') { F.setFDesde(hoyISO); F.setFHasta(hoyISO); return; }
    if (tipo === '7') { F.setFDesde(hace(7)); F.setFHasta(hoyISO); return; }
    if (tipo === 'mes') { const d = new Date(); F.setFDesde(iso(new Date(d.getFullYear(), d.getMonth(), 1))); F.setFHasta(hoyISO); return; }
    if (tipo === '90') { F.setFDesde(hace(90)); F.setFHasta(hoyISO); return; }
  }

  const activos = [];
  if (F.fCurso) activos.push(['Curso: ' + F.fCurso, () => F.setFCurso('')]);
  if (F.fEd) activos.push(['Edición: ' + F.fEd, () => F.setFEd('')]);
  if (F.fPais) activos.push(['País: ' + F.fPais, () => F.setFPais('')]);
  if (F.fEstado) activos.push(['Estado: ' + F.fEstado, () => F.setFEstado('')]);
  if (F.fDesde || F.fHasta) activos.push([`Fecha: ${F.fDesde || '…'} → ${F.fHasta || '…'}`, () => { F.setFDesde(''); F.setFHasta(''); }]);

  return (
    <>
      <div className="fchips" style={{ marginBottom: 10 }}>
        <button className={'pill' + (periodoActivo === 'todo' ? ' on' : '')} onClick={() => periodo('todo')}>Todo</button>
        <button className="pill" onClick={() => periodo('hoy')}>Hoy</button>
        <button className="pill" onClick={() => periodo('7')}>7 días</button>
        <button className="pill" onClick={() => periodo('mes')}>Este mes</button>
        <button className="pill" onClick={() => periodo('90')}>90 días</button>
      </div>
      <div className="filters" style={{ marginBottom: 8 }}>
        <select className="fsel" value={F.fCurso} onChange={(e) => F.setFCurso(e.target.value)}><option value="">Curso: todos</option>{F.cursos.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={F.fEd} onChange={(e) => F.setFEd(e.target.value)}><option value="">Edición: todas</option>{F.ediciones.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={F.fPais} onChange={(e) => F.setFPais(e.target.value)}><option value="">País: todos</option>{F.paises.map((x) => <option key={x}>{x}</option>)}</select>
        <select className="fsel" value={F.fEstado} onChange={(e) => F.setFEstado(e.target.value)}><option value="">Estado: todos</option>{ESTADOS.map((x) => <option key={x}>{x}</option>)}</select>
        {activos.length > 0 && <button className="btn-sm" onClick={F.limpiar}>Limpiar</button>}
      </div>
      {activos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {activos.map(([lbl, clear], i) => (
            <span className="chipfilt" key={i}>🟣 {lbl}<button onClick={clear} aria-label="Quitar">×</button></span>
          ))}
        </div>
      )}

      <div className="dash-kpis">
        <div className="dash-kpi click" onClick={() => F.irA('')}><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{rows.length}</div><div className="l">Inscripciones</div></div>
        <div className="dash-kpi"><div className="n">{hoy}</div><div className="l">Hoy</div></div>
        <div className="dash-kpi"><div className="n">{semana}</div><div className="l">Últimos 7 días</div></div>
        <div className="dash-kpi"><div className="n">{delMes}</div><div className="l">Este mes</div></div>
        <div className="dash-kpi click" onClick={() => F.irA('En revisión')}><div className="n" style={{ color: '#d879d1' }}>{est('En revisión')}</div><div className="l">En revisión</div></div>
        <div className="dash-kpi click" onClick={() => F.irA('Inscrito')}><div className="n" style={{ color: 'rgb(74 222 128)' }}>{est('Inscrito')}</div><div className="l">Inscriptos</div></div>
        <div className="dash-kpi"><div className="n" style={{ color: 'rgb(74 222 128)' }}>{tasa}%</div><div className="l">Completadas</div></div>
      </div>

      <div className="dash-grid">
        <div className="dash-panel"><h3>Por curso</h3>{minibars(group((r) => r.curso), 6)}</div>
        <div className="dash-panel"><h3>Por edición</h3>{cloud(group((r) => r.ed), 8)}</div>
        <div className="dash-panel"><h3>Por país</h3>{cloud(group((r) => r.pais), 8)}</div>
        <div className="dash-panel"><h3>Por estado</h3>{cloud(group((r) => r.estado), 8)}</div>
        <div className="dash-panel"><h3>Por origen</h3>{cloud(group((r) => r.origen), 6)}</div>
      </div>
    </>
  );
}

/* ===================== CONSTRUCTOR (v1) ===================== */
