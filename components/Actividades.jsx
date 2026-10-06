'use client';
import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { CURSOS, APP_URL, colorCurso, inicialesCurso, estadoFechaReciente } from '../lib/constants';
import { tienePermisoEliminarRespuestas } from '../lib/permisos';
import { SelectDropdown } from './SelectDropdown';
import ActividadForm from './ActividadForm';
import { IsologoDefs } from './Isologo';
import { useDialogos } from './Dialogos';

const slugify = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
function hoyISO() { return new Date().toISOString().slice(0, 10); }

// Este archivo corre en el navegador; lib/actividades.js no se puede importar acá porque
// usa googleapis (server-only). Se duplica acá la única cuenta que hace falta del lado
// del cliente: derivar "Programada"/"Cerrada" a partir de Estado + fechaDisponible/
// horaDisponible/fechaCierre — misma lógica que lib/actividades.js (yaDisponible/estadoEfectivo).
function yaDisponibleCliente(fechaDisponible, horaDisponible) {
  const hoy = hoyISO();
  if (!fechaDisponible) return true;
  if (fechaDisponible > hoy) return false;
  if (fechaDisponible < hoy) return true;
  if (!horaDisponible) return true;
  const ahora = new Date();
  const actualHHMM = String(ahora.getHours()).padStart(2, '0') + ':' + String(ahora.getMinutes()).padStart(2, '0');
  return actualHHMM >= horaDisponible;
}
function estadoEfectivoCliente(a) {
  const hoy = hoyISO();
  if (a.estado === 'Publicada' && a.fechaDisponible && !yaDisponibleCliente(a.fechaDisponible, a.horaDisponible)) return 'Programada';
  if (a.estado === 'Publicada' && a.fechaCierre && a.fechaCierre < hoy) return 'Cerrada';
  return a.estado || 'Publicada';
}
const ESTADO_ICO = {
  Publicada: { cls: 'pub', ico: '🟢' },
  Borrador: { cls: 'bor', ico: '⚪' },
  Programada: { cls: 'prog', ico: '🟠' },
  Cerrada: { cls: 'cer', ico: '🔴' },
  Archivada: { cls: 'arch', ico: '🔴' }
};

// (Antes acá vivía un componente "Reportes" local, duplicado del tab "Reportes" de arriba —
// era inalcanzable en la práctica (Panel.jsx siempre pasa "irAReportes", que lleva al tab real)
// y mostraba las mismas métricas/gráficos que ya están en Reportes → se saca (pedido de Diego:
// "todos los reportes, métricas, gráficos y análisis deben concentrarse exclusivamente" ahí).

function fmtTiempo(seg) {
  seg = Number(seg) || 0;
  if (!seg) return '—';
  const m = Math.floor(seg / 60), s = seg % 60;
  return m ? `${m}m ${String(s).padStart(2, '0')}s` : `${s}s`;
}
// Pedido de Diego (03/10/2026): colorear el puntaje según la nota, para que se vea de un
// vistazo quién tuvo un buen resultado sin tener que leer el número. Rangos sobre una escala
// de 1 a 10 (se normaliza el puntaje real/total a /10 por si una actividad no es sobre 10):
// 1-3 rojo, 4-5 naranja, 6-8 amarillo, 9-10 verde. No cambia el cálculo del puntaje, solo el color.
function colorPorPuntaje(puntaje, total) {
  if (puntaje == null || !total) return undefined;
  const sobreDiez = (puntaje / total) * 10;
  if (sobreDiez <= 3) return '#f87171';
  if (sobreDiez <= 5) return '#fb923c';
  if (sobreDiez <= 8) return '#fbbf24';
  return '#4ade80';
}
// Mismo criterio e insignias que la tabla de Fichas completadas (ver estadoFechaReciente en
// lib/constants.js y CeldaFechaReciente en Panel.jsx): hoy aparte, 1-9 días parpadeando.
function CeldaFechaRecienteAct({ iso }) {
  const { tipo } = estadoFechaReciente(iso);
  if (tipo === 'hoy') return <span className="badge-fecha-hoy" title={iso}>🟢 Inscrito hoy</span>;
  if (tipo === 'nueva') return <span className="badge-fecha-nueva" title={iso}> Ficha nueva</span>;
  // Pedido de Diego (03/10/2026): formato D/M/AAAA (sin ceros adelante) en vez de AAAA-MM-DD.
  return <span className="sec" title={iso}>{fmtFechaCorta(iso)}</span>;
}
function fmtFechaCorta(iso) {
  if (!iso) return '—';
  const d = new Date(String(iso).length <= 10 ? `${String(iso).slice(0, 10)}T00:00:00` : iso);
  if (isNaN(d)) return String(iso).slice(0, 10);
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}
const lbl = { fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 5, color: 'rgb(var(--textSec))' };

// El alta/baja de acceso de docentes se gestiona en una única pantalla, "Equipo Docente"
// (ver Equipo.jsx); antes había una pestaña "Docentes" duplicada acá adentro con el mismo
// alcance, lo que generaba dos lugares distintos para lo mismo — se saca (pedido de Diego).
const Actividades = forwardRef(function Actividades({ usuario, showToast, puedeGestionar, irABuscador, irAReportes, subInicial }, ref) {
  // "subInicial" lo usa Panel.jsx para abrir directo en "Respuestas" cuando se entra desde
  // la pestaña "Respuestas" (en vez de siempre arrancar en "Actividades").
  const [sub, setSub] = useState(subInicial || 'lista');
  const listaRef = useRef(null);
  const [abrirNuevaAlEntrar, setAbrirNuevaAlEntrar] = useState(false);
  const [preseedNueva, setPreseedNueva] = useState(null);
  useEffect(() => {
    if (sub === 'lista' && abrirNuevaAlEntrar) { listaRef.current?.nueva(preseedNueva); setAbrirNuevaAlEntrar(false); setPreseedNueva(null); }
  }, [sub, abrirNuevaAlEntrar]);
  useImperativeHandle(ref, () => ({
    nueva: (preseed) => { setPreseedNueva(preseed || null); setSub('lista'); setAbrirNuevaAlEntrar(true); }
  }));
  // Antes había acá un tab bar interno ("Actividades | Respuestas | Reportes") que duplicaba
  // navegación que ya existe arriba de todo: "Respuestas" tiene su propia pestaña de nivel
  // superior (ver Panel.jsx, tab "respuestas", que entra acá con subInicial="respuestas") y
  // "Reportes" también (tab "reportes") — se saca para no repetir lugares (pedido de Diego).
  return (
    <div>
      {sub === 'lista' && <Lista ref={listaRef} usuario={usuario} showToast={showToast} puedeGestionar={puedeGestionar} irABuscador={irABuscador} />}
      {sub === 'respuestas' && <Respuestas usuario={usuario} irABuscador={irABuscador} showToast={showToast} />}
    </div>
  );
});
export default Actividades;

// Distintas formas de ordenar el listado de actividades (Diego pidió variantes,
// sobre todo poder ver por clase dentro de un mismo curso).
const ORDENES = [
  { v: 'clase', l: 'Curso y clase' },
  { v: 'manual', l: 'Orden manual (arrastrar)' },
  { v: 'nombre', l: 'Nombre (A-Z)' },
  { v: 'curso', l: 'Curso (A-Z)' },
  { v: 'estado', l: 'Estado' },
  { v: 'preguntas', l: 'Más preguntas primero' },
];
function ordenarActividades(lista, orden) {
  const arr = [...lista];
  const claseNum = (a) => { const n = parseInt(a.clase, 10); return Number.isFinite(n) ? n : 9999; };
  const porTitulo = (a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es', { sensitivity: 'base' });
  if (orden === 'nombre') arr.sort(porTitulo);
  else if (orden === 'curso') arr.sort((a, b) => (a.curso || '').localeCompare(b.curso || '', 'es') || porTitulo(a, b));
  else if (orden === 'estado') arr.sort((a, b) => (a.estado || '').localeCompare(b.estado || '', 'es') || porTitulo(a, b));
  else if (orden === 'preguntas') arr.sort((a, b) => (b.preguntas?.length || 0) - (a.preguntas?.length || 0) || porTitulo(a, b));
  // "manual": el orden que Diego definió arrastrando filas (campo "orden" guardado por
  // actividad) — las que todavía no tienen uno asignado (0, el default) quedan al final,
  // en su orden de siempre (Curso y clase), para no mezclarlas al azar entre las ya ordenadas.
  else if (orden === 'manual') arr.sort((a, b) => {
    const oa = a.orden || 0, ob = b.orden || 0;
    if (oa && ob) return oa - ob;
    if (oa && !ob) return -1;
    if (!oa && ob) return 1;
    return (a.curso || '').localeCompare(b.curso || '', 'es') || claseNum(a) - claseNum(b) || porTitulo(a, b);
  });
  else arr.sort((a, b) => (a.curso || '').localeCompare(b.curso || '', 'es') || claseNum(a) - claseNum(b) || porTitulo(a, b));
  return arr;
}

// ───────────────────────────────────────────────────────────────────────────
// Asistente de creación/edición (wizard de 4 pasos)
// ───────────────────────────────────────────────────────────────────────────
// "Respuesta abierta" (pedido de Diego): el estudiante escribe libremente, no hay opción
// correcta para marcar — por eso no entra en el puntaje automático (ver corregir() en
// lib/actividades.js) y queda para que alguien la lea a mano en "Respuestas".
const PREG_TIPOS = [
  { v: 'multiple', l: 'Opción múltiple' },
  { v: 'vf', l: 'Verdadero / Falso' },
  { v: 'abierta', l: 'Respuesta abierta' }
];
function nuevaPreg() { return { pregunta: '', tipo: 'multiple', opciones: ['', '', ''], correcta: 0 }; }
function validarInfo(e) { return !!(e.titulo || '').trim(); }
function validarPreguntas(e) {
  if (!e.preguntas.length) return 'Agregá al menos una pregunta.';
  for (const p of e.preguntas) {
    if (!(p.pregunta || '').trim()) return 'Hay una pregunta sin texto.';
    if (p.tipo === 'abierta') continue; // sin opciones ni correcta — el estudiante escribe libre
    const ops = (p.opciones || []).filter((o) => (o || '').trim());
    if (ops.length < 2) return `«${(p.pregunta || '').slice(0, 40)}» necesita al menos 2 opciones.`;
    if (!(p.opciones[p.correcta] || '').trim()) return `«${(p.pregunta || '').slice(0, 40)}» necesita marcar cuál es la respuesta correcta.`;
  }
  return '';
}

function EditorActividad({ usuario, base, showToast, onGuardado, onCancelar, otrasActividades, onCerrarAhora, onDespublicar, onEliminar }) {
  const { confirmar, avisar } = useDialogos();
  const [e, setE] = useState(base);
  const [pasoPreview, setPasoPreview] = useState(0); // 0 = pantalla de inicio · n = pregunta n (sigue a la que se está editando)
  const refInfo = useRef(null), refPreg = useRef(null), refConfig = useRef(null);
  const irASeccion = (ref) => { if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [guardadoEstado, setGuardadoEstado] = useState(null); // null | 'guardando' | 'ok' | 'error' — siempre visible, nunca hay que adivinar
  const [confirmarPublicar, setConfirmarPublicar] = useState(false);
  const [pickerPreguntas, setPickerPreguntas] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const menuRef = useRef(null);
  const dragIdx = useRef(null);

  useEffect(() => {
    if (!menuAbierto) return;
    const onDoc = (ev) => { if (menuRef.current && !menuRef.current.contains(ev.target)) setMenuAbierto(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuAbierto]);

  const set = (patch) => setE((s) => ({ ...s, ...patch }));
  const preguntas = e.preguntas;
  const setPreg = (i, patch) => set({ preguntas: preguntas.map((p, j) => j === i ? { ...p, ...patch } : p) });
  const tieneRespuestas = !e._nuevo && (e.totalRespuestas || 0) > 0;

  async function cambiarTipo(i, tipo) {
    if (tipo === preguntas[i].tipo) return;
    // Cambiar el tipo de una pregunta que ya tiene respuestas puede dejar esas respuestas sin
    // sentido (p. ej. pasarla a Verdadero/Falso cuando alguien ya eligió una opción que ya no
    // va a existir) — se confirma antes, no se cambia de una.
    if (tieneRespuestas && !(await confirmar({ titulo: 'Cambiar el tipo de pregunta', textoConfirmar: 'Cambiar tipo', peligro: true, mensaje: 'Esta actividad ya tiene respuestas registradas. Cambiar el tipo de esta pregunta puede dejar esas respuestas sin sentido (no se van a recalcular). ¿Cambiar igual?'}))) return;
    if (tipo === 'vf') setPreg(i, { tipo, opciones: ['Verdadero', 'Falso'], correcta: preguntas[i].correcta <= 1 ? preguntas[i].correcta : 0 });
    else if (tipo === 'abierta') setPreg(i, { tipo, opciones: [], correcta: undefined });
    else setPreg(i, { tipo, opciones: ['', '', ''], correcta: 0 });
  }
  function agregarPreg() { set({ preguntas: [...preguntas, nuevaPreg()] }); }
  async function eliminarPreg(i) {
    if (preguntas.length <= 1) return;
    // Si la actividad ya tiene respuestas, eliminar una pregunta puede desalinear el puntaje
    // ya calculado de quienes ya respondieron (las respuestas guardadas quedan intactas, pero
    // van a quedar "corridas" respecto de las preguntas que queden) — se confirma antes, en vez
    // de borrar directo como si la actividad no tuviera nada cargado todavía.
    if (tieneRespuestas && !(await confirmar({ titulo: 'Eliminar pregunta', textoConfirmar: 'Eliminar', peligro: true, mensaje: 'Esta actividad ya tiene respuestas registradas. Eliminar esta pregunta no borra esas respuestas, pero el puntaje ya calculado no se va a recalcular. ¿Eliminar igual?'}))) return;
    set({ preguntas: preguntas.filter((_, j) => j !== i) });
  }
  function duplicarPreg(i) {
    const copia = { ...preguntas[i], opciones: [...preguntas[i].opciones] };
    const arr = preguntas.slice(); arr.splice(i + 1, 0, copia); set({ preguntas: arr });
  }
  // Preguntas reutilizables: copia (nunca referencia) una pregunta de OTRA actividad ya
  // existente — la original queda intacta, esto solo agrega una copia acá.
  function reutilizarPregunta(p) {
    const copia = { pregunta: p.pregunta, tipo: p.tipo || 'multiple', opciones: [...(p.opciones || [])], correcta: p.correcta };
    set({ preguntas: [...preguntas, copia] });
    setPickerPreguntas(false);
  }
  function moverPreg(i, dir) { const j = i + dir; if (j < 0 || j >= preguntas.length) return; const arr = preguntas.slice(); [arr[i], arr[j]] = [arr[j], arr[i]]; set({ preguntas: arr }); }
  function reordenarPreg(desde, hasta) { if (desde === hasta) return; const arr = preguntas.slice(); const [item] = arr.splice(desde, 1); arr.splice(hasta, 0, item); set({ preguntas: arr }); }

  // Si se borran preguntas, la vista previa no puede quedar apuntando a una que ya no existe.
  const pasoPreviewOk = Math.min(pasoPreview, preguntas.length);

  // "forzarEstado": lo usan los 3 botones principales (Guardar borrador | Publicar) para dejar
  // bien en claro qué estado va a quedar, sin depender de lo que haya elegido antes en el
  // selector del paso 1 — Publicar y Guardar borrador son acciones distintas, no la misma.
  async function guardar(forzarEstado) {
    const msgInfo = !validarInfo(e) ? 'Poné un título para la actividad.' : '';
    const msgPreg = !msgInfo ? validarPreguntas(e) : '';
    const msgFechas = (!msgInfo && !msgPreg && e.fechaDisponible && e.fechaCierre && e.fechaCierre < e.fechaDisponible)
      ? 'La fecha de cierre no puede ser anterior a la de disponibilidad.' : '';
    if (msgInfo || msgPreg || msgFechas) { setError(msgInfo || msgPreg || msgFechas); irASeccion(msgInfo ? refInfo : msgPreg ? refPreg : refConfig); return; }
    const estadoFinal = forzarEstado || e.estado;
    setGuardando(true); setGuardadoEstado('guardando'); setError(''); setConfirmarPublicar(false);
    const slug = e.slug || slugify(e.titulo);
    try {
      const res = await fetch('/api/actividades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitanteEmail: usuario.email, slug, curso: e.curso, titulo: e.titulo, clase: e.clase,
          estado: estadoFinal, edicion: e.edicion, intro: e.intro, fechaDisponible: e.fechaDisponible, horaDisponible: e.horaDisponible,
          fechaCierre: e.fechaCierre, mostrarResultado: e.mostrarResultado !== false, orden: e.orden || 0, preguntas: e.preguntas
        })
      });
      const data = await res.json();
      if (data.ok) {
        setGuardadoEstado('ok');
        showToast(estadoFinal === 'Publicada' ? ' Actividad publicada correctamente' : ' Actividad guardada como borrador');
        onGuardado();
      } else { setGuardadoEstado('error'); setError(data.error || 'No se pudo guardar'); }
    } catch { setGuardadoEstado('error'); setError('Error de conexión'); }
    setGuardando(false);
  }
  function clickPublicar() {
    // Confirmación previa (pedido de Diego) solo cuando realmente va a pasar a estar visible
    // para los estudiantes — si ya estaba Publicada, guardar cambios no necesita este paso.
    if (e.estado === 'Publicada' && !e._nuevo) { guardar('Publicada'); return; }
    setConfirmarPublicar(true);
  }

  return (
    <div className="cf-wrap">
      <div className="cf-top">
        <button className="btn-sm" onClick={onCancelar} disabled={guardando}>← Volver a la lista</button>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h2 className="cf-h1">{e._nuevo ? 'Nueva actividad' : 'Editar actividad'}</h2>
          <p className="cf-sub">Armá la actividad y mirá, a la derecha, cómo la va a ver el estudiante: la vista previa sigue la pregunta que estás editando.</p>
        </div>
        {!e._nuevo && (
          <div className="repx-more-wrap" ref={menuRef}>
            <button className="btn-sm" onClick={() => setMenuAbierto((v) => !v)} title="Más acciones">⋯</button>
            {menuAbierto && (
              <div className="repx-more-pop" style={{ minWidth: 180 }}>
                <button type="button" className="fdrop-opt" onClick={() => { setMenuAbierto(false); onDespublicar && onDespublicar(e); }}>Despublicar</button>
                <button type="button" className="fdrop-opt" onClick={() => { setMenuAbierto(false); onCerrarAhora && onCerrarAhora(e); }}>Cerrar actividad ahora</button>
                <button type="button" className="fdrop-opt" style={{ color: 'rgb(248 113 113)' }} onClick={() => { setMenuAbierto(false); onEliminar && onEliminar(e); }}> Eliminar actividad</button>
              </div>
            )}
          </div>
        )}
      </div>
      {!e._nuevo && <p className="muted" style={{ fontSize: 12, fontFamily: 'monospace', margin: '-10px 0 14px' }}>{APP_URL}/actividad/{e.slug}</p>}
      {tieneRespuestas && (
        <div className="note" style={{ margin: '0 0 16px' }}>
           Esta actividad ya tiene <b>{e.totalRespuestas} respuesta{e.totalRespuestas === 1 ? '' : 's'}</b>. Si eliminás o cambiás una pregunta existente (o su opción correcta), el puntaje de las respuestas ya enviadas no se recalcula — las respuestas en sí nunca se borran.
        </div>
      )}
      {error && <div className="cf-bad" role="alert">{error}</div>}

      <div className="cf-grid">
        <div className="cf-card">
          <div className="cf-sec" ref={refInfo}>
            <p className="cf-sec-t">Información general</p>
          <label style={lbl}>Título de la actividad</label>
          <input className="ctrl" value={e.titulo} onChange={(ev) => set({ titulo: ev.target.value })} placeholder="Ej: Postwork clase número 2" autoFocus />
          <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}><label style={lbl}>Curso</label>
              <select className="fsel" style={{ width: '100%' }} value={e.curso} onChange={(ev) => set({ curso: ev.target.value })}>{CURSOS.map((c) => <option key={c.slug}>{c.nombre}</option>)}</select></div>
            <div style={{ minWidth: 130 }}><label style={lbl}>Edición (opcional)</label>
              <input className="ctrl" value={e.edicion || ''} onChange={(ev) => set({ edicion: ev.target.value.replace(/\D/g, '') })} placeholder="Ej: 15" /></div>
            <div style={{ minWidth: 120 }}><label style={lbl}>N° de clase</label>
              <input className="ctrl" value={e.clase || ''} onChange={(ev) => set({ clase: ev.target.value })} placeholder="Ej: 14" /></div>
            <div style={{ minWidth: 160 }}><label style={lbl}>Estado</label>
              <select className="fsel" style={{ width: '100%' }} value={e.estado} onChange={(ev) => set({ estado: ev.target.value })}>
                <option>Publicada</option><option>Borrador</option><option>Archivada</option>
              </select></div>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 10 }}>
            {e.edicion
              ? 'Al fijar la edición acá, el estudiante ya no la va a tener que escribir al responder.'
              : 'Si dejás la edición vacía, se le va a seguir pidiendo al estudiante que la escriba al responder.'}
          </p>
          </div>

          <div className="cf-sec" ref={refPreg}>
            <p className="cf-sec-t">Preguntas</p>
          {/* Pedido de Diego: que se vea de entrada cuántas preguntas hay y de qué tipo,
              mientras se van agregando (no solo al final, en "Revisar"). */}
          <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 14 }}>
            {preguntas.length} pregunta{preguntas.length === 1 ? '' : 's'} · {preguntas.filter((p) => p.tipo !== 'abierta').length} cerrada{preguntas.filter((p) => p.tipo !== 'abierta').length === 1 ? '' : 's'} (se autocorrige) · {preguntas.filter((p) => p.tipo === 'abierta').length} abierta{preguntas.filter((p) => p.tipo === 'abierta').length === 1 ? '' : 's'} (se revisa a mano)
          </p>
          {preguntas.map((p, i) => (
            <div className="preg-card" key={i} onFocusCapture={() => setPasoPreview(i + 1)}
              onDragOver={(ev) => ev.preventDefault()}
              onDrop={() => { if (dragIdx.current !== null) reordenarPreg(dragIdx.current, i); dragIdx.current = null; }}>
              <div className="preg-card-head">
                <span className="preg-drag-handle" draggable onDragStart={() => { dragIdx.current = i; }} title="Arrastrar para reordenar"></span>
                <b>Pregunta {i + 1}</b>
                <select className="fsel" value={p.tipo} onChange={(ev) => cambiarTipo(i, ev.target.value)}>
                  {PREG_TIPOS.map((t) => <option key={t.v} value={t.v}>{t.l}</option>)}
                </select>
                <span className="grow" />
                <button className="btn-sm" onClick={() => moverPreg(i, -1)} disabled={i === 0} title="Subir">↑</button>
                <button className="btn-sm" onClick={() => moverPreg(i, 1)} disabled={i === preguntas.length - 1} title="Bajar">↓</button>
                <button className="btn-sm" onClick={() => duplicarPreg(i)} title="Duplicar pregunta">Duplicar</button>
                <button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => eliminarPreg(i)} title="Eliminar" disabled={preguntas.length <= 1}></button>
              </div>
              <input className="ctrl" value={p.pregunta} onChange={(ev) => setPreg(i, { pregunta: ev.target.value })} placeholder="Texto de la pregunta" />
              {p.tipo === 'abierta' ? (
                <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>El estudiante va a escribir su respuesta libremente — no se autocorrige, queda para revisar a mano en "Respuestas".</p>
              ) : (<>
              <p className="muted" style={{ fontSize: 12, margin: '10px 0 6px' }}>Marcá la opción correcta </p>
              {p.tipo === 'vf' ? (
                p.opciones.map((op, j) => (
                  <div key={j} className="preg-vf-row">
                    <input type="radio" name={'correcta-' + i} checked={p.correcta === j} onChange={() => setPreg(i, { correcta: j })} style={{ accentColor: 'rgb(var(--accentMagenta))' }} />
                    {op}
                  </div>
                ))
              ) : (<>
                {p.opciones.map((op, j) => (
                  <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                    <input type="radio" name={'correcta-' + i} checked={p.correcta === j} onChange={() => setPreg(i, { correcta: j })} title="Correcta" style={{ accentColor: 'rgb(var(--accentMagenta))' }} />
                    <input className="ctrl" value={op} onChange={(ev) => setPreg(i, { opciones: p.opciones.map((x, k) => k === j ? ev.target.value : x) })} placeholder={`Opción ${j + 1}`} />
                    <button className="btn-sm" onClick={() => setPreg(i, { opciones: p.opciones.filter((_, k) => k !== j), correcta: p.correcta >= p.opciones.length - 1 ? 0 : p.correcta })} disabled={p.opciones.length <= 2}></button>
                  </div>
                ))}
                <button className="btn-sm" onClick={() => setPreg(i, { opciones: [...p.opciones, ''] })}>+ Opción</button>
              </>)}
              </>)}
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn-sm solid" onClick={agregarPreg}>+ Agregar pregunta</button>
            {otrasActividades && otrasActividades.length > 0 && (
              <button className="btn-sm" onClick={() => setPickerPreguntas(true)}>⧉ Reutilizar pregunta existente</button>
            )}
          </div>
          </div>

          <div className="cf-sec" ref={refConfig}>
            <p className="cf-sec-t">Fechas y configuración</p>
          <label style={lbl}>Instrucciones para el estudiante (opcional)</label>
          <textarea className="ctrl" rows={3} style={{ resize: 'vertical', width: '100%' }} value={e.intro || ''} onChange={(ev) => set({ intro: ev.target.value })} placeholder="Ej: Mirá la clase grabada antes de responder. Tenés hasta el domingo." />
          <p className="muted" style={{ fontSize: 12, marginTop: 6 }}>Se le muestra al estudiante en "Antes de empezar", antes de pedirle el correo. Vacío = usa el texto genérico ({'"'}Completá tus datos y respondé las N preguntas{'"'}).</p>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 18 }}>
            <div>
              <label style={lbl}>Fecha de disponibilidad (opcional)</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="ctrl" type="date" style={{ maxWidth: 160 }} value={e.fechaDisponible || ''} onChange={(ev) => set({ fechaDisponible: ev.target.value })} />
                {e.fechaDisponible && (
                  <input className="ctrl" type="time" style={{ maxWidth: 110 }} value={e.horaDisponible || ''} onChange={(ev) => set({ horaDisponible: ev.target.value })} title="Hora de disponibilidad (opcional)" />
                )}
              </div>
              <p className="muted" style={{ fontSize: 12, marginTop: 6, maxWidth: 280 }}>Vacío = disponible apenas la publiques. Con una fecha futura, figura como <b>Programada</b> hasta ese día{e.fechaDisponible ? ' (y esa hora, si la ponés)' : ''}.</p>
            </div>
            <div>
              <label style={lbl}>Fecha de cierre (opcional)</label>
              <input className="ctrl" type="date" style={{ maxWidth: 200 }} value={e.fechaCierre || ''} onChange={(ev) => set({ fechaCierre: ev.target.value })} />
              <p className="muted" style={{ fontSize: 12, marginTop: 6, maxWidth: 260 }}>Vacío = sin fecha límite. Pasado ese día, figura como <b>Cerrada</b> y el estudiante ya no puede responderla (ni ver el formulario).</p>
            </div>
          </div>

          <label className="wiz-check-inline" style={{ marginTop: 18 }}>
            <input type="checkbox" checked={e.mostrarResultado !== false} onChange={(ev) => set({ mostrarResultado: ev.target.checked })} />
            Mostrarle el puntaje al estudiante al terminar
          </label>
          <p className="muted" style={{ fontSize: 12, marginTop: 6, marginLeft: 26 }}>Si lo desmarcás, igual se corrige y se guarda todo — solo no se le muestra el número en pantalla.</p>
          <details className="wiz-avanzado">
            <summary> Próximamente</summary>
            <p className="muted" style={{ fontSize: 12.5 }}>Límite de intentos y tiempo límite por actividad quedan para una próxima etapa: necesitan su propia lógica de control (contar intentos previos, cronómetro con envío automático) para no arriesgar respuestas de estudiantes ya en curso.</p>
          </details>
          </div>

      {confirmarPublicar && (
        <div className="note" style={{ margin: '0 0 14px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <span style={{ flex: '1 1 260px' }}>
            ¿Publicar esta actividad?{e.fechaDisponible && !yaDisponibleCliente(e.fechaDisponible, e.horaDisponible)
              ? <> Como pusiste una fecha de disponibilidad futura, va a quedar <b>Programada</b> hasta el {e.fechaDisponible}{e.horaDisponible ? ` ${e.horaDisponible}hs` : ''} — recién ahí la va a poder ver el estudiante.</>
              : <> Va a quedar visible para los estudiantes de inmediato.</>}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-sm" onClick={() => setConfirmarPublicar(false)}>Revisar</button>
            <button className="btn-sm solid" onClick={() => guardar('Publicada')} disabled={guardando}>Sí, publicar</button>
          </div>
        </div>
      )}

      <div className="cf-acts" style={{ alignItems: 'center' }}>
        {guardadoEstado && (
          <span style={{ fontSize: 12, fontWeight: 500, color: guardadoEstado === 'error' ? 'rgb(248 113 113)' : guardadoEstado === 'guardando' ? 'rgb(var(--textMuted))' : 'rgb(74 222 128)' }}>
            {guardadoEstado === 'guardando' ? 'Guardando…' : guardadoEstado === 'error' ? ' Error al guardar' : ' Guardado'}
          </span>
        )}
        <button className="btn" onClick={() => guardar('Borrador')} disabled={guardando}>Guardar borrador</button>
        <button className="btn btn-primary" onClick={clickPublicar} disabled={guardando}>Publicar</button>
      </div>
        </div>

        <div className="cf-side">
          <div className="cf-card">
            <p className="cf-pv-t">Vista previa</p>
            <div className="cf-pv-tabs" role="group" aria-label="Pantalla que se muestra en la vista previa">
              <button className={'fchip' + (pasoPreviewOk === 0 ? ' on' : '')} onClick={() => setPasoPreview(0)}>Inicio</button>
              {preguntas.map((_, i) => (
                <button key={i} className={'fchip' + (pasoPreviewOk === i + 1 ? ' on' : '')} onClick={() => setPasoPreview(i + 1)} title={`Ver la pregunta ${i + 1}`}>{i + 1}</button>
              ))}
            </div>
            <div className="cf-pv">
              <IsologoDefs />
              <ActividadForm act={e} modoPreview pasoInicial={pasoPreviewOk} key={`${preguntas.length}-${pasoPreviewOk}`} />
            </div>
            <div className="cf-sum">
              <div><span>Curso</span><b>{e.curso}</b></div>
              <div><span>Edición</span><b>{e.edicion || '—'}</b></div>
              <div><span>Clase</span><b>{e.clase || '—'}</b></div>
              <div><span>Estado</span><b>{e.estado}</b></div>
              <div><span>Preguntas</span><b>{preguntas.length} ({preguntas.filter((p) => p.tipo !== 'abierta').length} cerrada{preguntas.filter((p) => p.tipo !== 'abierta').length === 1 ? '' : 's'})</b></div>
              <div><span>Disponible desde</span><b>{e.fechaDisponible ? e.fechaDisponible + (e.horaDisponible ? ` ${e.horaDisponible}hs` : '') : 'Inmediata'}</b></div>
              <div><span>Cierra el</span><b>{e.fechaCierre || 'Sin límite'}</b></div>
              <div><span>Muestra resultado</span><b>{e.mostrarResultado !== false ? 'Sí' : 'No'}</b></div>
            </div>
          </div>
        </div>
      </div>

      {pickerPreguntas && (
        <div className="preview-ov" onClick={() => setPickerPreguntas(false)}>
          <div className="preview-card" onClick={(ev) => ev.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="preview-head">
              <div className="preview-kd">Reutilizar una pregunta de otra actividad</div>
              <button className="btn-sm" onClick={() => setPickerPreguntas(false)}> Cerrar</button>
            </div>
            <div className="preview-body" style={{ padding: 16 }}>
              {otrasActividades.filter((a) => (a.preguntas || []).length > 0).map((a) => (
                <div key={a.slug} style={{ marginBottom: 14 }}>
                  <div className="muted" style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>{a.titulo} · {a.curso}</div>
                  {a.preguntas.map((p, j) => (
                    <button type="button" key={j} className="celda-edit-btn" style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 4 }} onClick={() => reutilizarPregunta(p)}>
                      {p.pregunta || <span className="muted">(sin texto)</span>}
                    </button>
                  ))}
                </div>
              ))}
              {otrasActividades.filter((a) => (a.preguntas || []).length > 0).length === 0 && <p className="vacio">No hay otras actividades con preguntas todavía.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Agrupado por curso → edición (para la vista "Agrupar")
// ───────────────────────────────────────────────────────────────────────────
function agruparPorCurso(lista) {
  const ordenCursos = CURSOS.map((c) => c.nombre);
  const cursos = [...new Set(lista.map((a) => a.curso || 'Sin curso'))].sort((a, b) => {
    const ia = ordenCursos.indexOf(a), ib = ordenCursos.indexOf(b);
    if (ia === -1 && ib === -1) return a.localeCompare(b, 'es');
    if (ia === -1) return 1; if (ib === -1) return -1;
    return ia - ib;
  });
  return cursos.map((curso) => {
    const items = lista.filter((a) => (a.curso || 'Sin curso') === curso);
    const ediciones = [...new Set(items.map((a) => a.edicion || ''))].sort((a, b) => {
      if (a === '' && b === '') return 0;
      if (a === '') return 1; if (b === '') return -1;
      return (Number(a) - Number(b)) || a.localeCompare(b);
    });
    return { curso, items, porEdicion: ediciones.map((ed) => ({ edicion: ed, items: items.filter((a) => (a.edicion || '') === ed) })) };
  });
}

// ───────────────────────────────────────────────────────────────────────────
// Tabla / Tarjetas (usadas tal cual estén agrupadas o no)
// ───────────────────────────────────────────────────────────────────────────
// Celda de tabla que se convierte en un <input> al hacer click (para Edición/Clase),
// en vez de tener que abrir " Editar" para tocar un solo dato suelto.
function CeldaEditable({ valor, placeholder, onGuardar, render, puedeEditar }) {
  const [editando, setEditando] = useState(false);
  const [val, setVal] = useState(valor || '');
  const ref = useRef(null);
  useEffect(() => { if (editando) { ref.current?.focus(); ref.current?.select(); } }, [editando]);
  useEffect(() => { setVal(valor || ''); }, [valor]);
  function confirmar() {
    setEditando(false);
    const limpio = val.trim();
    if (limpio !== (valor || '')) onGuardar(limpio);
  }
  if (!puedeEditar) return render ? render(valor) : (valor || <span className="sec">—</span>);
  if (editando) {
    return (
      <input
        ref={ref} className="celda-edit-input" value={val} placeholder={placeholder}
        onChange={(e) => setVal(e.target.value)}
        onBlur={confirmar}
        onKeyDown={(e) => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') { setVal(valor || ''); setEditando(false); } }}
      />
    );
  }
  return (
    <button type="button" className="celda-edit-btn" onClick={() => setEditando(true)} title="Click para editar">
      {render ? render(valor) : (valor || <span className="sec">—</span>)}
    </button>
  );
}

// Pedido de Diego: el nombre del curso en la tabla de Actividades tiene que verse como en
// disponibilidad-zoom (punto de color + texto de ese mismo color), no como un chip/pill con
// fondo — mismos colores por curso ya unificados en colorCurso (lib/constants.js).
function CursoConPunto({ curso }) {
  const color = colorCurso(curso);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ color }}>{curso}</span>
    </span>
  );
}

// Pedido de Diego (03/10/2026): marcar cuándo se cargó la actividad/formulario — "cargada
// hoy" el mismo día, "nueva" entre el día 1 y 10 (distinto del criterio de 1-9 de Fichas, por
// eso el segundo parámetro). Usa "Creado" (ver lib/constants.js), que a diferencia de
// "Actualizado" se escribe una sola vez y no cambia con cada edición posterior.
function BadgeCreado({ iso }) {
  const { tipo } = estadoFechaReciente(iso, 10);
  if (tipo === 'hoy') return <span className="badge-fecha-hoy" title={'Cargada el ' + iso}>🟢 Cargada hoy</span>;
  if (tipo === 'nueva') return <span className="badge-fecha-nueva" title={'Cargada el ' + iso}> Nueva</span>;
  return null;
}

function TablaActividades({ items, puedeGestionar, onEditar, onDuplicar, onDetalle, onGuardarCampo }) {
  return (
    <div className="tablewrap"><table>
      <thead><tr><th>Actividad</th><th>Curso</th><th>Edición</th><th>Clase</th><th>Estado</th><th>Preguntas</th><th style={{ textAlign: 'right' }}>Acciones</th></tr></thead>
      <tbody>{items.map((a) => {
        const efectivo = estadoEfectivoCliente(a);
        const badge = ESTADO_ICO[efectivo] || ESTADO_ICO.Publicada;
        return (
          <tr key={a.slug}>
            <td className="ins-name acts-titlelink-cell"><button className="acts-titlelink" onClick={() => onDetalle(a)}>{a.titulo}</button> <BadgeCreado iso={a.creado} /></td>
            <td>{a.curso ? <CursoConPunto curso={a.curso} /> : ''}</td>
            <td>
              <CeldaEditable
                valor={a.edicion} placeholder="N° o Todas" puedeEditar={puedeGestionar}
                onGuardar={(v) => onGuardarCampo(a, { edicion: v })}
                render={(v) => v ? <span className="edchip">{v.toLowerCase() === 'todas' ? 'Todas' : v}</span> : <span className="sec">—</span>}
              />
            </td>
            <td className="sec">
              <CeldaEditable
                valor={a.clase} placeholder="N°" puedeEditar={puedeGestionar}
                onGuardar={(v) => onGuardarCampo(a, { clase: v })}
              />
            </td>
            <td><span className={'fstate fstate-liviana ' + badge.cls}><span className="d" />{efectivo}</span></td>
            <td className="sec">{a.preguntas.length}</td>
            <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
              <a className="btn-sm" href={`${APP_URL}/actividad/${a.slug}`} target="_blank" rel="noreferrer" title="Abrir actividad"></a>{' '}
              {puedeGestionar && <button className="btn-sm" onClick={() => onDuplicar(a)} title="Duplicar">⧉</button>}{' '}
              {puedeGestionar && <button className="btn-sm solid" onClick={() => onEditar(a)} title="Editar"></button>}
            </td>
          </tr>
        );
      })}</tbody>
    </table></div>
  );
}

function GridActividades({ items, puedeGestionar, onEditar, onDuplicar, onDetalle, showToast }) {
  return (
    <div className="pcard-wrap">
      <div className="pcard-grid">
      {items.map((a) => {
        const efectivo = estadoEfectivoCliente(a);
        const badge = ESTADO_ICO[efectivo] || ESTADO_ICO.Publicada;
        const color = colorCurso(a.curso);
        const sub = `${a.curso}${a.edicion ? ` · Ed. ${a.edicion}` : ''}${a.clase ? ` · Clase ${a.clase}` : ''}`;
        return (
          <div className="pcard" key={a.slug} style={{ borderLeft: `4px solid ${color}66` }}>
            <div className="pcard-top">
              <div className="pcard-dotrow">
                <span className="pcard-colordot" style={{ background: color }} />
                <button className="acts-titlelink pcard-title" style={{ background: 'none', border: 0, textAlign: 'left', cursor: 'pointer', color: 'inherit' }} title={a.titulo} onClick={() => onDetalle(a)}>{a.titulo}</button>
              </div>
              <span className={'pcard-dot ' + badge.cls}><span className="d" />{efectivo}</span>
            </div>
            <div className="pcard-sub" title={sub}>{sub}</div>
            <div className="pcard-datos">
              <span className="pcard-datos-destacado">{a.preguntas.length} pregunta{a.preguntas.length === 1 ? '' : 's'}</span>
              <BadgeCreado iso={a.creado} />
            </div>
            <div className="pcard-url">
              <span className="pcard-url-txt">/actividad/{a.slug}</span>
              <button className="pcard-url-copy" onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/actividad/${a.slug}`); showToast(' Enlace copiado'); }} title="Copiar enlace">Copiar</button>
            </div>
            <div className="pcard-actions">
              <a className="pcard-act pcard-act-icon" href={`${APP_URL}/actividad/${a.slug}`} target="_blank" rel="noreferrer" title="Ver actividad"></a>
              {puedeGestionar && <button className="pcard-act" onClick={() => onDuplicar(a)}>⧉ Duplicar</button>}
              {puedeGestionar && <button className="pcard-act pcard-act-primary" onClick={() => onEditar(a)}> Editar</button>}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Ficha de detalle de una actividad (solo lectura + acciones)
// ───────────────────────────────────────────────────────────────────────────
function DetalleActividad({ a, puedeGestionar, showToast, onEditar, onDuplicar, onVolver, onGuardarCampo }) {
  const { confirmar, avisar } = useDialogos();
  const efectivo = estadoEfectivoCliente(a);
  const badge = ESTADO_ICO[efectivo] || ESTADO_ICO.Publicada;
  const color = colorCurso(a.curso);
  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      <div className="panel" style={{ borderLeft: `4px solid ${color}66` }}>
        <div className="sechead">
          <button className="btn-sm" onClick={onVolver}> Volver</button>
          <span className="grow" />
          <button className="btn-sm" onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/actividad/${a.slug}`); showToast(' Enlace copiado'); }}>Copiar enlace</button>
          <a className="btn-sm" href={`${APP_URL}/actividad/${a.slug}`} target="_blank" rel="noreferrer">↗ Abrir actividad</a>
          {puedeGestionar && <button className="btn-sm" onClick={() => onDuplicar(a)}>⧉ Duplicar</button>}
          {puedeGestionar && <button className="btn-sm solid" onClick={() => onEditar(a)}> Editar</button>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10 }}>
          <span className="curso-avatar" style={{ background: color + '22', color, width: 42, height: 42, borderRadius: 12, fontSize: 15, flex: '0 0 auto' }}>{inicialesCurso(a.curso)}</span>
          <div style={{ minWidth: 0 }}>
            <div className="htitle" style={{ fontSize: 20, lineHeight: 1.2 }}>{a.titulo}</div>
            <div style={{ fontSize: 13, color, fontWeight: 600 }}>{a.curso}{a.edicion ? ` · Edición ${a.edicion}` : ''}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
          <span className={'fstate ' + badge.cls}><span className="d" />{efectivo}</span>
          <span className="tagchip">{a.preguntas.length} pregunta{a.preguntas.length === 1 ? '' : 's'}</span>
          {a.clase && <span className="tagchip">Clase {a.clase}</span>}
        </div>
      </div>

      <div className="panel">
        <div className="wiz-grupo-lbl">Configuración</div>
        <div className="detalle-meta">
          <div><div className="k">Curso</div><div className="v">{a.curso}</div></div>
          <div>
            <div className="k">Edición</div>
            <div className="v">
              <CeldaEditable
                valor={a.edicion} placeholder="N° o Todas" puedeEditar={puedeGestionar}
                onGuardar={(v) => onGuardarCampo(a, { edicion: v })}
                render={(v) => v ? (v.toLowerCase() === 'todas' ? 'Todas' : v) : 'Se la pide al estudiante'}
              />
            </div>
          </div>
          <div>
            <div className="k">Clase</div>
            <div className="v">
              <CeldaEditable
                valor={a.clase} placeholder="N°" puedeEditar={puedeGestionar}
                onGuardar={(v) => onGuardarCampo(a, { clase: v })}
                render={(v) => v || '—'}
              />
            </div>
          </div>
          <div><div className="k">Estado</div><div className="v">{a.estado}</div></div>
          <div><div className="k">Fecha de disponibilidad</div><div className="v">{a.fechaDisponible ? a.fechaDisponible + (a.horaDisponible ? ` ${a.horaDisponible}hs` : '') : 'Inmediata'}</div></div>
          <div><div className="k">Fecha de cierre</div><div className="v">{a.fechaCierre || 'Sin límite'}</div></div>
          <div><div className="k">Muestra resultado</div><div className="v">{a.mostrarResultado === false ? 'No' : 'Sí'}</div></div>
          <div><div className="k">Última actualización</div><div className="v">{a.actualizado ? new Date(a.actualizado).toLocaleString('es-AR') : '—'}</div></div>
        </div>
      </div>

      <div className="panel">
        <div className="wiz-grupo-lbl">Preguntas</div>
        {a.preguntas.map((p, i) => (
          <div className="detalle-preg" key={i}>
            <div className="detalle-preg-head">
              <span className="detalle-preg-num">{i + 1}</span>
              <b style={{ fontSize: 13.5 }}>{p.pregunta}</b>
            </div>
            {(p.opciones || []).map((op, j) => (
              <div key={j} className={'detalle-op' + (Number(p.correcta) === j ? ' ok' : '')}>
                {Number(p.correcta) === j && <span className="detalle-op-check"></span>}
                {op}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Listado principal
// ───────────────────────────────────────────────────────────────────────────
const Lista = forwardRef(function Lista({ usuario, showToast, puedeGestionar, irABuscador }, ref) {
  const [acts, setActs] = useState(null);
  const [modo, setModo] = useState(null); // null | {tipo:'editor', base} | {tipo:'detalle', act}
  const [q, setQ] = useState('');
  const [vista, setVista] = useState('lista');
  const [orden, setOrden] = useState('clase');
  const [agrupar, setAgrupar] = useState(false);
  const [fCurso, setFCurso] = useState(''); const [fEd, setFEd] = useState(''); const [fEstado, setFEstado] = useState('');
  const [mostrarArch, setMostrarArch] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem('ilce-actividades-vista'); if (v === 'cards' || v === 'lista') setVista(v);
      const o = localStorage.getItem('ilce-actividades-orden'); if (ORDENES.some((x) => x.v === o)) setOrden(o);
      const g = localStorage.getItem('ilce-actividades-agrupar'); if (g === '1') setAgrupar(true);
    } catch { /* */ }
  }, []);
  const cambiarVista = (v) => { setVista(v); try { localStorage.setItem('ilce-actividades-vista', v); } catch { /* */ } };
  const cambiarOrden = (v) => { setOrden(v); try { localStorage.setItem('ilce-actividades-orden', v); } catch { /* */ } };
  const toggleAgrupar = () => { const v = !agrupar; setAgrupar(v); try { localStorage.setItem('ilce-actividades-agrupar', v ? '1' : '0'); } catch { /* */ } };

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  async function cargar() {
    const res = await fetch('/api/actividades?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const data = await res.json();
    setActs(data.ok ? data.actividades : []);
  }

  function nueva(preseed) {
    const base = { slug: '', curso: CURSOS[0].nombre, titulo: '', clase: '', edicion: '', intro: '', fechaDisponible: '', fechaCierre: '', mostrarResultado: true, estado: 'Publicada', preguntas: [nuevaPreg()], _nuevo: true };
    if (preseed) {
      if (preseed.curso) base.curso = preseed.curso;
      if (preseed.clase != null && preseed.clase !== '') base.clase = String(preseed.clase);
      if (preseed.cantidadPreguntas > 0) base.preguntas = Array.from({ length: preseed.cantidadPreguntas }, () => nuevaPreg());
    }
    setModo({ tipo: 'editor', base });
  }
  useImperativeHandle(ref, () => ({ nueva }));
  function editar(a) { setModo({ tipo: 'editor', base: { ...a, _nuevo: false } }); }
  function duplicar(a) {
    const claseTxt = String(a.clase || '').trim();
    const claseNum = parseInt(claseTxt, 10);
    const claseNueva = Number.isFinite(claseNum) && String(claseNum) === claseTxt ? String(claseNum + 1) : (claseTxt ? claseTxt + ' (copia)' : '');
    setModo({
      tipo: 'editor', base: {
        slug: '', curso: a.curso, edicion: a.edicion || '', clase: claseNueva, titulo: (a.titulo || '') + ' (copia)', intro: a.intro || '',
        estado: 'Borrador', fechaDisponible: '', fechaCierre: '', mostrarResultado: a.mostrarResultado !== false,
        preguntas: (a.preguntas || []).map((p) => ({ ...p, opciones: [...(p.opciones || [])] })), _nuevo: true
      }
    });
  }
  function verDetalle(a) { setModo({ tipo: 'detalle', act: a }); }
  function cerrarModo() { setModo(null); }
  function guardado() { setModo(null); cargar(); }

  // Tres acciones destructivas/sensibles pedidas por Diego para el editor (menú "…"): cerrar
  // ahora, despublicar y eliminar. Las tres piden confirmación con un mensaje que explica
  // claramente qué va a pasar (pedido explícito de Diego), y las tres refrescan el listado y
  // cierran el editor al terminar (no tiene sentido seguir editando algo que ya cambió de estado
  // o que se borró).
  async function cerrarAhora(a) {
    if (!(await confirmar({ titulo: 'Cerrar actividad', textoConfirmar: 'Cerrar ahora', mensaje: `¿Cerrar "${a.titulo}" ahora?\n\nA partir de este momento ya no se van a aceptar nuevas respuestas. La actividad va a mostrarse como "Cerrada" para los estudiantes.`}))) return;
    await guardarCampo(a, { fechaCierre: hoyISO() });
    cerrarModo(); cargar();
  }
  async function despublicar(a) {
    if (!(await confirmar({ titulo: 'Despublicar actividad', textoConfirmar: 'Despublicar', mensaje: `¿Despublicar "${a.titulo}"?\n\nVa a volver a estado "Borrador": deja de estar visible para los estudiantes hasta que la publiques de nuevo. Las respuestas que ya tiene no se borran.`}))) return;
    await guardarCampo(a, { estado: 'Borrador' });
    cerrarModo(); cargar();
  }
  async function eliminarActividad(a) {
    const avisoResp = a.totalRespuestas > 0 ? `\n\nYa tiene ${a.totalRespuestas} respuesta${a.totalRespuestas === 1 ? '' : 's'} registrada${a.totalRespuestas === 1 ? '' : 's'}: esas respuestas NO se borran, quedan en el historial, pero la actividad va a desaparecer del listado.` : '';
    if (!(await confirmar({ titulo: 'Eliminar actividad', textoConfirmar: 'Eliminar', peligro: true, mensaje: `¿Eliminar "${a.titulo}"?\n\nEsta acción no se puede deshacer. La actividad deja de estar disponible para siempre.${avisoResp}`}))) return;
    try {
      const res = await fetch('/api/actividades', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: a.slug })
      });
      const data = await res.json();
      if (data.ok) showToast(' Actividad eliminada');
      else showToast(data.error || 'No se pudo eliminar');
    } catch { showToast('Error de conexión'); }
    cerrarModo(); cargar();
  }

  // Edición rápida de Edición/Clase directo desde la tabla (sin abrir el editor completo).
  // "Edición" acepta también la palabra "Todas" (la actividad no está atada a una edición puntual).
  async function guardarCampo(a, patch) {
    setActs((prev) => prev.map((x) => (x.slug === a.slug ? { ...x, ...patch } : x)));
    try {
      const res = await fetch('/api/actividades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitanteEmail: usuario.email, slug: a.slug, curso: a.curso, titulo: a.titulo,
          clase: a.clase, estado: a.estado, edicion: a.edicion, intro: a.intro, fechaDisponible: a.fechaDisponible, horaDisponible: a.horaDisponible, fechaCierre: a.fechaCierre,
          mostrarResultado: a.mostrarResultado !== false, orden: a.orden || 0, preguntas: a.preguntas, ...patch
        })
      });
      const data = await res.json();
      if (data.ok) showToast(' Guardado');
      else { showToast(data.error || 'No se pudo guardar'); cargar(); }
    } catch { showToast('Error de conexión'); cargar(); }
  }

  if (!acts) return <div className="spin" />;

  if (modo?.tipo === 'editor') {
    // otrasActividades: todas menos la que se está editando (si es nueva, "slug" viene vacío y
    // no matchea nada, así que quedan todas) — se usa para el picker de "Reutilizar pregunta".
    const otras = acts.filter((x) => x.slug !== modo.base.slug);
    return (
      <EditorActividad
        usuario={usuario} base={modo.base} showToast={showToast} onGuardado={guardado} onCancelar={cerrarModo}
        otrasActividades={otras}
        onCerrarAhora={cerrarAhora}
        onDespublicar={despublicar}
        onEliminar={eliminarActividad}
      />
    );
  }
  if (modo?.tipo === 'detalle') {
    const actual = acts.find((x) => x.slug === modo.act.slug) || modo.act;
    return <DetalleActividad a={actual} puedeGestionar={puedeGestionar} showToast={showToast} onEditar={editar} onDuplicar={duplicar} onVolver={cerrarModo} onGuardarCampo={guardarCampo} />;
  }

  const qq = (q || '').trim().toLowerCase();
  const cursosDisp = [...new Set(acts.map((a) => a.curso).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
  const edicionesDisp = [...new Set(acts.map((a) => a.edicion).filter(Boolean))].sort((a, b) => (Number(a) - Number(b)) || a.localeCompare(b));

  const base = acts.filter((a) => {
    const efectivo = estadoEfectivoCliente(a);
    if (fEstado) { if (efectivo !== fEstado) return false; }
    else if (efectivo === 'Archivada' && !mostrarArch) return false;
    if (fCurso && a.curso !== fCurso) return false;
    if (fEd && (a.edicion || '') !== fEd) return false;
    return true;
  });
  const filtradasSinOrden = qq ? base.filter((a) => [a.titulo, a.curso, a.clase, a.edicion, a.estado, a.slug].filter(Boolean).join(' ').toLowerCase().includes(qq)) : base;
  const filtradas = ordenarActividades(filtradasSinOrden, orden);
  const archivadasOcultas = (!fEstado && !mostrarArch) ? acts.filter((a) => estadoEfectivoCliente(a) === 'Archivada').length : 0;
  const hayFiltros = q || fCurso || fEd || fEstado;
  // Chips por curso (pedido de Diego): en vez del combo "Curso: todos". Los contadores aplican todos los filtros MENOS el de curso,
  // así al elegir un curso los demás siguen mostrando cuántas actividades tendrían (mismo criterio que los chips de Fichas).
  const baseSinCurso = acts.filter((a) => {
    const efectivo = estadoEfectivoCliente(a);
    if (fEstado) { if (efectivo !== fEstado) return false; }
    else if (efectivo === 'Archivada' && !mostrarArch) return false;
    if (fEd && (a.edicion || '') !== fEd) return false;
    if (qq && ![a.titulo, a.curso, a.clase, a.edicion, a.estado, a.slug].filter(Boolean).join(' ').toLowerCase().includes(qq)) return false;
    return true;
  });

  return (
    <div>
      <div className="sechead">
        <span className="hcount">{filtradas.length} actividad{filtradas.length === 1 ? '' : 'es'}</span>
        <span className="grow" />
        {/* El buscador de texto libre queda solo en el ícono  de arriba del todo (pestaña
            Buscador, busca en toda la app) — antes había acá un botón "Buscar" que lo
            duplicaba (pedido de Diego: "ES INNECESARIO ESTA ARRIBA", "evitemos botones
            innecesarios y repetidos"); quedan solo los filtros propios de esta lista
            (Curso/Edición/Estado), que el buscador global no cubre. */}
        <SelectDropdown placeholder="Edición: todas" searchable value={fEd} onChange={setFEd} options={edicionesDisp.map((ed) => ({ value: ed, label: 'Ed. ' + ed }))} />
        <SelectDropdown placeholder="Estado: todos" value={fEstado} onChange={setFEstado} options={['Publicada', 'Programada', 'Borrador', 'Archivada'].map((x) => ({ value: x, label: x }))} />
        {hayFiltros && <button className="btn-sm" onClick={() => { setQ(''); setFCurso(''); setFEd(''); setFEstado(''); }}>Limpiar</button>}
        <SelectDropdown value={orden} onChange={cambiarOrden} options={ORDENES.map((o) => ({ value: o.v, label: 'Ordenar: ' + o.l }))} />
        <button className={'btn-sm' + (agrupar ? ' solid' : '')} onClick={toggleAgrupar} title="Agrupar por curso y edición">▤ Agrupar</button>
        <div className="vista-toggle">
          <button className={vista === 'cards' ? 'on' : ''} onClick={() => cambiarVista('cards')} title="Ver en tarjetas">▦</button>
          <button className={vista === 'lista' ? 'on' : ''} onClick={() => cambiarVista('lista')} title="Ver en lista"></button>
        </div>
        {puedeGestionar && <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 18px' }} onClick={nueva}>+ Nueva actividad</button>}
      </div>

      {cursosDisp.length > 1 && (
        <div className="fchips fchips-sm" role="group" aria-label="Filtrar por curso">
          <button className={'fchip' + (fCurso === '' ? ' on' : '')} onClick={() => setFCurso('')}>Todos <span className="cnt">{baseSinCurso.length}</span></button>
          {cursosDisp.map((c) => (
            <button key={c} className={'fchip' + (fCurso === c ? ' on' : '')} onClick={() => setFCurso(fCurso === c ? '' : c)} aria-pressed={fCurso === c}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: colorCurso(c), display: 'inline-block' }} />
              {c} <span className="cnt">{baseSinCurso.filter((a) => a.curso === c).length}</span>
            </button>
          ))}
        </div>
      )}

      {archivadasOcultas > 0 && (
        <label className="acts-toggle-arch" style={{ marginBottom: 10 }}>
          <input type="checkbox" checked={mostrarArch} onChange={(e) => setMostrarArch(e.target.checked)} />
          Mostrar {archivadasOcultas} archivada{archivadasOcultas === 1 ? '' : 's'}
        </label>
      )}

      {acts.length === 0 ? (
        <div className="empty"><div className="ico"></div><h3>No hay actividades todavía</h3><p>{puedeGestionar ? 'Creá tu primera actividad (Postwork).' : 'Todavía no se cargaron actividades.'}</p></div>
      ) : filtradas.length === 0 ? (
        <div className="empty empty-sm"><p>No encontramos actividades con estos filtros.</p></div>
      ) : agrupar ? (
        agruparPorCurso(filtradas).map((g) => (
          <details className="acts-grupo" key={g.curso} open>
            <summary><span className="arw"></span><span className="nm">{g.curso}</span><span className="muted">{g.items.length} actividad{g.items.length === 1 ? '' : 'es'}</span></summary>
            <div className="acts-grupo-body">
              {g.porEdicion.map((sg) => (
                <div key={sg.edicion || '_sin'}>
                  <div className="acts-subgrupo-lbl">{sg.edicion ? `Edición ${sg.edicion}` : 'Sin edición asignada'}</div>
                  {vista === 'lista'
                    ? <TablaActividades items={sg.items} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} onGuardarCampo={guardarCampo} />
                    : <GridActividades items={sg.items} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} showToast={showToast} />}
                </div>
              ))}
            </div>
          </details>
        ))
      ) : vista === 'lista' ? (
        <TablaActividades items={filtradas} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} onGuardarCampo={guardarCampo} />
      ) : (
        <GridActividades items={filtradas} puedeGestionar={puedeGestionar} onEditar={editar} onDuplicar={duplicar} onDetalle={verDetalle} showToast={showToast} />
      )}
    </div>
  );
});

// Pedido de Diego: poder leer las respuestas de desarrollo (abiertas) — antes esta pantalla
// solo mostraba el puntaje total, sin ninguna forma de ver lo que escribió cada estudiante.
function ModalRespuestaDetalle({ x, onCerrar }) {
  // Pedido de Diego (06/10/2026): al apretar "Ver" en una respuesta, además de lo que escribió en las preguntas abiertas,
  // hay que poder ver las preguntas CERRADAS (opción múltiple) con lo que eligió y si estuvo bien o mal, y cuál era la correcta.
  // Antes solo recorría las abiertas y, si no había, decía "no tiene preguntas de respuesta abierta" aunque hubiera 10 cerradas.
  const [soloIncorrectas, setSoloIncorrectas] = useState(false);
  const todas = (x.detalle || []).map((d, i) => ({ ...d, n: i + 1 }));
  const cerradas = todas.filter((d) => d.tipo !== 'abierta');
  const abiertas = todas.filter((d) => d.tipo === 'abierta');
  const incorrectas = cerradas.filter((d) => d.ok === false);
  const verCerradas = soloIncorrectas ? incorrectas : cerradas;
  return (
    <div className="mwrap on" onClick={onCerrar}>
      <div className="modal" style={{ maxWidth: 600, maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{x.actividad}</h3>
        <p className="muted" style={{ fontSize: 12.5, marginTop: -6 }}>{x.nombre || x.email} · {x.curso}{x.edicion ? ` · Ed. ${x.edicion}` : ''}{cerradas.length ? ` · ${x.puntaje}/${x.total} correctas en las cerradas` : ''}</p>
        {todas.length === 0 && <p className="muted">No encontramos las preguntas de esta actividad (puede haberse modificado o eliminado después de que se respondió).</p>}
        {cerradas.length > 0 && (
          <>
            <div className="fchips fchips-sm" style={{ marginBottom: 10 }}>
              <button className={'fchip' + (!soloIncorrectas ? ' on' : '')} onClick={() => setSoloIncorrectas(false)}>Todas <span className="cnt">{cerradas.length}</span></button>
              <button className={'fchip' + (soloIncorrectas ? ' on' : '')} onClick={() => setSoloIncorrectas(true)} disabled={incorrectas.length === 0}>Incorrectas <span className="cnt">{incorrectas.length}</span></button>
            </div>
            {verCerradas.map((d) => (
              <div key={d.n} className="detalle-preg">
                <div className="detalle-preg-head">
                  <span className="detalle-preg-num">{d.n}</span>
                  <b style={{ fontSize: 13.5 }}>{d.pregunta}</b>
                </div>
                <div className={'detalle-op ' + (d.ok ? 'ok' : 'mal')}>
                  <span className={d.ok ? 'detalle-op-check' : 'detalle-op-cruz'} aria-hidden="true">{d.ok ? '✓' : '✕'}</span>
                  <span><span className="muted" style={{ fontWeight: 500 }}>{d.ok ? 'Respondió (correcta): ' : 'Respondió: '}</span>{d.opcionElegida != null && d.opcionElegida !== '' ? d.opcionElegida : <i>(sin responder)</i>}</span>
                </div>
                {!d.ok && d.opcionCorrecta != null && (
                  <div className="detalle-op ok"><span className="detalle-op-check" aria-hidden="true">✓</span><span><span className="muted" style={{ fontWeight: 500 }}>Correcta: </span>{d.opcionCorrecta}</span></div>
                )}
              </div>
            ))}
            {soloIncorrectas && incorrectas.length === 0 && <p className="muted">No hay respuestas incorrectas.</p>}
          </>
        )}
        {abiertas.length > 0 && (
          <>
            <div className="sectitle" style={{ margin: '14px 0 8px', fontSize: 12.5, letterSpacing: 1, textTransform: 'uppercase', color: 'rgb(var(--textMuted))' }}>Respuestas abiertas</div>
            {abiertas.map((d) => (
              <div key={d.n} className="detalle-preg">
                <div className="detalle-preg-head">
                  <span className="detalle-preg-num">{d.n}</span>
                  <b style={{ fontSize: 13.5 }}>{d.pregunta}</b>
                </div>
                <div className="detalle-op" style={{ whiteSpace: 'pre-wrap' }}>{d.respuesta ? String(d.respuesta) : <span className="muted">(sin responder)</span>}</div>
              </div>
            ))}
          </>
        )}
        <button className="btn-sm" style={{ marginTop: 14 }} onClick={onCerrar}>Cerrar</button>
      </div>
    </div>
  );
}

function Respuestas({ usuario, irABuscador, showToast }) {
  const { confirmar, avisar } = useDialogos();
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [fCurso, setFCurso] = useState(''); const [fEd, setFEd] = useState(''); const [fAct, setFAct] = useState('');
  const [detalleAbierto, setDetalleAbierto] = useState(null);
  const puedeEliminar = tienePermisoEliminarRespuestas(usuario);
  useEffect(() => { (async () => {
    const res = await fetch('/api/actividades/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setData(d.ok ? d : { respuestas: [] });
  })(); /* eslint-disable-next-line */ }, []);

  // Pedido de Diego: "Super Admin puede eliminar rtas" — baja lógica desde acá mismo, con
  // confirmación (misma UX que ya usa el resto de la app para borrar cosas que no se pueden
  // deshacer, ver EditorActividad.eliminar más arriba en este archivo).
  async function eliminarRespuesta(x) {
    if (!(await confirmar({ titulo: 'Eliminar respuesta', textoConfirmar: 'Eliminar', peligro: true, mensaje: `¿Eliminar la respuesta de ${x.nombre || x.email || 'esta persona'} en "${x.actividad}"?\n\nEsta acción no se puede deshacer.`}))) return;
    try {
      const res = await fetch('/api/actividades/respuestas', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, id: x.id })
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo eliminar');
      setData((prev) => ({ ...prev, respuestas: (prev.respuestas || []).filter((r) => r.id !== x.id) }));
      showToast && showToast(' Respuesta eliminada');
    } catch (e) {
      showToast ? showToast(' ' + (e.message || 'Error de conexión')) : avisar(e.message || 'Error de conexión', 'error');
    }
  }

  const r = data?.respuestas || [];
  const cursos = useMemo(() => [...new Set(r.map((x) => x.curso).filter(Boolean))].sort(), [r]);
  const ediciones = useMemo(() => [...new Set(r.map((x) => x.edicion).filter(Boolean))].sort(), [r]);
  const actividades = useMemo(() => [...new Set(r.map((x) => x.actividad).filter(Boolean))].sort(), [r]);
  const filtradas = useMemo(() => {
    const qq = norm(q);
    return r.filter((x) => {
      if (fCurso && x.curso !== fCurso) return false;
      if (fEd && x.edicion !== fEd) return false;
      if (fAct && x.actividad !== fAct) return false;
      if (qq && !norm(`${x.nombre} ${x.email}`).includes(qq)) return false;
      return true;
      // Más recientes primero, mismo criterio que la tabla de Fichas completadas (pedido de Diego).
    }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || ''));
  }, [r, q, fCurso, fEd, fAct]);
  // Chips de curso (pedido de Diego: "acá también debería haber chips"): reemplazan al combo "Curso: todos". Los contadores
  // aplican todos los filtros MENOS el de curso, así al elegir uno los demás siguen mostrando cuántas respuestas tendrían.
  const baseSinCurso = useMemo(() => {
    const qq = norm(q);
    return r.filter((x) => {
      if (fEd && x.edicion !== fEd) return false;
      if (fAct && x.actividad !== fAct) return false;
      if (qq && !norm(`${x.nombre} ${x.email}`).includes(qq)) return false;
      return true;
    });
  }, [r, q, fEd, fAct]);
  if (!data) return <div className="spin" />;

  // Nota: antes acá había una barra de KPIs (respuestas/estudiantes/actividades/promedio) que
  // duplicaba números que Reportes ya muestra — se saca (pedido de Diego: los números agregados
  // viven solo en Reportes; acá queda la gestión/búsqueda de respuestas individuales).
  return (
    <>
      <div className="filters">
        {/* Mismo motivo que en la lista de Actividades: el buscador de texto libre ya está en
            el ícono  de arriba del todo, este botón local lo duplicaba. */}
        <SelectDropdown placeholder="Edición: todas" searchable value={fEd} onChange={setFEd} options={ediciones.map((x) => ({ value: x, label: 'Ed. ' + x }))} />
        <SelectDropdown placeholder="Actividad: todas" searchable value={fAct} onChange={setFAct} options={actividades.map((x) => ({ value: x, label: x }))} />
        {(q || fCurso || fEd || fAct) && <button className="btn-sm" onClick={() => { setQ(''); setFCurso(''); setFEd(''); setFAct(''); }}>Limpiar</button>}
      </div>
      {cursos.length > 1 && (
        <div className="fchips fchips-sm" role="group" aria-label="Filtrar por curso">
          <button className={'fchip' + (fCurso === '' ? ' on' : '')} onClick={() => setFCurso('')}>Todos <span className="cnt">{baseSinCurso.length}</span></button>
          {cursos.map((c) => (
            <button key={c} className={'fchip' + (fCurso === c ? ' on' : '')} onClick={() => setFCurso(fCurso === c ? '' : c)} aria-pressed={fCurso === c}>
              <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 99, background: colorCurso(c), display: 'inline-block' }} />
              {c} <span className="cnt">{baseSinCurso.filter((x) => x.curso === c).length}</span>
            </button>
          ))}
        </div>
      )}
      {data.alcance === 'docente' && <p className="muted" style={{ fontSize: 12, marginTop: -4, marginBottom: 10 }}>Mostrando solo tus cursos/ediciones asignados.</p>}
      {filtradas.length === 0 ? <div className="empty empty-sm"><p>No encontramos respuestas con estos filtros.</p></div> : (
        <div className="tablewrap"><table>
          {/* Pedido de Diego: misma estructura de orden en las tres tablas de "Respuestas" —
              a la izquierda de todo, Fecha y después Nombre/Estudiante (Formularios.jsx ya
              tenía este orden; acá y en Fichas completadas se alinean a ese mismo criterio). */}
          <thead><tr>
            <th style={{ minWidth: 120 }}>Fecha</th><th style={{ minWidth: 150 }}>Nombre</th><th style={{ minWidth: 130 }}>Curso</th><th style={{ minWidth: 78 }}>Edición</th>
            <th style={{ minWidth: 160 }}>Actividad</th><th style={{ minWidth: 180 }}>Email</th><th style={{ minWidth: 90 }}>Tiempo</th>
            <th style={{ minWidth: 80, textAlign: 'right' }}>Puntaje</th><th style={{ minWidth: 70 }}></th>{puedeEliminar && <th style={{ minWidth: 40 }}></th>}
          </tr></thead>
          <tbody>{filtradas.map((x) => {
            const abiertas = (x.detalle || []).filter((d) => d.tipo === 'abierta');
            return (
            <tr key={x.id}>
              <td><CeldaFechaRecienteAct iso={x.fecha} /></td>
              <td>{x.nombre || '—'}</td>
              <td><span style={{ color: colorCurso(x.curso) }}>{x.curso}</span></td>
              <td>{x.edicion || '—'}</td>
              {/* Pedido de Diego: diferenciar las actividades por color — se reutiliza el
                  mismo color del curso (colorCurso) que ya tiñe la columna "Curso", para no
                  inventar una paleta nueva por actividad. */}
              <td style={{ color: colorCurso(x.curso) }}>{x.actividad}</td>
              <td className="sec">{x.email}</td>
              <td className="sec">{fmtTiempo(x.duracion)}</td>
              <td style={{ textAlign: 'right' }}><b style={{ color: colorPorPuntaje(x.puntaje, x.total) }}>{x.puntaje}/{x.total}</b></td>
              {/* Pedido de Diego: "acá falta que se pueda ver" — antes el botón "Ver" solo
                  aparecía si la actividad tenía preguntas abiertas; ahora siempre está para
                  poder revisar el detalle (el modal ya avisa cuando no hay abiertas). */}
              <td><button className="btn-sm" onClick={() => setDetalleAbierto(x)} title="Ver detalle de la respuesta"> Ver{abiertas.length > 0 ? ` (${abiertas.length})` : ''}</button></td>
              {/* Pedido de Diego: "Super Admin puede eliminar rtas" — solo visible con permiso
                  (tienePermisoEliminarRespuestas, hoy equivale a rol Admin). */}
              {puedeEliminar && <td><button className="btn-sm" style={{ color: 'rgb(248 113 113)' }} onClick={() => eliminarRespuesta(x)} title="Eliminar esta respuesta"></button></td>}
            </tr>
            );
          })}</tbody>
        </table></div>
      )}
      {detalleAbierto && <ModalRespuestaDetalle x={detalleAbierto} onCerrar={() => setDetalleAbierto(null)} />}
    </>
  );
}

