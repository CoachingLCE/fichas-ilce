'use client';
import { useEffect, useMemo, useState } from 'react';
import { APP_URL, colorCurso, estadoFechaReciente } from '../lib/constants';
import { creadaEfectiva } from '../lib/fechaCreacion';
import { textoReglas, formatoPuntos } from '../lib/evaluacionesLogica';
import { useDialogos } from './Dialogos';

// Listado de Evaluaciones finales (pestaña "Actividades y formularios" → "Evaluaciones finales"). Más nuevas primero.

const CLS_ESTADO = { Publicada: 'pub', Borrador: 'bor', Programada: 'prog', Cerrada: 'cer', Archivada: 'arch' };

function BadgeNueva({ creado, actualizado }) {
  const { tipo } = estadoFechaReciente(creado || actualizado, 10);
  if (tipo === 'hoy') return <span className="badge-fecha-hoy">{'🟢'} Cargada hoy</span>;
  if (tipo === 'nueva') return <span className="badge-fecha-nueva">{'✨'} Nueva</span>;
  return null;
}

export default function EvaluacionesLista({ usuario, showToast, onNueva, onEditar, puedeGestionar, recarga }) {
  const [evals, setEvals] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const { confirmar } = useDialogos();

  async function cargar() {
    try {
      const res = await fetch('/api/evaluaciones?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudieron cargar las evaluaciones');
      setEvals(d.evaluaciones || []); setError('');
    } catch (e) { setError(e.message || 'Error de conexión'); setEvals([]); }
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, [recarga]);

  const vista = useMemo(() => {
    const t = q.trim().toLowerCase();
    const arr = (evals || []).filter((e) => !t || `${e.titulo} ${e.curso} ${e.slug}`.toLowerCase().includes(t));
    return arr.sort((a, b) => creadaEfectiva(b.creado, b.actualizado).ms - creadaEfectiva(a.creado, a.actualizado).ms);
  }, [evals, q]);

  async function eliminar(e) {
    const ok = await confirmar({ titulo: 'Eliminar evaluación', textoConfirmar: 'Eliminar', mensaje: `¿Eliminar "${e.titulo}"?\n\nEl enlace deja de funcionar. Los intentos ya guardados no se borran.` });
    if (!ok) return;
    try {
      const res = await fetch('/api/evaluaciones', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitanteEmail: usuario.email, slug: e.slug }) });
      const d = await res.json();
      if (!d.ok) { showToast && showToast(d.error || 'No se pudo eliminar'); return; }
      showToast && showToast('Evaluación eliminada'); cargar();
    } catch { showToast && showToast('Error de conexión'); }
  }

  if (error && !evals?.length) return <div className="empty"><div className="ico"></div><h3>No se pudo cargar</h3><p>{error}</p></div>;
  if (!evals) return <div className="spin" />;
  return (
    <div>
      <div className="sechead">
        <span className="hcount">{vista.length} evaluaci{vista.length === 1 ? 'ón' : 'ones'} final{vista.length === 1 ? '' : 'es'}</span>
        <span className="grow" />
        <input className="ctrl" style={{ maxWidth: 240 }} placeholder="Buscar…" value={q} onChange={(e) => setQ(e.target.value)} />
        {puedeGestionar && onNueva && <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 18px' }} onClick={onNueva}>+ Nueva evaluación final</button>}
      </div>
      {evals.length === 0 ? (
        <div className="empty"><div className="ico"></div><h3>No hay evaluaciones finales todavía</h3><p>Creá la primera: con tiempo límite, intentos, días de espera y puntaje mínimo.</p>
          {puedeGestionar && onNueva && <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 18px' }} onClick={onNueva}>+ Nueva evaluación final</button>}</div>
      ) : (
        <div className="tablewrap"><table>
          <thead><tr><th>Evaluación</th><th>Curso</th><th>Estado</th><th>Reglas</th><th>Preguntas</th><th>Intentos</th><th>Creada</th><th></th></tr></thead>
          <tbody>{vista.map((e) => {
            const c = creadaEfectiva(e.creado, e.actualizado);
            const url = `${APP_URL}/evaluacion/${e.slug}`;
            return (
              <tr key={e.slug}>
                <td className="ins-name">{e.titulo} <BadgeNueva creado={e.creado} actualizado={e.actualizado} /></td>
                <td style={{ color: colorCurso(e.curso) }}>{e.curso}{e.edicion ? <span className="sec"> · Ed. {e.edicion}</span> : null}</td>
                <td><span className={'fstate fstate-liviana ' + (CLS_ESTADO[e.estadoEfectivo] || 'bor')}><span className="d" />{e.estadoEfectivo}</span></td>
                <td className="sec" title={`Aprueba con ${formatoPuntos(e.minimo)} de ${formatoPuntos(e.total)} puntos`}>{textoReglas(e)}</td>
                <td className="sec">{e.preguntas.length}</td>
                <td className="sec" title="Intentos / personas / aprobados">{e.conteo.intentos} · {e.conteo.personas} pers. · {e.conteo.aprobados} aprob.</td>
                <td className="sec" title={c.aprox ? 'Fecha aproximada (última actualización)' : 'Fecha de creación'}>{c.texto ? (c.aprox ? '~' : '') + c.texto : '—'}</td>
                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                  <button className="btn-sm" onClick={() => { navigator.clipboard?.writeText(url); showToast && showToast('Enlace copiado'); }}>Copiar</button>{' '}
                  <a className="btn-sm" href={url} target="_blank" rel="noreferrer" title="Abrir">↗</a>
                  {puedeGestionar && <>{' '}<button className="btn-sm solid" onClick={() => onEditar(e.slug)}>Editar</button>{' '}<button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => eliminar(e)} title="Eliminar">✕</button></>}
                </td>
              </tr>
            );
          })}</tbody>
        </table></div>
      )}
    </div>
  );
}
