'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { APP_URL } from '../lib/constants';
import { generarHorarios } from '../lib/husos';

// ───────────────────────────────────────────────────────────────────────────
// Biblioteca de campos estándar ILCE, agrupados. Esta es la base con la que
// se arma el "def.campos" (orden + activo/inactivo) de cada ficha la primera
// vez que alguien entra al Paso 3. A partir de ahí, def.campos manda.
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

const PASOS = ['Información', 'Ediciones', 'Campos', 'Orden', 'Configuración', 'Vista previa'];

export default function Constructor({ usuario, initialSlug, showToast, onVolver, volverLabel }) {
  const [defs, setDefs] = useState(null);
  const [sel, setSel] = useState(null); // índice de la ficha elegida, o null = pantalla de elegir formación
  const [paso, setPaso] = useState(1);
  const [dirty, setDirty] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoAt, setGuardadoAt] = useState(null);
  const [tick, setTick] = useState(0);
  const [campoNuevo, setCampoNuevo] = useState({ nombre: '', tipo: 'Texto' });
  const dragIdx = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => { (async () => {
    const res = await fetch('/api/fichas?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const data = await res.json();
    if (data.ok) {
      setDefs(data.defs);
      if (initialSlug) {
        const i = data.defs.findIndex((x) => x.slug === initialSlug);
        if (i >= 0) abrir(i, data.defs);
      }
    }
  })(); /* eslint-disable-next-line */ }, []);

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 15000); return () => clearInterval(t); }, []);
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);

  if (!defs) return <div className="spin" />;

  function abrir(i, arr = defs) {
    const d = arr[i];
    // Si la ficha nunca pasó por el constructor nuevo, arrancamos su biblioteca de campos.
    if (!Array.isArray(d.campos) || d.campos.length === 0) {
      setDefs((old) => old.map((x, j) => j === i ? { ...x, campos: camposIniciales() } : x));
    }
    setSel(i);
    setPaso(Math.min(Math.max(d.wizardPaso || 1, 1), 6));
    setDirty(false);
  }
  function volverAFichas() {
    if (dirty && !confirm('Tenés cambios sin guardar. ¿Volver sin guardar?')) return;
    if (onVolver) onVolver(); else setSel(null);
  }

  const d = sel === null ? null : defs[sel];

  function upd(patch) {
    setDefs((arr) => arr.map((x, i) => i === sel ? { ...x, ...patch } : x));
    setDirty(true);
    // autosave discreto: guarda solo unos instantes después de la última tecla
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => guardar({ silencioso: true }), 1100);
  }

  // ---- ediciones ----
  const eds = d?.ediciones || [];
  function setEds(nuevas) { upd({ ediciones: nuevas }); }
  function addEd() { setEds([...eds, { id: String(Date.now()).slice(-4), label: 'Nueva edición', horarios: '' }]); }
  function updEd(i, patch) { setEds(eds.map((e, j) => j === i ? { ...e, ...patch } : e)); }
  function delEd(i) { setEds(eds.filter((_, j) => j !== i)); }
  function moveEd(i, dir) {
    const j = i + dir; if (j < 0 || j >= eds.length) return;
    const c = eds.slice(); [c[i], c[j]] = [c[j], c[i]]; setEds(c);
  }

  // ---- campos ----
  const campos = d?.campos || [];
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
  const cfg = d?.config || { destinatarios: [], notificar: true, mensajePost: '', avanzado: { redireccion: '' } };
  function updCfg(patch) { upd({ config: { ...cfg, ...patch } }); }
  const [destNuevo, setDestNuevo] = useState('');
  function agregarDest() {
    const e = destNuevo.trim();
    if (!e || cfg.destinatarios.includes(e)) return;
    updCfg({ destinatarios: [...(cfg.destinatarios || []), e] });
    setDestNuevo('');
  }
  function quitarDest(e) { updCfg({ destinatarios: (cfg.destinatarios || []).filter((x) => x !== e) }); }

  async function guardar({ silencioso } = {}) {
    if (!d) return;
    setGuardando(true);
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: d.slug, def: { ...d, wizardPaso: paso } })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setDirty(false); setGuardadoAt(Date.now());
      if (!silencioso) showToast?.('✓ Ficha guardada');
    } catch (e) {
      if (!silencioso) showToast?.('⚠ No pudimos guardar los cambios');
    }
    setGuardando(false);
  }

  async function irAPaso(n) {
    await guardar({ silencioso: true });
    setPaso(n);
  }
  async function continuar() {
    if (paso >= 6) return publicar();
    await irAPaso(paso + 1);
  }
  async function atras() { await irAPaso(Math.max(1, paso - 1)); }
  async function publicar() {
    setGuardando(true);
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: d.slug, def: { ...d, wizardPaso: 6, wizardCompletado: true } })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setDirty(false); setGuardadoAt(Date.now());
      showToast?.('✓ Ficha publicada');
    } catch (e) {
      showToast?.('⚠ No pudimos publicar la ficha');
    }
    setGuardando(false);
  }

  const estadoGuardado = guardando
    ? { txt: 'Guardando…', cls: 'bor' }
    : dirty ? { txt: '● Cambios sin guardar', cls: 'cer' }
      : guardadoAt ? { txt: '✓ Guardado ' + haceTexto(guardadoAt, tick), cls: 'pub' }
        : { txt: '✓ Sin cambios', cls: 'pub' };

  // ─────────────────────────────────────────────────────────────────────
  // Pantalla 1: elegir qué ficha construir/editar (Paso 1 del flujo)
  // ─────────────────────────────────────────────────────────────────────
  if (sel === null) {
    return (
      <div>
        <div className="fhead">
          <div>
            <h2 style={{ margin: '0 0 4px' }}>Constructor de fichas</h2>
            <p className="fhead-sub">Elegí para qué formación querés armar o revisar la ficha de inscripción. El resto se hace en una guía paso a paso, sin necesitar ayuda externa.</p>
          </div>
        </div>
        <div className="wiz-grid-cursos">
          {defs.map((x, i) => {
            const enCurso = x.wizardPaso > 0 && x.wizardPaso < 6 && !x.wizardCompletado;
            return (
              <button key={x.slug} className="wiz-curso-card" onClick={() => abrir(i)}>
                <div className="wiz-curso-nombre">{x.curso}</div>
                {enCurso ? (
                  <div className="wiz-curso-progreso">Vas por el paso {x.wizardPaso} de 6</div>
                ) : x.wizardCompletado ? (
                  <div className="wiz-curso-progreso ok">✓ Ficha completa</div>
                ) : (
                  <div className="wiz-curso-progreso">Sin empezar</div>
                )}
                <span className="wiz-curso-cta">{enCurso ? 'Continuar donde dejaste →' : x.wizardCompletado ? 'Revisar ficha →' : 'Empezar →'}</span>
              </button>
            );
          })}
        </div>
        <p className="muted" style={{ fontSize: 11.5, marginTop: 14 }}>Agregar cursos/formaciones nuevas llega en el próximo lote (cursos dinámicos).</p>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────
  // Wizard de 6 pasos para la ficha elegida
  // ─────────────────────────────────────────────────────────────────────
  return (
    <div className="wiz-wrap">
      <div className="wiz-topbar">
        <button className="btn-sm" onClick={volverAFichas}>{volverLabel || '← Volver a fichas'}</button>
        <span className="muted" style={{ fontSize: 13, fontFamily: 'monospace' }}>{d.curso} · /inscripcion/{d.slug}</span>
        <span className={'fstate ' + estadoGuardado.cls} style={{ marginLeft: 'auto' }}><span className="d" />{estadoGuardado.txt}</span>
      </div>

      <div className="wiz-stepper">
        {PASOS.map((nombre, i) => {
          const n = i + 1;
          const estado = n < paso ? 'done' : n === paso ? 'current' : 'pending';
          return (
            <div key={n} className={'wiz-step ' + estado} onClick={() => irAPaso(n)}>
              <span className="wiz-step-ico">{estado === 'done' ? '✓' : estado === 'current' ? '●' : '○'}</span>
              <span className="wiz-step-lbl">{n} {nombre}</span>
              {i < PASOS.length - 1 && <span className="wiz-step-arrow">→</span>}
            </div>
          );
        })}
      </div>

      <div className="wiz-panel">
        {paso === 1 && (
          <div>
            <h3 style={{ marginTop: 0 }}>Información de la ficha</h3>
            <p className="muted" style={{ fontSize: 13 }}>Nombre, mensaje de bienvenida y estado. Las ediciones y los campos se cargan en los próximos pasos.</p>
            <label style={lbl}>Nombre de la ficha</label>
            <input className="ctrl" value={d.titulo || ''} onChange={(e) => upd({ titulo: e.target.value })} placeholder={`Ficha de inscripción — ${d.curso}`} />
            {!d.titulo && <p className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>Si lo dejás vacío, usamos este nombre por defecto.</p>}
            <label style={{ ...lbl, marginTop: 14 }}>Mensaje de bienvenida</label>
            <textarea className="ctrl" value={d.bienvenida || ''} onChange={(e) => upd({ bienvenida: e.target.value })} placeholder="¡Nos alegra tenerte acá! Completá tu ficha, se guarda sola." />
            <label style={{ ...lbl, marginTop: 14 }}>Estado de la ficha</label>
            <select className="fsel" value={d.estado || 'Publicada'} onChange={(e) => upd({ estado: e.target.value })}>
              <option>Borrador</option><option>Publicada</option><option>Cerrada</option>
            </select>
            <p className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>Solo <b>Publicada</b> deja completar el formulario público. Borrador y Cerrada muestran un aviso.</p>
          </div>
        )}

        {paso === 2 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <h3 style={{ margin: 0 }}>Ediciones y horarios</h3>
              <button className="btn-sm solid" style={{ marginLeft: 'auto' }} onClick={addEd}>+ Agregar edición</button>
            </div>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Cada edición es una tanda de cursada con su fecha y horario. Podés dejarlo sin cargar por ahora.</p>
            {eds.length === 0 && <div className="wiz-empty">Sin ediciones todavía. El formulario público deja continuar igual y el equipo asigna la edición después.</div>}
            <div className="wiz-eds-grid">
              {eds.map((e, i) => (
                <div key={i} className="wiz-ed-card">
                  <div className="wiz-ed-card-top">
                    <input className="ctrl" style={{ fontWeight: 700 }} value={e.label} onChange={(ev) => updEd(i, { label: ev.target.value })} placeholder="Ej: Edición 17 — Lunes 5 de mayo" />
                    <button className="btn-sm" onClick={() => moveEd(i, -1)} title="Subir" disabled={i === 0}>↑</button>
                    <button className="btn-sm" onClick={() => moveEd(i, 1)} title="Bajar" disabled={i === eds.length - 1}>↓</button>
                    <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => delEd(i)} title="Quitar">🗑</button>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
                    <input className="ctrl" type="date" style={{ maxWidth: 160 }} value={e.fecha || ''} onChange={(ev) => updEd(i, { fecha: ev.target.value })} title="Fecha de la clase (hora de Argentina)" />
                    <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={e.horaIni || ''} onChange={(ev) => updEd(i, { horaIni: ev.target.value })} title="Desde (hora AR)" />
                    <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={e.horaFin || ''} onChange={(ev) => updEd(i, { horaFin: ev.target.value })} title="Hasta (hora AR)" />
                    <button className="btn-sm solid" onClick={() => updEd(i, { horarios: generarHorarios(e.fecha, e.horaIni, e.horaFin) })} disabled={!e.fecha || !e.horaIni || !e.horaFin} title="Traduce la hora de Argentina a los demás países">⚙ Calcular husos</button>
                  </div>
                  <input className="ctrl" style={{ marginTop: 8 }} value={e.horarios || ''} onChange={(ev) => updEd(i, { horarios: ev.target.value })} placeholder="Horarios por país (se completan al calcular, o escribilos a mano)" />
                </div>
              ))}
            </div>
          </div>
        )}

        {paso === 3 && (
          <div>
            <h3 style={{ marginTop: 0 }}>Campos de la ficha</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Elegí qué campos van a aparecer en el formulario. El orden se define en el próximo paso.</p>
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
          </div>
        )}

        {paso === 4 && (
          <div>
            <h3 style={{ marginTop: 0 }}>Orden de los campos</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 10 }}>Arrastrá las tarjetas para definir en qué orden aparecen en el formulario. Solo se ordenan los campos activos.</p>
            {activos.length === 0 && <div className="wiz-empty">No activaste ningún campo todavía. Volvé al paso anterior.</div>}
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
          </div>
        )}

        {paso === 5 && (
          <div>
            <h3 style={{ marginTop: 0 }}>Configuración</h3>
            <label style={lbl}>Destinatarios de las respuestas</label>
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
          </div>
        )}

        {paso === 6 && (
          <div>
            <h3 style={{ marginTop: 0 }}>Vista previa</h3>
            <p className="muted" style={{ fontSize: 13, marginBottom: 14 }}>Así se ve hoy la ficha pública. Revisá todo y publicá cuando esté lista.</p>
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
                  {activos.slice(0, 4).map((c) => (
                    <div key={c.id}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{c.nombre}{c.requerido ? ' *' : ''}</div>
                      <div className="wiz-preview-input">{c.tipo}</div>
                    </div>
                  ))}
                  {activos.length > 4 && <p className="muted" style={{ fontSize: 11.5, margin: '4px 0 12px' }}>+ {activos.length - 4} campo{activos.length - 4 === 1 ? '' : 's'} más…</p>}
                  <div className="wiz-preview-cta">Comenzar</div>
                </>)}
              </div>
            </div>
            <a className="btn-sm" style={{ marginTop: 10, display: 'inline-flex' }} href={`${APP_URL}/inscripcion/${d.slug}`} target="_blank" rel="noreferrer">↗ Abrir ficha pública</a>
          </div>
        )}
      </div>

      <div className="wiz-nav-btns">
        <button className="btn-sm" onClick={atras} disabled={paso === 1}>← Atrás</button>
        <span style={{ flex: 1 }} />
        {paso < 6
          ? <button className="btn btn-primary" onClick={continuar}>Continuar →</button>
          : <button className="btn btn-primary" onClick={publicar} disabled={guardando}>Publicar ficha</button>}
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
