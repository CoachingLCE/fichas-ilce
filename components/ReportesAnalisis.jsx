'use client';
import { useMemo, useState } from 'react';
import { colorCurso, inicialesCurso } from '../lib/constants';

// Reportes → Resumen: gráficos de análisis (v1.76.0). Solo leen las filas que ya recibe Reportes (mismos filtros, sin consultas nuevas)
// y NO cambian ningún cálculo existente: usan las mismas definiciones de estado que la tabla "Por curso".
//   Completadas = estado "Completada" · Pendientes = "Pendiente" + "Iniciada" · En revisión = "En revisión" · Otros = Inscrito, Observada, Rechazada, Cancelada
// (los "Otros" se muestran para que cada barra sume el total de fichas del curso y no se oculte ningún estado).

const ESTADOS_ANALISIS = [
  { k: 'completadas', l: 'Completadas', color: 'rgb(var(--good))', f: (r) => r.estado === 'Completada' },
  { k: 'pendientes', l: 'Pendientes', color: 'rgb(var(--warn))', f: (r) => r.estado === 'Pendiente' || r.estado === 'Iniciada' },
  { k: 'revision', l: 'En revisión', color: 'rgb(var(--accentPurpleTxt))', f: (r) => r.estado === 'En revisión' },
  { k: 'otros', l: 'Otros estados', color: 'rgb(var(--textMuted))', f: () => true } // lo que no cayó en las anteriores
];
const clasificar = (r) => (ESTADOS_ANALISIS.slice(0, 3).find((e) => e.f(r)) || ESTADOS_ANALISIS[3]).k;
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const fmtPct = (n) => String(n).replace('.', ',') + '%';

/* ---------- Estado de las fichas por curso (barras horizontales apiladas) ---------- */
export function EstadoPorCurso({ rows, irAConFiltro }) {
  const [orden, setOrden] = useState('fichas'); // fichas | tasa
  const [modo, setModo] = useState('cantidad');  // cantidad | porcentaje
  const [sel, setSel] = useState(null);
  const datos = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      if (!r.curso) return;
      const c = m[r.curso] || (m[r.curso] = { curso: r.curso, total: 0, completadas: 0, pendientes: 0, revision: 0, otros: 0 });
      c.total++; c[clasificar(r)]++;
    });
    const arr = Object.values(m).map((c) => ({ ...c, tasa: pct(c.completadas, c.total) }));
    arr.sort(orden === 'tasa' ? (a, b) => b.tasa - a.tasa || b.total - a.total : (a, b) => b.total - a.total);
    return arr;
  }, [rows, orden]);
  const total = useMemo(() => datos.reduce((t, c) => ({ total: t.total + c.total, completadas: t.completadas + c.completadas, pendientes: t.pendientes + c.pendientes, revision: t.revision + c.revision, otros: t.otros + c.otros }), { total: 0, completadas: 0, pendientes: 0, revision: 0, otros: 0 }), [datos]);
  if (datos.length === 0) return <p className="vacio vacio-chico">Sin datos todavía.</p>;
  const max = Math.max(...datos.map((c) => c.total), 1);
  const detalle = datos.find((c) => c.curso === sel);
  const Barra = ({ c, ancho }) => (
    <div className="epc-bar" style={{ width: ancho + '%' }}>
      {ESTADOS_ANALISIS.map((e) => {
        const n = c[e.k]; if (!n) return null;
        const w = (n / c.total) * 100;
        return (
          <span key={e.k} className="epc-seg" style={{ width: w + '%', background: e.color }}
            title={`${c.curso || 'Total'} · ${e.l}: ${n} de ${c.total} (${fmtPct(pct(n, c.total))})`}>
            {w >= 9 ? (modo === 'cantidad' ? n : Math.round(w) + '%') : ''}
          </span>
        );
      })}
    </div>
  );
  return (
    <div>
      <div className="epc-controls">
        <div className="subtabs-pill" role="group" aria-label="Ordenar cursos">
          <button className={orden === 'fichas' ? 'on' : ''} onClick={() => setOrden('fichas')}>Más fichas</button>
          <button className={orden === 'tasa' ? 'on' : ''} onClick={() => setOrden('tasa')}>Mayor % completado</button>
        </div>
        <div className="subtabs-pill" role="group" aria-label="Mostrar">
          <button className={modo === 'cantidad' ? 'on' : ''} onClick={() => setModo('cantidad')}>Cantidades</button>
          <button className={modo === 'porcentaje' ? 'on' : ''} onClick={() => setModo('porcentaje')}>Porcentajes</button>
        </div>
      </div>
      <div className="epc-legend">
        {ESTADOS_ANALISIS.map((e) => <span key={e.k}><i style={{ background: e.color }} />{e.l}</span>)}
      </div>
      <div className="epc-list">
        <div className="epc-row epc-row-total">
          <div className="epc-name"><b>Todos los cursos</b></div>
          <div className="epc-track"><Barra c={{ ...total, curso: 'Todos los cursos' }} ancho={100} /></div>
          <div className="epc-num"><b>{total.total}</b><span>{fmtPct(pct(total.completadas, total.total))} compl.</span></div>
        </div>
        {datos.map((c) => (
          <button type="button" key={c.curso} className={'epc-row epc-click' + (sel === c.curso ? ' on' : '')} onClick={() => setSel(sel === c.curso ? null : c.curso)}>
            <div className="epc-name"><span className="curso-avatar" style={{ background: colorCurso(c.curso) + '22', color: colorCurso(c.curso) }}>{inicialesCurso(c.curso)}</span><span style={{ color: colorCurso(c.curso) }} title={c.curso}>{c.curso}</span></div>
            <div className="epc-track"><Barra c={c} ancho={modo === 'cantidad' ? (c.total / max) * 100 : 100} /></div>
            <div className="epc-num"><b>{c.total}</b><span>{fmtPct(c.tasa)} compl.</span></div>
          </button>
        ))}
      </div>
      {detalle && (
        <div className="epc-detalle">
          <div className="epc-detalle-h"><b style={{ color: colorCurso(detalle.curso) }}>{detalle.curso}</b><span>{detalle.total} ficha{detalle.total === 1 ? '' : 's'}</span></div>
          <div className="epc-detalle-g">
            {ESTADOS_ANALISIS.map((e) => <div key={e.k}><i style={{ background: e.color }} /><b>{detalle[e.k]}</b><span>{e.l} · {fmtPct(pct(detalle[e.k], detalle.total))}</span></div>)}
          </div>
          {irAConFiltro && <button className="btn-sm" onClick={() => irAConFiltro('curso', detalle.curso)}>Ver estas fichas →</button>}
        </div>
      )}
      <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>Un curso con muchas fichas no necesariamente completa más: mirá también el % completado. El estado es el de hoy. “Pendientes” incluye Pendiente e Iniciada, igual que la tabla “Por curso”.</p>
    </div>
  );
}

/* ---------- Antigüedad de las fichas pendientes ---------- */
// La fecha de la ficha trae solo el día (no la hora), así que el tramo más corto es "hoy"; no se estiman horas.
const TRAMOS = [
  { k: 'hoy', l: 'Hoy', f: (d) => d <= 0 },
  { k: 'd13', l: '1 a 3 días', f: (d) => d >= 1 && d <= 3 },
  { k: 'd47', l: '4 a 7 días', f: (d) => d >= 4 && d <= 7 },
  { k: 'd8', l: 'Más de 7 días', f: (d) => d > 7 }
];
export function AntiguedadPendientes({ rows, irAConFiltro }) {
  const datos = useMemo(() => {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const pend = rows.filter((r) => r.estado === 'Pendiente' || r.estado === 'Iniciada' || r.estado === 'En revisión');
    const conFecha = pend.filter((r) => /^\d{4}-\d{2}-\d{2}/.test(r.fecha || ''));
    const tramos = TRAMOS.map((t) => ({ ...t, pend: 0, rev: 0 }));
    conFecha.forEach((r) => {
      const d = Math.round((hoy - new Date(String(r.fecha).slice(0, 10) + 'T00:00:00')) / 86400000);
      const t = tramos.find((x) => x.f(d)); if (!t) return;
      if (r.estado === 'En revisión') t.rev++; else t.pend++;
    });
    return { tramos, total: pend.length, sinFecha: pend.length - conFecha.length };
  }, [rows]);
  if (datos.total === 0) return <p className="vacio vacio-chico">No hay fichas pendientes ni en revisión. Todo al día.</p>;
  const max = Math.max(...datos.tramos.map((t) => t.pend + t.rev), 1);
  const viejas = datos.tramos[3].pend + datos.tramos[3].rev;
  return (
    <div>
      <div className="ant-list">
        {datos.tramos.map((t, i) => {
          const n = t.pend + t.rev;
          return (
            <div key={t.k} className={'ant-row' + (i === 3 && n > 0 ? ' alerta' : '')}>
              <span className="ant-l">{t.l}</span>
              <div className="ant-track" title={`${t.l}: ${t.pend} pendientes, ${t.rev} en revisión`}>
                <span style={{ width: (t.pend / max) * 100 + '%', background: 'rgb(var(--warn))' }} />
                <span style={{ width: (t.rev / max) * 100 + '%', background: 'rgb(var(--accentPurpleTxt))' }} />
              </div>
              <span className="ant-n"><b>{n}</b>{i === 3 && n > 0 ? <em>requiere seguimiento</em> : null}</span>
            </div>
          );
        })}
      </div>
      <div className="epc-legend" style={{ marginTop: 10 }}>
        <span><i style={{ background: 'rgb(var(--warn))' }} />Pendientes (incluye Iniciada)</span>
        <span><i style={{ background: 'rgb(var(--accentPurpleTxt))' }} />En revisión</span>
        {irAConFiltro && <button className="linklike" style={{ fontSize: 12, marginLeft: 'auto' }} onClick={() => irAConFiltro('estado', 'Pendiente')}>Ver pendientes →</button>}
      </div>
      <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>
        {datos.total} ficha{datos.total === 1 ? '' : 's'} sin resolver{viejas > 0 ? `, ${viejas} con más de 7 días` : ''}. La antigüedad se cuenta desde la fecha de la ficha (solo trae el día, por eso no hay tramos de horas).{datos.sinFecha > 0 ? ` ${datos.sinFecha} sin fecha válida no se incluyen en los tramos.` : ''}
      </p>
    </div>
  );
}

/* ---------- Tasa de completitud por mes ---------- */
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export function TasaPorMes({ rows }) {
  const datos = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      const f = (r.fecha || '').slice(0, 7); if (!/^\d{4}-\d{2}$/.test(f)) return;
      const x = m[f] || (m[f] = { ym: f, total: 0, comp: 0 });
      x.total++; if (r.estado === 'Completada') x.comp++;
    });
    const hoy = new Date(); const ymHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
    return Object.values(m).sort((a, b) => a.ym.localeCompare(b.ym)).slice(-8).map((x) => ({ ...x, tasa: pct(x.comp, x.total), enCurso: x.ym === ymHoy }));
  }, [rows]);
  if (datos.length === 0) return <p className="vacio vacio-chico">Sin datos todavía.</p>;
  return (
    <div>
      <div className="tpm-grid">
        {datos.map((x) => {
          const [y, mm] = x.ym.split('-');
          return (
            <div key={x.ym} className="tpm-col" title={`${MESES[Number(mm) - 1]} ${y}: ${x.comp} completadas de ${x.total} fichas recibidas (${fmtPct(x.tasa)})${x.enCurso ? ' · mes en curso' : ''}`}>
              <b className="tpm-v">{fmtPct(x.tasa)}</b>
              <div className="tpm-bar"><span style={{ height: x.tasa + '%' }} className={x.enCurso ? 'curso' : ''} /></div>
              <span className="tpm-m">{MESES[Number(mm) - 1]} {y.slice(2)}</span>
              <span className="tpm-n">{x.comp}/{x.total}</span>
            </div>
          );
        })}
      </div>
      <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>Completadas ÷ fichas recibidas ese mes, con el estado de hoy (misma definición que la tasa de completitud general). El mes en curso (barra punteada) puede subir: sus fichas todavía tienen tiempo de completarse.</p>
    </div>
  );
}
