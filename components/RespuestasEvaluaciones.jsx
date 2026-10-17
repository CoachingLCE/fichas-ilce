'use client';
import { useEffect, useMemo, useState } from 'react';
import { colorCurso, estadoFechaReciente } from '../lib/constants';
import { formatoPuntos, formatoDuracion } from '../lib/evaluacionesLogica';
import { useDialogos } from './Dialogos';

// Respuestas de las Evaluaciones finales (pestaña "Respuestas" → "Evaluaciones finales").
// Arriba: las personas que se quedaron sin intentos (el admin puede habilitar uno más). Abajo: todos los intentos.

const fmt = (iso) => { if (!iso) return '—'; const d = new Date(iso); return isNaN(d) ? '—' : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' }); };

function FechaIntento({ iso }) {
  const { tipo } = estadoFechaReciente(iso);
  if (tipo === 'hoy') return <span className="badge-fecha-hoy" title={iso}>{'🟢'} Rendido hoy</span>;
  if (tipo === 'nueva') return <span className="badge-fecha-nueva" title={iso}>{'✨'} Intento nuevo</span>;
  return <span className="sec" title={iso}>{fmt(iso)}</span>;
}

export default function RespuestasEvaluaciones({ usuario, showToast }) {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  const [fEval, setFEval] = useState('');
  const [fRes, setFRes] = useState('');
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [habilitando, setHabilitando] = useState('');
  const { confirmar } = useDialogos();

  async function cargar() {
    try {
      const res = await fetch('/api/evaluaciones/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || 'No se pudieron cargar las respuestas');
      setD(j); setError('');
    } catch (e) { setError(e.message || 'Error de conexión'); setD({ intentos: [], pendientes: [], habilitaciones: [], preguntas: {}, puedeHabilitar: false }); }
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);

  const evaluaciones = useMemo(() => [...new Set((d?.intentos || []).map((x) => x.evaluacion).filter(Boolean))].sort(), [d]);
  const filas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (d?.intentos || []).filter((x) => (!fEval || x.evaluacion === fEval)
      && (!fRes || (fRes === 'aprobado' ? x.resultado === 'Aprobado' : fRes === 'no' ? x.estado === 'Finalizado' && x.resultado !== 'Aprobado' : x.estado !== 'Finalizado'))
      && (!t || `${x.nombre} ${x.email}`.toLowerCase().includes(t)));
  }, [d, fEval, fRes, q]);
  const stats = useMemo(() => {
    const fin = filas.filter((x) => x.estado === 'Finalizado');
    const ap = fin.filter((x) => x.resultado === 'Aprobado').length;
    return { intentos: filas.length, personas: new Set(filas.map((x) => x.email.toLowerCase())).size, aprobados: ap, tasa: fin.length ? Math.round((ap / fin.length) * 100) : 0, pend: filas.filter((x) => x.estado !== 'Finalizado').length };
  }, [filas]);

  async function habilitar(p) {
    const ok = await confirmar({ titulo: 'Habilitar un intento más', textoConfirmar: 'Habilitar', mensaje: `¿Darle un intento extra a ${p.nombre || p.email} en "${p.evaluacion}"?\n\nPodrá rendir enseguida (sin esperar los días entre intentos). Queda registrado que lo habilitaste vos.` });
    if (!ok) return;
    const k = p.slug + '|' + p.email; setHabilitando(k);
    try {
      const res = await fetch('/api/evaluaciones/habilitar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitanteEmail: usuario.email, slug: p.slug, email: p.email }) });
      const j = await res.json();
      if (!j.ok) { showToast && showToast(j.error || 'No se pudo habilitar'); } else { showToast && showToast('Intento habilitado'); await cargar(); }
    } catch { showToast && showToast('Error de conexión'); } finally { setHabilitando(''); }
  }

  if (!d) return <div className="spin" />;
  const detalle = abierto ? (d.preguntas[abierto.evaluacion] || []) : [];
  return (
    <div>
      {error && <div className="cf-bad" role="alert">{error}</div>}
      {d.pendientes.length > 0 && (
        <div className="section-card" style={{ border: '1px solid rgba(251,191,36,.45)', background: 'rgba(251,191,36,.06)', borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Pendientes de habilitar ({d.pendientes.length})</div>
          <div className="sec" style={{ fontSize: 13, marginBottom: 10 }}>Usaron todos sus intentos sin aprobar y quedaron bloqueados.{d.puedeHabilitar ? ' Podés darles un intento más.' : ' Un administrador o coordinador puede habilitarles otro.'}</div>
          <div className="tablewrap"><table>
            <thead><tr><th>Persona</th><th>Evaluación</th><th>Intentos</th><th>Mejor puntaje</th><th>Último</th><th></th></tr></thead>
            <tbody>{d.pendientes.map((p) => (
              <tr key={p.slug + p.email}>
                <td><b>{p.nombre || '—'}</b><div className="sec" style={{ fontSize: 12 }}>{p.email}</div></td>
                <td style={{ color: colorCurso(p.curso) }}>{p.evaluacion}</td>
                <td className="sec">{p.usados} de {p.maxIntentos}</td>
                <td className="sec">{formatoPuntos(p.mejor)} / {formatoPuntos(p.total)}</td>
                <td className="sec">{fmt(p.ultimo)}</td>
                <td style={{ textAlign: 'right' }}>{d.puedeHabilitar && <button className="btn-sm solid" disabled={habilitando === p.slug + '|' + p.email} onClick={() => habilitar(p)}>{habilitando === p.slug + '|' + p.email ? 'Habilitando…' : 'Habilitar 1 intento'}</button>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        </div>
      )}

      <div className="sechead" style={{ flexWrap: 'wrap', gap: 8 }}>
        <span className="hcount">{stats.intentos} intento{stats.intentos === 1 ? '' : 's'} · {stats.personas} persona{stats.personas === 1 ? '' : 's'} · {stats.aprobados} aprobado{stats.aprobados === 1 ? '' : 's'} ({stats.tasa}%){stats.pend ? ` · ${stats.pend} sin terminar` : ''}</span>
        <span className="grow" />
        <input className="ctrl" style={{ maxWidth: 200 }} placeholder="Buscar persona…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="ctrl" style={{ maxWidth: 240 }} value={fEval} onChange={(e) => setFEval(e.target.value)}><option value="">Todas las evaluaciones</option>{evaluaciones.map((x) => <option key={x} value={x}>{x}</option>)}</select>
        <select className="ctrl" style={{ maxWidth: 170 }} value={fRes} onChange={(e) => setFRes(e.target.value)}><option value="">Todos los resultados</option><option value="aprobado">Aprobados</option><option value="no">No aprobados</option><option value="sin">Sin terminar</option></select>
      </div>
      {filas.length === 0 ? (
        <div className="empty"><div className="ico"></div><h3>Todavía no hay intentos</h3><p>Cuando alguien rinda una evaluación final, va a aparecer acá.</p></div>
      ) : (
        <div className="tablewrap"><table>
          <thead><tr><th>Fecha</th><th>Nombre</th><th>Email</th><th>Evaluación</th><th>Ed.</th><th>Intento</th><th>Puntaje</th><th>Resultado</th><th>Tiempo</th></tr></thead>
          <tbody>{filas.map((x) => (
            <tr key={x.id} className="fila-click" tabIndex={0} role="button" onClick={() => setAbierto(x)} onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setAbierto(x); } }}>
              <td><FechaIntento iso={x.inicio} /></td>
              <td><b>{x.nombre || '—'}</b></td>
              <td className="sec">{x.email}</td>
              <td style={{ color: colorCurso(x.curso) }}>{x.evaluacion}</td>
              <td>{x.edicion || '—'}</td>
              <td className="sec">{x.intento}</td>
              <td>{x.estado === 'Finalizado' ? `${formatoPuntos(x.puntaje)} / ${formatoPuntos(x.total)}` : <span className="sec">—</span>}</td>
              <td>{x.estado !== 'Finalizado' ? <span className="sec">{x.estado}</span> : <span className={'fstate fstate-liviana ' + (x.resultado === 'Aprobado' ? 'pub' : 'cer')}><span className="d" />{x.resultado}</span>}</td>
              <td className="sec">{x.estado === 'Finalizado' ? formatoDuracion(x.duracionSeg) : '—'}</td>
            </tr>
          ))}</tbody>
        </table></div>
      )}

      {d.habilitaciones.length > 0 && (
        <details style={{ marginTop: 18 }}>
          <summary className="sec" style={{ cursor: 'pointer' }}>Historial de intentos habilitados ({d.habilitaciones.length})</summary>
          <div className="tablewrap" style={{ marginTop: 8 }}><table>
            <thead><tr><th>Fecha</th><th>Evaluación</th><th>Email</th><th>Extra</th><th>Habilitó</th></tr></thead>
            <tbody>{d.habilitaciones.map((h, i) => <tr key={i}><td className="sec">{fmt(h.fecha)}</td><td>{h.evaluacion}</td><td className="sec">{h.email}</td><td>+{h.extra}</td><td className="sec">{h.quien}</td></tr>)}</tbody>
          </table></div>
        </details>
      )}

      {abierto && (
        <div className="modal-bg" onClick={() => setAbierto(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 90, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '4vh 12px', overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 16, maxWidth: 680, width: '100%', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <h3 style={{ margin: 0 }}>{abierto.nombre || abierto.email}</h3>
                <div className="sec" style={{ fontSize: 13 }}>{abierto.email} · {abierto.evaluacion} · intento {abierto.intento}</div>
                <div className="sec" style={{ fontSize: 13 }}>Inició {fmt(abierto.inicio)}{abierto.fin ? ` · terminó ${fmt(abierto.fin)}` : ''}</div>
              </div>
              <button className="btn-sm" onClick={() => setAbierto(null)}>✕</button>
            </div>
            {abierto.estado !== 'Finalizado' ? (
              <p className="sec" style={{ marginTop: 14 }}>{abierto.estado === 'En curso' ? 'Está rindiendo ahora (el intento sigue abierto).' : 'Empezó el intento pero nunca lo envió. Cuenta como intento usado.'}</p>
            ) : (
              <>
                <p style={{ margin: '12px 0' }}><b>{formatoPuntos(abierto.puntaje)} / {formatoPuntos(abierto.total)}</b> · {abierto.resultado} · {formatoDuracion(abierto.duracionSeg)}</p>
                {abierto.r && abierto.r._fueraDeTiempo ? <p className="sec">Se envió pasado el tiempo: no se corrigió.</p> : detalle.map((p, i) => {
                  const el = abierto.r[i];
                  const ok = el === p.correcta;
                  return (
                    <div key={i} style={{ borderLeft: `3px solid ${ok ? 'rgb(34 211 238)' : 'rgb(248 113 113)'}`, background: 'rgb(var(--surface2))', borderRadius: 10, padding: '10px 12px', marginBottom: 8, fontSize: 13.5 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{i + 1}. {p.pregunta}</div>
                      <div>{ok ? '✓' : '✗'} {el == null ? <i>Sin responder</i> : p.opciones[el]}</div>
                      {!ok && <div style={{ color: 'rgb(34 211 238)' }}>Correcta: {p.opciones[p.correcta]}</div>}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
