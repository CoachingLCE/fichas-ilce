'use client';
import { useEffect, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { APP_URL, colorCurso, inicialesCurso, cantidadClasesFija, calcularFechaFinEdicion } from '../lib/constants';
import Constructor from './Constructor';

const ESTADO_META = {
  Publicada: { cls: 'pub', label: 'Publicada', dot: '🟢' },
  Borrador: { cls: 'bor', label: 'Borrador', dot: '🟡' },
  Cerrada: { cls: 'cer', label: 'Cerrada', dot: '🔴' },
  Archivada: { cls: 'arch', label: 'Archivada', dot: '⚪' }
};
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const FichasSection = forwardRef(function FichasSection({ usuario, rows, onVerInscripciones, showToast, puedeEditar, irABuscador }, ref) {
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
  // "Crear edición" (menú ⋮, vista tarjetas): en vez de abrir el Constructor completo de
  // entrada, primero pasa por este modal liviano con los datos mínimos — más rápido para el
  // caso común de "sumar la próxima edición". Guarda `d` (la ficha) para la que se está
  // creando la edición nueva.
  const [nuevaEdPara, setNuevaEdPara] = useState(null);

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
        {/* El buscador de texto libre queda solo en la pestaña "Buscador" (busca en toda la
            app), igual que en Actividades — acá ya quedan los chips de estado de arriba. */}
        {irABuscador && <button className="btn-sm" onClick={irABuscador}>🔎 Buscar</button>}
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
                <td className="sec">
                  {d.onDemand ? 'On demand' : eds.length > 0 ? `${eds.length} edición${eds.length === 1 ? '' : 'es'}` : '—'}
                  {/* Marca si entre las ediciones hay alguna asincrónica (sin día/horario fijo) —
                      así se ve de un vistazo sin tener que abrir cada ficha. */}
                  {eds.some((e) => /asincr/.test(norm(e.label))) && (
                    <span className="fstate bor" style={{ marginLeft: 6 }} title="Tiene una cursada asincrónica entre sus ediciones"><span className="d" />Asincrónica</span>
                  )}
                  {eds.length > 0 && eds.some((e) => !/asincr/.test(norm(e.label))) && (
                    <span className="fstate pub" style={{ marginLeft: 6 }} title="Tiene ediciones con día y horario fijo"><span className="d" />Sincrónica</span>
                  )}
                </td>
                <td className="sec">{d.curso === 'Coaching Inmobiliario' ? 'No aplica' : (proxima || '—')}</td>
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
              <div className="pcard" key={d.slug} style={{ borderLeft: `4px solid ${colorCurso(d.curso)}66` }}>
                <div className="pcard-top">
                  <div className="pcard-dotrow">
                    <span className="pcard-colordot" style={{ background: colorCurso(d.curso) }} />
                    <span className="pcard-title" title={d.curso} style={{ color: colorCurso(d.curso) }}>{d.curso}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
                    <span className={'pcard-dot ' + meta.cls}><span className="d" />{meta.label}</span>
                    <div className="fmenu">
                      <button className="pcard-menu-btn" aria-label="Más acciones" onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === d.slug ? null : d.slug); }}>•••</button>
                      {menuAbierto === d.slug && (
                        <div className="fmenu-pop" onClick={(e) => e.stopPropagation()}>
                          {puedeEditar && <button onClick={() => { setMenuAbierto(null); setNuevaEdPara(d); }}>Crear edición</button>}
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
                </div>

                {sub && <div className="pcard-sub" title={sub}>{sub}</div>}

                {/* Datos en líneas simples (calco de la tarjeta "Formaciones" de disponibilidad-zoom)
                    en vez de dos "metric boxes" grandes — la última línea, en negrita, es siempre
                    el dato más importante: la próxima edición si hay una fecha real. */}
                <div className="pcard-datos">
                  <span>{insc > 0 ? <button type="button" className="linklike" onClick={() => onVerInscripciones(d.curso)}>{insc} inscriptos →</button> : <span className="pcard-datos-muted">0 inscriptos</span>}</span>
                  {(() => {
                    if (d.onDemand) return <span className="pcard-datos-muted">Modalidad on demand — disponible siempre, sin ediciones programadas.</span>;
                    if (eds.length === 0) {
                      if (d.estado === 'Publicada') {
                        return (
                          <span className="pcard-datos-warn">⚠ Sin próxima edición{puedeEditar && <> — <button type="button" className="linklike" onClick={() => onEditar(d.slug)}>agregar edición</button></>}</span>
                        );
                      }
                      return (
                        <span className="pcard-datos-muted">Sin ediciones cargadas{puedeEditar && <> — <button type="button" className="linklike" onClick={() => onEditar(d.slug)}>agregar edición</button></>}</span>
                      );
                    }
                    return <span className="pcard-datos-muted">{eds.length} edición{eds.length === 1 ? '' : 'es'} cargada{eds.length === 1 ? '' : 's'}</span>;
                  })()}
                  {(() => {
                    if (d.onDemand || eds.length === 0) return null;
                    const det = proximaEdicionDetalle(eds);
                    if (!det) {
                      return (
                        <span className="pcard-datos-warn">⚠ Sin fecha definida{puedeEditar && <> — <button type="button" className="linklike" onClick={() => onEditar(d.slug)}>gestionar edición</button></>}</span>
                      );
                    }
                    return (
                      <span className="pcard-datos-destacado">{det.pasada ? 'Última edición' : 'Próxima edición'}: {det.fecha}{det.numero ? ` (${det.numero})` : ''}{det.pasada ? ' · pasada' : ''}</span>
                    );
                  })()}
                </div>

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

      {nuevaEdPara && (
        <ModalNuevaEdicion
          def={nuevaEdPara}
          usuario={usuario}
          onCerrar={() => setNuevaEdPara(null)}
          onCreada={async (slug) => {
            setNuevaEdPara(null);
            await cargar();
            onEditar(slug);
          }}
        />
      )}
    </div>
  );
});
export default FichasSection;

// Sugiere el próximo número de edición a partir de las ya cargadas (el label sigue la
// convención "Edición N — ...", ver Constructor). Si ninguna edición existente sigue esa
// convención (o no hay ninguna todavía), arranca en 1.
function sugerirProximoNumero(eds) {
  const nums = (eds || []).map((e) => {
    const m = /Edición\s+(\d+)/i.exec(e.label || '');
    return m ? parseInt(m[1], 10) : null;
  }).filter((n) => n != null);
  return nums.length ? Math.max(...nums) + 1 : 1;
}

// "2026-10-05" -> "Lunes 5 de octubre" (mismo formato que ya usan las ediciones cargadas a
// mano, ver EDICIONES_DEFAULT en lib/constants.js: "Edición 15 — Lunes 31 de agosto").
function diaFechaLabel(iso) {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00:00');
  if (isNaN(dt)) return iso;
  const s = dt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Modal liviano de "Nueva edición", disparado desde "Crear edición" en el menú ⋮ de una
// ficha (vista tarjetas) — pensado para el caso común de sumar la próxima edición sin abrir
// el Constructor completo. Al guardar, arma la edición y abre el Constructor de esa ficha
// para que se puedan revisar/ajustar el resto de los campos (mismo criterio ya usado en
// Formaciones/disponibilidad-zoom: crear rápido, después ajustar si hace falta).
function ModalNuevaEdicion({ def, usuario, onCerrar, onCreada }) {
  const eds = def.ediciones || [];
  const fija = cantidadClasesFija(def.curso);
  const [numero, setNumero] = useState(String(sugerirProximoNumero(eds)));
  const [sincronica, setSincronica] = useState(true);
  const [fecha, setFecha] = useState('');
  const [horaIni, setHoraIni] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [cantidadClases, setCantidadClases] = useState(fija ? String(fija) : '');
  const [docente, setDocente] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const fechaFinPreview = sincronica ? calcularFechaFinEdicion(fecha, fija ? String(fija) : cantidadClases) : '';
  const labelPreview = !numero.trim()
    ? ''
    : sincronica
      ? `Edición ${numero.trim()}${fecha ? ' — ' + diaFechaLabel(fecha) : ''}`
      : `Edición ${numero.trim()} — Cursada Asincrónica`;

  async function crear() {
    if (!numero.trim()) { setError('Falta el número de edición.'); return; }
    if (sincronica && !fecha) { setError('Elegí la fecha de la primera clase (o marcá la edición como asincrónica).'); return; }
    setError(''); setGuardando(true);
    const id = String(Date.now()).slice(-6);
    const nuevaEd = {
      id,
      label: sincronica ? `Edición ${numero.trim()} — ${diaFechaLabel(fecha)}` : `Edición ${numero.trim()} — Cursada Asincrónica`,
      horarios: '',
      ...(docente.trim() ? { docente: docente.trim() } : {}),
      ...(sincronica ? { fecha, ...(horaIni ? { horaIni } : {}), ...(horaFin ? { horaFin } : {}) } : {}),
      ...(fija ? { cantidadClases: String(fija) } : (cantidadClases ? { cantidadClases: String(cantidadClases) } : {}))
    };
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: def.slug, def: { ...def, ediciones: [...eds, nuevaEd] } })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo crear la edición.');
      onCreada(def.slug);
    } catch (e) {
      setError(e.message || 'Error de conexión.');
      setGuardando(false);
    }
  }

  return (
    <div className="mwrap on" onClick={onCerrar}>
      <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>+ Nueva edición</h3>
        <p className="muted" style={{ fontSize: 12.5, margin: '2px 0 14px' }}>{def.curso}</p>

        <div className="fgroup-label">Número de edición</div>
        <input className="ctrl" style={{ width: '100%', marginBottom: 10 }} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ej: 17" />

        <label className="wiz-check-inline" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={!sincronica} onChange={(e) => setSincronica(!e.target.checked)} />
          Es una cursada asincrónica (sin día ni horario fijo)
        </label>

        {sincronica ? (
          <>
            <div className="fgroup-label">Fecha de la primera clase</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              <input className="ctrl" type="date" style={{ maxWidth: 160 }} value={fecha} onChange={(e) => setFecha(e.target.value)} />
              <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={horaIni} onChange={(e) => setHoraIni(e.target.value)} title="Desde (hora AR, opcional)" />
              <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={horaFin} onChange={(e) => setHoraFin(e.target.value)} title="Hasta (hora AR, opcional)" />
            </div>
          </>
        ) : (
          <p className="muted" style={{ fontSize: 12, marginBottom: 10 }}>No tiene día ni horario fijo, así que esos campos no aplican acá.</p>
        )}

        <div className="fgroup-label">Cantidad de clases</div>
        {fija ? (
          <input className="ctrl" disabled style={{ width: '100%', marginBottom: 10 }} value={`${fija} clases (fijo para este curso)`} />
        ) : (
          <input className="ctrl" type="number" min="1" style={{ width: '100%', marginBottom: 10 }} value={cantidadClases} onChange={(e) => setCantidadClases(e.target.value)} placeholder="Cantidad de encuentros de esta edición" />
        )}

        <div className="fgroup-label">Docente</div>
        <input className="ctrl" style={{ width: '100%', marginBottom: 12 }} value={docente} onChange={(e) => setDocente(e.target.value)} placeholder="Nombre del docente (opcional por ahora)" />

        {labelPreview && (
          <div className="note" style={{ marginBottom: 12, fontSize: 12.5 }}>
            Se va a crear <b>{labelPreview}</b>
            {sincronica && fechaFinPreview && <> — termina el {diaFechaLabel(fechaFinPreview)}</>}
            .
          </div>
        )}

        {error && <p style={{ color: 'rgb(248 113 113)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-sm" onClick={onCerrar} disabled={guardando}>Cancelar</button>
          <button className="btn-sm solid" onClick={crear} disabled={guardando}>{guardando ? 'Creando…' : 'Crear y abrir Constructor'}</button>
        </div>
      </div>
    </div>
  );
}

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
