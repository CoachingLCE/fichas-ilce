'use client';
// Reportes: acá viven "todos los números" que antes estaban sueltos en Fichas completadas
// (Total, últimos 7 días, pendientes, en revisión, % completadas), más el desglose por curso,
// por estado y por mes. Fichas completadas quedó solo con los filtros para trabajar el día a día.
import { useMemo } from 'react';
import { ESTADOS, CURSOS } from '../lib/constants';

function iso(d) { return d.toISOString().slice(0, 10); }
function hace(n) { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); }

export default function Reportes({ rows }) {
  if (!rows) return <div className="spin" />;

  const hoy = iso(new Date());
  const sem = rows.filter((r) => (r.fecha || '') >= hace(7)).length;
  const pend = rows.filter((r) => ['Pendiente', 'Iniciada'].includes(r.estado)).length;
  const enRev = rows.filter((r) => r.estado === 'En revisión').length;
  const comp = rows.filter((r) => ['Completada', 'En revisión', 'Inscrito'].includes(r.estado)).length;
  const tasa = rows.length ? Math.round(comp / rows.length * 100) : 0;

  const porCurso = useMemo(() => {
    const m = {};
    rows.forEach((r) => { if (r.curso) m[r.curso] = (m[r.curso] || 0) + 1; });
    return CURSOS.map((c) => ({ curso: c.nombre, n: m[c.nombre] || 0 })).sort((a, b) => b.n - a.n);
  }, [rows]);

  const porEstado = useMemo(() => {
    const m = {};
    rows.forEach((r) => { m[r.estado] = (m[r.estado] || 0) + 1; });
    return ESTADOS.map((e) => ({ estado: e, n: m[e] || 0 })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  }, [rows]);

  const porMes = useMemo(() => {
    const m = {};
    rows.forEach((r) => { const k = (r.fecha || '').slice(0, 7); if (k) m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  }, [rows]);

  const maxCurso = Math.max(1, ...porCurso.map((x) => x.n));
  const maxEstado = Math.max(1, ...porEstado.map((x) => x.n));
  const maxMes = Math.max(1, ...porMes.map(([, n]) => n));
  const nombreMes = (k) => { const [y, m] = k.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }); };

  return (
    <div>
      <p className="fhead-sub" style={{ marginBottom: 16 }}>Panorama general de fichas de inscripción: totales, por curso, por estado y por mes.</p>

      <div className="ins-kpis">
        <div className="ins-kpi kpi-total"><div className="ic">📋</div><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{rows.length}</div><div className="l">Total</div></div>
        <div className="ins-kpi kpi-week"><div className="ic">📈</div><div className="n">{sem}</div><div className="l">Últimos 7 días</div></div>
        <div className="ins-kpi kpi-pend"><div className="ic">⏳</div><div className="n" style={{ color: 'rgb(251 191 36)' }}>{pend}</div><div className="l">Pendientes</div></div>
        <div className="ins-kpi kpi-rev"><div className="ic">👁</div><div className="n" style={{ color: '#d879d1' }}>{enRev}</div><div className="l">En revisión</div></div>
        <div className="ins-kpi kpi-comp"><div className="ic">✅</div><div className="n" style={{ color: 'rgb(74 222 128)' }}>{tasa}%</div><div className="l">Completadas</div></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginTop: 6 }}>
        <div className="panel">
          <h3>Por curso</h3>
          {porCurso.map((x) => (
            <div className="bar" key={x.curso}>
              <span className="lb">{x.curso}</span>
              <span className="track"><span className="fill" style={{ width: (x.n / maxCurso * 100) + '%' }} /></span>
              <span className="vv">{x.n}</span>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Por estado</h3>
          {porEstado.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : porEstado.map((x) => (
            <div className="bar" key={x.estado}>
              <span className="lb">{x.estado}</span>
              <span className="track"><span className="fill m" style={{ width: (x.n / maxEstado * 100) + '%' }} /></span>
              <span className="vv">{x.n}</span>
            </div>
          ))}
        </div>

        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3>Últimos 6 meses</h3>
          {porMes.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : porMes.map(([k, n]) => (
            <div className="bar" key={k}>
              <span className="lb">{nombreMes(k)}</span>
              <span className="track"><span className="fill" style={{ width: (n / maxMes * 100) + '%' }} /></span>
              <span className="vv">{n}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>¿Necesitás cruzar por edición, país u origen, o filtrar por un rango puntual? Eso está en <b>Dashboard</b>. El detalle de Actividades (promedios y preguntas más erradas) sigue en Actividades → Reportes. Próximo lote: sumarlo también acá, junto con Formularios.</p>
    </div>
  );
}
