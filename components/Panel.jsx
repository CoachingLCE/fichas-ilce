'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useSession } from '../lib/useSession';
import { tienePermisoInscripciones, tienePermisoCambiarEstado, tienePermisoExportar, tienePermisoDashboard, tienePermisoConstructor, tienePermisoAccesos, tienePermisoActividades, tienePermisoGestionActividades, tienePermisoAsignarDocentes, tienePermisoEmails, tienePermisoAuditoria, tienePermisoFormularios, puedeVerComoOtro } from '../lib/permisos';
import { ESTADOS, normalizarEstado, nombreVisibleRoles, estiloCurso } from '../lib/constants';
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

// La columna Edición a veces trae texto ('3° edición', 'Tercera', 'Edición n° 3', '3•').
// Nos quedamos solo con el número para que no se dupliquen ediciones que son la misma.
function edNum(v) { const m = String(v || '').match(/\d+/); return m ? m[0] : String(v || '').trim(); }
function normaliza(f) {
  return {
    id: f.ID, nom: f.Nombre, ape: f.Apellido, em: f.Email, curso: f.Curso, ed: edNum(f['Edición']),
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
  const actividadesRef = useRef(null);
  const { usuario: usuarioReal, cargando: cargandoSesion, logout } = useSession();
  const [verComo, setVerComo] = useState(null); // persona que se está "viendo como" (solo Admin)
  const [personas, setPersonas] = useState([]);
  const usuario = verComo || usuarioReal;
  // El tab activo se refleja en la URL (?tab=...) para que el link de cada página sea
  // compartible y funcione el botón "atrás" del navegador — antes quedaba siempre en /panel.
  const TABS_VALIDOS = ['fichas', 'inscripciones', 'reportes', 'emails', 'actividades', 'formularios', 'equipo', 'accesos', 'auditoria', 'buscador'];
  // El Dashboard se fusionó dentro de Reportes (v0.89.0) — un link viejo con ?tab=dashboard
  // manda directo a Reportes en vez de caer en "fichas" como si esa pestaña no existiera.
  const tabDeUrl = (t) => (t === 'dashboard' ? 'reportes' : TABS_VALIDOS.includes(t) ? t : 'fichas');
  const [tab, setTab] = useState(() => {
    if (typeof window === 'undefined') return 'fichas';
    const t = new URLSearchParams(window.location.search).get('tab');
    return tabDeUrl(t);
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
      if (t) setTab(tabDeUrl(t));
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
  // Punto de entrada único: el botón "+ Crear" (topbar) abre un selector — Inscripción /
  // Actividad / Formulario — y dependiendo de lo elegido dispara el alta correspondiente.
  // Antes cada sección tenía su propio botón de alta suelto (p. ej. "+ Crear nueva ficha de
  // inscripción" en Fichas); ese botón se saca de ahí porque ahora vive acá (pedido de Diego).
  // Si el alta elegida no es la pestaña activa, primero hay que cambiar de pestaña (recién ahí
  // se monta esa sección y su ref queda disponible) y disparar la acción apenas monte.
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [accionAlEntrar, setAccionAlEntrar] = useState(null); // null | 'ficha' | 'actividad'
  useEffect(() => {
    if (tab === 'fichas' && accionAlEntrar === 'ficha') { fichasRef.current?.abrirConstructor(); setAccionAlEntrar(null); }
    if (tab === 'actividades' && accionAlEntrar === 'actividad') { actividadesRef.current?.nueva(); setAccionAlEntrar(null); }
  }, [tab, accionAlEntrar]);
  function elegirCrear(tipo) {
    setCrearAbierto(false);
    if (tipo === 'inscripcion') {
      if (tab !== 'fichas') { setAccionAlEntrar('ficha'); setTab('fichas'); }
      else fichasRef.current?.abrirConstructor();
    } else if (tipo === 'actividad') {
      if (tab !== 'actividades') { setAccionAlEntrar('actividad'); setTab('actividades'); }
      else actividadesRef.current?.nueva();
    } else if (tipo === 'formulario') {
      setTab('formularios');
      showToast('Los formularios se cargan pegando la definición en la pestaña "Formularios" de la Sheet — el alta desde acá todavía no existe.');
    }
  }
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
        <div className="topnav-inner">
        <div className="topnav-brand">
          <Isologo size={32} />
        </div>
        <nav className="topnav-tabs">
          {/* "+ Crear" va primero, antes que Fichas — es el punto de entrada único para dar de
              alta una Inscripción, Actividad o Formulario (ver el selector más abajo). */}
          {(tienePermisoConstructor(usuario) || tienePermisoGestionActividades(usuario) || tienePermisoFormularios(usuario)) && (
            <button className="btn btn-primary" style={{ flex: 'none', height: 36, padding: '0 16px', marginRight: 4 }} onClick={() => setCrearAbierto(true)}>+ Crear</button>
          )}
          {/* Pestañas atenuadas cuando el rol de la persona no tiene acceso a esa sección
              (igual siguen siendo clickeables: si entran ven el cartel de Acceso denegado). */}
          {/* "Fichas de inscripción" y "Fichas completadas" quedan unificadas bajo una sola
              pestaña ("Fichas"), con sub-pestañas adentro — antes competían visualmente
              como si fueran dos módulos del mismo nivel. */}
          <button className={'tnav' + (tab === 'fichas' || tab === 'inscripciones' ? ' on' : '')} onClick={() => setTab('fichas')}>Fichas</button>
          <button className={'tnav' + (tab === 'actividades' ? ' on' : '') + (tienePermisoActividades(usuario) ? '' : ' dim')} onClick={() => setTab('actividades')}>Actividades</button>
          <button className={'tnav' + (tab === 'formularios' ? ' on' : '') + (tienePermisoFormularios(usuario) ? '' : ' dim')} onClick={() => setTab('formularios')}>Formularios</button>
          {/* El Dashboard se fusionó dentro de Reportes (v0.89.0): todo lo que mostraba
              (KPIs, Atención, Evolución, Por curso/estado/edición/país/origen) ahora vive
              en la pestaña "Reportes" → "Resumen", así que la pestaña aparte se saca. */}
          <button className={'tnav' + (tab === 'reportes' ? ' on' : '') + (tienePermisoDashboard(usuario) ? '' : ' dim')} onClick={() => setTab('reportes')}>Reportes</button>
          <div className="navgroup">
            <span className="navgroup-label">Gestión</span>
            <button className={'tnav' + (tab === 'emails' ? ' on' : '') + (tienePermisoEmails(usuario) ? '' : ' dim')} onClick={() => setTab('emails')}>Emails</button>
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
        </div>
      </header>
      {verComo && <div className="vercomo-banner">👁 Modo vista — estás viendo la app como <b>{verComo.nombre}</b> ({nombreVisibleRoles(verComo.roles)}), en solo lectura. <button onClick={() => setVerComo(null)}>Salir del modo vista</button></div>}

      <div className="main">
        <div className="topbar">
          <div>{(() => { const DESC = { fichas: 'Aquí encontrás las fichas de inscripción de cada curso: sus ediciones y las páginas públicas donde se anotan los estudiantes.', inscripciones: 'Aquí encontrás todas las inscripciones cargadas. Buscalas, filtralas y cambiá su estado.', reportes: 'Aquí encontrás el resumen general y las métricas y el análisis de inscripciones, actividades y cursos.', emails: 'Aquí están los correos automáticos que envía el sistema y sus plantillas.', actividades: 'Aquí encontrás las actividades y postworks de cada curso, con sus preguntas y respuestas.', formularios: 'Aquí encontrás los formularios públicos (encuestas, inscripciones y trámites) y sus respuestas.', equipo: 'Aquí encontrás al equipo docente y su asignación a cursos y ediciones.', constructor: 'Aquí armás y editás las fichas de inscripción de cada curso.', herramientas: 'Herramientas internas del sistema.', accesos: 'Aquí gestionás quién entra al sistema y con qué permisos.', auditoria: 'Aquí encontrás el historial de acciones realizadas en el sistema.', buscador: 'Aquí buscás inscripciones en todos los cursos a la vez.' }; return <p className="section-lead">{DESC[tab] || ''}</p>; })()}</div>
          {/* El buscador de texto libre vive en un solo lugar: la pestaña Buscador (🔎 arriba a
              la derecha). Antes había un segundo cuadro de búsqueda acá mismo, duplicando esa
              función — se saca para que quede un único buscador en toda la app. Si "q" ya viene
              cargado (por ejemplo, al llegar acá desde un resultado del Buscador), se muestra
              como un filtro activo más, con su propio botón para sacarlo. */}
          {tab === 'inscripciones' && (
            <button className="btn-sm" onClick={() => setTab('buscador')}>🔎 Buscar</button>
          )}
        </div>

        {(tab === 'fichas' || tab === 'inscripciones') && (
          <div className="subtabs-pill" style={{ alignItems: 'center' }}>
            <button className={tab === 'fichas' ? 'on' : ''} onClick={() => setTab('fichas')}>📋 Fichas de inscripción</button>
            <button className={tab === 'inscripciones' ? 'on' : ''} onClick={() => setTab('inscripciones')}>✅ Fichas completadas</button>
          </div>
        )}

        {crearAbierto && (
          <div className="mwrap on" onClick={() => setCrearAbierto(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
              <h3 style={{ marginTop: 0 }}>¿Qué querés crear?</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
                {tienePermisoConstructor(usuario) && (
                  <button className="btn-sm solid" style={{ justifyContent: 'flex-start', padding: '12px 16px' }} onClick={() => elegirCrear('inscripcion')}>📋 Inscripción</button>
                )}
                {tienePermisoGestionActividades(usuario) && (
                  <button className="btn-sm solid" style={{ justifyContent: 'flex-start', padding: '12px 16px' }} onClick={() => elegirCrear('actividad')}>📝 Actividad</button>
                )}
                {tienePermisoFormularios(usuario) && (
                  <button className="btn-sm solid" style={{ justifyContent: 'flex-start', padding: '12px 16px' }} onClick={() => elegirCrear('formulario')}>🗒️ Formulario</button>
                )}
              </div>
              <button className="btn-sm" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }} onClick={() => setCrearAbierto(false)}>Cancelar</button>
            </div>
          </div>
        )}

        <PausaSemanal />

        {tab === 'buscador' && <Buscador usuario={usuario} irA={(t) => setTab(t)} setQInscripciones={setQ} />}
        {tab === 'fichas' && <FichasSection ref={fichasRef} usuario={usuario} rows={rows} onEditar={editarFicha} onVerInscripciones={verInscripcionesDe} showToast={showToast} puedeEditar={tienePermisoConstructor(usuario)} irABuscador={() => setTab('buscador')} />}
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
            <div className="fgroup-label">Filtros</div>
            <div className="filters" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
              <SelectDropdown placeholder="Curso: todos" searchable value={fCurso} onChange={setFCurso}
                options={cursos.map((x) => ({ value: x, label: x }))} />
              {ediciones.length > 0 && <SelectDropdown placeholder="Edición: todas" searchable value={fEd} onChange={setFEd}
                options={ediciones.map((x) => ({ value: x, label: 'Ed. ' + x }))} />}
              <button className="btn-sm" onClick={() => setMasFiltros(!masFiltros)}>{masFiltros ? '– Menos filtros' : '+ Más filtros (país y fechas)'}</button>
            </div>
            {masFiltros && (
              <div className="filters" style={{ marginBottom: 8, flexWrap: 'wrap' }}>
                <SelectDropdown placeholder="País: todos" searchable value={fPais} onChange={setFPais}
                  options={paises.map((x) => ({ value: x, label: x }))} />
                <input type="date" className="fsel" value={fDesde} onChange={(e) => setFDesde(e.target.value)} title="Desde" />
                <input type="date" className="fsel" value={fHasta} onChange={(e) => setFHasta(e.target.value)} title="Hasta" />
              </div>
            )}
            <div className="filters">
              <span className="spacer" />
              <button className="btn-sm" onClick={() => setColModal(true)}>▦ Columnas</button>
              {puedeExportar && <><button className="btn-sm" onClick={exportCSV}>⬇ CSV</button><button className="btn-sm solid" onClick={exportXLSX}>⬇ Excel</button></>}
            </div>
            {(q || fCurso || fEd || fPais || fEstado || fDesde || fHasta) && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 12 }}>
                {(() => { const n = [q, fEstado, fCurso, fEd, fPais, (fDesde || fHasta)].filter(Boolean).length; return <span style={{ fontSize: 12.5, color: 'rgb(var(--textMuted))', fontWeight: 700 }}>{n} {n === 1 ? 'filtro activo' : 'filtros activos'}</span>; })()}
                {q && <FiltroChip label={`Buscando: "${q}"`} onClear={() => setQ('')} />}
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

        {tab === 'reportes' && (tienePermisoDashboard(usuario)
          ? <Reportes usuario={usuario} rows={rows} puedeActividades={tienePermisoActividades(usuario)} puedeFormularios={tienePermisoFormularios(usuario)} puedeExportar={puedeExportar} irAConFiltro={irAConFiltro} onActualizar={cargar} />
          : <AccesoDenegado seccion="Reportes" />)}

        {tab === 'emails' && (tienePermisoEmails(usuario) ? <EmailsPanel usuario={usuario} /> : <AccesoDenegado seccion="Emails" />)}
        {tab === 'actividades' && (tienePermisoActividades(usuario) ? <Actividades ref={actividadesRef} usuario={usuario} showToast={showToast} puedeGestionar={tienePermisoGestionActividades(usuario)} irABuscador={() => setTab('buscador')} /> : <AccesoDenegado seccion="Actividades" />)}
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
  if (k === 'curso') return r.curso ? <span className="cchip" style={estiloCurso(r.curso)}>{r.curso}</span> : '';
  if (k === 'wa') return <span className="sec">{r.wa}</span>;
  if (k === 'fecha') return <span className="sec" title={r.fecha}>{fechaAmigable(r.fecha)}</span>;
  return r[k] || '';
}
function fmtFecha(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

/* ===================== CONSTRUCTOR (v1) ===================== */
