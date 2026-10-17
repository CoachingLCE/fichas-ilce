'use client';
import { useEffect, useRef, useState } from 'react';
import { APP_URL, cantidadClasesFija, esAsincronica, calcularFechaFinEdicion, colorCurso } from '../lib/constants';
import { generarHorarios, horariosDeEdicion } from '../lib/husos';
import { useDialogos } from './Dialogos';
import { letra } from '../lib/escalaLetra';

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

// Pestañas del editor (siempre visibles; la activa muestra su contenido).
const SECCIONES = [
  { id: 'info', label: 'Información' },
  { id: 'ediciones', label: 'Ediciones' },
  { id: 'campos', label: 'Campos' },
  { id: 'config', label: 'Configuración' }
];

// Estado de publicación: mismos 3 valores y mismos colores que ya usa la lista de Fichas
// (fstate pub/bor/cer), ahora como selector visual en vez de un <select> de toda la vida.
const ESTADOS_FICHA = [
  { v: 'Borrador', cls: 'bor', dot: '🟡', explicacion: 'No es visible públicamente.' },
  { v: 'Publicada', cls: 'pub', dot: '🟢', explicacion: 'Permite completar el formulario.' },
  { v: 'Cerrada', cls: 'cer', dot: '🔴', explicacion: 'Sigue visible, pero no permite nuevas inscripciones.' }
];

function camposIniciales() {
  return CAMPOS_LIB.map((c) => ({ ...c, activo: true, personalizado: false }));
}

// Estado de una edición EN CURSO/PRÓXIMA/FINALIZADA — se calcula a partir de la fecha de
// inicio y la fecha de fin (que ya se calculaba), no es un dato nuevo que haya que cargar:
// es solo una lectura del calendario contra hoy, para ubicarse de un vistazo en la tarjeta.
function estadoEdicion(e, asincronica) {
  if (asincronica || !e.fecha) return null;
  const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(e.fecha + 'T00:00:00');
  if (isNaN(inicio)) return null;
  if (inicio > hoy) return { txt: 'Próxima', cls: 'prog', dot: '' };
  if (e.cantidadClases) {
    const finIso = calcularFechaFinEdicion(e.fecha, e.cantidadClases);
    const fin = finIso ? new Date(finIso + 'T00:00:00') : null;
    if (fin && fin < hoy) return { txt: 'Finalizada', cls: 'arch', dot: '⚪' };
  }
  return { txt: 'En curso', cls: 'pub', dot: '🟢' };
}

function relativo(ts, _tick) {
  if (!ts) return '';
  const seg = Math.round((Date.now() - ts) / 1000);
  if (seg < 10) return 'recién';
  if (seg < 60) return `hace ${seg}s`;
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  const horas = Math.round(min / 60);
  if (horas < 24) return `hace ${horas} h`;
  return 'hace un rato';
}

export default function Constructor({ usuario, initialSlug, showToast, onVolver, volverLabel }) {
  const { confirmar, avisar } = useDialogos();
  const [defs, setDefs] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [sel, setSel] = useState(null); // índice de la ficha activa en el editor
  const [dirty, setDirty] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardadoAt, setGuardadoAt] = useState(null);
  const [errorGuardado, setErrorGuardado] = useState('');
  const [tick, setTick] = useState(0);
  const [edAbierta, setEdAbierta] = useState(null); // id de la edición expandida
  const [edMenu, setEdMenu] = useState(null);
  const [campoNuevo, setCampoNuevo] = useState({ nombre: '', tipo: 'Texto' });
  const [agregandoCampo, setAgregandoCampo] = useState(false);
  const [destNuevo, setDestNuevo] = useState('');
  const [tab, setTab] = useState('info'); // pestaña activa del editor: info | ediciones | campos | config
  const [vistaPreview, setVistaPreview] = useState('desktop'); // 'desktop' | 'mobile'
  const [buscarFicha, setBuscarFicha] = useState('');
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

  // Autocompleta la cantidad de clases fija por curso. Va ACÁ (antes de cualquier return
  // temprano) y con guardas internas para no romper el orden de hooks (React #310).
  useEffect(() => {
    if (!defs) return;
    const idx = (sel != null && defs[sel]) ? sel : 0;
    const dd = defs[idx];
    if (!dd) return;
    const edsLocal = dd.ediciones || [];
    const fija = cantidadClasesFija(dd.curso);
    if (!fija || edsLocal.length === 0 || edsLocal.every((e) => e.cantidadClases)) return;
    setDefs((arr) => arr.map((x, i) => i === idx
      ? { ...x, ediciones: edsLocal.map((e) => e.cantidadClases ? e : { ...e, cantidadClases: String(fija), fechaFin: calcularFechaFinEdicion(e.fecha, fija) }) }
      : x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defs, sel]);

  if (errorCarga) {
    return (
      <div className="empty" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <p style={{ fontSize: letra(15), fontWeight: 500, marginBottom: 6 }}> No se pudo abrir el Constructor</p>
        <p className="muted" style={{ marginBottom: 16 }}>{errorCarga}</p>
        <button className="btn-sm solid" onClick={() => { setErrorCarga(''); setDefs(null); window.location.reload(); }}>Reintentar</button>
        {onVolver && <button className="btn-sm" style={{ marginLeft: 8 }} onClick={onVolver}> Volver</button>}
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
    setSel(i); setDirty(false); setEdAbierta(null); setErrorGuardado('');
  }
  async function cambiarFicha(i) {
    if (dirty && !(await confirmar({ titulo: 'Cambios sin guardar', textoConfirmar: 'Cambiar sin guardar', peligro: true, mensaje: 'Tenés cambios sin guardar. ¿Cambiar de ficha sin guardar?'}))) return;
    seleccionar(i);
  }
  async function volver() {
    if (dirty && !(await confirmar({ titulo: 'Cambios sin guardar', textoConfirmar: 'Volver sin guardar', peligro: true, mensaje: 'Tenés cambios sin guardar. ¿Volver sin guardar?'}))) return;
    if (onVolver) onVolver();
  }

  const d = defs[sel] || defs[0];
  if (!d) return <div className="spin" />;

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
    const fija = cantidadClasesFija(d.curso);
    setEds([...eds, { id, label: `Edición ${eds.length + 1}`, horarios: '', ...(fija ? { cantidadClases: String(fija) } : {}) }]);
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
    setAgregandoCampo(false);
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
      setDirty(false); setGuardadoAt(Date.now()); setErrorGuardado('');
      // Reflejo optimista de "Última modificación": el campo persistido (d.actualizado, que
      // viene de la columna "Actualizado" de la Sheet) recién se actualizaría en el próximo
      // GET — esto evita mostrar una fecha vieja hasta tanto se recargue la página.
      setDefs((arr) => arr.map((x, i) => i === sel ? { ...x, actualizado: new Date().toISOString() } : x));
      if (!silencioso) showToast?.(' Cambios guardados');
    } catch (e) {
      // Antes el toast era siempre genérico, sin importar la causa real (timeout de
      // Sheets, cuota, JSON cortado, etc.) — mostrar el motivo ayuda a distinguir un
      // problema puntual/transitorio de uno que se repite siempre igual. Además, ahora
      // queda un estado persistente (no solo el toast, que desaparece solo) para que el
      // 🔴 "Error al guardar" + "Reintentar" sigan visibles hasta que se resuelva.
      setErrorGuardado(e.message || 'Error al guardar');
      showToast?.(' No pudimos guardar los cambios' + (e.message ? ': ' + e.message : ''));
    }
    setGuardando(false);
  }

  // Estados del guardado: sin cambios · cambios pendientes · guardando · guardado · error (cls = clase visual de .ctr-save).
  const estadoGuardado = guardando
    ? { txt: 'Guardando…', cls: 'guard' }
    : errorGuardado ? { txt: 'Error al guardar', cls: 'err' }
      : dirty ? { txt: 'Cambios pendientes', cls: 'pend' }
        : guardadoAt ? { txt: 'Guardado ' + relativo(guardadoAt, tick), cls: 'ok' }
          : { txt: 'Sin cambios', cls: 'sin' };

  const ultimaModTexto = (() => {
    const ts = guardadoAt || (d.actualizado ? new Date(d.actualizado).getTime() : null);
    return ts ? relativo(ts, tick) : '';
  })();

  // Para cursos largos (ej: 48 clases semanales) el inicio y el fin pueden caer en años
  // distintos — sin el año, una fecha de fin de marzo podía leerse como "antes" que un
  // inicio de mayo. Se agrega el año SOLO cuando no es el actual, para no alargar las
  // fechas de todos los días con un año que ya se sobreentiende.
  const fechaLegible = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt)) return iso;
    const opciones = { weekday: 'long', day: 'numeric', month: 'long' };
    if (dt.getFullYear() !== new Date().getFullYear()) opciones.year = 'numeric';
    return dt.toLocaleDateString('es-AR', opciones);
  };
  // calcularFechaFinEdicion ahora vive en lib/constants.js (para que el modal de "Nueva
  // edición" rápida use exactamente la misma cuenta) — acá queda solo el alias corto.
  const calcularFechaFin = calcularFechaFinEdicion;

  const estadoActual = ESTADOS_FICHA.find((x) => x.v === (d.estado || 'Publicada')) || ESTADOS_FICHA[1];
  const defsFiltrados = buscarFicha.trim()
    ? defs.map((x, i) => ({ x, i })).filter(({ x }) => x.curso.toLowerCase().includes(buscarFicha.trim().toLowerCase()))
    : defs.map((x, i) => ({ x, i }));


  // ---- lecturas visuales (no cambian ningún dato) ----
  const nombreDia = (iso) => {
    if (!iso) return '';
    const dt = new Date(iso + 'T00:00:00');
    if (isNaN(dt)) return '';
    const t = dt.toLocaleDateString('es-AR', { weekday: 'long' });
    return t.charAt(0).toUpperCase() + t.slice(1);
  };
  const horarioAR = (e) => (e.horaIni || e.horaFin) ? `${e.horaIni || '—'}–${e.horaFin || '—'} (hora AR)` : '';
  // Qué le falta a una edición para quedar completa (solo avisa: no cambia ni completa nada solo).
  const faltantesEd = (e) => {
    if (esAsincronica(e.label)) return [];
    const f = [];
    if (!e.fecha) f.push('fecha de inicio');
    if (!(e.horaIni && e.horaFin) && !e.horarios) f.push('horario');
    if (!e.cantidadClases && !cantidadClasesFija(d.curso)) f.push('cantidad de clases');
    return f;
  };
  const edsIncompletas = eds.filter((e) => faltantesEd(e).length > 0).length;
  const nDest = (cfg.destinatarios || []).length;
  const publicada = (d.estado || 'Publicada') === 'Publicada';
  const TABS = [
    { id: 'info', label: 'Información', n: null },
    { id: 'ediciones', label: 'Ediciones', n: eds.length, alerta: edsIncompletas > 0 },
    { id: 'campos', label: 'Campos', n: activos.length },
    { id: 'config', label: 'Configuración', n: null }
  ];
  function teclasTabs(ev) {
    const i = TABS.findIndex((t) => t.id === tab);
    let j = null;
    if (ev.key === 'ArrowRight') j = (i + 1) % TABS.length;
    else if (ev.key === 'ArrowLeft') j = (i - 1 + TABS.length) % TABS.length;
    if (j === null) return;
    ev.preventDefault(); setTab(TABS[j].id);
    setTimeout(() => document.getElementById('ctr-tab-' + TABS[j].id)?.focus(), 0);
  }

  // Ediciones que ve la persona en la vista previa: lo que hay cargado, tal cual (nada inventado).
  const edsPrevia = eds.slice(0, 4);
  const camposPrevia = activos.slice(0, 6);

  return (
    <div className="ctor3 ctr-root" onClick={() => edMenu !== null && setEdMenu(null)}>
      {/* IZQUIERDA — navegación del constructor + lista de fichas */}
      <aside className="ctr-list" aria-label="Fichas de inscripción">
        <div className="ctr-list-nav">
          <button className="ctr-volver" onClick={volver}>{volverLabel || ' Volver'}</button>
        </div>
        <div className="ctr-list-card">
          <div className="ctr-list-title">Fichas <span className="ctr-list-count">{defs.length}</span></div>
          {defs.length > 5 && (
            <input className="ctrl ctr-list-buscar" placeholder="Buscar ficha…" aria-label="Buscar ficha" value={buscarFicha} onChange={(e) => setBuscarFicha(e.target.value)} />
          )}
          <div className="ctr-list-items">
            {defsFiltrados.map(({ x, i }) => {
              const em = ESTADOS_FICHA.find((s) => s.v === (x.estado || 'Publicada')) || ESTADOS_FICHA[1];
              const activa = i === sel;
              return (
                <button key={x.slug} className={'ctr-list-item' + (activa ? ' on' : '')} onClick={() => cambiarFicha(i)} aria-current={activa ? 'true' : undefined}>
                  <span className={'ctor-list-dot ' + em.cls} />
                  <span className="ctr-list-txt">
                    {/* Mismo color por curso (colorCurso) que en el resto de la app. */}
                    <span className="ctr-list-nm" style={{ color: colorCurso(x.curso) }}>{x.curso}</span>
                    <span className="ctr-list-st">{em.v}</span>
                  </span>
                  {activa && dirty && <span className="ctr-list-dirty" title="Cambios sin guardar">●<span className="sr-only"> Cambios sin guardar</span></span>}
                </button>
              );
            })}
          </div>
          {defsFiltrados.length === 0 && <p className="vacio vacio-chico">Sin resultados.</p>}
          <p className="ctr-list-nota">Por ahora se editan las formaciones existentes.</p>
        </div>
      </aside>

      {/* CENTRO — editor */}
      <div className="ctor-editor ctr-editor">
        <header className="ctr-head">
          <div className="ctr-head-top">
            <div className="ctr-head-main">
              <div className="ctr-head-eyebrow">Constructor · Ficha de inscripción</div>
              <h2 className="ctr-head-title">{d.curso}</h2>
              <div className="ctr-head-sub">
                <span className={'fstate ' + estadoActual.cls}><span className="d" />{estadoActual.v}</span>
                {ultimaModTexto && <span className="ctr-head-mod">Última modificación {ultimaModTexto}</span>}
              </div>
            </div>
            <div className="ctr-head-actions">
              <span className={'ctr-save ' + estadoGuardado.cls} role="status" aria-live="polite"><span className="d" />{estadoGuardado.txt}</span>
              {errorGuardado && <button className="btn-sm" onClick={() => guardar()}>Reintentar</button>}
              <a className="btn-sm" href={`${APP_URL}/inscripcion/${d.slug}`} target="_blank" rel="noreferrer">Ver ficha pública ↗</a>
              <button className="btn-sm solid" onClick={() => guardar()} disabled={guardando || !dirty}>Guardar</button>
            </div>
          </div>
          {errorGuardado && <div className="ctr-err" role="alert"> No se pudieron guardar los cambios: {errorGuardado}. Tus cambios siguen acá; probá de nuevo con “Reintentar”.</div>}
        </header>

        <div className="ctr-tabs" role="tablist" aria-label="Secciones de la ficha" onKeyDown={teclasTabs}>
          {TABS.map((t) => (
            <button key={t.id} id={'ctr-tab-' + t.id} role="tab" aria-selected={tab === t.id} aria-controls={'ctr-panel-' + t.id} tabIndex={tab === t.id ? 0 : -1}
              className={'ctr-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
              {t.label}
              {t.n !== null && <span className="ctr-tab-n">{t.n}</span>}
              {t.alerta && <span className="ctr-tab-alerta" title="Hay ediciones con datos sin completar">!</span>}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <section className="ctr-panel" role="tabpanel" id="ctr-panel-info" aria-labelledby="ctr-tab-info">
            <h3 className="ctr-panel-title">Información de la ficha</h3>
            <p className="ctr-panel-sub">Lo primero que ve la persona al abrir la ficha pública.</p>
            <div className="ctr-campo">
              <label className="ctr-lbl" htmlFor="ctr-titulo">Título</label>
              <input id="ctr-titulo" className="ctrl" value={d.titulo || ''} onChange={(e) => upd({ titulo: e.target.value })} placeholder={`Ficha de inscripción — ${d.curso}`} />
            </div>
            <div className="ctr-campo">
              <label className="ctr-lbl" htmlFor="ctr-bienvenida">Mensaje de bienvenida</label>
              <textarea id="ctr-bienvenida" className="ctrl ctr-textarea" rows={6} value={d.bienvenida || ''} onChange={(e) => upd({ bienvenida: e.target.value })} placeholder="¡Nos alegra tenerte acá! Completá tu ficha, se guarda sola." />
            </div>
            <div className="ctr-campo">
              <div className="ctr-lbl" id="ctr-estado-lbl">Estado de publicación</div>
              <div className="ctor-estado-sel ctr-estado" role="group" aria-labelledby="ctr-estado-lbl">
                {ESTADOS_FICHA.map((op) => {
                  const on = estadoActual.v === op.v;
                  return (
                    <button key={op.v} type="button" aria-pressed={on} className={'ctor-estado-opt ctr-estado-opt ' + op.cls + (on ? ' on' : '')} onClick={() => upd({ estado: op.v })}>
                      <span className="d" />{op.v}{on && <span className="ctr-estado-check" aria-hidden="true"></span>}
                    </button>
                  );
                })}
              </div>
              <p className={'ctr-estado-exp ' + estadoActual.cls}><strong>{estadoActual.v}:</strong> {estadoActual.explicacion}</p>
            </div>
          </section>
        )}

        {tab === 'ediciones' && (
          <section className="ctr-panel" role="tabpanel" id="ctr-panel-ediciones" aria-labelledby="ctr-tab-ediciones">
            <div className="ctr-panel-head">
              <div>
                <h3 className="ctr-panel-title">Ediciones</h3>
                <p className="ctr-panel-sub">{eds.length === 0 ? 'Las fechas de cursada que la persona puede elegir.' : `${eds.length} edición${eds.length === 1 ? '' : 'es'} cargada${eds.length === 1 ? '' : 's'}${edsIncompletas ? ` · ${edsIncompletas} con datos por completar` : ''}`}</p>
              </div>
              <button className="btn-sm solid" onClick={addEd}>+ Agregar edición</button>
            </div>
            {eds.length === 0 ? (
              <div className="ctr-vacio">
                <strong>Todavía no hay ediciones.</strong>
                <span>Agregá una edición para que las personas puedan elegir una fecha de cursada.</span>
                <button className="btn-sm solid" onClick={addEd}>+ Agregar edición</button>
              </div>
            ) : (
              <div className="ctr-ed-list">
                {eds.map((e, i) => {
                  const abierta = edAbierta === e.id;
                  const asincronica = esAsincronica(e.label);
                  const fija = cantidadClasesFija(d.curso);
                  const est = estadoEdicion(e, asincronica);
                  const falt = faltantesEd(e);
                  const dia = nombreDia(e.fecha);
                  const hor = horarioAR(e);
                  const nClases = e.cantidadClases || fija;
                  return (
                    <div className={'ctr-ed' + (abierta ? ' abierta' : '') + (falt.length ? ' incompleta' : '')} key={e.id || i}>
                      <div className="ctr-ed-top">
                        <span className="ctr-ed-num" aria-hidden="true">{i + 1}</span>
                        <div className="ctr-ed-id">
                          <span className="ctr-ed-nombre">{e.label || `Edición ${i + 1}`}</span>
                          {est && <span className={'fstate ' + est.cls}><span className="d" />{est.txt}</span>}
                        </div>
                        <div className="ctr-ed-acc">
                          <button className={'btn-sm' + (abierta ? ' ctr-activo' : '')} aria-expanded={abierta} onClick={() => setEdAbierta(abierta ? null : e.id)}>{abierta ? 'Cerrar' : 'Editar'}</button>
                          <div className="ctor-ed-menu-wrap">
                            <button className="btn-sm fmenu-btn" aria-label="Más acciones de la edición" aria-haspopup="menu" aria-expanded={edMenu === i} onClick={(ev) => { ev.stopPropagation(); setEdMenu(edMenu === i ? null : i); }}>⋮</button>
                            {edMenu === i && (
                              <div className="fmenu-pop ctr-ed-pop" role="menu" onClick={(ev) => ev.stopPropagation()}>
                                <button role="menuitem" onClick={() => moveEd(i, -1)} disabled={i === 0}>↑ Subir</button>
                                <button role="menuitem" onClick={() => moveEd(i, 1)} disabled={i === eds.length - 1}>↓ Bajar</button>
                                <div className="sep" />
                                <button role="menuitem" className="danger" onClick={() => delEd(i)}> Eliminar</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      {asincronica ? (
                        <div className="ctr-ed-asinc">🔵 Cursada asincrónica · sin día ni horario fijo</div>
                      ) : (
                        <dl className="ctr-ed-datos">
                          <div><dt>Inicio</dt><dd>{e.fecha ? fechaLegible(e.fecha) : <span className="ctr-falta">Sin cargar</span>}</dd></div>
                          <div><dt>Fin</dt><dd>{e.fecha && e.cantidadClases ? fechaLegible(calcularFechaFin(e.fecha, e.cantidadClases)) : <span className="ctr-falta">Sin calcular</span>}</dd></div>
                          <div><dt>Días y horarios</dt><dd>{dia || hor ? <>{dia}{dia && hor ? ' · ' : ''}{hor}</> : <span className="ctr-falta">Sin cargar</span>}</dd></div>
                          <div><dt>Clases</dt><dd>{nClases ? `${nClases} clases` : <span className="ctr-falta">Sin cargar</span>}</dd></div>
                        </dl>
                      )}
                      {e.docente && <div className="ctr-ed-doc"> Docente: {e.docente}</div>}
                      {falt.length > 0 && (
                        <div className="ctr-ed-aviso" role="note">
                          <span> Falta completar: {falt.join(', ')}.</span>
                          {!abierta && <button className="linklike" onClick={() => setEdAbierta(e.id)}>Completar ahora</button>}
                        </div>
                      )}
                      {abierta && (
                        <div className="ctr-ed-body">
                          <div className="ctr-grid2">
                            <div className="ctr-campo">
                              <label className="ctr-lbl" htmlFor={'ed-nom-' + i}>Nombre de la edición</label>
                              <input id={'ed-nom-' + i} className="ctrl" value={e.label} onChange={(ev) => updEd(i, { label: ev.target.value })} placeholder="Ej: Edición 17 — Lunes 5 de mayo (o 'Cursada Asincrónica')" />
                            </div>
                            <div className="ctr-campo">
                              <label className="ctr-lbl" htmlFor={'ed-doc-' + i}>Docente</label>
                              <input id={'ed-doc-' + i} className="ctrl" value={e.docente || ''} onChange={(ev) => updEd(i, { docente: ev.target.value })} placeholder="Docente (texto libre)" />
                            </div>
                          </div>
                          {asincronica ? (
                            <p className="ctr-nota">Es una cursada asincrónica: no tiene día ni horario fijo, así que esos campos no aplican acá.</p>
                          ) : (
                            <>
                              <div className="ctr-grid3">
                                <div className="ctr-campo">
                                  <label className="ctr-lbl" htmlFor={'ed-fec-' + i}>Primera clase</label>
                                  <input id={'ed-fec-' + i} className="ctrl" type="date" value={e.fecha || ''} onChange={(ev) => updEd(i, { fecha: ev.target.value })} title="Fecha de la primera clase (hora de Argentina)" />
                                </div>
                                <div className="ctr-campo">
                                  <label className="ctr-lbl" htmlFor={'ed-hi-' + i}>Desde (hora AR)</label>
                                  <input id={'ed-hi-' + i} className="ctrl" type="time" value={e.horaIni || ''} onChange={(ev) => updEd(i, { horaIni: ev.target.value })} title="Desde (hora AR)" />
                                </div>
                                <div className="ctr-campo">
                                  <label className="ctr-lbl" htmlFor={'ed-hf-' + i}>Hasta (hora AR)</label>
                                  <input id={'ed-hf-' + i} className="ctrl" type="time" value={e.horaFin || ''} onChange={(ev) => updEd(i, { horaFin: ev.target.value })} title="Hasta (hora AR)" />
                                </div>
                              </div>
                              <div className="ctr-grid2">
                                <div className="ctr-campo">
                                  <label className="ctr-lbl" htmlFor={'ed-cl-' + i}>Cantidad de clases</label>
                                  {fija ? (
                                    <input id={'ed-cl-' + i} className="ctrl" disabled value={`${e.cantidadClases || fija} clases (fijo para este curso)`} title="Este curso siempre tiene la misma cantidad de clases — se completa solo." />
                                  ) : (
                                    <input id={'ed-cl-' + i} className="ctrl" type="number" min="1" value={e.cantidadClases || ''}
                                      onChange={(ev) => { const cantidadClases = ev.target.value; updEd(i, { cantidadClases, fechaFin: calcularFechaFin(e.fecha, cantidadClases) }); }}
                                      placeholder="Cant. de clases" title="Cantidad de encuentros de esta edición" />
                                  )}
                                </div>
                                {e.fecha && e.cantidadClases && (
                                  <div className="ctr-campo">
                                    <div className="ctr-lbl">Fin calculado</div>
                                    <div className="ctor-fin-destacado ctr-fin"> Finaliza el {fechaLegible(calcularFechaFin(e.fecha, e.cantidadClases))}</div>
                                  </div>
                                )}
                              </div>
                              <div className="ctr-campo">
                                <div className="ctr-lbl-fila">
                                  <label className="ctr-lbl" htmlFor={'ed-hor-' + i}>Horarios internacionales</label>
                                  <button className="btn-sm solid" onClick={() => updEd(i, { horarios: generarHorarios(e.fecha, e.horaIni, e.horaFin) })} disabled={!e.fecha || !e.horaIni || !e.horaFin}> Calcular horarios</button>
                                </div>
                                <input id={'ed-hor-' + i} className="ctrl" value={e.horarios || ''} onChange={(ev) => updEd(i, { horarios: ev.target.value })} placeholder="Horarios por país (se completan al calcular, o escribilos a mano)" />
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'campos' && (
          <section className="ctr-panel" role="tabpanel" id="ctr-panel-campos" aria-labelledby="ctr-tab-campos">
            <div className="ctr-panel-head">
              <div>
                <h3 className="ctr-panel-title">Campos del formulario</h3>
                <p className="ctr-panel-sub">{activos.length} activos · {campos.filter((c) => c.personalizado).length} personalizados. Elegí qué campos van a aparecer en el formulario y en qué orden.</p>
              </div>
              {!agregandoCampo && <button className="btn-sm" onClick={() => setAgregandoCampo(true)}>+ Nuevo campo personalizado</button>}
            </div>

            {agregandoCampo && (
              <div className="ctr-nuevo-campo">
                <div className="ctr-grid2">
                  <div className="ctr-campo">
                    <label className="ctr-lbl" htmlFor="ctr-nc-nombre">Nombre del campo</label>
                    <input id="ctr-nc-nombre" className="ctrl" placeholder="Ej: Empresa donde trabajás" value={campoNuevo.nombre} onChange={(e) => setCampoNuevo({ ...campoNuevo, nombre: e.target.value })} autoFocus />
                  </div>
                  <div className="ctr-campo">
                    <label className="ctr-lbl" htmlFor="ctr-nc-tipo">Tipo de campo</label>
                    <select id="ctr-nc-tipo" className="fsel ctr-select" value={campoNuevo.tipo} onChange={(e) => setCampoNuevo({ ...campoNuevo, tipo: e.target.value })}>
                      <option>Texto</option><option>Texto largo</option><option>Selección única</option><option>Fecha</option>
                    </select>
                  </div>
                </div>
                <div className="ctr-fila-btns">
                  <button className="btn-sm solid" onClick={agregarCampoPersonalizado} disabled={!campoNuevo.nombre.trim()}>Agregar campo</button>
                  <button className="btn-sm" onClick={() => { setAgregandoCampo(false); setCampoNuevo({ nombre: '', tipo: 'Texto' }); }}>Cancelar</button>
                </div>
              </div>
            )}

            {GRUPOS.map((g) => (
              <div className="ctr-bloque" key={g}>
                <div className="ctr-bloque-t">{g}</div>
                {campos.filter((c) => c.grupo === g).map((c) => (
                  <label className={'ctr-check' + (c.activo ? ' on' : '')} key={c.id}>
                    <input type="checkbox" checked={c.activo} onChange={() => toggleCampo(c.id)} />
                    <div className="ctr-check-txt"><div className="nm">{c.nombre}</div><div className="tp">{c.tipo}</div></div>
                    {c.requerido && <span className="req">Obligatorio</span>}
                  </label>
                ))}
              </div>
            ))}
            {campos.some((c) => c.personalizado) && (
              <div className="ctr-bloque">
                <div className="ctr-bloque-t">Personalizados</div>
                {campos.filter((c) => c.personalizado).map((c) => (
                  <label className={'ctr-check' + (c.activo ? ' on' : '')} key={c.id}>
                    <input type="checkbox" checked={c.activo} onChange={() => toggleCampo(c.id)} />
                    <div className="ctr-check-txt"><div className="nm">{c.nombre}</div><div className="tp">{c.tipo}</div></div>
                    <button className="btn-sm peligro" onClick={(e) => { e.preventDefault(); eliminarCampoPersonalizado(c.id); }} title="Eliminar campo" aria-label={'Eliminar campo ' + c.nombre}></button>
                  </label>
                ))}
              </div>
            )}

            {activos.length > 0 && (
              <div className="ctr-bloque">
                <div className="ctr-bloque-t">Orden en la ficha</div>
                <p className="ctr-nota">Arrastrá los campos (o usá las flechas) para cambiar el orden en que aparecerán en la ficha.</p>
                <div className="wiz-orden-list ctr-orden">
                  {activos.map((c, i) => (
                    <div
                      key={c.id}
                      className="wiz-orden-card ctr-orden-card"
                      draggable
                      onDragStart={() => { dragIdx.current = i; }}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => { if (dragIdx.current !== null) reordenar(dragIdx.current, i); dragIdx.current = null; }}
                    >
                      <span className="ctr-orden-n">{i + 1}</span>
                      <span className="wiz-orden-handle"></span>
                      <div style={{ flex: 1, minWidth: 0 }}><div className="nm">{c.nombre}</div><div className="tp">{c.grupo} · {c.tipo}</div></div>
                      <button className="btn-sm" onClick={() => moverCampo(i, -1)} title="Subir" aria-label={'Subir ' + c.nombre} disabled={i === 0}>↑</button>
                      <button className="btn-sm" onClick={() => moverCampo(i, 1)} title="Bajar" aria-label={'Bajar ' + c.nombre} disabled={i === activos.length - 1}>↓</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {tab === 'config' && (
          <section className="ctr-panel" role="tabpanel" id="ctr-panel-config" aria-labelledby="ctr-tab-config">
            <h3 className="ctr-panel-title">Configuración</h3>
            <p className="ctr-panel-sub">
              {nDest} destinatario{nDest === 1 ? '' : 's'} · Notificaciones {cfg.notificar ? 'activadas' : 'desactivadas'} · Mensaje de confirmación {cfg.mensajePost ? 'configurado' : 'sin configurar'}
            </p>

            <div className="ctr-bloque">
              <div className="ctr-bloque-t">Notificaciones</div>
              <label className="ctr-lbl" htmlFor="ctr-dest">Destinatarios de las respuestas</label>
              <div className="wiz-dest-list ctr-dest">
                {nDest === 0 && <p className="ctr-nota" style={{ margin: 0 }}>Sin destinatarios cargados todavía.</p>}
                {(cfg.destinatarios || []).map((e) => (
                  <span className="tagchip" key={e}>{e} <button onClick={() => quitarDest(e)} title="Quitar" aria-label={'Quitar ' + e}></button></span>
                ))}
              </div>
              <div className="ctr-fila-input">
                <input id="ctr-dest" className="ctrl" placeholder="correo@equipo.com" value={destNuevo} onChange={(e) => setDestNuevo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregarDest()} />
                <button className="btn-sm solid" onClick={agregarDest} disabled={!destNuevo.trim()}>+ Agregar</button>
              </div>
              <label className="ctr-check ctr-check-simple">
                <input type="checkbox" checked={!!cfg.notificar} onChange={(e) => updCfg({ notificar: e.target.checked })} />
                <div className="ctr-check-txt"><div className="nm">¿Notificar por correo al completar la ficha?</div></div>
              </label>
            </div>

            <div className="ctr-bloque">
              <div className="ctr-bloque-t">Confirmación</div>
              <label className="ctr-lbl" htmlFor="ctr-post">Mensaje que verá la persona después de completar</label>
              <textarea id="ctr-post" className="ctrl ctr-textarea" rows={4} value={cfg.mensajePost || ''} onChange={(e) => updCfg({ mensajePost: e.target.value })} placeholder="¡Listo! Ya tenemos tu ficha, en breve te contactamos." />
            </div>

            <details className="wiz-avanzado ctr-avanzado">
              <summary> Avanzado</summary>
              <label className="ctr-lbl" htmlFor="ctr-redir">URL de redirección tras completar (opcional)</label>
              <input id="ctr-redir" className="ctrl" value={cfg.avanzado?.redireccion || ''} onChange={(e) => updCfg({ avanzado: { ...cfg.avanzado, redireccion: e.target.value } })} placeholder="https://..." />
            </details>
          </section>
        )}
      </div>

      {/* DERECHA — vista previa independiente */}
      <aside className="ctor-preview-col ctr-prev" aria-label="Vista previa de la ficha">
        <div className="ctr-prev-head">
          <div>
            <div className="ctr-prev-title">Vista previa</div>
            <span className="ctr-prev-live"><span className="d" />En vivo · con los datos de esta ficha</span>
          </div>
          <div className="ctr-prev-toggle" role="group" aria-label="Tamaño de la vista previa">
            <button className={vistaPreview === 'desktop' ? 'on' : ''} aria-pressed={vistaPreview === 'desktop'} onClick={() => setVistaPreview('desktop')}>Desktop</button>
            <button className={vistaPreview === 'mobile' ? 'on' : ''} aria-pressed={vistaPreview === 'mobile'} onClick={() => setVistaPreview('mobile')}>Mobile</button>
          </div>
        </div>
        {!publicada && (
          <div className={'ctr-prev-aviso ' + estadoActual.cls}>
            {d.estado === 'Cerrada' ? ' Cerrada: la ficha se ve, pero no permite nuevas inscripciones.' : ' Borrador: la ficha no es visible al público todavía.'}
          </div>
        )}
        <div className="ctr-prev-stage">
          <div className={'ctr-prev-device ' + (vistaPreview === 'mobile' ? 'mobile' : 'desktop')} data-vista={vistaPreview}>
            {vistaPreview === 'desktop' && (
              <div className="ctr-prev-bar"><i /><i /><i /><span>{`inscripcion/${d.slug}`}</span></div>
            )}
            <div className="ctr-pv">
              <div className="ctr-pv-hero">
                <div className="ctr-pv-eyebrow">FORMACIÓN EN</div>
                <div className="ctr-pv-curso">{d.curso}</div>
              </div>
              <div className="ctr-pv-body">
                <div className="ctr-pv-titulo">{d.titulo || 'Ficha de inscripción'}</div>
                <div className="ctr-pv-bienv">{d.bienvenida || '¡Nos alegra tenerte acá!'}</div>

                <div className="ctr-pv-h">Ediciones disponibles</div>
                {eds.length === 0 ? (
                  <div className="ctr-pv-vacio">Todavía no hay ediciones cargadas.</div>
                ) : (
                  <div className="ctr-pv-eds">
                    {edsPrevia.map((e, i) => {
                      const hs = (horariosDeEdicion(e) || '').split(' | ').filter(Boolean);
                      return (
                        <div key={e.id || i} className="ctr-pv-ed">
                          <div className="ctr-pv-ed-nm">{e.label || 'Edición'}</div>
                          {hs.length > 0 && (
                            <ul className="ctr-pv-hs">{hs.map((h, k) => <li key={k}>{h}</li>)}</ul>
                          )}
                        </div>
                      );
                    })}
                    {eds.length > edsPrevia.length && <div className="ctr-pv-mas">+ {eds.length - edsPrevia.length} edición{eds.length - edsPrevia.length === 1 ? '' : 'es'} más</div>}
                  </div>
                )}

                <div className="ctr-pv-h">Campos del formulario</div>
                {activos.length === 0 ? (
                  <div className="ctr-pv-vacio">No hay campos activos.</div>
                ) : (
                  <div className="ctr-pv-campos">
                    {camposPrevia.map((c) => (
                      <div key={c.id} className="ctr-pv-campo">
                        <div className="ctr-pv-lbl">{c.nombre}{c.requerido ? ' *' : ''}</div>
                        <div className="ctr-pv-input" />
                      </div>
                    ))}
                    {activos.length > camposPrevia.length && <div className="ctr-pv-mas">+ {activos.length - camposPrevia.length} campo{activos.length - camposPrevia.length === 1 ? '' : 's'} más</div>}
                  </div>
                )}

                <div className="ctr-pv-cta">Comenzar</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}

// Nivel 3 de la jerarquía tipográfica (pedido de Diego): los labels de campo tienen que
// pesar MENOS que el contenido que etiquetan, no competir con él — antes estaban en
// weight 700, igual de "gritones" que los títulos.
const lbl = { fontSize: 12.5, fontWeight: 500, display: 'block', marginBottom: 5, color: 'rgb(var(--textMuted))' };
