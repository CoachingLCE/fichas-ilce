'use client';
import { useEffect, useRef, useState } from 'react';
import { APP_URL } from '../lib/constants';
import { generarHorarios } from '../lib/husos';

// ───────────────────────────────────────────────────────────────────────────
// Biblioteca de campos estándar ILCE, agrupados. Es la base con la que se
// arma el "def.campos" (orden + activo/inactivo) de cada ficha la primera vez
// que alguien abre la sección "Campos". A partir de ahí, def.campos manda.
// NOTA: hoy esto configura la definición guardada de la ficha; conectar este
// orden/selección para que la ficha PÚBLICA (FichaWizard) los use de verdad
// es el siguiente paso — se hace aparte para no arriesgar las fichas ya
// publicadas mientras se prueba.
// ───────────────────────────────────────────────────────────────────────────
const CAMPOS_LIB = [
  { id: 'nombre', nombre: 'Nombre', tipo: 'Texto', requerido: true, grupo: 'Datos personales' },
  { id: 'apellido', nombre: 'Apellido', tipo: 'Texto', requerido: true, grupo: 'Datos personales' },
  { id: 'fecha_nac', nombre: 'Fecha de nacimiento', tipo: 'Fecha', requerido: false, grupo: 'Datos personales' },
  { id: 'pais', nombre: 'País de residencia', tipo: 'País · activa DNI/Provincia', requerido: true, grupo: 'Datos personales' },
  { id: 'dni', nombre: 'DNI / Pasaporte', tipo: 'Documento · condicional', requerido: true, grupo: 'Datos personales' },
  { id: 'provincia', nombre: 'Provincia / Estado', tipo: 'Condicional', requerido: true, grupo: 'Datos personales' },
  { id: 'localidad', nombre: 'Localidad', tipo: 'Texto', requerido: true, grupo: 'Datos personales' },
  { id: 'profesion', nombre: 'Profesión', tipo: 'Texto', requerido: false, grupo: 'Datos personales' },
  { id: 'whatsapp', nombre: 'WhatsApp', tipo: 'WhatsApp', requerido: true, grupo: 'Contacto' },
  { id: 'instagram', nombre: 'Instagram', tipo: 'Texto', requerido: false, grupo: 'Contacto' },
  { id: 'modalidad', nombre: 'Modalidad de cursada', tipo: 'Selección única', requerido: true, grupo: 'Cursada' },
  { id: 'como_llegaste', nombre: '¿Cómo llegaste?', tipo: 'Selección única', requerido: true, grupo: 'Cursada' },
  { id: 'medio_contacto', nombre: 'Medio de contacto', tipo: 'Selección única', requerido: true, grupo: 'Cursada' },
  { id: 'salud', nombre: 'Tema de salud', tipo: 'Texto', requerido: false, grupo: 'Cursada' },
  { id: 'sobre_vos', nombre: 'Sobre vos', tipo: 'Texto largo', requerido: true, grupo: 'Cursada' },
  { id: 'comentarios', nombre: 'Comentarios', tipo: 'Texto largo', requerido: false, grupo: 'Cursada' },
  { id: 'consentimiento', nombre: 'Consentimiento', tipo: 'Consentimiento', requerido: true, grupo: 'Cursada' }
];
const GRUPOS = ['Datos personales', 'Contacto', 'Cursada'];

function camposIniciales() {
  return CAMPOS_LIB.map((c) => ({ ...c, activo: true, personalizado: false }));
}

export default function Constructor({ usuario, initialSlug, showToast, onVolver, volverLabel }) {
  const [defs, setDefs] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [sel, setSel] = useState(null); // índice de la ficha activa en el editor
  const [dirty, setDirty] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoAt, setGuardadoAt] = useState(null);
  const [tick, setTick] = useState(0);
  const [edAbierta, setEdAbierta] = useState(null); // id de la edición expandida
  const [edMenu, setEdMenu] = useState(null);
  const [campoNuevo, setCampoNuevo] = useState({ nombre: '', tipo: 'Texto' });
  const [destNuevo, setDestNuevo] = useState('');
  const dragIdx = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/fichas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const data = await res.json();
      if (!data.ok || !Array.isArray(data.defs) || data.defs.length === 0) {
        setErrorCarga(data.error || 'No se pudieron cargar las fichas.'); return;
      }
      setDefs(data.defs);
      const i = initialSlug ? Math.max(0, data.defs.findIndex((x) => x.slug === initialSlug)) : 0;
      seleccionar(i, data.defs);
    } catch (e) {
      setErrorCarga('No se pudo conectar con el servidor.');
    }
  })(); /* eslint-disable-next-line */ }, []);

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 15000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (errorCarga) {
    return (
      <div className="empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>⚠️ No se pudo abrir el Constructor</p>
        <p className="muted" style={{ marginBottom: 16 }}>{errorCarga}</p>
        <button className="btn-sm solid" onClick={() => { setErrorCarga(''); setDefs(null); window.location.reload(); }}>Reintentar</button>
        {onVolver && <button className="btn-sm" style={{ marginLeft: 8 }} onClick={onVolver}>← Volver</button>}
      </div>
    );
  }
  if (!defs) return <div className="spin" />;

  function seleccionar(i, arr = defs) {
    // Blindaje: si el índice no existe en el array (ficha borrada/slug inválido), no
    // rompemos la pantalla — caemos a la primera ficha disponible.
    const idx = (Array.isArray(arr) && arr[i]) ? i : 0;
    const d = arr[idx];
    if (!d) { setErrorCarga('No hay fichas para mostrar.'); return; }
    i = idx;
    // Si la ficha nunca pasó por acá, le damos la biblioteca de campos estándar.
    if (!Array.isArray(d.campos) || d.campos.length === 0) {
      setDefs((old) => old.map((x, j) => j === i ? { ...x, campos: camposIniciales() } : x));
    }
    setSel(i); setDirty(false); setEdAbierta(null);
  }
  function cambiarFicha(i) {
    if (dirty && !confirm('Tenés cambios sin guardar. ¿Cambiar de ficha sin guardar?')) return;
    seleccionar(i);
  }
  function volver() {
    if (dirty && !confirm('Tenés cambios sin guardar. ¿Volver sin guardar?')) return;
    if (onVolver) onVolver();
  }

  const d = defs[sel];

  function upd(patch) {
    setDefs((arr) => arr.map((x, i) => i === sel ? { ...x, ...patch } : x));
    setDirty(true);
    // autosave discreto: guarda solo unos instantes después de la última tecla
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => guardar({ silencioso: true }), 1100);
  }

  // ---- ediciones ----
  const eds = d.ediciones || [];
  function setEds(nuevas) { upd({ ediciones: nuevas }); }
  function addEd() {
    const id = String(Date.now()).slice(-6);
    setEds([...eds, { id, label: `Edición ${eds.length + 1}`, horarios: '' }]);
    setEdAbierta(id);
  }
  function updEd(i, patch) { setEds(eds.map((e, j) => j === i ? { ...e, ...patch } : e)); }
  function delEd(i) { setEds(eds.filter((_, j) => j !== i)); setEdMenu(null); }
  function moveEd(i, dir) {
    const j = i + dir; if (j < 0 || j >= eds.length) return;
    const c = eds.slice(); [c[i], c[j]] = [c[j], c[i]]; setEds(c); setEdMenu(null);
  }

  // ---- campos ----
  const campos = d.campos || [];
  function toggleCampo(id) { upd({ campos: campos.map((c) => c.id === id ? { ...c, activo: !c.activo } : c) }); }
  function agregarCampoPersonalizado() {
    if (!campoNuevo.nombre.trim()) return;
    const id = 'custom_' + Date.now();
    upd({ campos: [...campos, { id, nombre: campoNuevo.nombre.trim(), tipo: campoNuevo.tipo, requerido: false, grupo: 'Personalizados', activo: true, personalizado: true }] });
    setCampoNuevo({ nombre: '', tipo: 'Texto' });
  }
  function eliminarCampoPersonalizado(id) { upd({ campos: campos.filter((c) => c.id !== id) }); }

  // ---- orden (drag & drop nativo, solo entre campos activos) ----
  const activos = campos.filter((c) => c.activo);
  const inactivos = campos.filter((c) => !c.activo);
  function reordenar(desde, hasta) {
    if (desde === hasta) return;
    const list = activos.slice();
    const [item] = list.splice(desde, 1);
    list.splice(hasta, 0, item);
    upd({ campos: [...list, ...inactivos] });
  }
  function moverCampo(i, dir) { const j = i + dir; if (j < 0 || j >= activos.length) return; reordenar(i, j); }

  // ---- configuración ----
  const cfg = d.config || { destinatarios: [], notificar: true, mensajePost: '', avanzado: { redireccion: '' } };
  function updCfg(patch) { upd({ config: { ...cfg, ...patch } }); }
  function agregarDest() {
    const e = destNuevo.trim();
    if (!e || (cfg.destinatarios || []).includes(e)) return;
    updCfg({ destinatarios: [...(cfg.destinatarios || []), e] });
    setDestNuevo('');
  }
  function quitarDest(e) { updCfg({ destinatarios: (cfg.destinatarios || []).filter((x) => x !== e) }); }

  async function guardar({ silencioso } = {}) {
    setGuardando(true);
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: d.slug, def: d })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setDirty(false); setGuardadoAt(Date.now());
      if (!silencioso) showToast?.('✓ Cambios guardados');
    } catch (e) {
      showToast?.('⚠ No pudimos guardar los cambios');
    }
    setGuardando(false);
  }

  const estadoGuardado = guardando
    ? { txt: 'Guardando…', cls: 'bor' }
    : dirty ? { txt: '● Cambios sin guardar', cls: 'cer' }
      : guardadoAt ? { txt: '✓ Cambios guardados ' + haceTexto(guardadoAt, tick), cls: 'pub' }
        : { txt: '● Sin cambios', cls: 'pub' };

  const fechaLegible = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt)) return iso;
    return dt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  // Fecha de fin estimada de una edición: fecha de inicio + (cantidad de clases - 1) *
  // frecuencia (semanal = 7 días, quincenal = 14 días). Es por edición (no por curso),
  // porque la cantidad de encuentros varía de una edición a otra incluso dentro del mismo
  // curso. Devuelve '' si falta algún dato.
  const calcularFechaFin = (fecha, cantidadClases, frecuencia) => {
    const n = parseInt(cantidadClases, 10);
    if (!fecha || !n || n < 1) return '';
    const dias = (frecuencia === 'quincenal' ? 14 : 7) * (n - 1);
    const dt = new Date(fecha + 'T00:00:00');
    if (isNaN(dt)) return '';
    dt.setDate(dt.getDate() + dias);
    return dt.toISOString().slice(0, 10);
  };

  return (
    <div className="ctor3" onClick={() => edMenu !== null && setEdMenu(null)}>
      {/* IZQUIERDA — lista compacta de fichas */}
      <div className="ctor-list">
        <div className="ctor-list-head">
          <button className="linklike" onClick={volver}>{volverLabel || '← Volver'}</button>
          <div className="ctor-list-title">Fichas</div>
        </div>
        {defs.map((x, i) => (
          <button key={x.slug} className={'ctor-list-item' + (i === sel ? ' on' : '')} onClick={() => cambiarFicha(i)}>
            {x.curso}
          </button>
        ))}
        <p className="muted" style={{ fontSize: 11, marginTop: 10, padding: '0 4px' }}>Agregar formaciones nuevas llega en el próximo lote.</p>
      </div>

      {/* CENTRO — editor */}
      <div className="ctor-editor">
        <div className="ctor-topbar">
          <span className="ctor-path muted">/inscripcion/{d.slug}</span>
          <span className={'fstate ' + estadoGuardado.cls} style={{ marginLeft: 'auto' }}><span className="d" />{estadoGuardado.txt}</span>
          <button className="btn-sm solid" onClick={() => guardar()} disabled={guardando || !dirty}>Guardar</button>
        </div>

        <div className="ctor-section">
          <div className="ctor-section-lbl">Información</div>
          <label style={lbl}>Título</label>
          <input className="ctrl" value={d.titulo || ''} onChange={(e) => upd({ titulo: e.target.value })} placeholder={`Ficha de inscripción — ${d.curso}`} />
          <label style={{ ...lbl, marginTop: 12 }}>Mensaje de bienvenida</label>
          <textarea className="ctrl" value={d.bienvenida || ''} onChange={(e) => upd({ bienvenida: e.target.value })} placeholder="¡Nos alegra tenerte acá! Completá tu ficha, se guarda sola." />
          <label style={{ ...lbl, marginTop: 12 }}>Estado</label>
          <select className="fsel" value={d.estado || 'Publicada'} onChange={(e) => upd({ estado: e.target.value })}>
            <option>Borrador</option><option>Publicada</option><option>Cerrada</option>
          </select>
          <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Solo <b>Publicada</b> deja completar el formulario público.</p>
        </div>

        <div className="ctor-section">
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <div className="ctor-section-lbl" style={{ margin: 0 }}>Ediciones</div>
            <button className="btn-sm" style={{ marginLeft: 'auto' }} onClick={addEd}>+ Agregar edición</button>
          </div>
          {eds.length === 0 ? (
            <div className="wiz-empty">
              Todavía no hay ediciones.<br />Agregá una edición para que las personas puedan elegir una fecha de cursada.
            </div>
          ) : (
            <div className="ctor-ed-list">
              {eds.map((e, i) => {
                const abierta = edAbierta === e.id;
                return (
                  <div className="ctor-ed-card" key={e.id || i}>
                    <div className="ctor-ed-head">
                      <div className="ctor-ed-titulo">
                        <b>{e.label || `Edición ${i + 1}`}</b>
                        {e.fecha && <span className="muted"> · {fechaLegible(e.fecha)}</span>}
                        {e.fecha && e.cantidadClases && <span className="muted"> → {fechaLegible(calcularFechaFin(e.fecha, e.cantidadClases, e.frecuencia))}</span>}
                      </div>
                      <button className="linklike" onClick={() => setEdAbierta(abierta ? null : e.id)}>{abierta ? 'cerrar' : 'editar'}</button>
                      <div className="ctor-ed-menu-wrap">
                        <button className="btn-sm fmenu-btn" onClick={(ev) => { ev.stopPropagation(); setEdMenu(edMenu === i ? null : i); }}>⋮</button>
                        {edMenu === i && (
                          <div className="fmenu-pop" onClick={(ev) => ev.stopPropagation()}>
                            <button onClick={() => moveEd(i, -1)} disabled={i === 0}>↑ Subir</button>
                            <button onClick={() => moveEd(i, 1)} disabled={i === eds.length - 1}>↓ Bajar</button>
                            <div className="sep" />
                            <button className="danger" onClick={() => delEd(i)}>🗑 Eliminar</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {abierta && (
                      <div className="ctor-ed-body">
                        <input className="ctrl" style={{ fontWeight: 700 }} value={e.label} onChange={(ev) => updEd(i, { label: ev.target.value })} placeholder="Ej: Edición 17 — Lunes 5 de mayo" />
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                          <input className="ctrl" type="date" style={{ maxWidth: 160 }} value={e.fecha || ''} onChange={(ev) => updEd(i, { fecha: ev.target.value })} title="Fecha de la primera clase (hora de Argentina)" />
                          <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={e.horaIni || ''} onChange={(ev) => updEd(i, { horaIni: ev.target.value })} title="Desde (hora AR)" />
                          <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={e.horaFin || ''} onChange={(ev) => updEd(i, { horaFin: ev.target.value })} title="Hasta (hora AR)" />
                          <button className="btn-sm solid" onClick={() => updEd(i, { horarios: generarHorarios(e.fecha, e.horaIni, e.horaFin) })} disabled={!e.fecha || !e.horaIni || !e.horaFin} title="Calcula el horario en otros países a partir de la hora de Argentina">⚙ Calcular husos</button>
                        </div>
                        <input className="ctrl" style={{ marginTop: 8 }} value={e.horarios || ''} onChange={(ev) => updEd(i, { horarios: ev.target.value })} placeholder="Horarios por país (se completan al calcular, o escribilos a mano)" />
                        {/* Fecha de fin: opcional y se calcula sola a partir de la fecha de inicio +
                            cantidad de clases — así no hay que ir a buscar un calendario aparte. */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 10 }}>
                          <input className="ctrl" type="number" min="1" style={{ maxWidth: 130 }} value={e.cantidadClases || ''}
                            onChange={(ev) => { const cantidadClases = ev.target.value; updEd(i, { cantidadClases, fechaFin: calcularFechaFin(e.fecha, cantidadClases, e.frecuencia) }); }}
                            placeholder="Cant. de clases" title="Cantidad de encuentros de esta edición" />
                          <select className="ctrl" style={{ maxWidth: 150 }} value={e.frecuencia || 'semanal'}
                            onChange={(ev) => { const frecuencia = ev.target.value; updEd(i, { frecuencia, fechaFin: calcularFechaFin(e.fecha, e.cantidadClases, frecuencia) }); }}>
                            <option value="semanal">Semanal</option>
                            <option value="quincenal">Quincenal</option>
                          </select>
                          {e.fecha && e.cantidadClases ? (
                            <span className="muted" style={{ fontSize: 12.5 }}>Termina el {fechaLegible(calcularFechaFin(e.fecha, e.cantidadClases, e.frecuencia))} (calculado)</span>
                          ) : (
                            <span className="muted" style={{ fontSize: 12.5 }}>Completá fecha de inicio y cantidad de clases para calcular la fecha de fin</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <details className="ctor-section ctor-collapse">
          <summary>Campos de la ficha <span className="muted">· {activos.length} activos</span></summary>
          <p className="muted" style={{ fontSize: 12.5, margin: '10px 0' }}>Elegí qué campos van a aparecer en el formulario y en qué orden (arrastrando).</p>
          {GRUPOS.map((g) => (
            <div key={g} style={{ marginBottom: 14 }}>
              <div className="wiz-grupo-lbl">{g}</div>
              {campos.filter((c) => c.grupo === g).map((c) => (
                <label className="wiz-campo-check" key={c.id}>
                  <input type="checkbox" checked={c.activo} onChange={() => toggleCampo(c.id)} />
                  <div><div className="nm">{c.nombre}</div><div className="tp">{c.tipo}</div></div>
                  {c.requerido && <span className="req">Obligatorio</span>}
                </label>
              ))}
            </div>
          ))}
          {campos.some((c) => c.personalizado) && (
            <div style={{ marginBottom: 14 }}>
              <div className="wiz-grupo-lbl">Personalizados</div>
              {campos.filter((c) => c.personalizado).map((c) => (
                <label className="wiz-campo-check" key={c.id}>
                  <input type="checkbox" checked={c.activo} onChange={() => toggleCampo(c.id)} />
                  <div><div className="nm">{c.nombre}</div><div className="tp">{c.tipo}</div></div>
                  <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={(e) => { e.preventDefault(); eliminarCampoPersonalizado(c.id); }} title="Eliminar campo">🗑</button>
                </label>
              ))}
            </div>
          )}
          <div className="wiz-campo-nuevo">
            <input className="ctrl" placeholder="Nombre del campo nuevo" value={campoNuevo.nombre} onChange={(e) => setCampoNuevo({ ...campoNuevo, nombre: e.target.value })} />
            <select className="fsel" value={campoNuevo.tipo} onChange={(e) => setCampoNuevo({ ...campoNuevo, tipo: e.target.value })}>
              <option>Texto</option><option>Texto largo</option><option>Selección única</option><option>Fecha</option>
            </select>
            <button className="btn-sm solid" onClick={agregarCampoPersonalizado} disabled={!campoNuevo.nombre.trim()}>+ Agregar campo</button>
          </div>

          {activos.length > 0 && (
            <>
              <div className="wiz-grupo-lbl" style={{ marginTop: 18 }}>Orden (arrastrá para reordenar)</div>
              <div className="wiz-orden-list">
                {activos.map((c, i) => (
                  <div
                    key={c.id}
                    className="wiz-orden-card"
                    draggable
                    onDragStart={() => { dragIdx.current = i; }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => { if (dragIdx.current !== null) reordenar(dragIdx.current, i); dragIdx.current = null; }}
                  >
                    <span className="wiz-orden-handle">☰</span>
                    <div style={{ flex: 1 }}><div className="nm">{c.nombre}</div><div className="tp">{c.grupo} · {c.tipo}</div></div>
                    <button className="btn-sm" onClick={() => moverCampo(i, -1)} title="Subir" disabled={i === 0}>↑</button>
                    <button className="btn-sm" onClick={() => moverCampo(i, 1)} title="Bajar" disabled={i === activos.length - 1}>↓</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </details>

        <details className="ctor-section ctor-collapse">
          <summary>Configuración</summary>
          <label style={{ ...lbl, marginTop: 12 }}>Destinatarios de las respuestas</label>
          <div className="wiz-dest-list">
            {(cfg.destinatarios || []).length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>Sin destinatarios cargados todavía.</p>}
            {(cfg.destinatarios || []).map((e) => (
              <span className="tagchip" key={e}>{e} <button onClick={() => quitarDest(e)} title="Quitar">✕</button></span>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input className="ctrl" placeholder="correo@equipo.com" value={destNuevo} onChange={(e) => setDestNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregarDest()} />
            <button className="btn-sm solid" onClick={agregarDest} disabled={!destNuevo.trim()}>+ Agregar</button>
          </div>
          <label className="wiz-check-inline" style={{ marginTop: 16 }}>
            <input type="checkbox" checked={!!cfg.notificar} onChange={(e) => updCfg({ notificar: e.target.checked })} />
            ¿Notificar por correo al completar la ficha?
          </label>
          <label style={{ ...lbl, marginTop: 14 }}>Mensaje post-completar</label>
          <textarea className="ctrl" value={cfg.mensajePost || ''} onChange={(e) => updCfg({ mensajePost: e.target.value })} placeholder="¡Listo! Ya tenemos tu ficha, en breve te contactamos." />
          <details className="wiz-avanzado">
            <summary>⚙ Configuración avanzada</summary>
            <label style={lbl}>URL de redirección tras completar (opcional)</label>
            <input className="ctrl" value={cfg.avanzado?.redireccion || ''} onChange={(e) => updCfg({ avanzado: { ...cfg.avanzado, redireccion: e.target.value } })} placeholder="https://..." />
          </details>
        </details>
      </div>

      {/* DERECHA — vista previa en vivo */}
      <div className="ctor-preview-col">
        <div className="wiz-grupo-lbl" style={{ marginBottom: 8 }}>Vista previa</div>
        <div className="wiz-preview-shell">
          <div className="wiz-preview-hero">
            <div className="wiz-preview-eyebrow">FORMACIÓN EN</div>
            <div className="wiz-preview-title">{d.curso}</div>
          </div>
          <div className="wiz-preview-body">
            {d.estado !== 'Publicada' ? (
              <div style={{ textAlign: 'center', padding: '20px 6px', color: 'rgb(var(--textSec))', fontSize: 13.5 }}>
                {d.estado === 'Cerrada' ? '🔒 Inscripciones cerradas' : '📝 Ficha en borrador (no visible al público)'}
              </div>
            ) : (<>
              <div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.titulo || 'Ficha de inscripción'}</div>
              <div style={{ fontSize: 12.5, color: 'rgb(var(--textSec))', marginBottom: 12 }}>{d.bienvenida || '¡Nos alegra tenerte acá!'}</div>
              {eds.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Elegí día de cursada</div>
                  {eds.slice(0, 3).map((e, i) => (
                    <div key={i} className="wiz-preview-ed">
                      <div style={{ fontWeight: 700 }}>{e.label || 'Edición'}</div>
                      {e.horarios && <div style={{ fontSize: 11, color: 'rgb(var(--textMuted))' }}>{e.horarios}</div>}
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>Correo *</div>
              <div className="wiz-preview-input">tunombre@correo.com</div>
              <div className="wiz-preview-cta">Comenzar</div>
            </>)}
          </div>
        </div>
        <a className="btn-sm" style={{ marginTop: 10, display: 'inline-flex' }} href={`${APP_URL}/inscripcion/${d.slug}`} target="_blank" rel="noreferrer">↗ Abrir ficha pública</a>
      </div>
    </div>
  );
}

const lbl = { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'rgb(var(--textSec))' };

function haceTexto(ts, _tick) {
  const seg = Math.round((Date.now() - ts) / 1000);
  if (seg < 10) return 'recién';
  if (seg < 60) return `hace ${seg}s`;
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  return 'hace un rato';
}
