'use client';
// Reportes: acá viven "todos los números" que antes estaban sueltos en Fichas completadas
// (Total, últimos 7 días, pendientes, en revisión, % completadas), más el desglose por curso,
// por estado y por mes — y ahora también un resumen de Actividades y de Formularios, para
// no tener que ir pestaña por pestaña a buscar cómo viene cada cosa.
import { useEffect, useMemo, useState } from 'react';
import { ESTADOS, CURSOS } from '../lib/constants';

function iso(d) { return d.toISOString().slice(0, 10); }
function hace(n) { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); }

function Barra({ label, n, max, claseFill = '' }) {
  return (
    <div className="bar">
      <span className="lb">{label}</span>
      <span className="track"><span className={'fill ' + claseFill} style={{ width: (n / max * 100) + '%' }} /></span>
      <span className="vv">{n}</span>
    </div>
  );
}

export default function Reportes({ usuario, rows, puedeActividades, puedeFormularios }) {
  const [sub, setSub] = useState('inscripciones');
  if (!rows) return <div className="spin" />;

  return (
    <div>
      <div className="subtabs" style={{ marginBottom: 18 }}>
        <button className={sub === 'inscripciones' ? 'on' : ''} onClick={() => setSub('inscripciones')}>Inscripciones</button>
        {puedeActividades && <button className={sub === 'actividades' ? 'on' : ''} onClick={() => setSub('actividades')}>Actividades</button>}
        {puedeFormularios && <button className={sub === 'formularios' ? 'on' : ''} onClick={() => setSub('formularios')}>Formularios</button>}
      </div>
      {sub === 'inscripciones' && <ReportesInscripciones rows={rows} />}
      {sub === 'actividades' && puedeActividades && <ReportesActividades usuario={usuario} />}
      {sub === 'formularios' && puedeFormularios && <ReportesFormularios usuario={usuario} />}
    </div>
  );
}

function ReportesInscripciones({ rows }) {
  const sem = rows.filter((r) => (r.fecha || '') >= hace(7)).length;
  const pend = rows.filter((r) => ['Pendiente', 'Iniciada'].includes(r.estado)).length;
  const enRev = rows.filter((r) => r.estado === 'En revisión').length;
  const comp = rows.filter((r) => ['Completada', 'En revisión', 'Inscrito'].includes(r.estado)).length;
  const tasa = rows.length ? Math.round(comp / rows.length * 100) : 0;

  // Variación real (no inventada): fichas nuevas en los últimos 30 días vs. los 30 días
  // anteriores. Es la única comparación "vs. período anterior" que se puede calcular con
  // los datos que hay — no se guarda un historial de cambios de estado día a día, así que
  // un "Pendientes -14% vs. mes pasado" no se puede calcular de verdad todavía (se podría
  // sumar más adelante si se empieza a registrar una foto diaria de los estados).
  const nuevos30 = rows.filter((r) => (r.fecha || '') >= hace(30)).length;
  const nuevos30prev = rows.filter((r) => (r.fecha || '') >= hace(60) && (r.fecha || '') < hace(30)).length;
  const variacion = nuevos30prev > 0 ? Math.round((nuevos30 - nuevos30prev) / nuevos30prev * 100) : (nuevos30 > 0 ? 100 : 0);

  // Embudo: en qué estado está cada ficha hoy, en el orden en que normalmente avanza un
  // trámite. Cada etapa muestra qué % del total representa (no es acumulado entre etapas,
  // porque cada ficha está en un solo estado a la vez).
  const embudo = useMemo(() => {
    const etapas = ['Iniciada', 'Pendiente', 'En revisión', 'Completada'];
    return etapas.map((e) => ({ estado: e, n: rows.filter((r) => r.estado === e).length }));
  }, [rows]);

  const porCursoDetalle = useMemo(() => {
    return CURSOS.map((c) => {
      const delCurso = rows.filter((r) => r.curso === c.nombre);
      const completadas = delCurso.filter((r) => ['Completada', 'En revisión', 'Inscrito'].includes(r.estado)).length;
      const pendientes = delCurso.filter((r) => ['Pendiente', 'Iniciada'].includes(r.estado)).length;
      return { curso: c.nombre, total: delCurso.length, completadas, pendientes, pct: delCurso.length ? Math.round(completadas / delCurso.length * 100) : 0 };
    }).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);
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

  const maxEstado = Math.max(1, ...porEstado.map((x) => x.n));
  const maxMes = Math.max(1, ...porMes.map(([, n]) => n));
  const nombreMes = (k) => { const [y, m] = k.split('-'); return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('es-AR', { month: 'short', year: '2-digit' }); };

  return (
    <div>
      <p className="fhead-sub" style={{ marginBottom: 16 }}>Panorama general de fichas de inscripción: totales, embudo por estado, por curso y por mes.</p>

      {/* Resumen ejecutivo: compacto y horizontal, para entender la situación de un vistazo
          en vez de 5 tarjetas grandes. La única variación real que se puede mostrar (sin
          inventar números) es la de fichas nuevas — no hay un historial diario de estados
          guardado todavía como para comparar "Pendientes vs. mes pasado" de verdad. */}
      <div className="ins-kpis ins-kpis-compact">
        <div className="ins-kpi kpi-total"><div className="ic">📋</div><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{rows.length}</div><div className="l">Total</div></div>
        <div className="ins-kpi kpi-comp"><div className="ic">✅</div><div className="n" style={{ color: 'rgb(74 222 128)' }}>{tasa}%</div><div className="l">Completadas</div></div>
        <div className="ins-kpi kpi-pend"><div className="ic">⏳</div><div className="n" style={{ color: 'rgb(251 191 36)' }}>{pend}</div><div className="l">Pendientes</div></div>
        <div className="ins-kpi kpi-rev"><div className="ic">👁</div><div className="n" style={{ color: '#d879d1' }}>{enRev}</div><div className="l">En revisión</div></div>
        <div className="ins-kpi kpi-week"><div className="ic">📈</div><div className="n">{sem}</div><div className="l">Nuevas · 7 días</div></div>
        <div className="ins-kpi">
          <div className="ic">{variacion > 0 ? '↑' : variacion < 0 ? '↓' : '→'}</div>
          <div className="n" style={{ color: variacion > 0 ? 'rgb(74 222 128)' : variacion < 0 ? 'rgb(248 113 113)' : 'rgb(var(--textMuted))' }}>{variacion > 0 ? '+' : ''}{variacion}%</div>
          <div className="l">Nuevas vs. 30d previos</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16, marginTop: 6 }}>
        <div className="panel">
          <h3>Embudo por estado</h3>
          <p className="muted" style={{ fontSize: 12, marginTop: -6, marginBottom: 10 }}>En qué estado está cada ficha hoy (sobre {rows.length} en total).</p>
          {embudo.map((e, i) => (
            <div key={e.estado} style={{ marginBottom: 4 }}>
              <Barra label={e.estado} n={e.n} max={rows.length || 1} claseFill={i % 2 ? 'm' : ''} />
              <div style={{ fontSize: 11, color: 'rgb(var(--textMuted))', textAlign: 'right', marginTop: -4, marginBottom: 6 }}>{rows.length ? Math.round(e.n / rows.length * 100) : 0}% del total</div>
            </div>
          ))}
        </div>

        <div className="panel">
          <h3>Por estado</h3>
          {porEstado.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : porEstado.map((x) => <Barra key={x.estado} label={x.estado} n={x.n} max={maxEstado} claseFill="m" />)}
        </div>

        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3>Por curso</h3>
          <div className="tablewrap" style={{ maxHeight: 340 }}>
            <table>
              <thead><tr><th>Curso</th><th>Fichas</th><th>Completadas</th><th>Pendientes</th><th>% completado</th></tr></thead>
              <tbody>{porCursoDetalle.map((c) => (
                <tr key={c.curso}>
                  <td><b>{c.curso}</b></td>
                  <td className="sec">{c.total}</td>
                  <td className="sec">{c.completadas}</td>
                  <td className="sec">{c.pendientes}</td>
                  <td style={{ fontWeight: 700, color: c.pct >= 80 ? 'rgb(74 222 128)' : c.pct >= 50 ? 'rgb(251 191 36)' : 'rgb(248 113 113)' }}>{c.pct}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>

        <div className="panel" style={{ gridColumn: '1 / -1' }}>
          <h3>Últimos 6 meses</h3>
          {porMes.length === 0 ? <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p> : porMes.map(([k, n]) => <Barra key={k} label={nombreMes(k)} n={n} max={maxMes} />)}
        </div>
      </div>
    </div>
  );
}

function ReportesActividades({ usuario }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/actividades/reporte?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo cargar');
      setData(d.actividades || []);
    } catch (e) { setError(e.message || 'Error de conexión'); setData([]); }
  })(); /* eslint-disable-next-line */ }, []);

  if (error) return <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{error}</p></div>;
  if (!data) return <div className="spin" />;

  const conRespuestas = data.filter((a) => a.totalResp > 0);
  const totalResp = conRespuestas.reduce((s, a) => s + a.totalResp, 0);
  const promedioGeneral = conRespuestas.length ? Math.round(conRespuestas.reduce((s, a) => s + a.promedio * a.totalResp, 0) / totalResp) : 0;
  // Las que menos promedio tienen son las que más vale la pena revisar (contenido difícil,
  // consigna confusa, etc.) — por eso van ordenadas de menor a mayor, no al revés.
  const ordenadas = conRespuestas.slice().sort((a, b) => a.promedio - b.promedio);
  const maxResp = Math.max(1, ...conRespuestas.map((a) => a.totalResp));

  return (
    <div>
      <p className="fhead-sub" style={{ marginBottom: 16 }}>Resumen de Actividades (postwork): participación y promedio por actividad. El detalle pregunta por pregunta sigue en Actividades → Reportes.</p>
      <div className="ins-kpis">
        <div className="ins-kpi kpi-total"><div className="ic">🧩</div><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{data.length}</div><div className="l">Actividades</div></div>
        <div className="ins-kpi kpi-week"><div className="ic">📝</div><div className="n">{totalResp}</div><div className="l">Respuestas totales</div></div>
        <div className="ins-kpi kpi-comp"><div className="ic">✅</div><div className="n" style={{ color: 'rgb(74 222 128)' }}>{promedioGeneral}%</div><div className="l">Promedio general</div></div>
        <div className="ins-kpi kpi-pend"><div className="ic">⚪</div><div className="n" style={{ color: 'rgb(var(--textMuted))' }}>{data.length - conRespuestas.length}</div><div className="l">Sin respuestas aún</div></div>
      </div>

      {conRespuestas.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>Todavía no hay respuestas de actividades para mostrar.</p>
      ) : (
        <div className="panel">
          <h3>Participación por actividad</h3>
          {conRespuestas.slice().sort((a, b) => b.totalResp - a.totalResp).slice(0, 10).map((a) => (
            <Barra key={a.slug} label={`${a.titulo} (${a.curso})`} n={a.totalResp} max={maxResp} />
          ))}

          <h3 style={{ marginTop: 20 }}>Menor promedio (a revisar primero)</h3>
          <div className="tablewrap" style={{ maxHeight: 320 }}>
            <table>
              <thead><tr><th>Actividad</th><th>Curso</th><th>Respuestas</th><th>Promedio</th></tr></thead>
              <tbody>{ordenadas.slice(0, 12).map((a) => (
                <tr key={a.slug}>
                  <td>{a.titulo}</td>
                  <td className="sec">{a.curso}</td>
                  <td className="sec">{a.totalResp}</td>
                  <td style={{ fontWeight: 700, color: a.promedio < 60 ? 'rgb(248 113 113)' : a.promedio < 80 ? 'rgb(251 191 36)' : 'rgb(74 222 128)' }}>{a.promedio}%</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportesFormularios({ usuario }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/formularios/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo cargar');
      setData(d.respuestas || []);
    } catch (e) { setError(e.message || 'Error de conexión'); setData([]); }
  })(); /* eslint-disable-next-line */ }, []);

  if (error) return <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{error}</p></div>;
  if (!data) return <div className="spin" />;

  const porFormulario = useMemo(() => {
    const m = {};
    data.forEach((r) => { const k = r.formulario || 'Sin nombre'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([formulario, n]) => ({ formulario, n })).sort((a, b) => b.n - a.n);
  }, [data]);

  const porCurso = useMemo(() => {
    const m = {};
    data.forEach((r) => { const k = r.curso || 'Sin curso'; m[k] = (m[k] || 0) + 1; });
    return Object.entries(m).map(([curso, n]) => ({ curso, n })).sort((a, b) => b.n - a.n);
  }, [data]);

  const sem = data.filter((r) => (r.fecha || '') >= hace(7)).length;
  const maxForm = Math.max(1, ...porFormulario.map((x) => x.n));
  const maxCurso = Math.max(1, ...porCurso.map((x) => x.n));

  return (
    <div>
      <p className="fhead-sub" style={{ marginBottom: 16 }}>Resumen de Formularios: cuántas respuestas hay por encuesta y por curso (incluye las importadas de encuestas históricas).</p>
      <div className="ins-kpis">
        <div className="ins-kpi kpi-total"><div className="ic">🗒️</div><div className="n" style={{ color: 'rgb(var(--accentTeal))' }}>{data.length}</div><div className="l">Respuestas totales</div></div>
        <div className="ins-kpi kpi-week"><div className="ic">📈</div><div className="n">{sem}</div><div className="l">Últimos 7 días</div></div>
        <div className="ins-kpi kpi-comp"><div className="ic">🗂️</div><div className="n" style={{ color: 'rgb(74 222 128)' }}>{porFormulario.length}</div><div className="l">Formularios distintos</div></div>
      </div>

      {data.length === 0 ? (
        <p className="muted" style={{ fontSize: 13 }}>Todavía no hay respuestas de formularios para mostrar.</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 16 }}>
          <div className="panel">
            <h3>Por formulario</h3>
            {porFormulario.map((x) => <Barra key={x.formulario} label={x.formulario} n={x.n} max={maxForm} />)}
          </div>
          <div className="panel">
            <h3>Por curso</h3>
            {porCurso.map((x) => <Barra key={x.curso} label={x.curso} n={x.n} max={maxCurso} claseFill="m" />)}
          </div>
        </div>
      )}
    </div>
  );
}
