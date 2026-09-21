'use client';
// Reportes: centro de análisis administrativo (rediseño v2). Se mantiene el 100% de la lógica
// de cálculo que ya existía (embudo, por curso, por mes, participación en Actividades,
// respuestas de Formularios) — lo que cambia acá es la estructura visual: header propio,
// navegación como control segmentado, filtros con presets de período + "Más filtros", KPIs
// sobrios (máx. 4 por vista, sin emojis), tablas premium (barra + dato en una sola fila, en
// vez de repetir la misma lista dos veces), embudo partido en Proceso/Salidas con tasa de
// finalización, tarjetas de "Resumen del período" con datos reales, e íconos lineales en vez
// de emoji. Ninguna fórmula ni endpoint cambia.
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { ESTADOS, CURSOS } from '../lib/constants';
import { SelectDropdown, FiltroChip } from './SelectDropdown';
import MiniChart from './MiniChart';
import { exportarCSV, exportarXLSX } from '../lib/exportUtils';

function iso(d) { return d.toISOString().slice(0, 10); }
function hace(n) { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
function primerDiaMes() { const d = new Date(); d.setDate(1); return iso(d); }
function primerDiaTrimestre() { const d = new Date(); d.setMonth(Math.floor(d.getMonth() / 3) * 3, 1); return iso(d); }
function nombreMes(k) { const [y, m] = k.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }); }
function pctTone(pct, { buenoDesde = 80, regularDesde = 50 } = {}) {
  if (pct == null) return 'muted';
  return pct >= buenoDesde ? 'good' : pct >= regularDesde ? 'warn' : 'bad';
}

/* ============================ Íconos lineales (sin librerías, sin emoji) ============================ */
const svgBase = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  list: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><rect x="4" y="4" width="16" height="16" rx="3" /><line x1="8" y1="9.5" x2="16" y2="9.5" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="16.5" x2="13" y2="16.5" /></svg>),
  check: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><circle cx="12" cy="12" r="8.2" /><path d="M8.3 12.3l2.4 2.4 5-5.2" /></svg>),
  clock: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><circle cx="12" cy="12" r="8.2" /><path d="M12 7.5v4.8l3.2 2" /></svg>),
  eye: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="2.6" /></svg>),
  trend: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><polyline points="3.5,16 9.5,10 13.5,14 20.5,6.5" /><polyline points="15,6.5 20.5,6.5 20.5,12" /></svg>),
  layers: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M12 3.5l8.5 4.5-8.5 4.5-8.5-4.5L12 3.5z" /><path d="M3.5 12.5L12 17l8.5-4.5" /><path d="M3.5 16.5L12 21l8.5-4.5" /></svg>),
  edit: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M6 18.3l.7-3.4L15.6 6l2.7 2.7-8.9 8.9-3.4.7z" /><path d="M13.9 7.7l2.7 2.7" /></svg>),
  user: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><circle cx="12" cy="8.3" r="3.3" /><path d="M4.8 19.5c1.3-3.4 4-5.2 7.2-5.2s5.9 1.8 7.2 5.2" /></svg>),
  circleDash: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><circle cx="12" cy="12" r="8.2" strokeDasharray="3.5 3.5" /></svg>),
  file: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M7 3.5h7l4 4v13h-11z" /><path d="M14 3.5v4h4" /><line x1="9" y1="13" x2="15" y2="13" /><line x1="9" y1="16.3" x2="15" y2="16.3" /></svg>),
  calendar: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><rect x="3.5" y="5" width="17" height="15.5" rx="2.4" /><line x1="3.5" y1="9.6" x2="20.5" y2="9.6" /><line x1="8" y1="3" x2="8" y2="6.8" /><line x1="16" y1="3" x2="16" y2="6.8" /></svg>),
  folder: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M3.5 6.3c0-.7.6-1.3 1.3-1.3h4.6l1.8 2h7.4c.7 0 1.3.6 1.3 1.3v10.4c0 .7-.6 1.3-1.3 1.3H4.8c-.7 0-1.3-.6-1.3-1.3z" /></svg>),
  alert: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M12 3.8L21.3 20H2.7z" /><line x1="12" y1="9.6" x2="12" y2="14" /><circle cx="12" cy="16.9" r="0.15" fill="currentColor" stroke="currentColor" strokeWidth="1.6" /></svg>),
  refresh: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M20 12a8 8 0 10-2.6 5.9" /><polyline points="20,6 20,12 14,12" /></svg>),
  download: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M12 3.5v12.2" /><polyline points="7.3,11.5 12 16.2 16.7,11.5" /><line x1="4.5" y1="20" x2="19.5" y2="20" /></svg>),
  filter: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><path d="M4 5.5h16l-6.2 7.4v5.3l-3.6 1.8v-7.1z" /></svg>),
  table: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><rect x="3.5" y="4.5" width="17" height="15" rx="2" /><line x1="3.5" y1="9.5" x2="20.5" y2="9.5" /><line x1="9.5" y1="9.5" x2="9.5" y2="19.5" /></svg>),
  grid: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><rect x="3.5" y="3.5" width="7.2" height="7.2" rx="1.6" /><rect x="13.3" y="3.5" width="7.2" height="7.2" rx="1.6" /><rect x="3.5" y="13.3" width="7.2" height="7.2" rx="1.6" /><rect x="13.3" y="13.3" width="7.2" height="7.2" rx="1.6" /></svg>),
  chevronRight: (p) => (<svg {...svgBase} {...p} className={'repx-icon repx-rowarrow ' + (p.className || '')}><polyline points="9,5 16,12 9,19" /></svg>),
  arrowOut: (p) => (<svg {...svgBase} {...p} className={'repx-icon ' + (p.className || '')}><line x1="6" y1="18" x2="18" y2="6" /><polyline points="9,6 18,6 18,15" /></svg>),
};

/* ============================ Piezas reutilizables ============================ */
function RepKpi({ icon, n, label, sub, subTone, onClick }) {
  const cuerpo = (
    <>
      <div className="repx-kpi-top">{icon}</div>
      <div className="repx-kpi-n">{n}</div>
      <div className="repx-kpi-l">{label}</div>
      {sub != null && <div className={'repx-kpi-sub' + (subTone ? ' ' + subTone : '')}>{sub}</div>}
    </>
  );
  return onClick
    ? <div className="repx-kpi click" role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()}>{cuerpo}</div>
    : <div className="repx-kpi">{cuerpo}</div>;
}

// Fila de tabla "premium": barra proporcional + valor en una sola celda, para no repetir el
// mismo ranking una vez como lista de barras y otra vez como columna de tabla.
function CellBar({ n, max, tone }) {
  return (
    <div className="repx-cellbar">
      <span className="tr"><span className="fl" style={{ width: (max ? n / max * 100 : 0) + '%' }} /></span>
      <span className={'vv' + (tone ? ' repx-pct ' + tone : '')}>{n}</span>
    </div>
  );
}

function Pct({ v, tone }) {
  const t = tone || pctTone(v);
  return <span className={'repx-pct ' + t}>{v == null ? '—' : v + '%'}</span>;
}

function ExportarMenu({ disabled, onCSV, onXLSX }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fmenu" onClick={(e) => e.stopPropagation()}>
      <button className="btn-sm" disabled={disabled} onClick={() => setOpen((v) => !v)}><Ico.download /> Exportar</button>
      {open && (
        <div className="fmenu-pop" style={{ right: 0, bottom: 'auto', top: 'calc(100% + 6px)' }}>
          <button onClick={() => { setOpen(false); onXLSX(); }}>Excel (.xlsx)</button>
          <button onClick={() => { setOpen(false); onCSV(); }}>CSV</button>
        </div>
      )}
    </div>
  );
}

function Seccion({ titulo, sub, children, right, className }) {
  return (
    <div className={'panel' + (className ? ' ' + className : '')}>
      <div className="sechead" style={{ marginBottom: sub ? 2 : 10 }}>
        <span className="htitle">{titulo}</span>
        <span className="grow" />
        {right}
      </div>
      {sub && <p className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>{sub}</p>}
      {children}
    </div>
  );
}

// Detalle/expandible, para no ocupar espacio hasta que alguien lo pida (ej. "Desglose
// mensual" o "Análisis de preguntas", que quedan de-enfatizados por defecto).
function Expandible({ titulo, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel">
      <button type="button" className="sechead" style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={() => setOpen((v) => !v)}>
        <span className="htitle">{titulo}</span>
        <span className="grow" />
        <span style={{ fontSize: 12, color: 'rgb(var(--accentTeal))', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {open ? 'Ocultar' : 'Ver'} <Ico.chevronRight style={{ transform: open ? 'rotate(90deg)' : 'none', width: 12, height: 12 }} />
        </span>
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

function CrossLink({ onClick, children }) {
  if (!onClick) return null;
  return <button type="button" className="repx-crosslink" onClick={onClick}>{children} <Ico.arrowOut /></button>;
}

const NAV = [
  { v: 'resumen', l: 'Resumen' },
  { v: 'inscripciones', l: 'Inscripciones' },
  { v: 'actividades', l: 'Actividades', req: 'act' },
  { v: 'formularios', l: 'Formularios', req: 'form' },
];
const PERIODOS = [
  { v: 'todo', l: 'Todo' }, { v: 'hoy', l: 'Hoy' }, { v: '7d', l: '7 días' },
  { v: '30d', l: '30 días' }, { v: 'mes', l: 'Este mes' }, { v: 'trimestre', l: 'Trimestre' },
  { v: 'custom', l: 'Personalizado' },
];

export default function Reportes({ usuario, rows, puedeActividades, puedeFormularios, puedeExportar, irAConFiltro, onActualizar }) {
  const [sub, setSub] = useState('resumen');
  const [fCurso, setFCurso] = useState('');
  const [fEd, setFEd] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [periodo, setPeriodo] = useState('todo');
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const [actualizado, setActualizado] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const [actData, setActData] = useState(null);
  const [actError, setActError] = useState('');
  const [formData, setFormData] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => { if (rows) setActualizado(new Date()); }, [rows]);
  useEffect(() => { if (puedeActividades) cargarActividades(); /* eslint-disable-next-line */ }, [puedeActividades]);
  useEffect(() => { if (puedeFormularios) cargarFormularios(); /* eslint-disable-next-line */ }, [puedeFormularios]);
  useEffect(() => {
    if (!moreOpen) return;
    const onDoc = (e) => { if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [moreOpen]);

  async function cargarActividades() {
    try {
      const res = await fetch('/api/actividades/reporte?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo cargar');
      setActData({ actividades: d.actividades || [], porCurso: d.porCurso || [] });
    } catch (e) { setActError(e.message || 'Error de conexión'); setActData({ actividades: [], porCurso: [] }); }
  }
  async function cargarFormularios() {
    try {
      const res = await fetch('/api/formularios/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo cargar');
      setFormData(d.respuestas || []);
    } catch (e) { setFormError(e.message || 'Error de conexión'); setFormData([]); }
  }
  async function actualizar() {
    setRefrescando(true);
    try {
      const tareas = [];
      if (onActualizar) tareas.push(onActualizar());
      if (puedeActividades) tareas.push(cargarActividades());
      if (puedeFormularios) tareas.push(cargarFormularios());
      await Promise.all(tareas);
    } finally { setRefrescando(false); }
  }

  function aplicarPeriodo(v) {
    setPeriodo(v);
    if (v === 'todo') { setFDesde(''); setFHasta(''); }
    else if (v === 'hoy') { setFDesde(hace(0)); setFHasta(hace(0)); }
    else if (v === '7d') { setFDesde(hace(6)); setFHasta(hace(0)); }
    else if (v === '30d') { setFDesde(hace(29)); setFHasta(hace(0)); }
    else if (v === 'mes') { setFDesde(primerDiaMes()); setFHasta(hace(0)); }
    else if (v === 'trimestre') { setFDesde(primerDiaTrimestre()); setFHasta(hace(0)); }
    // 'custom': se deja que el usuario complete los campos Desde/Hasta a mano.
  }

  // Ojo: todos los hooks (useMemo acá abajo) tienen que ejecutarse siempre en el mismo orden,
  // así que el "if (!rows) return spinner" queda MÁS ABAJO, después de todos ellos — nunca
  // antes. Cada useMemo usa "rows || []" para no explotar mientras todavía no llegaron.
  const cursosDisp = useMemo(() => [...new Set((rows || []).map((r) => r.curso).filter(Boolean))].sort(), [rows]);
  const edicionesDisp = useMemo(() => [...new Set((rows || []).map((r) => r.ed).filter(Boolean))].sort((a, b) => {
    const na = parseInt(a, 10), nb = parseInt(b, 10);
    if (!isNaN(na) && !isNaN(nb) && na !== nb) return na - nb;
    return String(a).localeCompare(String(b), 'es', { numeric: true });
  }), [rows]);

  const rowsF = useMemo(() => (rows || []).filter((r) => {
    if (fCurso && r.curso !== fCurso) return false;
    if (fEd && r.ed !== fEd) return false;
    if (fEstado && r.estado !== fEstado) return false;
    if (fDesde && (r.fecha || '') < fDesde) return false;
    if (fHasta && (r.fecha || '') > fHasta) return false;
    return true;
  }), [rows, fCurso, fEd, fEstado, fDesde, fHasta]);

  // Actividades: el reporte agregado viene por actividad/curso, sin fecha ni edición por
  // respuesta individual — así que ahí solo se puede aplicar el filtro de Curso (dato real
  // por actividad). Edición/Estado/Fecha no se pueden calcular sin cambiar la API, así que
  // no se aplican (en vez de fingir que filtran).
  const actividadesF = useMemo(() => {
    if (!actData) return null;
    const actividades = fCurso ? actData.actividades.filter((a) => a.curso === fCurso) : actData.actividades;
    const porCurso = fCurso ? actData.porCurso.filter((c) => c.curso === fCurso) : actData.porCurso;
    return { actividades, porCurso };
  }, [actData, fCurso]);

  // Formularios: cada respuesta sí trae curso, edición y fecha reales.
  const formF = useMemo(() => {
    if (!formData) return null;
    return formData.filter((r) => {
      if (fCurso && r.curso !== fCurso) return false;
      if (fEd && (r.edicion || '') !== fEd) return false;
      if (fDesde && (r.fecha || '') < fDesde) return false;
      if (fHasta && (r.fecha || '') > fHasta) return false;
      return true;
    });
  }, [formData, fCurso, fEd, fDesde, fHasta]);

  const hayFiltros = !!(fCurso || fEd || fEstado || fDesde || fHasta);
  function limpiarFiltros() { setFCurso(''); setFEd(''); setFEstado(''); setFDesde(''); setFHasta(''); setPeriodo('todo'); }
  const nFiltrosExtra = (fCurso ? 1 : 0) + (fEd ? 1 : 0) + (fEstado ? 1 : 0);

  const exportInfo = useMemo(() => {
    if (sub === 'resumen' || sub === 'inscripciones') {
      return { nombre: 'reportes_inscripciones', hoja: 'Inscripciones', cols: [['nom', 'Nombre'], ['ape', 'Apellido'], ['em', 'Email'], ['curso', 'Curso'], ['ed', 'Edición'], ['estado', 'Estado'], ['fecha', 'Fecha ficha']], data: rowsF };
    }
    if (sub === 'actividades' && actividadesF) {
      return { nombre: 'reportes_actividades', hoja: 'Actividades', cols: [['titulo', 'Actividad'], ['curso', 'Curso'], ['totalResp', 'Respuestas'], ['promedio', 'Promedio %'], ['tiempoProm', 'Tiempo promedio (seg)']], data: actividadesF.actividades };
    }
    if (sub === 'formularios' && formF) {
      return { nombre: 'reportes_formularios', hoja: 'Formularios', cols: [['formulario', 'Formulario'], ['curso', 'Curso'], ['edicion', 'Edición'], ['nombre', 'Nombre'], ['email', 'Email'], ['fecha', 'Fecha']], data: formF };
    }
    return null;
  }, [sub, rowsF, actividadesF, formF]);

  if (!rows) return <div className="spin" />;

  const chips = [];
  if (fCurso) chips.push(['Curso: ' + fCurso, () => setFCurso('')]);
  if (fEd) chips.push(['Edición: ' + fEd, () => setFEd('')]);
  if (fEstado) chips.push(['Estado: ' + fEstado, () => setFEstado('')]);
  if (fDesde || fHasta) chips.push([`Fecha: ${fDesde || '…'} → ${fHasta || '…'}`, () => { setFDesde(''); setFHasta(''); setPeriodo('todo'); }]);

  const totalesSub = {
    resumen: rows.length, inscripciones: rows.length,
    actividades: actData ? actData.actividades.length : 0,
    formularios: formData ? formData.length : 0
  };
  const mostrandoSub = {
    resumen: rowsF.length, inscripciones: rowsF.length,
    actividades: actividadesF ? actividadesF.actividades.length : 0,
    formularios: formF ? formF.length : 0
  };

  return (
    <div>
      <div className="repx-head">
        <div className="repx-head-txt">
          <p className="fhead-sub">Analizá inscripciones, participación y actividad de los estudiantes.</p>
          <div className="repx-head-meta">
            {actualizado && <span>Actualizado {actualizado.toLocaleDateString('es-AR')} · {actualizado.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>}
            <span>· Mostrando <b style={{ color: 'rgb(var(--text))' }}>{mostrandoSub[sub]}</b> de {totalesSub[sub]} registro{totalesSub[sub] === 1 ? '' : 's'}</span>
          </div>
        </div>
        <div className="repx-head-actions">
          <button className="btn-sm" onClick={actualizar} disabled={refrescando}>
            <Ico.refresh className={refrescando ? 'spinning' : ''} /> {refrescando ? 'Actualizando…' : 'Actualizar'}
          </button>
          {puedeExportar && exportInfo && (
            <ExportarMenu
              disabled={exportInfo.data.length === 0}
              onCSV={() => exportarCSV(exportInfo.nombre + '.csv', exportInfo.cols, exportInfo.data)}
              onXLSX={() => exportarXLSX(exportInfo.nombre + '.xlsx', exportInfo.hoja, exportInfo.cols, exportInfo.data)}
            />
          )}
        </div>
      </div>

      <div className="repx-nav">
        {NAV.filter((n) => (n.req === 'act' ? puedeActividades : n.req === 'form' ? puedeFormularios : true)).map((n) => (
          <button key={n.v} className={sub === n.v ? 'on' : ''} onClick={() => setSub(n.v)}>{n.l}</button>
        ))}
      </div>

      <div className="repx-toolbar">
        <div className="repx-period">
          {PERIODOS.map((p) => <button key={p.v} className={'fchip' + (periodo === p.v ? ' on' : '')} onClick={() => aplicarPeriodo(p.v)}>{p.l}</button>)}
        </div>
        {periodo === 'custom' && (<>
          <div className="fdrop"><div className="fdrop-label">Desde</div><input type="date" className="fsel" value={fDesde} onChange={(e) => setFDesde(e.target.value)} /></div>
          <div className="fdrop"><div className="fdrop-label">Hasta</div><input type="date" className="fsel" value={fHasta} onChange={(e) => setFHasta(e.target.value)} /></div>
        </>)}
        <div className="repx-more-wrap" ref={moreRef}>
          <button className={'btn-sm' + (nFiltrosExtra ? ' solid' : '')} onClick={() => setMoreOpen((v) => !v)}>
            <Ico.filter /> Más filtros{nFiltrosExtra ? ` · ${nFiltrosExtra}` : ''}
          </button>
          {moreOpen && (
            <div className="repx-more-pop">
              <div className="repx-more-row"><SelectDropdown label="Curso" value={fCurso} onChange={setFCurso} placeholder="Todos los cursos" searchable options={cursosDisp.map((x) => ({ value: x, label: x }))} /></div>
              <div className="repx-more-row"><SelectDropdown label="Edición" value={fEd} onChange={setFEd} placeholder="Todas" searchable options={edicionesDisp.map((x) => ({ value: x, label: 'Ed. ' + x }))} /></div>
              <div className="repx-more-row"><SelectDropdown label="Estado" value={fEstado} onChange={setFEstado} placeholder="Todos" options={ESTADOS.filter((e) => rows.some((r) => r.estado === e)).map((e) => ({ value: e, label: e }))} /></div>
            </div>
          )}
        </div>
        {hayFiltros && <button className="btn-sm" onClick={limpiarFiltros}>Limpiar filtros</button>}
        <span className="grow" />
      </div>
      {(sub === 'actividades' || sub === 'formularios') && (fEstado) && (
        <p className="muted" style={{ fontSize: 11.5, margin: '0 0 8px' }}>El filtro de Estado no aplica acá (es propio de las fichas de inscripción).</p>
      )}
      {sub === 'actividades' && (fEd || fDesde || fHasta) && (
        <p className="muted" style={{ fontSize: 11.5, margin: '0 0 8px' }}>Edición y fecha no se pueden filtrar en Actividades todavía (el reporte no trae ese detalle por respuesta) — solo se aplicó Curso.</p>
      )}
      {chips.length > 0 && (
        <div className="repx-chips-row">
          {chips.map(([lbl, clear], i) => <FiltroChip key={i} label={lbl} onClear={clear} />)}
        </div>
      )}

      {sub === 'resumen' && <ReportesResumen rows={rowsF} irAConFiltro={irAConFiltro} />}
      {sub === 'inscripciones' && <ReportesInscripciones rows={rowsF} irAConFiltro={irAConFiltro} />}
      {sub === 'actividades' && puedeActividades && (
        actError ? <div className="empty"><Ico.alert className="lg" /><h3>No se pudo cargar</h3><p>{actError}</p></div> :
        !actividadesF ? <div className="spin" /> :
        <ReportesActividades data={actividadesF} rowsInsc={rowsF} />
      )}
      {sub === 'formularios' && puedeFormularios && (
        formError ? <div className="empty"><Ico.alert className="lg" /><h3>No se pudo cargar</h3><p>{formError}</p></div> :
        !formF ? <div className="spin" /> :
        <ReportesFormularios data={formF} irAConFiltro={irAConFiltro} />
      )}
    </div>
  );
}

/* ============================ RESUMEN ============================ */
const RANGOS_EVOL = [{ v: 30, l: '30 días' }, { v: 90, l: '3 meses' }, { v: 180, l: '6 meses' }, { v: 365, l: '12 meses' }];

function serieDiaria(rows, dias) {
  const claves = [];
  for (let i = dias - 1; i >= 0; i--) claves.push(hace(i));
  const porDia = {}; const compPorDia = {}; const pendPorDia = {};
  rows.forEach((r) => {
    const f = (r.fecha || '').slice(0, 10);
    if (!f) return;
    porDia[f] = (porDia[f] || 0) + 1;
    if (r.estado === 'Completada') compPorDia[f] = (compPorDia[f] || 0) + 1;
    if (r.estado === 'Pendiente') pendPorDia[f] = (pendPorDia[f] || 0) + 1;
  });
  const fmt = (k) => { const d = new Date(k + 'T00:00:00'); return d.toLocaleDateString('es-AR', dias <= 31 ? { day: '2-digit', month: '2-digit' } : { day: '2-digit', month: 'short' }); };
  return {
    total: claves.map((k) => ({ label: fmt(k), v: porDia[k] || 0 })),
    completadas: claves.map((k) => ({ label: fmt(k), v: compPorDia[k] || 0 })),
    pendientes: claves.map((k) => ({ label: fmt(k), v: pendPorDia[k] || 0 }))
  };
}

function ReportesResumen({ rows, irAConFiltro }) {
  const [rango, setRango] = useState(30);
  const sem = rows.filter((r) => (r.fecha || '') >= hace(7)).length;
  const completadas = rows.filter((r) => r.estado === 'Completada').length;
  const pendientes = rows.filter((r) => r.estado === 'Pendiente').length;
  const enRevision = rows.filter((r) => r.estado === 'En revisión').length;
  const enProceso = pendientes + enRevision;
  const pctCompletadas = rows.length ? Math.round(completadas / rows.length * 100) : 0;

  const nuevos30 = rows.filter((r) => (r.fecha || '') >= hace(30)).length;
  const nuevos30prev = rows.filter((r) => (r.fecha || '') >= hace(60) && (r.fecha || '') < hace(30)).length;
  const variacion = nuevos30prev > 0 ? Math.round((nuevos30 - nuevos30prev) / nuevos30prev * 100) : (nuevos30 > 0 ? 100 : 0);

  const serie = useMemo(() => serieDiaria(rows, rango), [rows, rango]);

  const porCursoDetalle = useMemo(() => {
    return CURSOS.map((c) => {
      const del = rows.filter((r) => r.curso === c.nombre);
      const completadas = del.filter((r) => r.estado === 'Completada').length;
      const pendientes = del.filter((r) => ['Pendiente', 'Iniciada'].includes(r.estado)).length;
      const revision = del.filter((r) => r.estado === 'En revisión').length;
      return { curso: c.nombre, total: del.length, completadas, pendientes, revision, pct: del.length ? Math.round(completadas / del.length * 100) : 0 };
    }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  }, [rows]);
  const maxCurso = Math.max(1, ...porCursoDetalle.map((c) => c.total));
  const cursoTop = porCursoDetalle[0];

  // "Resumen del período": frases con datos ya calculados arriba — nada inventado.
  const insights = [];
  if (cursoTop) insights.push({ tone: '', ico: 'trend', txt: <><b>{cursoTop.curso}</b> concentra el mayor número de fichas ({cursoTop.total}, {cursoTop.pct}% completadas).</> });
  insights.push({ tone: pctCompletadas >= 80 ? 'good' : pctCompletadas >= 50 ? 'warn' : 'bad', ico: 'check', txt: <>La tasa de finalización general es del <b>{pctCompletadas}%</b> ({completadas} de {rows.length} fichas).</> });
  if (nuevos30 > 0 || nuevos30prev > 0) {
    insights.push({
      tone: variacion > 0 ? 'good' : variacion < 0 ? 'bad' : '', ico: 'trend',
      txt: <>Las fichas nuevas {variacion > 0 ? 'subieron' : variacion < 0 ? 'bajaron' : 'se mantuvieron'} un <b>{Math.abs(variacion)}%</b> en los últimos 30 días respecto de los 30 anteriores.</>
    });
  }
  if (enProceso > 0) insights.push({ tone: 'warn', ico: 'clock', txt: <>Hay <b>{enProceso}</b> ficha{enProceso === 1 ? '' : 's'} en proceso ({pendientes} pendiente{pendientes === 1 ? '' : 's'}, {enRevision} en revisión).</> });

  return (
    <div>
      <div className="repx-kpis">
        <RepKpi icon={<Ico.list />} n={rows.length} label="Total de fichas" onClick={() => irAConFiltro && irAConFiltro('estado', '')} />
        <RepKpi icon={<Ico.check />} n={completadas} label="Completadas" sub={rows.length ? `${pctCompletadas}% del total` : null} onClick={() => irAConFiltro && irAConFiltro('estado', 'Completada')} />
        <RepKpi icon={<Ico.clock />} n={enProceso} label="En proceso" sub={`${pendientes} pendientes · ${enRevision} en revisión`} />
        <RepKpi icon={<Ico.trend />} n={sem} label="Nuevas · 7 días" sub={(variacion > 0 ? '↑ +' : variacion < 0 ? '↓ ' : '→ ') + variacion + '% vs. 30 días previos'} subTone={variacion > 0 ? 'good' : variacion < 0 ? 'bad' : ''} />
      </div>

      {insights.length > 0 && (
        <Seccion titulo="Resumen del período">
          <div className="repx-insights">
            {insights.map((it, i) => (
              <div key={i} className={'repx-insight' + (it.tone ? ' ' + it.tone : '')}>
                {Ico[it.ico]({})}
                <span>{it.txt}</span>
              </div>
            ))}
          </div>
        </Seccion>
      )}

      <Seccion titulo="Evolución de inscripciones" sub="Fichas nuevas por día. Completadas y Pendientes se muestran como referencia secundaria." right={
        <div className="fchips" style={{ margin: 0 }}>
          {RANGOS_EVOL.map((r) => <button key={r.v} className={'fchip' + (rango === r.v ? ' on' : '')} onClick={() => setRango(r.v)}>{r.l}</button>)}
        </div>
      }>
        <MiniChart series={[{ nombre: 'Nuevas', data: serie.total }, { nombre: 'Completadas', data: serie.completadas, color: 'rgb(74 222 128)' }, { nombre: 'Pendientes', data: serie.pendientes, color: 'rgb(251 191 36)' }]} />
      </Seccion>

      <Seccion titulo="Por curso" sub="Ranking de fichas por curso — clickeá una fila para verlo en Fichas completadas.">
        {porCursoDetalle.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : (
          <div className="tablewrap" style={{ maxHeight: 400 }}>
            <table>
              <thead><tr><th>Curso</th><th>Fichas</th><th>Completadas</th><th>Pendientes</th><th>En revisión</th><th>% completado</th><th /></tr></thead>
              <tbody>{porCursoDetalle.map((c) => (
                <tr key={c.curso} className="clickable" style={{ cursor: irAConFiltro ? 'pointer' : undefined }} onClick={() => irAConFiltro && irAConFiltro('curso', c.curso)}>
                  <td><b>{c.curso}</b></td>
                  <td><CellBar n={c.total} max={maxCurso} /></td>
                  <td className="sec">{c.completadas}</td>
                  <td className="sec">{c.pendientes}</td>
                  <td className="sec">{c.revision}</td>
                  <td><Pct v={c.pct} /></td>
                  <td>{irAConFiltro && <Ico.chevronRight />}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Seccion>
    </div>
  );
}

/* ============================ INSCRIPCIONES ============================ */
// Orden "de viaje" de una ficha: Rechazada/Cancelada quedan al final como salidas, no como
// parte del avance normal — así el embudo cubre los 8 estados reales sin duplicar un bloque
// "Por estado" aparte (son el mismo dato, mostrado una sola vez).
const ORDEN_EMBUDO = ['Iniciada', 'Pendiente', 'En revisión', 'Observada', 'Completada', 'Inscrito', 'Rechazada', 'Cancelada'];
const ESTADOS_SALIDA = new Set(['Rechazada', 'Cancelada']);
const ESTADOS_PROCESO = ORDEN_EMBUDO.filter((e) => !ESTADOS_SALIDA.has(e));

function ReportesInscripciones({ rows, irAConFiltro }) {
  const embudoProceso = useMemo(() => ESTADOS_PROCESO.map((e) => ({ estado: e, n: rows.filter((r) => r.estado === e).length })).filter((e) => e.n > 0), [rows]);
  const embudoSalidas = useMemo(() => [...ESTADOS_SALIDA].map((e) => ({ estado: e, n: rows.filter((r) => r.estado === e).length })).filter((e) => e.n > 0), [rows]);
  const finalizadas = rows.filter((r) => r.estado === 'Completada' || r.estado === 'Inscrito').length;
  const tasaFinalizacion = rows.length ? Math.round(finalizadas / rows.length * 100) : 0;

  const porCursoDetalle = useMemo(() => {
    return CURSOS.map((c) => {
      const del = rows.filter((r) => r.curso === c.nombre);
      const completadas = del.filter((r) => r.estado === 'Completada').length;
      return { curso: c.nombre, total: del.length, completadas, pct: del.length ? Math.round(completadas / del.length * 100) : 0 };
    }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
  }, [rows]);
  const maxCurso = Math.max(1, ...porCursoDetalle.map((c) => c.total));

  const serieMensual = useMemo(() => {
    const m = {};
    rows.forEach((r) => { const k = (r.fecha || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, n]) => ({ label: nombreMes(k), v: n }));
  }, [rows]);

  const cursosConDatos = useMemo(() => [...new Set(rows.map((r) => r.curso).filter(Boolean))].sort(), [rows]);
  const porMes6 = useMemo(() => {
    const m = {};
    rows.forEach((r) => { const k = (r.fecha || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [rows]);
  const porMesYCurso = useMemo(() => porMes6.map(([k, total]) => {
    const delMes = rows.filter((r) => (r.fecha || '').slice(0, 7) === k);
    const porCurso = {};
    cursosConDatos.forEach((c) => { porCurso[c] = delMes.filter((r) => r.curso === c).length; });
    return { mes: k, total, porCurso };
  }), [rows, porMes6, cursosConDatos]);

  const maxEmbudo = rows.length || 1;

  return (
    <div>
      <div className="repx-completion">
        <div className={'repx-completion-n repx-pct ' + pctTone(tasaFinalizacion)}>{tasaFinalizacion}%</div>
        <div className="repx-completion-txt">Tasa de finalización general — <b style={{ color: 'rgb(var(--text))' }}>{finalizadas}</b> de {rows.length} fichas llegaron a Completada o Inscrito.</div>
      </div>

      <Seccion titulo="Embudo por estado" sub="En qué estado está cada ficha hoy. Proceso = etapas de avance normal; Salidas = fichas que no van a seguir.">
        <div className="repx-funnel-groups">
          <div>
            <div className="repx-funnel-grouplbl"><span>Proceso de inscripción</span><b>{embudoProceso.reduce((s, e) => s + e.n, 0)} fichas</b></div>
            {embudoProceso.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : embudoProceso.map((e) => (
              <div key={e.estado} style={{ marginBottom: 4 }}>
                <Barra label={e.estado} n={e.n} max={maxEmbudo} claseFill={e.estado === 'Completada' || e.estado === 'Inscrito' ? '' : 'm'} onClick={irAConFiltro ? () => irAConFiltro('estado', e.estado) : undefined} />
                <div style={{ fontSize: 11, color: 'rgb(var(--textMuted))', textAlign: 'right', marginTop: -4, marginBottom: 6 }}>{rows.length ? Math.round(e.n / rows.length * 100) : 0}% del total</div>
              </div>
            ))}
          </div>
          {embudoSalidas.length > 0 && (
            <div>
              <div className="repx-funnel-grouplbl"><span>Salidas del proceso</span><b>{embudoSalidas.reduce((s, e) => s + e.n, 0)} fichas</b></div>
              {embudoSalidas.map((e) => (
                <div key={e.estado} style={{ marginBottom: 4 }}>
                  <Barra label={e.estado} n={e.n} max={maxEmbudo} claseFill="r" onClick={irAConFiltro ? () => irAConFiltro('estado', e.estado) : undefined} />
                  <div style={{ fontSize: 11, color: 'rgb(var(--textMuted))', textAlign: 'right', marginTop: -4, marginBottom: 6 }}>{rows.length ? Math.round(e.n / rows.length * 100) : 0}% del total</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Seccion>

      <Seccion titulo="Evolución mensual" sub="Fichas recibidas por mes (últimos 12 meses con datos).">
        <MiniChart series={[{ nombre: 'Fichas', data: serieMensual }]} />
      </Seccion>

      <Seccion titulo="Distribución por curso">
        {porCursoDetalle.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : (
          <div className="tablewrap" style={{ maxHeight: 380 }}>
            <table>
              <thead><tr><th>Curso</th><th>Fichas</th><th>Completadas</th><th>% completado</th><th /></tr></thead>
              <tbody>{porCursoDetalle.map((c) => (
                <tr key={c.curso} className="clickable" style={{ cursor: irAConFiltro ? 'pointer' : undefined }} onClick={() => irAConFiltro && irAConFiltro('curso', c.curso)}>
                  <td><b>{c.curso}</b></td>
                  <td><CellBar n={c.total} max={maxCurso} /></td>
                  <td className="sec">{c.completadas}</td>
                  <td><Pct v={c.pct} /></td>
                  <td>{irAConFiltro && <Ico.chevronRight />}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Seccion>

      <Expandible titulo="Desglose mensual por curso">
        {porMesYCurso.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : (
          <div className="tablewrap tablewrap-ancha" style={{ maxHeight: 340 }}>
            <table>
              <thead><tr><th>Mes</th>{cursosConDatos.map((c) => <th key={c}>{c}</th>)}<th>Total</th></tr></thead>
              <tbody>{porMesYCurso.map((fila) => (
                <tr key={fila.mes}>
                  <td><b>{nombreMes(fila.mes)}</b></td>
                  {cursosConDatos.map((c) => <td key={c} className="sec">{fila.porCurso[c] || 0}</td>)}
                  <td style={{ fontWeight: 700 }}>{fila.total}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Expandible>
    </div>
  );
}

// Se mantiene por compatibilidad de estilo visual (embudo): barra simple con click opcional.
function Barra({ label, n, max, claseFill = '', onClick }) {
  const contenido = (<><span className="lb" title={label}>{label}</span><span className="track"><span className={'fill ' + claseFill} style={{ width: (n / max * 100) + '%' }} /></span><span className="vv">{n}</span></>);
  return onClick
    ? <button type="button" className="bar bar-click" onClick={onClick}>{contenido}</button>
    : <div className="bar">{contenido}</div>;
}

/* ============================ ACTIVIDADES ============================ */
const MIN_RESP_PREGUNTA_DEFAULT = 3;
const ORDEN_ACTIVIDADES = [
  { v: 'mas_resp', l: 'Más respuestas' }, { v: 'menos_resp', l: 'Menos respuestas' },
  { v: 'mayor_prom', l: 'Mayor promedio' }, { v: 'menor_prom', l: 'Menor promedio' }
];
const ORDEN_PREGUNTAS = [
  { v: 'menor', l: 'Menor % de aciertos primero' }, { v: 'mayor', l: 'Mayor % de aciertos primero' }, { v: 'actividad', l: 'Por actividad' }
];
function fmtDuracion(seg) {
  if (!seg) return '—';
  if (seg < 60) return `${seg}s`;
  return `${Math.floor(seg / 60)}m ${seg % 60}s`;
}

function ReportesActividades({ data, rowsInsc }) {
  const { actividades, porCurso } = data;
  const [ordenAct, setOrdenAct] = useState('menos_resp');
  const [vistaAct, setVistaAct] = useState('tabla');
  const [ordenPreg, setOrdenPreg] = useState('menor');
  const [fCursoPreg, setFCursoPreg] = useState('');
  const [fActPreg, setFActPreg] = useState('');
  const [minResp, setMinResp] = useState(MIN_RESP_PREGUNTA_DEFAULT);
  const [abierta, setAbierta] = useState(null);
  const [abiertoCurso, setAbiertoCurso] = useState(null);

  const conRespuestas = actividades.filter((a) => a.totalResp > 0);
  const totalResp = conRespuestas.reduce((s, a) => s + a.totalResp, 0);
  const promedioGeneral = totalResp ? Math.round(conRespuestas.reduce((s, a) => s + a.promedio * a.totalResp, 0) / totalResp) : 0;
  const estudiantesPorCurso = porCurso.reduce((s, c) => s + c.estudiantesConActividad, 0);
  const maxResp = Math.max(1, ...conRespuestas.map((a) => a.totalResp));

  const ordenadas = useMemo(() => actividades.slice().sort((a, b) => {
    if (ordenAct === 'mas_resp') return b.totalResp - a.totalResp;
    if (ordenAct === 'mayor_prom') return b.promedio - a.promedio;
    if (ordenAct === 'menor_prom') return a.promedio - b.promedio;
    return a.totalResp - b.totalResp; // menos_resp
  }), [actividades, ordenAct]);

  // Cruce inscriptos (Fichas, ya filtradas) vs. participación (Actividades) por curso.
  const cruce = useMemo(() => {
    const inscriptosPorCurso = {};
    rowsInsc.forEach((r) => { if (r.curso && !['Rechazada', 'Cancelada'].includes(r.estado)) inscriptosPorCurso[r.curso] = (inscriptosPorCurso[r.curso] || 0) + 1; });
    const cursos = new Set([...Object.keys(inscriptosPorCurso), ...porCurso.map((p) => p.curso)]);
    const porCursoMap = {}; porCurso.forEach((p) => { porCursoMap[p.curso] = p; });
    return [...cursos].map((curso) => {
      const inscriptos = inscriptosPorCurso[curso] || 0;
      const act = porCursoMap[curso];
      const realizaron = act ? act.estudiantesConActividad : 0;
      return { curso, inscriptos, realizaron, respuestas: act ? act.totalRespuestas : 0, pct: inscriptos > 0 ? Math.round(realizaron / inscriptos * 100) : null, promedio: act && act.totalRespuestas > 0 ? act.promedio : null };
    }).filter((c) => c.inscriptos > 0 || c.realizaron > 0).sort((a, b) => b.inscriptos - a.inscriptos);
  }, [rowsInsc, porCurso]);

  const actividadesPorCurso = useMemo(() => { const m = {}; actividades.forEach((a) => (m[a.curso] = m[a.curso] || []).push(a)); return m; }, [actividades]);

  const cursosPreg = useMemo(() => [...new Set(actividades.map((a) => a.curso).filter(Boolean))].sort(), [actividades]);
  const todasPreguntas = useMemo(() => actividades.flatMap((a) => a.preguntas.map((p, i) => ({
    actividadSlug: a.slug, actividadTitulo: a.titulo, actividadCurso: a.curso, idx: i, pregunta: p.pregunta, respondidas: p.respondidas, aciertos: p.aciertos, pct: p.pct
  }))).filter((p) => p.respondidas >= minResp), [actividades, minResp]);
  const preguntasFiltradas = useMemo(() => todasPreguntas.filter((p) => (!fCursoPreg || p.actividadCurso === fCursoPreg) && (!fActPreg || p.actividadTitulo === fActPreg)), [todasPreguntas, fCursoPreg, fActPreg]);
  const preguntasOrdenadas = useMemo(() => preguntasFiltradas.slice().sort((a, b) => {
    if (ordenPreg === 'mayor') return b.pct - a.pct;
    if (ordenPreg === 'actividad') return a.actividadTitulo.localeCompare(b.actividadTitulo) || a.idx - b.idx;
    return a.pct - b.pct;
  }), [preguntasFiltradas, ordenPreg]);

  return (
    <div>
      <p className="fhead-sub" style={{ marginBottom: 14 }}>Participación y desempeño en las actividades (postwork) de cada curso.</p>
      <div className="repx-kpis">
        <RepKpi icon={<Ico.layers />} n={actividades.length} label="Actividades" sub={conRespuestas.length < actividades.length ? `${actividades.length - conRespuestas.length} sin respuestas aún` : null} />
        <RepKpi icon={<Ico.edit />} n={totalResp} label="Respuestas totales" />
        <RepKpi icon={<Ico.user />} n={estudiantesPorCurso} label="Estudiantes participantes*" />
        <RepKpi icon={<Ico.check />} n={totalResp ? promedioGeneral + '%' : '—'} label="Promedio general" sub={totalResp ? `sobre ${totalResp} respuesta${totalResp === 1 ? '' : 's'}` : null} subTone={totalResp ? (promedioGeneral >= 80 ? 'good' : promedioGeneral < 50 ? 'bad' : '') : ''} />
      </div>
      <p className="muted" style={{ fontSize: 11, marginTop: -8 }}>*Suma de estudiantes distintos por curso — si alguien participó en más de un curso, se cuenta una vez en cada uno (no es un total global deduplicado).</p>

      <Seccion titulo="Participación por curso" sub="Inscriptos (fichas activas, según filtros) vs. estudiantes que efectivamente respondieron alguna actividad de ese curso.">
        {cruce.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Todavía no hay datos suficientes.</p> : (
          <div className="tablewrap tablewrap-ancha" style={{ maxHeight: 420 }}>
            <table>
              <thead><tr><th>Curso</th><th>Inscriptos</th><th>Participaron</th><th>% participación</th><th>Respuestas</th><th>Promedio</th></tr></thead>
              <tbody>{cruce.map((c) => {
                const acts = actividadesPorCurso[c.curso] || [];
                const puedeExpandir = acts.length > 0;
                return (
                  <Fragment key={c.curso}>
                    <tr className={puedeExpandir ? 'clickable' : ''} style={puedeExpandir ? { cursor: 'pointer' } : undefined} onClick={puedeExpandir ? () => setAbiertoCurso(abiertoCurso === c.curso ? null : c.curso) : undefined}>
                      <td><b>{c.curso}</b>{puedeExpandir && <span style={{ marginLeft: 8, fontSize: 12, color: 'rgb(var(--accentTeal))' }}>{abiertoCurso === c.curso ? 'Ocultar ▲' : 'Ver actividades ▾'}</span>}</td>
                      <td className="sec">{c.inscriptos}</td>
                      <td className="sec">{c.realizaron}</td>
                      <td><Pct v={c.pct} /></td>
                      <td className="sec">{c.respuestas}</td>
                      <td><Pct v={c.promedio} /></td>
                    </tr>
                    {abiertoCurso === c.curso && puedeExpandir && (
                      <tr><td colSpan={6} style={{ background: 'rgb(var(--surface2))' }}>
                        <div style={{ padding: '10px 6px' }}>
                          {acts.slice().sort((a, b) => b.totalResp - a.totalResp).map((a) => (
                            <div key={a.slug} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', fontSize: 13 }}>
                              <span style={{ flex: 1 }}>{a.titulo}</span>
                              <span className="sec" style={{ flex: '0 0 auto' }}>{a.totalResp} resp.</span>
                              <span style={{ flex: '0 0 auto', fontWeight: 700 }}>{a.totalResp ? a.promedio + '%' : '—'}</span>
                            </div>
                          ))}
                        </div>
                      </td></tr>
                    )}
                  </Fragment>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </Seccion>

      <Seccion titulo="Resultados por actividad" right={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select className="fsel" value={ordenAct} onChange={(e) => setOrdenAct(e.target.value)}>
            {ORDEN_ACTIVIDADES.map((o) => <option key={o.v} value={o.v}>Ordenar: {o.l}</option>)}
          </select>
          <div className="repx-viewtoggle">
            <button className={vistaAct === 'tabla' ? 'on' : ''} onClick={() => setVistaAct('tabla')}><Ico.table style={{ width: 14, height: 14 }} /> Tabla</button>
            <button className={vistaAct === 'tarjetas' ? 'on' : ''} onClick={() => setVistaAct('tarjetas')}><Ico.grid style={{ width: 14, height: 14 }} /> Tarjetas</button>
          </div>
        </div>
      }>
        {conRespuestas.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Todavía no hay respuestas.</p> :
        vistaAct === 'tarjetas' ? (
          <div className="repx-actcards">
            {ordenadas.map((a) => (
              <div key={a.slug} className="repx-actcard">
                <div className="repx-actcard-t">{a.titulo}</div>
                <div className="repx-actcard-c">{a.curso}</div>
                <div className="repx-actcard-row"><span>Respuestas</span><b>{a.totalResp}</b></div>
                <div className="repx-actcard-row"><span>Promedio</span><span className={'repx-actcard-pct repx-pct ' + (a.totalResp ? pctTone(a.promedio) : 'muted')}>{a.totalResp ? a.promedio + '%' : '—'}</span></div>
                <div className="repx-actcard-row"><span>Tiempo promedio</span><span>{fmtDuracion(a.tiempoProm)}</span></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="tablewrap" style={{ maxHeight: 420 }}>
            <table>
              <thead><tr><th>Actividad</th><th>Curso</th><th>Respuestas</th><th>Promedio</th><th>Tiempo promedio</th></tr></thead>
              <tbody>{ordenadas.map((a) => (
                <tr key={a.slug}>
                  <td>{a.titulo}</td>
                  <td className="sec">{a.curso}</td>
                  <td><CellBar n={a.totalResp} max={maxResp} /></td>
                  <td><Pct v={a.totalResp ? a.promedio : null} /></td>
                  <td className="sec">{fmtDuracion(a.tiempoProm)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </Seccion>

      <Expandible titulo="Análisis de preguntas" defaultOpen={false}>
        <div className="repx-deemph">
          <p className="muted" style={{ fontSize: 12, margin: '0 0 10px' }}>Solo se muestran preguntas con al menos {minResp} respuesta{minResp === 1 ? '' : 's'}.</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <select className="fsel" value={fCursoPreg} onChange={(e) => { setFCursoPreg(e.target.value); setFActPreg(''); }}>
              <option value="">Todos los cursos</option>
              {cursosPreg.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="fsel" value={fActPreg} onChange={(e) => setFActPreg(e.target.value)}>
              <option value="">Todas las actividades</option>
              {actividades.filter((a) => !fCursoPreg || a.curso === fCursoPreg).map((a) => <option key={a.slug} value={a.titulo}>{a.titulo}</option>)}
            </select>
            <select className="fsel" value={ordenPreg} onChange={(e) => setOrdenPreg(e.target.value)}>
              {ORDEN_PREGUNTAS.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <input type="number" className="fsel" style={{ width: 84 }} min={3} value={minResp} onChange={(e) => setMinResp(Math.max(3, Number(e.target.value) || 3))} title="Mínimo de respuestas" />
          </div>
          {preguntasOrdenadas.length === 0 ? (
            <p className="muted" style={{ fontSize: 13 }}>No hay preguntas que cumplan el mínimo de respuestas con estos filtros.</p>
          ) : (
            <div className="tablewrap tablewrap-ancha" style={{ maxHeight: 420 }}>
              <table>
                <thead><tr><th>Pregunta</th><th>Actividad</th><th>Curso</th><th>Respondidas</th><th>Aciertos</th><th>% correcto</th></tr></thead>
                <tbody>{preguntasOrdenadas.map((p) => {
                  const key = p.actividadSlug + '·' + p.idx;
                  const act = actividades.find((a) => a.slug === p.actividadSlug);
                  return (
                    <Fragment key={key}>
                      <tr className="clickable" style={{ cursor: 'pointer' }} onClick={() => setAbierta(abierta === key ? null : key)}>
                        <td>{p.pregunta}</td>
                        <td className="sec">{p.actividadTitulo}</td>
                        <td className="sec">{p.actividadCurso}</td>
                        <td className="sec">{p.respondidas}</td>
                        <td className="sec">{p.aciertos}</td>
                        <td><Pct v={p.pct} /></td>
                      </tr>
                      {abierta === key && act && (
                        <tr><td colSpan={6} style={{ background: 'rgb(var(--surface2))' }}>
                          <div style={{ padding: '10px 6px' }}>
                            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Todas las preguntas de «{act.titulo}» · {act.totalResp} respuesta(s) · promedio {act.promedio}%</div>
                            {act.preguntas.map((pp, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', fontSize: 13, borderBottom: i < act.preguntas.length - 1 ? '1px solid rgb(var(--border))' : 'none' }}>
                                <span style={{ flex: 1 }}>{pp.pregunta}</span>
                                <span className="sec" style={{ flex: '0 0 auto' }}>{pp.respondidas} resp.</span>
                                <Pct v={pp.respondidas ? pp.pct : null} />
                              </div>
                            ))}
                          </div>
                        </td></tr>
                      )}
                    </Fragment>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      </Expandible>
    </div>
  );
}

/* ============================ FORMULARIOS ============================ */
function ReportesFormularios({ data, irAConFiltro }) {
  const hoy = hace(0);
  const sem = data.filter((r) => (r.fecha || '') >= hace(7)).length;
  const mes = data.filter((r) => (r.fecha || '') >= hace(30)).length;
  const hoyN = data.filter((r) => (r.fecha || '').slice(0, 10) === hoy).length;

  const porFormulario = useMemo(() => {
    const m = {};
    data.forEach((r) => { const k = r.formulario || 'Sin nombre'; (m[k] = m[k] || { n: 0, ultima: '' }).n++; if ((r.fecha || '') > m[k].ultima) m[k].ultima = r.fecha || ''; });
    return Object.entries(m).map(([formulario, v]) => ({ formulario, n: v.n, ultima: v.ultima, ult30: data.filter((r) => r.formulario === formulario && (r.fecha || '') >= hace(30)).length })).sort((a, b) => b.n - a.n);
  }, [data]);

  const porCurso = useMemo(() => {
    const m = {};
    data.forEach((r) => { const k = r.curso || 'Sin curso'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([curso, n]) => ({ curso, n })).sort((a, b) => b.n - a.n);
  }, [data]);

  const serieMensual = useMemo(() => {
    const m = {};
    data.forEach((r) => { const k = (r.fecha || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).slice(-12).map(([k, n]) => ({ label: nombreMes(k), v: n }));
  }, [data]);

  const maxForm = Math.max(1, ...porFormulario.map((x) => x.n));
  const maxCurso = Math.max(1, ...porCurso.map((x) => x.n));

  return (
    <div>
      <p className="fhead-sub" style={{ marginBottom: 14 }}>Respuestas de Formularios (incluye las importadas de encuestas históricas).</p>
      <div className="repx-kpis">
        <RepKpi icon={<Ico.file />} n={data.length} label="Respuestas totales" />
        <RepKpi icon={<Ico.calendar />} n={mes} label="Últimos 30 días" sub={`${sem} en los últimos 7 días`} />
        <RepKpi icon={<Ico.calendar />} n={hoyN} label="Hoy" />
        <RepKpi icon={<Ico.folder />} n={porFormulario.length} label="Formularios distintos" />
      </div>

      {data.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>Todavía no hay respuestas de formularios para mostrar.</p>
      ) : (<>
        <Seccion titulo="Evolución temporal" sub="Respuestas recibidas por mes (últimos 12 meses con datos).">
          <MiniChart series={[{ nombre: 'Respuestas', data: serieMensual }]} />
        </Seccion>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(360px,1fr))', gap: 16 }}>
          <Seccion titulo="Detalle por formulario" sub="Respuestas, última recibida y ritmo reciente.">
            <div className="tablewrap" style={{ maxHeight: 360 }}>
              <table>
                <thead><tr><th>Formulario</th><th>Respuestas</th><th>Última</th><th>30 días</th></tr></thead>
                <tbody>{porFormulario.map((f) => (
                  <tr key={f.formulario}>
                    <td><b>{f.formulario}</b></td>
                    <td><CellBar n={f.n} max={maxForm} /></td>
                    <td className="sec">{f.ultima ? f.ultima.slice(0, 10) : '—'}</td>
                    <td className="sec">{f.ult30}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Seccion>
          <Seccion titulo="Por curso">
            <div className="tablewrap" style={{ maxHeight: 360 }}>
              <table>
                <thead><tr><th>Curso</th><th>Respuestas</th><th /></tr></thead>
                <tbody>{porCurso.map((x) => (
                  <tr key={x.curso} className={(irAConFiltro && x.curso !== 'Sin curso') ? 'clickable' : ''} style={(irAConFiltro && x.curso !== 'Sin curso') ? { cursor: 'pointer' } : undefined} onClick={(irAConFiltro && x.curso !== 'Sin curso') ? () => irAConFiltro('curso', x.curso) : undefined}>
                    <td><b>{x.curso}</b></td>
                    <td><CellBar n={x.n} max={maxCurso} /></td>
                    <td>{(irAConFiltro && x.curso !== 'Sin curso') && <Ico.chevronRight />}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </Seccion>
        </div>
      </>)}
    </div>
  );
}
