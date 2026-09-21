'use client';
// Reportes: centro de análisis administrativo. Se mantiene toda la lógica de cálculo que ya
// existía (embudo, por curso, por mes, participación en Actividades, respuestas de
// Formularios) — lo que cambia acá es la estructura (Resumen/Inscripciones/Actividades/
// Formularios + filtros globales + navegación cruzada), no las fórmulas.
import { Fragment, useEffect, useMemo, useState } from 'react';
import { ESTADOS, CURSOS } from '../lib/constants';
import { SelectDropdown, FiltroChip } from './SelectDropdown';
import MiniChart from './MiniChart';
import { exportarCSV, exportarXLSX } from '../lib/exportUtils';

function iso(d) { return d.toISOString().slice(0, 10); }
function hace(n) { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); }
function nombreMes(k) { const [y, m] = k.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }); }

function Barra({ label, n, max, claseFill = '', onClick }) {
  const contenido = (<><span className="lb" title={label}>{label}</span><span className="track"><span className={'fill ' + claseFill} style={{ width: (n / max * 100) + '%' }} /></span><span className="vv">{n}</span></>);
  return onClick
    ? <button type="button" className="bar bar-click" onClick={onClick}>{contenido}</button>
    : <div className="bar">{contenido}</div>;
}

function Kpi({ icon, n, label, color, cls = '', onClick }) {
  const contenido = (<><div className="ic">{icon}</div><div className="n" style={color ? { color } : undefined}>{n}</div><div className="l">{label}</div></>);
  return onClick
    ? <div className={'ins-kpi click ' + cls} role="button" tabIndex={0} onClick={onClick} onKeyDown={(e) => e.key === 'Enter' && onClick()}>{contenido}</div>
    : <div className={'ins-kpi ' + cls}>{contenido}</div>;
}

function ExportarMenu({ disabled, onCSV, onXLSX }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="fmenu" onClick={(e) => e.stopPropagation()}>
      <button className="btn-sm" disabled={disabled} onClick={() => setOpen((v) => !v)}>⬇ Exportar ▾</button>
      {open && (
        <div className="fmenu-pop" style={{ right: 0, bottom: 'auto', top: 'calc(100% + 6px)' }}>
          <button onClick={() => { setOpen(false); onXLSX(); }}>Excel (.xlsx)</button>
          <button onClick={() => { setOpen(false); onCSV(); }}>CSV</button>
        </div>
      )}
    </div>
  );
}

function Seccion({ titulo, sub, children, right }) {
  return (
    <div className="panel">
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

// Detalle/expandible, para no ocupar espacio hasta que alguien lo pida (ej. "Mes a mes por curso").
function Expandible({ titulo, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="panel">
      <button type="button" className="sechead" style={{ width: '100%', background: 'none', border: 0, cursor: 'pointer', padding: 0 }} onClick={() => setOpen((v) => !v)}>
        <span className="htitle">{titulo}</span>
        <span className="grow" />
        <span style={{ fontSize: 12, color: 'rgb(var(--accentTeal))', fontWeight: 700 }}>{open ? 'Ocultar ▲' : 'Ver ▾'}</span>
      </button>
      {open && <div style={{ marginTop: 10 }}>{children}</div>}
    </div>
  );
}

export default function Reportes({ usuario, rows, puedeActividades, puedeFormularios, puedeExportar, irAConFiltro, onActualizar }) {
  const [sub, setSub] = useState('resumen');
  const [fCurso, setFCurso] = useState('');
  const [fEd, setFEd] = useState('');
  const [fEstado, setFEstado] = useState('');
  const [fDesde, setFDesde] = useState('');
  const [fHasta, setFHasta] = useState('');
  const [actualizado, setActualizado] = useState(null);
  const [refrescando, setRefrescando] = useState(false);

  const [actData, setActData] = useState(null);
  const [actError, setActError] = useState('');
  const [formData, setFormData] = useState(null);
  const [formError, setFormError] = useState('');

  useEffect(() => { if (rows) setActualizado(new Date()); }, [rows]);
  useEffect(() => { if (puedeActividades) cargarActividades(); /* eslint-disable-next-line */ }, [puedeActividades]);
  useEffect(() => { if (puedeFormularios) cargarFormularios(); /* eslint-disable-next-line */ }, [puedeFormularios]);

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
  function limpiarFiltros() { setFCurso(''); setFEd(''); setFEstado(''); setFDesde(''); setFHasta(''); }

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
  if (fDesde || fHasta) chips.push([`Fecha: ${fDesde || '…'} → ${fHasta || '…'}`, () => { setFDesde(''); setFHasta(''); }]);

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
      <p className="fhead-sub" style={{ marginBottom: 14 }}>Analizá inscripciones, participación y actividad de los estudiantes.</p>

      <div className="subtabs" style={{ marginBottom: 14 }}>
        <button className={sub === 'resumen' ? 'on' : ''} onClick={() => setSub('resumen')}>Resumen</button>
        <button className={sub === 'inscripciones' ? 'on' : ''} onClick={() => setSub('inscripciones')}>Inscripciones</button>
        {puedeActividades && <button className={sub === 'actividades' ? 'on' : ''} onClick={() => setSub('actividades')}>Actividades</button>}
        {puedeFormularios && <button className={sub === 'formularios' ? 'on' : ''} onClick={() => setSub('formularios')}>Formularios</button>}
      </div>

      <div className="fdrop-row rep-filtbar">
        <SelectDropdown label="Curso" value={fCurso} onChange={setFCurso} placeholder="Todos los cursos" searchable options={cursosDisp.map((x) => ({ value: x, label: x }))} />
        <SelectDropdown label="Edición" value={fEd} onChange={setFEd} placeholder="Todas" searchable options={edicionesDisp.map((x) => ({ value: x, label: 'Ed. ' + x }))} />
        <SelectDropdown label="Estado" value={fEstado} onChange={setFEstado} placeholder="Todos" options={ESTADOS.filter((e) => rows.some((r) => r.estado === e)).map((e) => ({ value: e, label: e }))} />
        <div className="fdrop">
          <div className="fdrop-label">Desde</div>
          <input type="date" className="fsel" value={fDesde} onChange={(e) => setFDesde(e.target.value)} />
        </div>
        <div className="fdrop">
          <div className="fdrop-label">Hasta</div>
          <input type="date" className="fsel" value={fHasta} onChange={(e) => setFHasta(e.target.value)} />
        </div>
        {hayFiltros && <button className="btn-sm" onClick={limpiarFiltros}>Limpiar filtros</button>}
        <span className="grow" />
        <button className="btn-sm" onClick={actualizar} disabled={refrescando}>{refrescando ? '↻ Actualizando…' : '↻ Actualizar'}</button>
        {puedeExportar && exportInfo && (
          <ExportarMenu
            disabled={exportInfo.data.length === 0}
            onCSV={() => exportarCSV(exportInfo.nombre + '.csv', exportInfo.cols, exportInfo.data)}
            onXLSX={() => exportarXLSX(exportInfo.nombre + '.xlsx', exportInfo.hoja, exportInfo.cols, exportInfo.data)}
          />
        )}
      </div>
      {(sub === 'actividades' || sub === 'formularios') && (fEstado) && (
        <p className="muted" style={{ fontSize: 11.5, margin: '0 0 8px' }}>El filtro de Estado no aplica acá (es propio de las fichas de inscripción).</p>
      )}
      {sub === 'actividades' && (fEd || fDesde || fHasta) && (
        <p className="muted" style={{ fontSize: 11.5, margin: '0 0 8px' }}>Edición y fecha no se pueden filtrar en Actividades todavía (el reporte no trae ese detalle por respuesta) — solo se aplicó Curso.</p>
      )}
      {chips.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '2px 0 10px' }}>
          {chips.map(([lbl, clear], i) => <FiltroChip key={i} label={lbl} onClear={clear} />)}
        </div>
      )}
      <p className="count" style={{ marginTop: -2 }}>
        {actualizado && <>Actualizado: {actualizado.toLocaleDateString('es-AR')} {actualizado.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} · </>}
        Mostrando <b>{mostrandoSub[sub]}</b> de <b>{totalesSub[sub]}</b> registro{totalesSub[sub] === 1 ? '' : 's'}
      </p>

      {sub === 'resumen' && <ReportesResumen rows={rowsF} irAConFiltro={irAConFiltro} />}
      {sub === 'inscripciones' && <ReportesInscripciones rows={rowsF} irAConFiltro={irAConFiltro} />}
      {sub === 'actividades' && puedeActividades && (
        actError ? <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{actError}</p></div> :
        !actividadesF ? <div className="spin" /> :
        <ReportesActividades data={actividadesF} rowsInsc={rowsF} />
      )}
      {sub === 'formularios' && puedeFormularios && (
        formError ? <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{formError}</p></div> :
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

  return (
    <div>
      <div className="ins-kpis ins-kpis-compact">
        <Kpi icon="📋" n={rows.length} label="Total de fichas" color="rgb(var(--accentTeal))" onClick={() => irAConFiltro && irAConFiltro('estado', '')} />
        <Kpi icon="✅" n={completadas} label="Completadas" color="rgb(74 222 128)" onClick={() => irAConFiltro && irAConFiltro('estado', 'Completada')} />
        <Kpi icon="⏳" n={pendientes} label="Pendientes" color="rgb(251 191 36)" onClick={() => irAConFiltro && irAConFiltro('estado', 'Pendiente')} />
        <Kpi icon="👁" n={enRevision} label="En revisión" color="#d879d1" onClick={() => irAConFiltro && irAConFiltro('estado', 'En revisión')} />
        <Kpi icon="📈" n={sem} label="Nuevas · 7 días" />
        <Kpi icon={variacion > 0 ? '↑' : variacion < 0 ? '↓' : '→'} n={(variacion > 0 ? '+' : '') + variacion + '%'}
          label="Nuevas vs. 30d previos" color={variacion > 0 ? 'rgb(74 222 128)' : variacion < 0 ? 'rgb(248 113 113)' : 'rgb(var(--textMuted))'} />
      </div>

      <Seccion titulo="Evolución de inscripciones" sub="Fichas nuevas por día. Completadas y Pendientes se muestran como referencia secundaria." right={
        <div className="fchips" style={{ margin: 0 }}>
          {RANGOS_EVOL.map((r) => <button key={r.v} className={'fchip' + (rango === r.v ? ' on' : '')} onClick={() => setRango(r.v)}>{r.l}</button>)}
        </div>
      }>
        <MiniChart series={[{ nombre: 'Nuevas', data: serie.total }, { nombre: 'Completadas', data: serie.completadas, color: 'rgb(74 222 128)' }, { nombre: 'Pendientes', data: serie.pendientes, color: 'rgb(251 191 36)' }]} />
      </Seccion>

      <Seccion titulo="Por curso" sub="Ranking de fichas por curso — clickeá una barra o una fila para ver ese curso en Fichas completadas.">
        {porCursoDetalle.slice(0, 8).map((c) => (
          <Barra key={c.curso} label={c.curso} n={c.total} max={maxCurso} onClick={irAConFiltro ? () => irAConFiltro('curso', c.curso) : undefined} />
        ))}
        <div className="tablewrap" style={{ maxHeight: 340, marginTop: 12 }}>
          <table>
            <thead><tr><th>Curso</th><th>Fichas</th><th>Completadas</th><th>Pendientes</th><th>En revisión</th><th>% completado</th></tr></thead>
            <tbody>{porCursoDetalle.map((c) => (
              <tr key={c.curso} className="clickable" style={{ cursor: irAConFiltro ? 'pointer' : undefined }} onClick={() => irAConFiltro && irAConFiltro('curso', c.curso)}>
                <td><b>{c.curso}</b></td>
                <td className="sec">{c.total}</td>
                <td className="sec">{c.completadas}</td>
                <td className="sec">{c.pendientes}</td>
                <td className="sec">{c.revision}</td>
                <td style={{ fontWeight: 700, color: c.pct >= 80 ? 'rgb(74 222 128)' : c.pct >= 50 ? 'rgb(251 191 36)' : 'rgb(248 113 113)' }}>{c.pct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
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

function ReportesInscripciones({ rows, irAConFiltro }) {
  const embudo = useMemo(() => ORDEN_EMBUDO.map((e) => ({ estado: e, n: rows.filter((r) => r.estado === e).length })).filter((e) => e.n > 0), [rows]);

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

  return (
    <div>
      <Seccion titulo="Embudo por estado" sub={`En qué estado está cada ficha hoy (sobre ${rows.length} en total). Rechazada/Cancelada son salidas del proceso, no una etapa de avance.`}>
        {embudo.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : embudo.map((e) => (
          <div key={e.estado} style={{ marginBottom: 4 }}>
            <Barra label={e.estado} n={e.n} max={rows.length || 1} claseFill={ESTADOS_SALIDA.has(e.estado) ? 'r' : (e.estado === 'Completada' || e.estado === 'Inscrito' ? '' : 'm')}
              onClick={irAConFiltro ? () => irAConFiltro('estado', e.estado) : undefined} />
            <div style={{ fontSize: 11, color: 'rgb(var(--textMuted))', textAlign: 'right', marginTop: -4, marginBottom: 6 }}>{rows.length ? Math.round(e.n / rows.length * 100) : 0}% del total</div>
          </div>
        ))}
      </Seccion>

      <Seccion titulo="Evolución mensual" sub="Fichas recibidas por mes (últimos 12 meses con datos).">
        <MiniChart series={[{ nombre: 'Fichas', data: serieMensual }]} />
      </Seccion>

      <Seccion titulo="Distribución por curso">
        {porCursoDetalle.slice(0, 8).map((c) => (
          <Barra key={c.curso} label={c.curso} n={c.total} max={maxCurso} claseFill="m" onClick={irAConFiltro ? () => irAConFiltro('curso', c.curso) : undefined} />
        ))}
        <div className="tablewrap" style={{ maxHeight: 320, marginTop: 12 }}>
          <table>
            <thead><tr><th>Curso</th><th>Fichas</th><th>Completadas</th><th>% completado</th></tr></thead>
            <tbody>{porCursoDetalle.map((c) => (
              <tr key={c.curso} className="clickable" style={{ cursor: irAConFiltro ? 'pointer' : undefined }} onClick={() => irAConFiltro && irAConFiltro('curso', c.curso)}>
                <td><b>{c.curso}</b></td><td className="sec">{c.total}</td><td className="sec">{c.completadas}</td>
                <td style={{ fontWeight: 700, color: c.pct >= 80 ? 'rgb(74 222 128)' : c.pct >= 50 ? 'rgb(251 191 36)' : 'rgb(248 113 113)' }}>{c.pct}%</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Seccion>

      <Expandible titulo="Mes a mes, por curso">
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
      <div className="ins-kpis">
        <Kpi icon="🧩" n={actividades.length} label="Actividades" color="rgb(var(--accentTeal))" />
        <Kpi icon="📝" n={totalResp} label="Respuestas totales" />
        <Kpi icon="🧑‍🎓" n={estudiantesPorCurso} label="Estudiantes participantes*" />
        <Kpi icon="✅" n={promedioGeneral + '%'} label="Promedio general" color="rgb(74 222 128)" />
        <Kpi icon="⚪" n={actividades.length - conRespuestas.length} label="Sin respuestas aún" color="rgb(var(--textMuted))" />
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
                      <td style={{ fontWeight: 700, color: c.pct == null ? 'rgb(var(--textMuted))' : c.pct < 50 ? 'rgb(248 113 113)' : c.pct < 80 ? 'rgb(251 191 36)' : 'rgb(74 222 128)' }}>{c.pct == null ? '—' : c.pct + '%'}</td>
                      <td className="sec">{c.respuestas}</td>
                      <td style={{ fontWeight: 700, color: c.promedio == null ? 'rgb(var(--textMuted))' : c.promedio < 60 ? 'rgb(248 113 113)' : c.promedio < 80 ? 'rgb(251 191 36)' : 'rgb(74 222 128)' }}>{c.promedio == null ? '—' : c.promedio + '%'}</td>
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
        <select className="fsel" value={ordenAct} onChange={(e) => setOrdenAct(e.target.value)}>
          {ORDEN_ACTIVIDADES.map((o) => <option key={o.v} value={o.v}>Ordenar: {o.l}</option>)}
        </select>
      }>
        {conRespuestas.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            {conRespuestas.slice().sort((a, b) => b.totalResp - a.totalResp).slice(0, 10).map((a) => (
              <Barra key={a.slug} label={`${a.titulo} (${a.curso})`} n={a.totalResp} max={maxResp} />
            ))}
          </div>
        )}
        <div className="tablewrap" style={{ maxHeight: 360 }}>
          <table>
            <thead><tr><th>Actividad</th><th>Curso</th><th>Respuestas</th><th>Promedio</th><th>Tiempo promedio</th></tr></thead>
            <tbody>{ordenadas.map((a) => (
              <tr key={a.slug}>
                <td>{a.titulo}</td>
                <td className="sec">{a.curso}</td>
                <td className="sec">{a.totalResp}</td>
                <td style={{ fontWeight: 700, color: !a.totalResp ? 'rgb(var(--textMuted))' : a.promedio < 60 ? 'rgb(248 113 113)' : a.promedio < 80 ? 'rgb(251 191 36)' : 'rgb(74 222 128)' }}>{a.totalResp ? a.promedio + '%' : '—'}</td>
                <td className="sec">{fmtDuracion(a.tiempoProm)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Seccion>

      <Seccion titulo="Análisis de preguntas" sub={`Solo se muestran preguntas con al menos ${minResp} respuesta${minResp === 1 ? '' : 's'}.`} right={
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
      }>
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
                      <td style={{ fontWeight: 700, color: p.pct < 60 ? 'rgb(248 113 113)' : p.pct < 80 ? 'rgb(251 191 36)' : 'rgb(74 222 128)' }}>{p.pct}%</td>
                    </tr>
                    {abierta === key && act && (
                      <tr><td colSpan={6} style={{ background: 'rgb(var(--surface2))' }}>
                        <div style={{ padding: '10px 6px' }}>
                          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Todas las preguntas de «{act.titulo}» · {act.totalResp} respuesta(s) · promedio {act.promedio}%</div>
                          {act.preguntas.map((pp, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '4px 0', fontSize: 13, borderBottom: i < act.preguntas.length - 1 ? '1px solid rgb(var(--border))' : 'none' }}>
                              <span style={{ flex: 1 }}>{pp.pregunta}</span>
                              <span className="sec" style={{ flex: '0 0 auto' }}>{pp.respondidas} resp.</span>
                              <span style={{ flex: '0 0 auto', fontWeight: 700, color: pp.pct < 60 ? 'rgb(248 113 113)' : pp.pct < 80 ? 'rgb(251 191 36)' : 'rgb(74 222 128)' }}>{pp.respondidas ? pp.pct + '%' : '—'}</span>
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
      <div className="ins-kpis">
        <Kpi icon="🗒️" n={data.length} label="Respuestas totales" color="rgb(var(--accentTeal))" />
        <Kpi icon="📅" n={hoyN} label="Hoy" />
        <Kpi icon="📈" n={sem} label="Últimos 7 días" />
        <Kpi icon="🗓️" n={mes} label="Últimos 30 días" />
        <Kpi icon="🗂️" n={porFormulario.length} label="Formularios distintos" color="rgb(74 222 128)" />
      </div>

      {data.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>Todavía no hay respuestas de formularios para mostrar.</p>
      ) : (<>
        <Seccion titulo="Evolución temporal" sub="Respuestas recibidas por mes (últimos 12 meses con datos).">
          <MiniChart series={[{ nombre: 'Respuestas', data: serieMensual }]} />
        </Seccion>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
          <Seccion titulo="Por formulario">
            {porFormulario.map((x) => <Barra key={x.formulario} label={x.formulario} n={x.n} max={maxForm} />)}
          </Seccion>
          <Seccion titulo="Por curso">
            {porCurso.map((x) => (
              <Barra key={x.curso} label={x.curso} n={x.n} max={maxCurso} claseFill="m" onClick={(irAConFiltro && x.curso !== 'Sin curso') ? () => irAConFiltro('curso', x.curso) : undefined} />
            ))}
          </Seccion>
        </div>

        <Seccion titulo="Detalle por formulario">
          <div className="tablewrap tablewrap-ancha" style={{ maxHeight: 360 }}>
            <table>
              <thead><tr><th>Formulario</th><th>Respuestas</th><th>Última respuesta</th><th>Últimos 30 días</th></tr></thead>
              <tbody>{porFormulario.map((f) => (
                <tr key={f.formulario}>
                  <td><b>{f.formulario}</b></td>
                  <td className="sec">{f.n}</td>
                  <td className="sec">{f.ultima ? f.ultima.slice(0, 10) : '—'}</td>
                  <td className="sec">{f.ult30}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </Seccion>
      </>)}
    </div>
  );
}
