'use client';
import { useEffect, useRef, useState } from 'react';
import { APP_URL, cantidadClasesFija, esAsincronica, calcularFechaFinEdicion, colorCurso } from '../lib/constants';
import { generarHorarios } from '../lib/husos';
import { useDialogos } from './Dialogos';

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

// Navegación interna del editor (pedido de Diego: "Campos" y "Configuración" quedaban
// escondidas dentro de <details> y pasaban desapercibidas — ahora son secciones siempre
// visibles del mismo editor, con un link arriba que hace scroll directo a cada una).
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
  const [camposAbierto, setCamposAbierto] = useState(false);
  const [configAbierto, setConfigAbierto] = useState(false);
  const [vistaPreview, setVistaPreview] = useState('desktop'); // 'desktop' | 'mobile'
  const [buscarFicha, setBuscarFicha] = useState('');
  const dragIdx = useRef(null);
  const saveTimer = useRef(null);
  const refInfo = useRef(null);
  const refEdiciones = useRef(null);
  const refCampos = useRef(null);
  const refConfig = useRef(null);
  const REFS = { info: refInfo, ediciones: refEdiciones, campos: refCampos, config: refConfig };

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
        <p style={{ fontSize: 15, fontWeight: 500, marginBottom: 6 }}> No se pudo abrir el Constructor</p>
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
  function irASeccion(id) {
    REFS[id]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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

  const estadoGuardado = guardando
    ? { txt: 'Guardando…', cls: 'bor', dot: '🟡' }
    : errorGuardado ? { txt: 'Error al guardar', cls: 'cer', dot: '🔴' }
      : dirty ? { txt: 'Cambios sin guardar', cls: 'prog', dot: '🟠' }
        : guardadoAt ? { txt: 'Guardado ' + relativo(guardadoAt, tick), cls: 'pub', dot: '🟢' }
          : d.actualizado ? { txt: 'Guardado ' + relativo(new Date(d.actualizado).getTime(), tick), cls: 'pub', dot: '🟢' }
            : { txt: 'Sin cambios', cls: 'pub', dot: '🟢' };

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

  return (
    <div className="ctor3" onClick={() => edMenu !== null && setEdMenu(null)}>
      {/* IZQUIERDA — lista compacta de fichas */}
      <div className="ctor-list">
        <div className="ctor-list-head">
          <button className="linklike" onClick={volver}>{volverLabel || ' Volver'}</button>
          <div className="ctor-list-title">Fichas</div>
        </div>
        {defs.length > 5 && (
          <input className="ctrl ctor-list-buscar" placeholder="Buscar ficha…" value={buscarFicha} onChange={(e) => setBuscarFicha(e.target.value)} />
        )}
        {defsFiltrados.map(({ x, i }) => {
          const em = ESTADOS_FICHA.find((s) => s.v === (x.estado || 'Publicada')) || ESTADOS_FICHA[1];
          const activa = i === sel;
          return (
            <button key={x.slug} className={'ctor-list-item' + (activa ? ' on' : '')} onClick={() => cambiarFicha(i)}>
              <span className={'ctor-list-dot ' + em.cls} />
              {/* Pedido de Diego: los nombres de curso acá tienen que usar el mismo color por
                  curso (colorCurso) que ya se usa en toda la app (Fichas, Actividades, etc.),
                  en vez de un color genérico parejo para todos. */}
              <span className="ctor-list-nm" style={{ color: colorCurso(x.curso) }}>{x.curso}</span>
              {activa && dirty && <span className="ctor-list-dirty" title="Cambios sin guardar">●</span>}
            </button>
          );
        })}
        {defsFiltrados.length === 0 && <p className="vacio vacio-chico">Sin resultados.</p>}
        <p className="muted" style={{ fontSize: 12, marginTop: 10, padding: '0 4px' }}>Agregar formaciones nuevas llega en el próximo lote.</p>
      </div>

      {/* CENTRO — editor */}
      <div className="ctor-editor">
        <div className="ctor-head">
          <div className="ctor-head-main">
            <div className="ctor-head-eyebrow">Constructor</div>
            <div className="ctor-head-title">{d.curso}</div>
            <div className="muted ctor-head-sub">Ficha de inscripción{ultimaModTexto && ` · Última modificación ${ultimaModTexto}`}</div>
          </div>
          <div className="ctor-head-actions">
            <span className={'fstate ' + estadoGuardado.cls}><span className="d" />{estadoGuardado.txt}</span>
            {errorGuardado && <button className="btn-sm" onClick={() => guardar()}>Reintentar</button>}
            <a className="btn-sm" href={`${APP_URL}/inscripcion/${d.slug}`} target="_blank" rel="noreferrer">Ver ficha pública ↗</a>
            <button className="btn-sm solid" onClick={() => guardar()} disabled={guardando || !dirty}>Guardar</button>
          </div>
        </div>

        <div className="ctor-secnav">
          {SECCIONES.map((s) => (
            <button key={s.id} className="ctor-secnav-item" onClick={() => irASeccion(s.id)}>{s.label}</button>
          ))}
        </div>

        <div className="ctor-section" ref={refInfo} id="info">
          <div className="ctor-section-lbl">Información de la ficha</div>
          <label style={lbl}>Título</label>
          <input className="ctrl" value={d.titulo || ''} onChange={(e) => upd({ titulo: e.target.value })} placeholder={`Ficha de inscripción — ${d.curso}`} />
          <label style={{ ...lbl, marginTop: 12 }}>Mensaje de bienvenida</label>
          <textarea className="ctrl" value={d.bienvenida || ''} onChange={(e) => upd({ bienvenida: e.target.value })} placeholder="¡Nos alegra tenerte acá! Completá tu ficha, se guarda sola." />
          <label style={{ ...lbl, marginTop: 12 }}>Estado de publicación</label>
          <div className="ctor-estado-sel">
            {ESTADOS_FICHA.map((op) => (
              <button key={op.v} type="button" className={'ctor-estado-opt ' + op.cls + (estadoActual.v === op.v ? ' on' : '')} onClick={() => upd({ estado: op.v })}>
                <span className="d" />{op.v}
              </button>
            ))}
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>{estadoActual.explicacion}</p>
        </div>

        <div className="ctor-section" ref={refEdiciones} id="ediciones">
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
                const asincronica = esAsincronica(e.label);
                const fija = cantidadClasesFija(d.curso);
                const est = estadoEdicion(e, asincronica);
                return (
                  <div className="ctor-ed-card" key={e.id || i}>
                    <div className="ctor-ed-head">
                      <div className="ctor-ed-titulo">
                        <div className="ctor-ed-titulo-top">
                          <span className="ctor-ed-nombre">{e.label || `Edición ${i + 1}`}</span>
                          {est && <span className={'fstate ' + est.cls}><span className="d" />{est.txt}</span>}
                        </div>
                        <div className="ctor-ed-meta">
                          {asincronica ? (
                            <span>🔵 Cursada asincrónica</span>
                          ) : e.fecha ? (
                            <>
                              {/* Pedido de Diego: que se entienda cuál fecha es el inicio y cuál
                                  el fin — antes era "fecha → fecha" sin aclarar cuál era cuál. */}
                              <span> Inicio: {fechaLegible(e.fecha)}</span>
                              {e.cantidadClases && <span> Fin: {fechaLegible(calcularFechaFin(e.fecha, e.cantidadClases))}</span>}
                            </>
                          ) : (
                            <span className="muted">Sin fecha cargada</span>
                          )}
                          {!asincronica && (e.horaIni || e.horaFin) && <span> {e.horaIni || '—'}–{e.horaFin || '—'}</span>}
                          {e.docente && <span> Docente: {e.docente}</span>}
                          {(e.cantidadClases || fija) && <span>{e.cantidadClases || fija} clases</span>}
                        </div>
                      </div>
                      <button className="linklike ctor-ed-editar" onClick={() => setEdAbierta(abierta ? null : e.id)}>{abierta ? 'cerrar' : 'editar'}</button>
                      <div className="ctor-ed-menu-wrap">
                        <button className="btn-sm fmenu-btn" onClick={(ev) => { ev.stopPropagation(); setEdMenu(edMenu === i ? null : i); }}>⋮</button>
                        {edMenu === i && (
                          <div className="fmenu-pop" onClick={(ev) => ev.stopPropagation()}>
                            <button onClick={() => moveEd(i, -1)} disabled={i === 0}>↑ Subir</button>
                            <button onClick={() => moveEd(i, 1)} disabled={i === eds.length - 1}>↓ Bajar</button>
                            <div className="sep" />
                            <button className="danger" onClick={() => delEd(i)}> Eliminar</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {abierta && (
                      <div className="ctor-ed-body">
                        <div className="ctor-ed-sub-lbl">Identificación</div>
                        <input className="ctrl" value={e.label} onChange={(ev) => updEd(i, { label: ev.target.value })} placeholder="Ej: Edición 17 — Lunes 5 de mayo (o 'Cursada Asincrónica')" />

                        <div className="ctor-ed-sub-lbl">Docencia</div>
                        <input className="ctrl" value={e.docente || ''} onChange={(ev) => updEd(i, { docente: ev.target.value })} placeholder="Docente (texto libre)" />

                        <div className="ctor-ed-sub-lbl">Cursada</div>
                        {asincronica ? (
                          <p className="muted" style={{ fontSize: 12, marginTop: -4 }}>Es una cursada asincrónica: no tiene día ni horario fijo, así que esos campos no aplican acá.</p>
                        ) : (
                          <>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                              <input className="ctrl" type="date" style={{ maxWidth: 160 }} value={e.fecha || ''} onChange={(ev) => updEd(i, { fecha: ev.target.value })} title="Fecha de la primera clase (hora de Argentina)" />
                              <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={e.horaIni || ''} onChange={(ev) => updEd(i, { horaIni: ev.target.value })} title="Desde (hora AR)" />
                              <input className="ctrl" type="time" style={{ maxWidth: 120 }} value={e.horaFin || ''} onChange={(ev) => updEd(i, { horaFin: ev.target.value })} title="Hasta (hora AR)" />
                            </div>
                            {fija ? (
                              <input className="ctrl" disabled style={{ maxWidth: 260, marginTop: 8 }} value={`${e.cantidadClases || fija} clases (fijo para este curso)`} title="Este curso siempre tiene la misma cantidad de clases — se completa solo." />
                            ) : (
                              <input className="ctrl" type="number" min="1" style={{ maxWidth: 160, marginTop: 8 }} value={e.cantidadClases || ''}
                                onChange={(ev) => { const cantidadClases = ev.target.value; updEd(i, { cantidadClases, fechaFin: calcularFechaFin(e.fecha, cantidadClases) }); }}
                                placeholder="Cant. de clases" title="Cantidad de encuentros de esta edición" />
                            )}
                            {e.fecha && e.cantidadClases && (
                              <div className="ctor-fin-destacado"> Finaliza el {fechaLegible(calcularFechaFin(e.fecha, e.cantidadClases))}</div>
                            )}

                            <div className="ctor-ed-sub-lbl">Horarios internacionales</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <button className="btn-sm solid" onClick={() => updEd(i, { horarios: generarHorarios(e.fecha, e.horaIni, e.horaFin) })} disabled={!e.fecha || !e.horaIni || !e.horaFin}> Calcular horarios</button>
                            </div>
                            <input className="ctrl" style={{ marginTop: 8 }} value={e.horarios || ''} onChange={(ev) => updEd(i, { horarios: ev.target.value })} placeholder="Horarios por país (se completan al calcular, o escribilos a mano)" />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="ctor-section" ref={refCampos} id="campos">
          <div className="ctor-resumen-row">
            <div>
              <div className="ctor-section-lbl" style={{ margin: 0 }}>Campos del formulario</div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>{activos.length} activos · {campos.filter((c) => c.personalizado).length} personalizados</p>
            </div>
            <button className="btn-sm" onClick={() => setCamposAbierto((v) => !v)}>{camposAbierto ? 'Ocultar campos' : 'Editar campos'}</button>
          </div>

          {camposAbierto && (
            <div style={{ marginTop: 16 }}>
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>Elegí qué campos van a aparecer en el formulario y en qué orden (arrastrando).</p>
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
                      <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={(e) => { e.preventDefault(); eliminarCampoPersonalizado(c.id); }} title="Eliminar campo"></button>
                    </label>
                  ))}
                </div>
              )}

              {!agregandoCampo ? (
                <button className="btn-sm" style={{ marginTop: 4 }} onClick={() => setAgregandoCampo(true)}>+ Nuevo campo personalizado</button>
              ) : (
                <div className="ctor-campo-nuevo-box">
                  <label style={lbl}>Nombre del campo</label>
                  <input className="ctrl" placeholder="Ej: Empresa donde trabajás" value={campoNuevo.nombre} onChange={(e) => setCampoNuevo({ ...campoNuevo, nombre: e.target.value })} autoFocus />
                  <label style={{ ...lbl, marginTop: 10 }}>Tipo de campo</label>
                  <select className="fsel" style={{ width: '100%' }} value={campoNuevo.tipo} onChange={(e) => setCampoNuevo({ ...campoNuevo, tipo: e.target.value })}>
                    <option>Texto</option><option>Texto largo</option><option>Selección única</option><option>Fecha</option>
                  </select>
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button className="btn-sm solid" onClick={agregarCampoPersonalizado} disabled={!campoNuevo.nombre.trim()}>Agregar campo</button>
                    <button className="btn-sm" onClick={() => { setAgregandoCampo(false); setCampoNuevo({ nombre: '', tipo: 'Texto' }); }}>Cancelar</button>
                  </div>
                </div>
              )}

              {activos.length > 0 && (
                <>
                  <div className="wiz-grupo-lbl" style={{ marginTop: 18 }}>Orden</div>
                  <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 8 }}>Arrastrá los campos para cambiar el orden en que aparecerán en la ficha.</p>
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
                        <span className="wiz-orden-handle"></span>
                        <div style={{ flex: 1 }}><div className="nm">{c.nombre}</div><div className="tp">{c.grupo} · {c.tipo}</div></div>
                        <button className="btn-sm" onClick={() => moverCampo(i, -1)} title="Subir" disabled={i === 0}>↑</button>
                        <button className="btn-sm" onClick={() => moverCampo(i, 1)} title="Bajar" disabled={i === activos.length - 1}>↓</button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="ctor-section" ref={refConfig} id="config">
          <div className="ctor-resumen-row">
            <div>
              <div className="ctor-section-lbl" style={{ margin: 0 }}>Configuración</div>
              <p className="muted" style={{ fontSize: 12.5, marginTop: 4 }}>
                {(cfg.destinatarios || []).length} destinatario{(cfg.destinatarios || []).length === 1 ? '' : 's'} · Notificaciones {cfg.notificar ? 'activadas' : 'desactivadas'} · Mensaje de confirmación {cfg.mensajePost ? 'configurado' : 'sin configurar'}
              </p>
            </div>
            <button className="btn-sm" onClick={() => setConfigAbierto((v) => !v)}>{configAbierto ? 'Ocultar' : 'Editar configuración'}</button>
          </div>

          {configAbierto && (
            <div style={{ marginTop: 16 }}>
              <div className="wiz-grupo-lbl">Notificaciones</div>
              <label style={lbl}>Destinatarios de las respuestas</label>
              <div className="wiz-dest-list">
                {(cfg.destinatarios || []).length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>Sin destinatarios cargados todavía.</p>}
                {(cfg.destinatarios || []).map((e) => (
                  <span className="tagchip" key={e}>{e} <button onClick={() => quitarDest(e)} title="Quitar"></button></span>
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

              <div className="wiz-grupo-lbl" style={{ marginTop: 18 }}>Confirmación</div>
              <label style={lbl}>Mensaje que verá la persona después de completar</label>
              <textarea className="ctrl" value={cfg.mensajePost || ''} onChange={(e) => updCfg({ mensajePost: e.target.value })} placeholder="¡Listo! Ya tenemos tu ficha, en breve te contactamos." />

              <details className="wiz-avanzado">
                <summary> Avanzado</summary>
                <label style={lbl}>URL de redirección tras completar (opcional)</label>
                <input className="ctrl" value={cfg.avanzado?.redireccion || ''} onChange={(e) => updCfg({ avanzado: { ...cfg.avanzado, redireccion: e.target.value } })} placeholder="https://..." />
              </details>
            </div>
          )}
        </div>
      </div>

      {/* DERECHA — vista previa en vivo */}
      <div className="ctor-preview-col">
        <div className="ctor-preview-head">
          <div>
            <div className="wiz-grupo-lbl" style={{ marginBottom: 2 }}>Vista previa de la ficha</div>
            <span className="ctor-preview-live">● Vista previa en vivo</span>
          </div>
          <div className="ctor-preview-toggle">
            <button className={vistaPreview === 'desktop' ? 'on' : ''} onClick={() => setVistaPreview('desktop')}>Desktop</button>
            <button className={vistaPreview === 'mobile' ? 'on' : ''} onClick={() => setVistaPreview('mobile')}>Mobile</button>
          </div>
        </div>
        <div className={vistaPreview === 'mobile' ? 'ctor-phone-frame' : ''}>
          <div className="wiz-preview-shell">
            <div className="wiz-preview-hero">
              <div className="wiz-preview-eyebrow">FORMACIÓN EN</div>
              <div className="wiz-preview-title">{d.curso}</div>
            </div>
            <div className="wiz-preview-body">
              {d.estado !== 'Publicada' ? (
                <div style={{ textAlign: 'center', padding: '20px 6px', color: 'rgb(var(--textSec))', fontSize: 13.5 }}>
                  {d.estado === 'Cerrada' ? ' Inscripciones cerradas' : ' Ficha en borrador (no visible al público)'}
                </div>
              ) : (<>
                <div style={{ fontFamily: 'Jost', fontWeight: 500, fontSize: 15, marginBottom: 4 }}>{d.titulo || 'Ficha de inscripción'}</div>
                <div style={{ fontSize: 12.5, color: 'rgb(var(--textSec))', marginBottom: 12 }}>{d.bienvenida || '¡Nos alegra tenerte acá!'}</div>
                {eds.length > 0 && (
                  <div style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 5 }}>Elegí día de cursada</div>
                    {eds.slice(0, 3).map((e, i) => (
                      <div key={i} className="wiz-preview-ed">
                        <div style={{ fontWeight: 500 }}>{e.label || 'Edición'}</div>
                        {e.horarios && <div style={{ fontSize: 12, color: 'rgb(var(--textMuted))' }}>{e.horarios}</div>}
                      </div>
                    ))}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 5 }}>Correo *</div>
                <div className="wiz-preview-input">tunombre@correo.com</div>
                <div className="wiz-preview-cta">Comenzar</div>
              </>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Nivel 3 de la jerarquía tipográfica (pedido de Diego): los labels de campo tienen que
// pesar MENOS que el contenido que etiquetan, no competir con él — antes estaban en
// weight 700, igual de "gritones" que los títulos.
const lbl = { fontSize: 12.5, fontWeight: 500, display: 'block', marginBottom: 5, color: 'rgb(var(--textMuted))' };
