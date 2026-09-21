'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
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
import Equipo from './Equipo';
import AccesoDenegado from './AccesoDenegado';
import Formularios from './Formularios';
import PausaSemanal from './PausaSemanal';
import Reportes from './Reportes';
import Buscador from './Buscador';
import TourGuiado from './TourGuiado';
import { SelectDropdown, FiltroChip } from './SelectDropdown';

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

// Los campos Pa\u00eds y Origen a veces terminan con valores que no les corresponden (arrastrados
// de otra pregunta, checkboxes, importaciones viejas, etc.): "SI", "True", el nombre de un
// estado como "Inscrito", o un simple "-". Esto los detecta para que no aparezcan como si
// fueran un pa\u00eds o un canal real en filtros y gr\u00e1ficos.
const VALORES_BASURA_CAMPO = new Set(['si', 'no', 'true', 'false', ...ESTADOS.map((e) => e.toLowerCase())]);
function esValorValido(v) {
  const s = (v || '').toString().trim();
  if (!s || s === '-') return false;
  return !VALORES_BASURA_CAMPO.has(s.toLowerCase());
}

export default function Panel() {
  const fichasRef = useRef(null);
  const { usuario: usuarioReal, cargando: cargandoSesion, logout } = useSession();
  const [verComo, setVerComo] = useState(null); // persona que se está "viendo como" (solo Admin)
  const [personas, setPersonas] = useState([]);
  const usuario = verComo || usuarioReal;
  // El tab activo se refleja en la URL (?tab=...) para que el link de cada página sea
  // compartible y funcione el botón "atrás" del navegador — antes quedaba siempre en /panel.
  const TABS_VALIDOS = ['fichas', 'inscripciones', 'dashboard', 'reportes', 'emails', 'actividades', 'formularios', 'equipo', 'accesos', 'auditoria', 'buscador'];
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
  // "q" también puede venir por URL (?tab=inscripciones&q=email@...) — así el botón "Ver
  // inscripción en el panel" del mail de aviso al equipo puede saltar directo a la persona.
  const [q, setQ] = useState(() => (typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('q') || ''));
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
  // Un solo punto de entrada para "apretar un número/chip del Dashboard y ver de qué fichas
  // se trata": pone ESE filtro puntual (sin tocar los demás que ya estén activos) y salta a
  // Fichas completadas.
  function irAConFiltro(campo, valor) {
    if (campo === 'estado') setFEstado(valor || '');
    else if (campo === 'curso') setFCurso(valor || '');
    else if (campo === 'ed') setFEd(valor || '');
    else if (campo === 'pais') setFPais(valor || '');
    setTab('inscripciones');
  }
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
  const paises = useMemo(() => [...new Set((rows || []).map((r) => r.pais).filter(esValorValido))].sort(), [rows]);

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
          {/* "Fichas de inscripción" y "Fichas completadas" quedan unificadas bajo una sola
              pestaña ("Fichas"), con sub-pestañas adentro — antes competían visualmente
              como si fueran dos módulos del mismo nivel. */}
          <button className={'tnav' + (tab === 'fichas' || tab === 'inscripciones' ? ' on' : '')} onClick={() => setTab('fichas')}>Fichas</button>
          <button className={'tnav' + (tab === 'dashboard' ? ' on' : '') + (tienePermisoDashboard(usuario) ? '' : ' dim')} onClick={() => setTab('dashboard')}>Dashboard</button>
          <button className={'tnav' + (tab === 'reportes' ? ' on' : '') + (tienePermisoDashboard(usuario) ? '' : ' dim')} onClick={() => setTab('reportes')}>Reportes</button>
          <div className="navgroup">
            <span className="navgroup-label">Gestión</span>
            <button className={'tnav' + (tab === 'emails' ? ' on' : '') + (tienePermisoEmails(usuario) ? '' : ' dim')} onClick={() => setTab('emails')}>Emails</button>
            <button className={'tnav' + (tab === 'actividades' ? ' on' : '') + (tienePermisoActividades(usuario) ? '' : ' dim')} onClick={() => setTab('actividades')}>Actividades</button>
            <button className={'tnav' + (tab === 'formularios' ? ' on' : '') + (tienePermisoFormularios(usuario) ? '' : ' dim')} onClick={() => setTab('formularios')}>Formularios</button>
            <button className={'tnav' + (tab === 'equipo' ? ' on' : '') + (tienePermisoAsignarDocentes(usuario) ? '' : ' dim')} onClick={() => setTab('equipo')}>Equipo Docente</button>
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
          <button data-tour="nav-buscador" className={'iconbtn' + (tab === 'buscador' ? ' on' : '')} title="Buscar en fichas, inscripciones, actividades y formularios" aria-label="Buscar" onClick={() => setTab('buscador')}>🔎</button>
          <ThemeSelector />
          {puedeVerComoOtro(usuarioReal) && (verComo
            ? <div data-tour="ver-como" className="vercomo-chip">👁 {verComo.nombre}<button onClick={() => setVerComo(null)} title="Salir del modo vista">✕</button></div>
            : (
              // Antes era un <select> nativo de 180px: en varios navegadores la lista
              // desplegada hereda ese mismo ancho y los nombres/roles largos aparecían
              // recortados. Este dropdown propio no tiene ese límite.
              <div data-tour="ver-como">
                <SelectDropdown
                  className="fdrop-vercomo" placeholder="👁 Ver como…" value="" hidePlaceholderOption searchable
                  onOpen={cargarPersonas}
                  onChange={(email) => { const p = personas.find((x) => x.email === email); if (p) setVerComo(p); }}
                  options={personas.map((p) => ({ value: p.email, label: `${p.nombre} — ${nombreVisibleRoles(p.roles)}` }))}
                />
              </div>
            ))}
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
          <div><div className="crumb">ILCE / FICHAS</div><h1>{{ fichas: 'Fichas de inscripción', inscripciones: 'Fichas completadas', dashboard: 'Dashboard', reportes: 'Reportes', emails: 'Emails', actividades: 'Actividades', formularios: 'Formularios', equipo: 'Equipo Docente', constructor: 'Constructor de fichas', herramientas: 'Herramientas', accesos: 'Accesos', auditoria: 'Historial de acciones', buscador: 'Buscador' }[tab]}</h1></div>
          {tab === 'inscripciones' && <div className="search">🔎 <input id="ins-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, apellido, email, DNI, WhatsApp, edición…" /></div>}
        </div>

        {(tab === 'fichas' || tab === 'inscripciones') && (
          <div className="subtabs" style={{ marginBottom: 18, display: 'flex', alignItems: 'center' }}>
            <button className={tab === 'fichas' ? 'on' : ''} onClick={() => setTab('fichas')}>Fichas de inscripción</button>
            <button className={tab === 'inscripciones' ? 'on' : ''} onClick={() => setTab('inscripciones')}>Fichas completadas</button>
            {tab === 'fichas' && tienePermisoConstructor(usuario) && (
              <button className="btn-sm solid" style={{ marginLeft: 12 }} onClick={() => fichasRef.current?.abrirConstructor()}>Crear nueva ficha de inscripción</button>
            )}
          </div>
        )}

        <PausaSemanal />

        {tab === 'buscador' && <Buscador usuario={usuario} irA={(t) => setTab(t)} setQInscripciones={setQ} />}
        {tab === 'fichas' && <FichasSection ref={fichasRef} usuario={usuario} rows={rows} onEditar={editarFicha} onVerInscripciones={verInscripcionesDe} showToast={showToast} puedeEditar={tienePermisoConstructor(usuario)} />}
        {tab === 'herramientas' && <Herramientas />}
        {error && <div className="note" style={{ borderLeftColor: 'rgb(248 113 113)' }}>{error}</div>}
        {rows === null && !error && tab !== 'herramientas' && <div className="spin" />}

        {rows && tab === 'inscripciones' && (
          <>
            {/* Los números/KPIs (Total, últimos 7 días, pendientes, etc.) se movieron a la
                pestaña "Reportes" — acá solo quedan los filtros rápidos para trabajar el día a día. */}
            {(() => {
              const iso = (d) => d.toISOString().slice(0, 10);
              const hace = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
              const hoy = iso(new Date());
              const setPeriodo = (t) => {
                if (t === 'hoy') { setFDesde(hoy); setFHasta(hoy); }
                else if (t === 'sem') { setFDesde(hace(7)); setFHasta(hoy); }
                else if (t === 'mes') { const d = new Date(); setFDesde(iso(new Date(d.getFullYear(), d.getMonth(), 1))); setFHasta(hoy); }
                setMasFiltros(true);
              };
              return (<>
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
            <div className="fgroup-label">Curso</div>
            <div className="fchips">
              <button className={'pill' + (fCurso === '' ? ' on' : '')} onClick={() => setFCurso('')}>Todos</button>
              {cursos.map((x) => <button key={x} className={'pill' + (fCurso === x ? ' on' : '')} onClick={() => setFCurso(fCurso === x ? '' : x)}>{x}</button>)}
            </div>
            {ediciones.length > 0 && (<>
              <div className="fgroup-label">Edición</div>
              <div className="fchips">
                <button className={'pill' + (fEd === '' ? ' on' : '')} onClick={() => setFEd('')}>Todas</button>
                {ediciones.map((x) => <button key={x} className={'pill' + (fEd === x ? ' on' : '')} onClick={() => setFEd(fEd === x ? '' : x)}>Ed. {x}</button>)}
              </div>
            </>)}
            {/* Antes acá había un <select> de Curso y otro de País (dropdowns) mezclados con
                los chips de Estado/Edición de arriba — Diego pidió un solo criterio visual,
                así que Curso y País pasaron a chips también; solo el rango de fechas, que no
                es una categoría, sigue como selector nativo. */}
            <button className="btn-sm" onClick={() => setMasFiltros(!masFiltros)} style={{ marginBottom: 8 }}>{masFiltros ? '– Menos filtros' : '+ Más filtros (país y fechas)'}</button>
            {masFiltros && (<>
              <div className="fgroup-label">País</div>
              <div className="fchips">
                <button className={'pill' + (fPais === '' ? ' on' : '')} onClick={() => setFPais('')}>Todos</button>
                {paises.map((x) => <button key={x} className={'pill' + (fPais === x ? ' on' : '')} onClick={() => setFPais(fPais === x ? '' : x)}>{x}</button>)}
              </div>
              <div className="filters" style={{ marginBottom: 8 }}>
                <input type="date" className="fsel" value={fDesde} onChange={(e) => setFDesde(e.target.value)} title="Desde" />
                <input type="date" className="fsel" value={fHasta} onChange={(e) => setFHasta(e.target.value)} title="Hasta" />
              </div>
            </>)}
            <div className="filters">
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
            <div className="tablewrap tablewrap-inscripciones">
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
              filtros={{ fEstado, setFEstado, fCurso, setFCurso, fEd, setFEd, fPais, setFPais, fDesde, setFDesde, fHasta, setFHasta, limpiar, cursos, ediciones, paises, irA: (estado) => irAConFiltro('estado', estado), irAConFiltro }} />)
          : <AccesoDenegado seccion="Dashboard" />)}

        {tab === 'reportes' && (tienePermisoDashboard(usuario)
          ? <Reportes usuario={usuario} rows={rows} puedeActividades={tienePermisoActividades(usuario)} puedeFormularios={tienePermisoFormularios(usuario)} puedeExportar={puedeExportar} irAConFiltro={irAConFiltro} onActualizar={cargar} />
          : <AccesoDenegado seccion="Reportes" />)}

        {tab === 'emails' && (tienePermisoEmails(usuario) ? <EmailsPanel usuario={usuario} /> : <AccesoDenegado seccion="Emails" />)}
        {tab === 'actividades' && (tienePermisoActividades(usuario) ? <Actividades usuario={usuario} showToast={showToast} puedeGestionar={tienePermisoGestionActividades(usuario)} puedeDocentes={tienePermisoAsignarDocentes(usuario)} /> : <AccesoDenegado seccion="Actividades" />)}
        {tab === 'formularios' && (tienePermisoFormularios(usuario) ? <Formularios usuario={usuario} showToast={showToast} /> : <AccesoDenegado seccion="Formularios" />)}
        {tab === 'equipo' && (tienePermisoAsignarDocentes(usuario) ? <Equipo usuario={usuario} /> : <AccesoDenegado seccion="Equipo Docente" />)}
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
      <TourGuiado tab={tab} setTab={setTab} permisos={{
        dashboard: tienePermisoDashboard(usuario),
        actividades: tienePermisoActividades(usuario),
        formularios: tienePermisoFormularios(usuario),
        emails: tienePermisoEmails(usuario),
        accesos: tienePermisoAccesos(usuario),
        auditoria: tienePermisoAuditoria(usuario),
        verComo: puedeVerComoOtro(usuarioReal)
      }} />
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
function Dashboard({ rows, allRows, filtros }) {
  const F = filtros;
  const universo = allRows || rows;
  const est = (k) => rows.filter((r) => r.estado === k).length;
  const iso = (d) => d.toISOString().slice(0, 10);
  const hoyISO = iso(new Date());
  const hace = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };

  // KPIs: cada número mide una sola cosa. Antes "Completadas %" sumaba Completada + En
  // revisión + Inscrito sobre el total, así que con estos datos siempre daba ~100% aunque
  // "Completada" (75 fichas) fuera apenas un 6% — inconsistente con el número de al lado.
  // Ahora "Completadas" es el conteo real de estado Completada, y el % se llama "Avance" y
  // mide cuántas fichas llegaron a Inscripto (el estado final del proceso).
  const inscritos = est('Inscrito');
  const completadasN = est('Completada');
  const revisionN = est('En revisión');
  const avance = rows.length ? Math.round(inscritos / rows.length * 100) : 0;

  const group = (fn) => { const m = {}; rows.forEach((r) => { const k = fn(r) || '—'; m[k] = (m[k] || 0) + 1; }); return m; };
  const top = (map, n) => Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, n);
  // onPick (opcional): al apretar una barra/chip, filtra Fichas completadas por ese valor
  // puntual — así se puede ver de qué fichas se trata en vez de quedarse solo con el número.
  // disabledKeys: valores que no corresponden a un filtro real (p. ej. "Sin datos" agrupa
  // varios valores sucios distintos, no uno solo) y por eso no son clickeables.
  const minibars = (map, n = 6, onPick, disabledKeys) => {
    const arr = top(map, n); const max = Math.max(1, ...arr.map((a) => a[1]));
    return arr.map(([k, v]) => {
      const clickeable = onPick && !(disabledKeys && disabledKeys.has(k));
      const contenido = (<><span className="lb" title={k}>{k}</span><span className="tr"><span className="fl" style={{ width: (v / max * 100) + '%' }} /></span><span className="vv">{v}</span></>);
      return clickeable
        ? <button type="button" className="minibar minibar-click" key={k} onClick={() => onPick(k)}>{contenido}</button>
        : <div className="minibar" key={k}>{contenido}</div>;
    });
  };
  const cloud = (map, n = 8, onPick, disabledKeys) => (
    <div className="tagcloud">{top(map, n).map(([k, v]) => (
      (onPick && !(disabledKeys && disabledKeys.has(k)))
        ? <button type="button" className="tc" key={k} onClick={() => onPick(k)}>{k} <b>{v}</b></button>
        : <span className="tc" key={k}>{k} <b>{v}</b></span>
    ))}</div>
  );

  // País/Origen a veces traen valores que no son un país ni un canal real ("SI", "True", el
  // nombre de un estado). Para los gráficos los agrupamos aparte en vez de mostrarlos como si
  // fueran datos válidos — la fila cruda en "Fichas completadas" sigue mostrando el valor tal
  // cual está en la planilla, para que se pueda ubicar y corregir.
  const paisAgrupado = (r) => (esValorValido(r.pais) ? r.pais.trim() : 'Sin datos');
  const origenAgrupado = (r) => (esValorValido(r.origen) ? r.origen.trim() : 'Sin informar');

  const periodoActivo = (() => {
    if (!F.fDesde && !F.fHasta) return 'todo';
    if (F.fDesde === hoyISO && F.fHasta === hoyISO) return 'hoy';
    if (F.fDesde === hace(7) && F.fHasta === hoyISO) return '7';
    const d = new Date();
    if (F.fDesde === iso(new Date(d.getFullYear(), d.getMonth(), 1)) && F.fHasta === hoyISO) return 'mes';
    if (F.fDesde === hace(90) && F.fHasta === hoyISO) return '90';
    return '';
  })();
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

  // ⚠ Atención: lo que conviene mirar primero. Solo aparece lo que realmente aplica — si no
  // hay nada pendiente, en revisión ni con datos sucios, el panel entero no se muestra.
  const sinPaisValido = rows.filter((r) => !esValorValido(r.pais)).length;
  const sinOrigenValido = rows.filter((r) => !esValorValido(r.origen)).length;
  const sinDatosLimpios = Math.max(sinPaisValido, sinOrigenValido);
  const UMBRAL_MUESTRA = 8; // cursos con muy pocas fichas no dan un % representativo
  const cursosBajos = F.cursos
    .map((c) => { const deC = rows.filter((r) => r.curso === c); return { curso: c, total: deC.length, pct: deC.length ? Math.round(deC.filter((r) => r.estado === 'Inscrito').length / deC.length * 100) : 0 }; })
    .filter((c) => c.total >= UMBRAL_MUESTRA && c.pct < 70)
    .sort((a, b) => a.pct - b.pct)
    .slice(0, 2);
  const atencion = [];
  if (revisionN > 0) atencion.push({ texto: `${revisionN} ficha${revisionN === 1 ? '' : 's'} pendiente${revisionN === 1 ? '' : 's'} de revisión`, onVer: () => F.irA('En revisión') });
  cursosBajos.forEach((c) => atencion.push({ texto: `${c.curso}: ${c.pct}% de avance sobre ${c.total} fichas (el más bajo)`, onVer: () => F.setFCurso(c.curso) }));
  if (sinDatosLimpios > 0) atencion.push({ texto: `${sinDatosLimpios} ficha${sinDatosLimpios === 1 ? '' : 's'} con País y/u Origen sin un dato válido — conviene revisarlas en la planilla`, onVer: null });

  // Evolución: últimas 8 semanas de fichas (según los filtros activos), para ver de un
  // vistazo si el ritmo de inscripción sube o baja, sin tener que ir a Reportes.
  const semanas = [];
  for (let i = 7; i >= 0; i--) {
    const fin = hace(i * 7); const ini = hace(i * 7 + 6);
    semanas.push({ label: i === 0 ? 'Esta sem.' : `-${i}sem`, rango: `${ini} → ${fin}`, n: rows.filter((r) => (r.fecha || '') >= ini && (r.fecha || '') <= fin).length });
  }
  const maxSem = Math.max(1, ...semanas.map((s) => s.n));

  return (
    <>
      <div className="fdrop-row">
        <SelectDropdown label="Período" value={periodoActivo} onChange={periodo} hidePlaceholderOption options={[
          { value: 'todo', label: 'Todo' }, { value: 'hoy', label: 'Hoy' }, { value: '7', label: '7 días' },
          { value: 'mes', label: 'Este mes' }, { value: '90', label: '90 días' }
        ]} />
        <SelectDropdown label="Edición" value={F.fEd} onChange={F.setFEd} placeholder="Todas las ediciones" searchable options={F.ediciones.map((x) => ({ value: x, label: 'Ed. ' + x }))} />
        <SelectDropdown label="Curso" value={F.fCurso} onChange={F.setFCurso} placeholder="Todos los cursos" searchable options={F.cursos.map((x) => ({ value: x, label: x }))} />
        <SelectDropdown label="Estado" value={F.fEstado} onChange={F.setFEstado} placeholder="Todos" options={ESTADOS.filter((e) => universo.some((r) => r.estado === e)).map((e) => ({ value: e, label: e }))} />
        <SelectDropdown label="País" value={F.fPais} onChange={F.setFPais} placeholder="Todos" searchable options={F.paises.map((x) => ({ value: x, label: x }))} />
        {activos.length > 0 && <button className="btn-sm" onClick={F.limpiar} style={{ alignSelf: 'flex-end' }}>Limpiar filtros</button>}
      </div>
      {activos.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '2px 0 14px' }}>
          {activos.map(([lbl, clear], i) => (
            <span className="chipfilt" key={i}>🟣 {lbl}<button onClick={clear} aria-label="Quitar">×</button></span>
          ))}
        </div>
      )}

      <div className="dash-kpis">
        <div className="dash-kpi click" onClick={() => F.irA('')}><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{rows.length}</div><div className="l">Inscripciones</div></div>
        <div className="dash-kpi click" onClick={() => F.irA('Inscrito')}><div className="n" style={{ color: 'rgb(74 222 128)' }}>{inscritos}</div><div className="l">Inscriptos</div></div>
        <div className="dash-kpi click" onClick={() => F.irA('Completada')}><div className="n">{completadasN}</div><div className="l">Completadas</div></div>
        <div className="dash-kpi click" onClick={() => F.irA('En revisión')}><div className="n" style={{ color: '#d879d1' }}>{revisionN}</div><div className="l">En revisión</div></div>
        <div className="dash-kpi"><div className="n" style={{ color: 'rgb(74 222 128)' }}>{avance}%</div><div className="l">Avance (inscriptos)</div></div>
      </div>

      {atencion.length > 0 && (
        <div className="dash-atencion">
          <h3>⚠ Atención</h3>
          {atencion.map((a, i) => (
            <div className="dash-atencion-item" key={i}>
              <span>{a.texto}</span>
              {a.onVer && <button className="btn-sm" onClick={a.onVer}>Ver →</button>}
            </div>
          ))}
        </div>
      )}

      <div className="dash-grid dash-grid-2">
        <div className="dash-panel dash-panel-lg">
          <h3>Evolución (últimas 8 semanas)</h3>
          <div className="dash-evol">
            {semanas.map((s) => (
              <div className="dash-evol-col" key={s.label} title={`${s.rango}: ${s.n}`}>
                <div className="dash-evol-bar" style={{ height: (s.n / maxSem * 100) + '%' }} />
                <div className="dash-evol-n">{s.n}</div>
                <div className="dash-evol-lb">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-panel dash-panel-lg"><h3>Por estado</h3>{minibars(group((r) => r.estado), 8, (k) => F.irAConFiltro('estado', k))}</div>

        <div className="dash-panel dash-panel-lg"><h3>Por curso</h3>{minibars(group((r) => r.curso), 8, (k) => F.irAConFiltro('curso', k))}</div>
        <div className="dash-panel dash-panel-lg"><h3>Por edición</h3>{cloud(group((r) => r.ed), 10, (k) => F.irAConFiltro('ed', k))}</div>

        <div className="dash-panel dash-panel-lg"><h3>Origen de inscripciones</h3>{minibars(group(origenAgrupado), 8)}</div>
        <div className="dash-panel dash-panel-lg"><h3>Por país</h3>{cloud(group(paisAgrupado), 10, (k) => F.irAConFiltro('pais', k), new Set(['Sin datos']))}</div>
      </div>
    </>
  );
}

/* ===================== CONSTRUCTOR (v1) ===================== */
