'use client';
import { useEffect, useMemo, useState } from 'react';
import { APP_URL } from '../lib/constants';
import Constructor from './Constructor';

const ESTADO_META = {
  Publicada: { cls: 'pub', label: 'Publicada', dot: '🟢' },
  Borrador: { cls: 'bor', label: 'Borrador', dot: '🟡' },
  Cerrada: { cls: 'cer', label: 'Cerrada', dot: '🔴' },
  Archivada: { cls: 'arch', label: 'Archivada', dot: '⚪' }
};
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function FichasSection({ usuario, rows, onVerInscripciones, showToast, puedeEditar }) {
  // El Constructor de fichas vive DENTRO de "Fichas de inscripción": editar o cargar una
  // edición abre el wizard acá mismo (no navega a una pestaña aparte).
  const [construyendo, setConstruyendo] = useState(null); // slug de la ficha que se está armando, o null
  function onEditar(slug) { setConstruyendo(slug); }
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
  const { porCurso, porEd } = useMemo(() => {
    const pc = {}, pe = {};
    (rows || []).forEach((r) => {
      if (!r.curso) return;
      pc[r.curso] = (pc[r.curso] || 0) + 1;
      const k = r.curso + '||' + norm(r.ed);
      pe[k] = (pe[k] || 0) + 1;
    });
    return { porCurso: pc, porEd: pe };
  }, [rows]);

  function contarEd(curso, label) {
    // best-effort: suma las filas cuya edición coincide con el label configurado
    const ln = norm(label);
    let total = 0;
    Object.keys(porEd).forEach((k) => {
      const [c, kn] = k.split('||');
      if (c !== curso) return;
      if (kn === ln || ln.startsWith(kn) || kn.startsWith(ln.split(' ').slice(0, 2).join(' '))) total += porEd[k];
    });
    return total;
  }

  const cuenta = (estado) => (defs || []).filter((d) => !estado || d.estado === estado).length;
  const sinEd = useMemo(() => (defs || []).filter((d) => (d.ediciones || []).length === 0).length, [defs]);
  const conEd = (defs || []).length - sinEd;

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
          <div className="fstat-cards">
            <div className="fstat-card"><div className="n">{defs.length}</div><div className="l">Fichas</div></div>
            <div className="fstat-card"><div className="n" style={{ color: 'rgb(74 222 128)' }}>{conEd}</div><div className="l">Con ediciones</div></div>
            <div className="fstat-card"><div className="n" style={{ color: 'rgb(251 191 36)' }}>{sinEd}</div><div className="l">Requieren atención</div></div>
          </div>
        </div>
        <span style={{ flex: 1 }} />
        {puedeEditar && <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 18px' }} onClick={() => showToast('El alta de cursos nuevos llega en el próximo lote (cursos dinámicos).')}>+ Nueva ficha</button>}
      </div>

      {sinEd > 0 && (
        <div className="fbanner">
          <span className="fbanner-ico">⚠️</span>
          <div className="fbanner-txt">
            <b>Cargá ediciones</b>
            <span>{sinEd} ficha{sinEd === 1 ? '' : 's'} sin ediciones</span>
          </div>
          <button className="btn-sm solid" onClick={() => { const f = defs.find((d) => (d.ediciones || []).length === 0); if (f) onEditar(f.slug); }}>Cargar edición</button>
        </div>
      )}

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
          <thead><tr><th>Ficha</th><th>Estado</th><th>Inscripciones</th><th>Ediciones</th><th>URL de inscripción</th><th></th></tr></thead>
          <tbody>{filtradas.map((d) => {
            const meta = ESTADO_META[d.estado] || ESTADO_META.Publicada;
            const insc = porCurso[d.curso] || 0;
            const eds = d.ediciones || [];
            const url = `${APP_URL}/inscripcion/${d.slug}`;
            return (
              <tr key={d.slug}>
                <td className="ins-name">{d.curso}</td>
                <td><span className={'fstate ' + meta.cls}><span className="d" />{meta.label}</span></td>
                <td>{insc > 0 ? <button className="linklike" onClick={() => onVerInscripciones(d.curso)}>{insc} inscriptos →</button> : <span className="sec">0</span>}</td>
                <td className="sec">{eds.length} edición{eds.length === 1 ? '' : 'es'}</td>
                <td className="col-url">
                  <div className="url-cell">
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
        <div className="fgrid">
          {filtradas.map((d) => {
            const meta = ESTADO_META[d.estado] || ESTADO_META.Publicada;
            const insc = porCurso[d.curso] || 0;
            const eds = d.ediciones || [];
            const fecha = fmtFecha(d.actualizado);
            const alerta = d.estado === 'Publicada' && eds.length === 0;
            return (
              <div className="fcard" key={d.slug}>
                <div className="fcard-top">
                  <span className={'fstate ' + meta.cls}><span className="d" />{meta.label}</span>
                  {fecha && <span className="fcard-upd">Act. {fecha}</span>}
                </div>

                <div className="ftitle">{d.curso}</div>

                <div className="fbig">
                  <div className="fbig-n">{insc}</div>
                  <div className="fbig-l">inscripcion{insc === 1 ? '' : 'es'}<br /><span>{eds.length} edición{eds.length === 1 ? '' : 'es'}</span></div>
                </div>
                {insc > 0 && <button className="fver-insc" onClick={() => onVerInscripciones(d.curso)}>Ver listado de inscriptos →</button>}

                <div className="feds">
                  {eds.length === 0 ? (
                    <div className="fnoed-neutral">
                      <span>Sin ediciones cargadas</span>
                      {puedeEditar && <button onClick={() => onEditar(d.slug)}>+ Agregar edición</button>}
                    </div>
                  ) : (<>
                    <div className="feds-title">Ediciones</div>
                    {eds.slice(0, 3).map((e, i) => {
                      const parts = (e.label || '').split('—');
                      const num = parts[0].trim();
                      const fe = parts[1] ? parts[1].trim() : '';
                      return (
                        <div className="fed-row" key={i}>
                          <div className="fed-info"><span className="nm">{num}</span>{fe && <span className="fe">{fe}</span>}</div>
                          <span className="c">{contarEd(d.curso, e.label)}</span>
                        </div>
                      );
                    })}
                    {eds.length > 3 && <button className="fed-more" onClick={() => onEditar(d.slug)}>Ver todas ({eds.length})</button>}
                    {puedeEditar && eds.length <= 3 && <button className="fed-more" onClick={() => onEditar(d.slug)}>+ Agregar edición</button>}
                  </>)}
                </div>

                <div className="fspacer" />

                <div className="factions">
                  {(() => {
                    const eds = d.ediciones || [];
                    let ap;
                    if (d.estado === 'Borrador') ap = { l: '✎ Continuar edición', f: () => onEditar(d.slug) };
                    else if (eds.length === 0) ap = { l: '➕ Cargar edición', f: () => onEditar(d.slug) };
                    else if (d.estado === 'Publicada') ap = { l: '👁 Ver inscripción', f: () => abrirPublica(d) };
                    else ap = { l: '🎓 Gestionar ediciones', f: () => onEditar(d.slug) };
                    return <button className="btn-sm solid" style={{ flex: 1, justifyContent: 'center' }} onClick={ap.f}>{ap.l}</button>;
                  })()}
                  <div className="fmenu">
                    <button className="btn-sm fmenu-btn" aria-label="Más acciones" onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === d.slug ? null : d.slug); }}>⋮</button>
                    {menuAbierto === d.slug && (
                      <div className="fmenu-pop" onClick={(e) => e.stopPropagation()}>
                        {puedeEditar && <button onClick={() => { setMenuAbierto(null); onEditar(d.slug); }}>✎ Editar ficha</button>}
                        <button onClick={() => abrirPublica(d)}>👁 Vista previa</button>
                        <button onClick={() => copiarLink(d)}>{copiado === d.slug ? '✓ Copiado' : '🔗 Copiar URL'}</button>
                        {onVerInscripciones && <button onClick={() => { setMenuAbierto(null); onVerInscripciones(d.curso); }}>📋 Ver inscripciones</button>}
                        {puedeEditar && <button onClick={() => { setMenuAbierto(null); onEditar(d.slug); }}>➕ Crear edición</button>}
                        {puedeEditar && <>
                          <div className="sep" />
                          {d.estado !== 'Publicada' && <button onClick={() => guardarEstado(d, 'Publicada')}>🟢 Publicar</button>}
                          {d.estado !== 'Borrador' && <button onClick={() => guardarEstado(d, 'Borrador')}>🟡 Pasar a borrador</button>}
                          {d.estado !== 'Cerrada' && <button onClick={() => guardarEstado(d, 'Cerrada')}>🔴 Cerrar</button>}
                          {d.estado !== 'Archivada' && <button onClick={() => guardarEstado(d, 'Archivada')}>🗄 Archivar</button>}
                          <div className="sep" />
                          <button className="danger" onClick={() => { setMenuAbierto(null); showToast('Eliminar/duplicar cursos base llega con los cursos dinámicos.'); }}>🗑 Eliminar</button>
                        </>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmtFecha(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d)) return null;
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return 'hoy';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
