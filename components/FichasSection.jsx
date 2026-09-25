'use client';
import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { APP_URL, colorCurso } from '../lib/constants';
import Constructor from './Constructor';

const ESTADO_META = {
  Publicada: { cls: 'pub', label: 'Publicada', dot: '🟢' },
  Borrador: { cls: 'bor', label: 'Borrador', dot: '🟡' },
  Cerrada: { cls: 'cer', label: 'Cerrada', dot: '🔴' },
  Archivada: { cls: 'arch', label: 'Archivada', dot: '⚪' }
};
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
// Iniciales para el avatar de color de cada curso en la vista Lista \u2014 dos letras de las
// palabras "importantes" del nombre (se saltea "de/la/el/los/para", etc.), en may\u00fascula.
const STOP_INICIALES = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'y']);
function inicialesCurso(nombre) {
  const palabras = (nombre || '').split(/\s+/).filter((p) => p && !STOP_INICIALES.has(p.toLowerCase()));
  return (palabras.slice(0, 2).map((p) => p[0]).join('') || (nombre || '?')[0] || '?').toUpperCase();
}

const FichasSection = forwardRef(function FichasSection({ usuario, rows, onVerInscripciones, showToast, puedeEditar }, ref) {
  // El Constructor de fichas vive DENTRO de "Fichas de inscripción": editar o cargar una
  // edición abre el wizard acá mismo (no navega a una pestaña aparte).
  const [construyendo, setConstruyendo] = useState(null); // slug de la ficha que se está armando, o null
  function onEditar(slug) { setConstruyendo(slug); }
  // El botón "Crear nueva ficha de inscripción" vive al lado de las sub-pestañas, en Panel.jsx
  // (no acá adentro), así que Panel necesita poder abrir el Constructor desde afuera.
  useImperativeHandle(ref, () => ({
    abrirConstructor: () => { if (defs && defs.length > 0) onEditar(defs[0].slug); }
  }));
  const [defs, setDefs] = useState(null);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('Todas');
  // Vista predeterminada: Lista (antes arrancaba en Tarjetas). Si la persona ya eligió una
  // vista antes, se respeta lo guardado; si no hay nada guardado, arranca en "lista".
  const [vista, setVista] = useState('lista');
  useEffect(() => { try { const v = localStorage.getItem('ilce-fichas-vista'); if (v === 'cards' || v === 'lista') setVista(v); } catch { /* */ } }, []);
  const cambiarVista = (v) => { setVista(v); try { localStorage.setItem('ilce-fichas-vista', v); } catch { /* */ } };
  const [orden, setOrden] = useState('nombre');
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [copiado, setCopiado] = useState(null);

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  async function cargar() {
    try {
      const res = await fetch('/api/fichas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const data = await res.json();
      setDefs(data.ok ? data.defs.map((d) => ({ ...d, estado: d.estado || 'Publicada' })) : []);
    } catch { setDefs([]); }
  }

  // Conteos de inscripciones por curso y por (curso+edición)
  const { porCurso } = useMemo(() => {
    const pc = {}, pe = {};
    (rows || []).forEach((r) => {
      if (!r.curso) return;
      pc[r.curso] = (pc[r.curso] || 0) + 1;
      const k = r.curso + '||' + norm(r.ed);
      pe[k] = (pe[k] || 0) + 1;
    });
    return { porCurso: pc, porEd: pe };
  }, [rows]);

  const cuenta = (estado) => (defs || []).filter((d) => !estado || d.estado === estado).length;

  const filtradas = useMemo(() => {
    if (!defs) return [];
    const qq = norm(q);
    let list = defs.filter((d) => {
      if (chip === 'Publicadas' && d.estado !== 'Publicada') return false;
      if (chip === 'Borradores' && d.estado !== 'Borrador') return false;
      if (chip === 'Cerradas' && d.estado !== 'Cerrada') return false;
      if (chip === 'Archivadas' && d.estado !== 'Archivada') return false;
      if (chip === 'Todas' && d.estado === 'Archivada') return false; // archivadas fuera de "Todas"
      if (qq) {
        const hay = norm([d.curso, d.titulo, d.slug, d.estado, (d.ediciones || []).map((e) => e.label).join(' ')].join(' '));
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
    list = list.slice().sort((a, b) => {
      if (orden === 'inscripciones') return (porCurso[b.curso] || 0) - (porCurso[a.curso] || 0);
      if (orden === 'recientes') return new Date(b.actualizado || 0) - new Date(a.actualizado || 0);
      return a.curso.localeCompare(b.curso);
    });
    return list;
  }, [defs, q, chip, orden, porCurso]);

  async function guardarEstado(d, nuevo) {
    const prev = d.estado;
    setDefs((arr) => arr.map((x) => x.slug === d.slug ? { ...x, estado: nuevo } : x));
    setMenuAbierto(null);
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: d.slug, def: { ...d, estado: nuevo } })
      });
      const data = await res.json();
      if (!data.ok) throw new Error();
      showToast('✓ Estado actualizado a ' + nuevo);
    } catch {
      setDefs((arr) => arr.map((x) => x.slug === d.slug ? { ...x, estado: prev } : x));
      showToast('⚠ No se pudo actualizar');
    }
  }
  function copiarLink(d) {
    navigator.clipboard?.writeText(`${APP_URL}/inscripcion/${d.slug}`);
    setCopiado(d.slug); clearTimeout(copiarLink._t); copiarLink._t = setTimeout(() => setCopiado(null), 1600);
    setMenuAbierto(null);
    showToast?.('✓ URL copiada');
  }
  function abrirPublica(d) { window.open(`${APP_URL}/inscripcion/${d.slug}`, '_blank'); setMenuAbierto(null); }

  if (construyendo) {
    return <Constructor usuario={usuario} initialSlug={construyendo} showToast={showToast} onVolver={() => { setConstruyendo(null); cargar(); }} volverLabel="← Volver a Fichas de inscripción" />;
  }

  if (!defs) return <div className="spin" />;

  return (
    <div onClick={() => menuAbierto && setMenuAbierto(null)}>
      {/* Cabecera de gestión */}
      <div className="fhead">
        <div>
          <p className="fhead-sub">Administrá los cursos, ediciones y páginas de inscripción.</p>
        </div>
        <span style={{ flex: 1 }} />
        {/* El acceso directo al Constructor ahora vive al lado de las sub-pestañas "Fichas de
            inscripción / Fichas completadas" (ver Panel.jsx), como "Crear nueva ficha de
            inscripción" — se sacó de acá para no duplicarlo. */}
        {puedeEditar && <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 18px' }} onClick={() => showToast('El alta de cursos nuevos llega en el próximo lote (cursos dinámicos).')}>+ Nueva ficha</button>}
      </div>

      {/* Filtros */}
      <div className="fchips">
        {[['Todas', defs.filter((d) => d.estado !== 'Archivada').length], ['Publicadas', cuenta('Publicada')], ['Borradores', cuenta('Borrador')], ['Cerradas', cuenta('Cerrada')], ['Archivadas', cuenta('Archivada')]].map(([c, n]) => (
          <button key={c} className={'fchip' + (chip === c ? ' on' : '')} onClick={() => setChip(c)}>{c} <span className="cnt">{n}</span></button>
        ))}
      </div>
      <div className="fbar">
        <div className="fsearch">🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, edición, URL o estado…" /></div>
        {q && <button className="btn-sm" onClick={() => setQ('')}>Limpiar</button>}
        <span style={{ flex: 1 }} />
        <select className="fsel" value={orden} onChange={(e) => setOrden(e.target.value)}>
          <option value="nombre">Ordenar: Nombre</option>
          <option value="recientes">Ordenar: Más recientes</option>
          <option value="inscripciones">Ordenar: Más inscripciones</option>
        </select>
        <div className="vista-toggle">
          <button className={vista === 'cards' ? 'on' : ''} onClick={() => cambiarVista('cards')} title="Ver en tarjetas">▦</button>
          <button className={vista === 'lista' ? 'on' : ''} onClick={() => cambiarVista('lista')} title="Ver en lista">☰</button>
        </div>
      </div>
      <p className="count">{filtradas.length} ficha{filtradas.length === 1 ? '' : 's'} encontrada{filtradas.length === 1 ? '' : 's'}</p>

      {filtradas.length === 0 ? (
        <div className="empty"><div className="ico">🗂️</div><h3>No encontramos fichas</h3><p>Probá con otro término o cambiá el filtro.</p><button className="btn-sm" onClick={() => { setQ(''); setChip('Todas'); }}>Limpiar filtros</button></div>
      ) : vista === 'lista' ? (
        <div className="tablewrap tablewrap-fichas"><table>
          <thead><tr><th>Ficha</th><th>Estado</th><th>Inscripciones</th><th>Próximas ediciones</th><th>Próxima edición</th><th>Actualizado</th><th>URL de inscripción</th><th></th></tr></thead>
          <tbody>{filtradas.map((d) => {
            const meta = ESTADO_META[d.estado] || ESTADO_META.Publicada;
            const insc = porCurso[d.curso] || 0;
            const eds = d.ediciones || [];
            const url = `${APP_URL}/inscripcion/${d.slug}`;
            const proxima = proximaEdicion(eds);
            const actualizado = fmtFecha(d.actualizado);
            return (
              <tr key={d.slug}>
                <td className="ins-name">
                  <div className="curso-cell">
                    <span className="curso-avatar" style={{ background: colorCurso(d.curso) + '22', color: colorCurso(d.curso) }}>{inicialesCurso(d.curso)}</span>
                    <span style={{ color: colorCurso(d.curso) }}>{d.curso}</span>
                  </div>
                </td>
                <td><span className={'fstate ' + meta.cls}><span className="d" />{meta.label}</span></td>
                <td>{insc > 0 ? <button className="linklike" onClick={() => onVerInscripciones(d.curso)}>{insc} inscriptos →</button> : <span className="sec">0</span>}</td>
                <td className="sec">{d.onDemand ? 'On demand' : eds.length > 0 ? `${eds.length} edición${eds.length === 1 ? '' : 'es'}` : '—'}</td>
                <td className="sec">{proxima || '—'}</td>
                <td className="sec">{actualizado || '—'}</td>
                <td className="col-url">
                  <div className="url-cell url-chip">
                    <span className="url-txt" title={url}>{url.replace(/^https?:\/\//, '')}</span>
                    <button className="url-copy" title="Copiar URL" onClick={(e) => { e.stopPropagation(); copiarLink(d); }}>{copiado === d.slug ? '✓' : '📋'}</button>
                  </div>
                </td>
                <td style={{ textAlign: 'right' }}>{puedeEditar && <button className="btn-sm solid" onClick={() => onEditar(d.slug)}>{eds.length ? '✎ Editar' : '+ Cargar edición'}</button>}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      ) : (
        <div className="pcard-wrap">
        <div className="pcard-grid">
          {filtradas.map((d) => {
            const meta = ESTADO_META[d.estado] || ESTADO_META.Publicada;
            const insc = porCurso[d.curso] || 0;
            const eds = d.ediciones || [];
            const url = `${APP_URL}/inscripcion/${d.slug}`;
            const subDefault = `Ficha de inscripción — ${d.curso}`;
            const sub = (d.titulo && d.titulo.trim() && d.titulo.trim() !== subDefault && d.titulo.trim() !== d.curso) ? d.titulo.trim() : null;
            return (
              <div className="pcard" key={d.slug}>
                <div className="pcard-head">
                  <span className={'pcard-dot ' + meta.cls}><span className="d" />{meta.label}</span>
                  <div className="fmenu">
                    <button className="pcard-menu-btn" aria-label="Más acciones" onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === d.slug ? null : d.slug); }}>•••</button>
                    {menuAbierto === d.slug && (
                      <div className="fmenu-pop" onClick={(e) => e.stopPropagation()}>
                        {puedeEditar && <button onClick={() => { setMenuAbierto(null); onEditar(d.slug); }}>Crear edición</button>}
                        {puedeEditar && <>
                          <div className="sep" />
                          {d.estado !== 'Publicada' && <button onClick={() => guardarEstado(d, 'Publicada')}>Publicar</button>}
                          {d.estado !== 'Borrador' && <button onClick={() => guardarEstado(d, 'Borrador')}>Pasar a borrador</button>}
                          {d.estado !== 'Cerrada' && <button onClick={() => guardarEstado(d, 'Cerrada')}>Cerrar</button>}
                          {d.estado !== 'Archivada' && <button onClick={() => guardarEstado(d, 'Archivada')}>Archivar</button>}
                          <div className="sep" />
                          <button className="danger" onClick={() => { setMenuAbierto(null); showToast('Eliminar/duplicar cursos base llega con los cursos dinámicos.'); }}>Eliminar</button>
                        </>}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pcard-title" title={d.curso} style={{ color: colorCurso(d.curso) }}>{d.curso}</div>
                {sub && <div className="pcard-sub" title={sub}>{sub}</div>}

                <div className="pcard-metrics">
                  <button type="button" className="pcard-metric" disabled={insc === 0} onClick={() => insc > 0 && onVerInscripciones(d.curso)}>
                    <span className="pcard-metric-n">{insc || '—'}</span>
                    <span className="pcard-metric-l">Inscriptos{insc > 0 ? ' →' : ''}</span>
                  </button>
                  <button type="button" className="pcard-metric" disabled={eds.length === 0 || d.onDemand} onClick={() => eds.length > 0 && onEditar(d.slug)}>
                    {d.onDemand
                      ? <span className="pcard-metric-n" style={{ fontSize: 17 }}>On demand</span>
                      : eds.length > 0
                        ? <span className="pcard-metric-n">{eds.length}</span>
                        : <span className="pcard-metric-n" style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(var(--textMuted))', lineHeight: 1.25 }}>Aún no hay nada cargado</span>}
                    <span className="pcard-metric-l">Próximas ediciones{eds.length > 0 && !d.onDemand ? ' →' : ''}</span>
                  </button>
                </div>

                <div className="pcard-divider" />

                {(() => {
                  if (d.onDemand) {
                    return (
                      <div className="pcard-next pcard-next-neutral">
                        <div>
                          <div className="pcard-next-label">Modalidad on demand</div>
                          <div className="pcard-next-date" style={{ color: 'rgb(var(--textSec))' }}>Disponible siempre, sin ediciones programadas.</div>
                        </div>
                      </div>
                    );
                  }
                  if (eds.length === 0) {
                    if (d.estado === 'Publicada') {
                      return (
                        <div className="pcard-next pcard-next-warn">
                          <span className="pcard-next-ico">⚠</span>
                          <div>
                            <div className="pcard-next-label">Sin próxima edición</div>
                            {puedeEditar && <button className="pcard-next-link" onClick={() => onEditar(d.slug)}>Agregar edición</button>}
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div className="pcard-next pcard-next-neutral">
                        <div>
                          <div className="pcard-next-label">Sin ediciones cargadas</div>
                          {puedeEditar && <button className="pcard-next-link" onClick={() => onEditar(d.slug)}>+ Agregar edición</button>}
                        </div>
                      </div>
                    );
                  }
                  const det = proximaEdicionDetalle(eds);
                  if (!det) {
                    return (
                      <div className="pcard-next pcard-next-warn">
                        <span className="pcard-next-ico">⚠</span>
                        <div>
                          <div className="pcard-next-label">Sin fecha definida</div>
                          {puedeEditar && <button className="pcard-next-link" onClick={() => onEditar(d.slug)}>Gestionar edición</button>}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div className="pcard-next">
                      <div className="pcard-next-label">{det.pasada ? 'Última edición' : 'Próxima edición'}</div>
                      <div className="pcard-next-date">{det.fecha}{det.pasada && <span className="pcard-next-tag"> · pasada</span>}</div>
                      {det.numero && <div className="pcard-next-ed">{det.numero}</div>}
                    </div>
                  );
                })()}

                <div className="pcard-divider" />

                <div className="pcard-url">
                  <span className="pcard-url-txt" title={url}>/inscripcion/{d.slug}</span>
                  <button className="pcard-url-copy" title="Copiar enlace" onClick={(e) => { e.stopPropagation(); copiarLink(d); }}>{copiado === d.slug ? '✓' : '🔗'}</button>
                  <button className="pcard-url-copy" title="Abrir enlace" onClick={(e) => { e.stopPropagation(); abrirPublica(d); }}>↗</button>
                </div>

                <div className="pcard-actions">
                  {puedeEditar && <button className="pcard-act pcard-act-primary" onClick={() => onEditar(d.slug)}>✎ Editar</button>}
                  <button className="pcard-act" onClick={() => abrirPublica(d)} title="Ver la ficha pública">Ver pública</button>
                  {onVerInscripciones && <button className="pcard-act" onClick={() => onVerInscripciones(d.curso)} title="Ver inscripciones de este curso">Fichas completadas</button>}
                  <button className="pcard-act pcard-act-icon" title="Copiar enlace de inscripción" onClick={(e) => { e.stopPropagation(); copiarLink(d); }}>{copiado === d.slug ? '✓' : '🔗'}</button>
                </div>
              </div>
            );
          })}
        </div>
        </div>
      )}
    </div>
  );
});
export default FichasSection;

// La próxima edición con fecha de inicio en el futuro (o la más próxima si ya pasaron
// todas), para tener de un vistazo cuándo arranca lo que sigue de ese curso.
function proximaEdicion(eds) {
  const conFecha = (eds || []).filter((e) => e.fecha).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (conFecha.length === 0) return null;
  const hoyISO = new Date().toISOString().slice(0, 10);
  const futura = conFecha.find((e) => e.fecha >= hoyISO);
  const e = futura || conFecha[conFecha.length - 1];
  const dt = new Date(e.fecha + 'T00:00:00');
  const txt = isNaN(dt) ? e.fecha : dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
  return futura ? txt : `${txt} (pasada)`;
}

// Versión "detalle" de próxima edición para la tarjeta nueva: separa fecha, número de
// edición y si ya pasó, en vez de devolver un solo string armado (como proximaEdicion).
function proximaEdicionDetalle(eds) {
  const conFecha = (eds || []).filter((e) => e.fecha).slice().sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (conFecha.length === 0) return null;
  const hoyISO = new Date().toISOString().slice(0, 10);
  const futura = conFecha.find((e) => e.fecha >= hoyISO);
  const e = futura || conFecha[conFecha.length - 1];
  const dt = new Date(e.fecha + 'T00:00:00');
  const fecha = isNaN(dt) ? e.fecha : dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase().replace('.', '');
  const numero = (e.label || '').split('—')[0].trim() || null;
  return { fecha, numero, pasada: !futura };
}

function fmtFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return 'hoy';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
