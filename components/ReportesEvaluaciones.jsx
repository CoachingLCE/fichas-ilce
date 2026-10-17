'use client';
import { useEffect, useMemo, useState } from 'react';
import { colorCurso } from '../lib/constants';
import { formatoPuntos, formatoDuracion } from '../lib/evaluacionesLogica';

// Reportes → Evaluaciones: resumen por evaluación (personas, aprobados, promedio, tiempo) y preguntas más falladas.
// Respeta el curso, la edición y las fechas que ya están elegidos arriba en Reportes.

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : null);
const dia = (iso) => String(iso || '').slice(0, 10);

export default function ReportesEvaluaciones({ usuario, fCurso, fEd, fDesde, fHasta }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [evSel, setEvSel] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/evaluaciones/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
        const j = await res.json();
        if (!j.ok) throw new Error(j.error || 'No se pudieron cargar las evaluaciones');
        setD(j);
      } catch (e) { setError(e.message || 'Error de conexión'); }
    })();
    // eslint-disable-next-line
  }, []);

  const intentos = useMemo(() => (d?.intentos || []).filter((x) => (!fCurso || x.curso === fCurso) && (!fEd || String(x.edicion) === String(fEd))
    && (!fDesde || dia(x.inicio) >= fDesde) && (!fHasta || dia(x.inicio) <= fHasta)), [d, fCurso, fEd, fDesde, fHasta]);

  const porEval = useMemo(() => {
    const m = {};
    intentos.forEach((x) => { (m[x.evaluacion] || (m[x.evaluacion] = [])).push(x); });
    const pend = {};
    (d?.pendientes || []).forEach((p) => { pend[p.evaluacion] = (pend[p.evaluacion] || 0) + 1; });
    return Object.entries(m).map(([nombre, xs]) => {
      const fin = xs.filter((x) => x.estado === 'Finalizado');
      const ap = fin.filter((x) => x.resultado === 'Aprobado');
      const personas = new Set(xs.map((x) => x.email.toLowerCase()));
      const aprobaron = new Set(ap.map((x) => x.email.toLowerCase()));
      const prom = fin.length ? fin.reduce((s, x) => s + (x.total ? x.puntaje / x.total : 0), 0) / fin.length : null;
      const durProm = fin.length ? fin.reduce((s, x) => s + x.duracionSeg, 0) / fin.length : null;
      const intAprob = ap.length ? ap.reduce((s, x) => s + x.intento, 0) / ap.length : null;
      return { nombre, curso: xs[0].curso, intentos: xs.length, personas: personas.size, aprobaron: aprobaron.size, finalizados: fin.length, sinTerminar: xs.length - fin.length, aprobadosIntentos: ap.length, prom, durProm, intAprob, pendientes: pend[nombre] || 0 };
    }).sort((a, b) => b.intentos - a.intentos);
  }, [intentos, d]);

  const nombres = porEval.map((e) => e.nombre);
  const sel = nombres.includes(evSel) ? evSel : nombres[0] || '';
  const fallos = useMemo(() => {
    const preg = (d?.preguntas || {})[sel] || [];
    const fin = intentos.filter((x) => x.evaluacion === sel && x.estado === 'Finalizado' && !(x.r && x.r._fueraDeTiempo));
    return preg.map((p, i) => {
      let mal = 0, blanco = 0;
      fin.forEach((x) => { const e = x.r?.[i]; if (e == null) { blanco++; mal++; } else if (e !== p.correcta) mal++; });
      return { n: i + 1, pregunta: p.pregunta, total: fin.length, mal, blanco, tasa: pct(mal, fin.length) };
    }).filter((x) => x.total > 0).sort((a, b) => (b.tasa ?? 0) - (a.tasa ?? 0));
  }, [d, intentos, sel]);

  if (error) return <div className="empty"><h3>No se pudo cargar</h3><p>{error}</p></div>;
  if (!d) return <div className="spin" />;
  if (porEval.length === 0) return <div className="empty"><div className="ico"></div><h3>Sin intentos para estos filtros</h3><p>Cuando alguien rinda una evaluación final, el resumen aparece acá.</p></div>;

  const fin = intentos.filter((x) => x.estado === 'Finalizado');
  const ap = fin.filter((x) => x.resultado === 'Aprobado');
  const personasAprob = new Set(ap.map((x) => x.email.toLowerCase())).size;
  const personas = new Set(intentos.map((x) => x.email.toLowerCase())).size;
  return (
    <div>
      <div className="metrica-grid">
        <div className="metrica"><div className="metrica-val">{personas}</div><div className="metrica-lbl">Personas que rindieron</div></div>
        <div className="metrica"><div className="metrica-val">{intentos.length}</div><div className="metrica-lbl">Intentos</div></div>
        <div className="metrica"><div className="metrica-val good">{personasAprob}</div><div className="metrica-lbl">Personas aprobadas ({pct(personasAprob, personas) ?? 0}%)</div></div>
        <div className="metrica"><div className={'metrica-val' + (d.pendientes.length ? ' warn' : '')}>{d.pendientes.length}</div><div className="metrica-lbl">Pendientes de habilitar</div></div>
      </div>
      <div className="tablewrap"><table>
        <thead><tr><th>Evaluación</th><th>Personas</th><th>Intentos</th><th>Aprobaron</th><th>Puntaje promedio</th><th>Intentos hasta aprobar</th><th>Tiempo promedio</th><th>Sin terminar</th><th>Pendientes</th></tr></thead>
        <tbody>{porEval.map((e) => (
          <tr key={e.nombre}>
            <td style={{ color: colorCurso(e.curso) }}><b>{e.nombre}</b></td>
            <td>{e.personas}</td><td>{e.intentos}</td>
            <td>{e.aprobaron} <span className="sec">({pct(e.aprobaron, e.personas) ?? 0}%)</span></td>
            <td>{e.prom == null ? '—' : Math.round(e.prom * 100) + '%'}</td>
            <td>{e.intAprob == null ? '—' : formatoPuntos(Math.round(e.intAprob * 10) / 10)}</td>
            <td className="sec">{e.durProm == null ? '—' : formatoDuracion(e.durProm)}</td>
            <td className="sec">{e.sinTerminar}</td>
            <td>{e.pendientes > 0 ? <span style={{ color: 'rgb(var(--warn))' }}>{e.pendientes}</span> : <span className="sec">0</span>}</td>
          </tr>
        ))}</tbody>
      </table></div>

      <div className="sechead" style={{ marginTop: 22 }}>
        <span className="htitle">Preguntas más falladas</span>
        <span className="grow" />
        {nombres.length > 1 && <select className="ctrl" style={{ maxWidth: 280 }} value={sel} onChange={(e) => setEvSel(e.target.value)}>{nombres.map((n) => <option key={n}>{n}</option>)}</select>}
      </div>
      {fallos.length === 0 ? <p className="sec">Todavía no hay intentos terminados de esta evaluación.</p> : (
        <div className="tablewrap"><table>
          <thead><tr><th>#</th><th>Pregunta</th><th>Respondieron mal</th><th>% de error</th></tr></thead>
          <tbody>{fallos.map((f) => (
            <tr key={f.n}>
              <td className="sec">{f.n}</td><td>{f.pregunta}</td>
              <td>{f.mal} de {f.total}{f.blanco ? <span className="sec"> ({f.blanco} sin responder)</span> : null}</td>
              <td><b style={{ color: f.tasa >= 60 ? 'rgb(var(--bad))' : f.tasa >= 35 ? 'rgb(var(--warn))' : 'inherit' }}>{f.tasa}%</b></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}
