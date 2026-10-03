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
    abrirConstructor: (curso) => { if (!defs || defs.length === 0) return; const d = curso ? (defs.find((x) => x.curso === curso) || defs[0]) : defs[0]; onEditar(d.slug); }
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
  if (nuevaEdPara) {
    return (
      <NuevaEdicionPanel
        def={nuevaEdPara}
        usuario={usuario}
        onVolver={() => setNuevaEdPara(null)}
        onCreada={async (slug) => {
          setNuevaEdPara(null);
          await cargar();
          onEditar(slug);
        }}
      />
    );
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
                <td className="ins-name" style={{ borderLeft: `4px solid ${colorCurso(d.curso)}` }}>
                  {/* Pedido de Diego: hacer clic acá (el nombre del curso) tiene que abrir
                      directamente la edición/ficha en el Constructor, no solo el botón "Editar". */}
                  <div className="curso-cell" style={puedeEditar ? { cursor: 'pointer' } : undefined} onClick={puedeEditar ? () => onEditar(d.slug) : undefined} title={puedeEditar ? 'Editar esta ficha' : undefined}>
                    <span className="curso-avatar" style={{ background: colorCurso(d.curso) + '22', color: colorCurso(d.curso) }}>{inicialesCurso(d.curso)}</span>
                    <span style={{ color: colorCurso(d.curso), fontWeight: 400 }}>{d.curso}</span>
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
              <div className="pcard" key={d.slug} style={{ borderLeft: `5px solid ${colorCurso(d.curso)}` }}>
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

const TIPO_CURSADA = [
  { v: 'sincronica', l: 'Sincrónica — con día y horario fijo' },
  { v: 'asincronica', l: 'Asincrónica — sin día ni horario fijo' },
  { v: 'ondemand', l: 'A demanda — el curso entero, sin ediciones programadas' }
];

// Pantalla de "Nueva edición", disparada desde "Crear edición" en el menú ⋮ de una ficha
// (vista tarjetas) — pensada para el caso común de sumar la próxima edición sin abrir el
// Constructor completo de entrada. Ocupa toda la pantalla (no un modal chico), con el tipo
// de cursada arriba en un combo y la vista previa actualizándose al costado a medida que se
// completa — mismo criterio que ya usa listadopresentismo en su propia "Nueva edición".
// Al guardar, abre el Constructor de esa ficha para revisar/ajustar el resto de los campos.
function NuevaEdicionPanel({ def, usuario, onVolver, onCreada }) {
  const eds = def.ediciones || [];
  const fija = cantidadClasesFija(def.curso);
  const [tipo, setTipo] = useState('sincronica');
  const [numero, setNumero] = useState(String(sugerirProximoNumero(eds)));
  const [fecha, setFecha] = useState('');
  const [horaIni, setHoraIni] = useState('');
  const [horaFin, setHoraFin] = useState('');
  const [cantidadClases, setCantidadClases] = useState(fija ? String(fija) : '');
  const [docente, setDocente] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  // Precarga del equipo docente: al abrir el form se trae el roster para ofrecer los docentes
  // del curso en un desplegable (en vez de tipear el nombre a mano).
  const [docentesRoster, setDocentesRoster] = useState([]);
  const [modoDocenteLibre, setModoDocenteLibre] = useState(false);
  useEffect(() => {
    let vivo = true;
    fetch('/api/docentes?solicitanteEmail=' + encodeURIComponent(usuario.email))
      .then((r) => r.json())
      .then((d) => { if (vivo && d && d.ok) setDocentesRoster(d.docentes || []); })
      .catch(() => {});
    return () => { vivo = false; };
  }, [usuario]);
  const docentesDelCurso = useMemo(() => {
    const norm = (x) => (x || '').toString().trim().toLowerCase();
    const delCurso = docentesRoster.filter((d) => norm(d.curso) === norm(def.curso) && (d.nombre || '').trim());
    const base = delCurso.length ? delCurso : docentesRoster;
    return [...new Set(base.map((d) => (d.nombre || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [docentesRoster, def.curso]);

  const sincronica = tipo === 'sincronica';
  const ondemand = tipo === 'ondemand';
  const fechaFinPreview = sincronica ? calcularFechaFinEdicion(fecha, fija ? String(fija) : cantidadClases) : '';
  const labelPreview = ondemand
    ? 'Modalidad a demanda'
    : !numero.trim()
      ? ''
      : sincronica
        ? `Edición ${numero.trim()}${fecha ? ' — ' + diaFechaLabel(fecha) : ''}`
        : `Edición ${numero.trim()} — Cursada Asincrónica`;

  async function crear() {
    if (!ondemand && !numero.trim()) { setError('Falta el número de edición.'); return; }
    if (sincronica && !fecha) { setError('Elegí la fecha de la primera clase (o cambiá el tipo de cursada).'); return; }
    setError(''); setGuardando(true);
    try {
      let nuevoDef;
      if (ondemand) {
        // "A demanda" es una propiedad de la ficha entera (mismo campo que ya usa Coaching
        // Inmobiliario) — no se agrega una edición nueva a la lista, se marca el curso.
        nuevoDef = { ...def, onDemand: true };
      } else {
        const id = String(Date.now()).slice(-6);
        const nuevaEd = {
          id,
          label: sincronica ? `Edición ${numero.trim()} — ${diaFechaLabel(fecha)}` : `Edición ${numero.trim()} — Cursada Asincrónica`,
          horarios: '',
          ...(docente.trim() ? { docente: docente.trim() } : {}),
          ...(sincronica ? { fecha, ...(horaIni ? { horaIni } : {}), ...(horaFin ? { horaFin } : {}) } : {}),
          ...(fija ? { cantidadClases: String(fija) } : (cantidadClases ? { cantidadClases: String(cantidadClases) } : {}))
        };
        nuevoDef = { ...def, ediciones: [...eds, nuevaEd] };
      }
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: def.slug, def: nuevoDef })
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
    <div>
      <div className="fhead">
        <div>
          <button className="linklike" onClick={onVolver}>← Volver a Fichas de inscripción</button>
          <h2 style={{ margin: '6px 0 0' }}>+ Nueva edición</h2>
          <p className="fhead-sub">{def.curso}</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="ctor-section" style={{ flex: '1 1 460px', minWidth: 320 }}>
          <div className="ctor-section-lbl">Información general</div>
          <div className="fgroup-label" style={{ marginTop: 10 }}>Tipo de cursada</div>
          <select className="fsel" style={{ width: '100%', marginBottom: 14 }} value={tipo} onChange={(e) => setTipo(e.target.value)}>
            {TIPO_CURSADA.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
          </select>

          {!ondemand && (
            <>
              <div className="fgroup-label">Número de edición</div>
              <input className="ctrl" style={{ width: '100%', marginBottom: 14 }} value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Ej: 17" />
            </>
          )}

          {ondemand ? (
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
              El curso queda disponible siempre, sin ediciones programadas (mismo criterio que Coaching Inmobiliario) — no hace falta cargar fecha ni número.
            </p>
          ) : sincronica ? (
            <>
              <div className="fgroup-label">Fecha de la primera clase</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                <input className="ctrl" type="date" style={{ maxWidth: 160 }} value={fecha} onChange={(e) => setFecha(e.target.value)} />
                <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={horaIni} onChange={(e) => setHoraIni(e.target.value)} title="Desde (hora AR, opcional)" />
                <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={horaFin} onChange={(e) => setHoraFin(e.target.value)} title="Hasta (hora AR, opcional)" />
              </div>
            </>
          ) : (
            <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>No tiene día ni horario fijo, así que esos campos no aplican acá.</p>
          )}

          {!ondemand && (
            <>
              <div className="fgroup-label">Cantidad de clases</div>
              {fija ? (
                <input className="ctrl" disabled style={{ width: '100%', marginBottom: 14 }} value={`${fija} clases (fijo para este curso)`} />
              ) : (
                <input className="ctrl" type="number" min="1" style={{ width: '100%', marginBottom: 14 }} value={cantidadClases} onChange={(e) => setCantidadClases(e.target.value)} placeholder="Cantidad de encuentros de esta edición" />
              )}

              <div className="fgroup-label">Docente</div>
              {!modoDocenteLibre && docentesDelCurso.length > 0 ? (
                <select
                  className="fsel" style={{ width: '100%', marginBottom: 14 }}
                  value={docentesDelCurso.includes(docente) ? docente : ''}
                  onChange={(e) => { if (e.target.value === '__otro__') { setModoDocenteLibre(true); setDocente(''); } else setDocente(e.target.value); }}
                >
                  <option value="">— Sin asignar todavía —</option>
                  {docentesDelCurso.map((n) => <option key={n} value={n}>{n}</option>)}
                  <option value="__otro__">✏️ Otro (escribir)…</option>
                </select>
              ) : (
                <>
                  <input className="ctrl" style={{ width: '100%', marginBottom: docentesDelCurso.length > 0 ? 6 : 14 }} value={docente} onChange={(e) => setDocente(e.target.value)} placeholder="Nombre del docente (opcional por ahora)" />
                  {docentesDelCurso.length > 0 && (
                    <button type="button" onClick={() => { setModoDocenteLibre(false); setDocente(''); }}
                      style={{ background: 'none', border: 'none', color: 'rgb(var(--accentTeal))', cursor: 'pointer', padding: 0, fontSize: 12, marginBottom: 14, display: 'block' }}>
                      ← Elegir del equipo docente
                    </button>
                  )}
                </>
              )}
            </>
          )}

          {error && <p style={{ color: 'rgb(248 113 113)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn-sm solid" onClick={crear} disabled={guardando}>{guardando ? 'Creando…' : 'Crear edición'}</button>
            <button className="btn-sm" onClick={onVolver} disabled={guardando}>Cancelar</button>
          </div>
        </div>

        {/* Vista previa: se va completando sola a medida que se cargan los datos — mismo
            criterio que la "Nueva edición" de listadopresentismo. */}
        <div className="ctor-section" style={{ flex: '0 1 300px', minWidth: 260, position: 'sticky', top: 16 }}>
          <div className="ctor-section-lbl">Vista previa</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="curso-avatar" style={{ background: colorCurso(def.curso) + '22', color: colorCurso(def.curso) }}>{inicialesCurso(def.curso)}</span>
            <b style={{ color: colorCurso(def.curso) }}>{def.curso}</b>
          </div>
          <div style={{ fontSize: 12.5, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FilaPreview label={ondemand ? 'Modalidad' : 'Edición'}>{ondemand ? 'A demanda' : (numero.trim() ? numero.trim() : '—')}</FilaPreview>
            {!ondemand && <FilaPreview label="Docente">{docente.trim() || '— Sin asignar —'}</FilaPreview>}
            {!ondemand && <FilaPreview label="Fecha de inicio">{sincronica ? (fecha ? diaFechaLabel(fecha) : '—') : 'No aplica'}</FilaPreview>}
            {!ondemand && <FilaPreview label="Fecha de finalización">{sincronica ? (fechaFinPreview ? diaFechaLabel(fechaFinPreview) : '— Elegí la fecha de inicio —') : 'No aplica'}</FilaPreview>}
          </div>
          {labelPreview && (
            <div className="note" style={{ marginTop: 12, fontSize: 12 }}>
              Se va a crear: <b>{labelPreview}</b>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilaPreview({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, borderBottom: '1px solid rgb(var(--border))', paddingBottom: 6 }}>
      <span className="muted">{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{children}</span>
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
  // Pedido de Diego (03/10/2026): formato de fecha D/M/AAAA (sin ceros adelante, año completo),
  // igual en todo el panel.
  const txt = isNaN(dt) ? e.fecha : dt.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric', year: 'numeric' });
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
  // Pedido de Diego (03/10/2026): formato de fecha D/M/AAAA (sin ceros adelante).
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'numeric', year: 'numeric' });
}
