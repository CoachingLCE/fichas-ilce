'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CURSOS, colorCurso } from '../lib/constants';
import FormularioForm from './FormularioForm';
import { estadoNuevo, estadoActividadEspecial, aEstado, validar, aPayload, paraVistaPrevia, slugify, TIPOS_UI, LIMITES } from '../lib/formularioConstructor';

// Constructor de formularios (pedido de Diego: estilo "Nueva edición" de Presentismo — el formulario a la izquierda, por
// secciones, y una VISTA PREVIA que se va armando en vivo a la derecha). La vista previa es el formulario público REAL
// (FormularioForm), así que lo que se ve acá es exactamente lo que va a ver quien responda.
//
// Un formulario puede NO estar relacionado con ningún curso o programa: "Sin curso ni programa" es el valor por defecto.
const MODOS = [
  ['ninguno', 'Sin curso ni programa', 'Para encuestas o trámites que no son de ningún curso. Las respuestas quedan "Sin curso".'],
  ['fijo', 'Un curso fijo', 'Todas las respuestas quedan asociadas a ese curso, sin preguntarlo.'],
  ['elige', 'Que lo elija quien responde', 'Se agrega una pregunta "Curso" con la lista de cursos.']
];

function Campo({ label, req, err, help, children }) {
  return (
    <div className="cf-f">
      <label>{label}{req && <span className="cf-req"> *</span>}</label>
      {children}
      {err && <div className="cf-err">{err}</div>}
      {help && <div className="cf-help">{help}</div>}
    </div>
  );
}

export default function ConstructorFormulario({ usuario, slugInicial, preseed, onVolver, showToast }) {
  const [forms, setForms] = useState(null);
  const [est, setEst] = useState(null);
  const [tituloOriginal, setTituloOriginal] = useState('');
  const [errores, setErrores] = useState({});
  const [errorGlobal, setErrorGlobal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const arriba = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/formularios?solicitanteEmail=' + encodeURIComponent(usuario.email));
        const d = await res.json();
        if (!d.ok) throw new Error(d.error || 'No se pudieron cargar los formularios');
        setForms(d.formularios || []);
        if (slugInicial) {
          const def = (d.formularios || []).find((f) => f.slug === slugInicial);
          if (!def) { setNoEncontrado(true); return; }
          setEst(aEstado(def)); setTituloOriginal(def.titulo || '');
        } else setEst(preseed && preseed.actividad ? estadoActividadEspecial(preseed.actividad) : estadoNuevo());
      } catch (e) { setErrorGlobal(e.message || 'Error de conexión'); setForms([]); setEst(slugInicial ? null : (preseed && preseed.actividad ? estadoActividadEspecial(preseed.actividad) : estadoNuevo())); }
    })();
    /* eslint-disable-next-line */
  }, []);

  const slugsExistentes = useMemo(() => (forms || []).map((f) => f.slug), [forms]);
  const cursosValidos = useMemo(() => CURSOS.map((c) => c.nombre), []);
  const formVista = useMemo(() => (est ? paraVistaPrevia(est) : null), [est]);

  if (noEncontrado) return <div className="empty"><div className="ico"></div><h3>No encontramos ese formulario</h3><p>Puede que se haya borrado de la hoja.</p><button className="btn-sm" onClick={() => onVolver(false)}>Volver a la lista</button></div>;
  if (!est) return errorGlobal ? <div className="empty"><h3>No se pudo cargar</h3><p>{errorGlobal}</p><button className="btn-sm" onClick={() => onVolver(false)}>Volver</button></div> : <div className="spin" />;

  const set = (patch) => { setEst((s) => ({ ...s, ...patch })); setErrores({}); setErrorGlobal(''); };
  const setPreg = (id, patch) => { setEst((s) => ({ ...s, preguntas: s.preguntas.map((q) => (q.id === id ? { ...q, ...patch } : q)) })); setErrores((e) => ({ ...e, ['q' + id]: undefined })); setErrorGlobal(''); };
  const slugActual = est.slugEditado ? est.slug : slugify(est.titulo);
  const nId = () => Math.max(0, ...est.preguntas.map((q) => q.id)) + 1;
  const agregar = () => { if (est.preguntas.length >= LIMITES.preguntas) return; setEst((s) => ({ ...s, preguntas: [...s.preguntas, { id: nId(), key: '', label: '', tipoUi: 'texto', tipoCambiado: true, orig: null, req: false, ops: '', filas: '', cols: '' }] })); };
  const quitar = (id) => setEst((s) => ({ ...s, preguntas: s.preguntas.filter((q) => q.id !== id) }));
  const mover = (id, d) => setEst((s) => { const L = [...s.preguntas]; const i = L.findIndex((q) => q.id === id); const j = i + d; if (j < 0 || j >= L.length) return s; [L[i], L[j]] = [L[j], L[i]]; return { ...s, preguntas: L }; });

  async function guardar() {
    const e = validar(est, { slugsExistentes, cursosValidos });
    setErrores(e);
    if (Object.keys(e).length) { setErrorGlobal('Revisá los campos marcados en rojo.'); arriba.current && arriba.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    setGuardando(true); setErrorGlobal('');
    try {
      const res = await fetch('/api/formularios', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, crear: !est.editando, ...aPayload(est) })
      });
      const d = await res.json();
      if (!d.ok) { setErrorGlobal(d.error || 'No se pudo guardar'); setGuardando(false); return; }
      showToast && showToast(est.editando ? 'Formulario guardado' : 'Formulario creado');
      onVolver(true);
    } catch { setErrorGlobal('Error de conexión'); setGuardando(false); }
  }

  const tituloCambio = est.editando && tituloOriginal && est.titulo.trim() !== tituloOriginal.trim();
  const colorCursoFijo = est.cursoFijo ? colorCurso(est.cursoFijo) : null;

  return (
    <div className="cf-wrap" ref={arriba}>
      <div className="cf-top">
        <button className="btn-sm" onClick={() => onVolver(false)}>← Volver a la lista</button>
        <div>
          <h2 className="cf-h1">{est.editando ? 'Editar formulario' : (preseed && preseed.actividad ? `Nueva actividad especial · ${est.tipo || 'Actividad'}` : 'Nuevo formulario')}</h2>
          <p className="cf-sub">Armá la encuesta o el formulario y mirá, a la derecha, cómo lo va a ver quien responde.</p>
        </div>
      </div>
      {errorGlobal && <div className="cf-bad" role="alert">{errorGlobal}</div>}

      <div className="cf-grid">
        <div className="cf-card">
          <div className="cf-sec">
            <p className="cf-sec-t">Información general</p>
            <Campo label="Título" req err={errores.titulo} help={tituloCambio ? 'Ojo: las respuestas que ya recibió se guardaron con el título anterior y en "Respuestas" van a figurar como otro formulario.' : null}>
              <input className={'ctrl' + (errores.titulo ? ' err' : '')} value={est.titulo} maxLength={LIMITES.titulo + 20} placeholder="Ej: Encuesta de satisfacción 2026" onChange={(e) => set({ titulo: e.target.value })} />
            </Campo>
            <Campo label="Introducción" err={errores.intro}>
              <textarea className="ctrl" style={{ minHeight: 70, resize: 'vertical' }} value={est.intro} placeholder="Texto que se muestra arriba del formulario (opcional)" onChange={(e) => set({ intro: e.target.value })} />
            </Campo>
            <Campo label="Curso o programa" err={errores.curso} help={est.editando ? 'Cambiarlo no modifica las respuestas que ya recibió el formulario.' : null}>
              <div className="cf-modos" role="radiogroup" aria-label="Curso o programa">
                {MODOS.map(([k, t, d]) => (
                  <button key={k} type="button" role="radio" aria-checked={est.modo === k} className={'cf-modo' + (est.modo === k ? ' on' : '')} onClick={() => set({ modo: k })}>
                    <b>{t}</b><span>{d}</span>
                  </button>
                ))}
              </div>
            </Campo>
            {est.modo === 'fijo' && (
              <Campo label="Curso" req err={errores.curso}>
                <div className="cf-curso">
                  <span className="cf-dot" style={{ background: colorCursoFijo || 'rgb(var(--textMuted))' }} />
                  <select className={'ctrl' + (errores.curso ? ' err' : '')} value={est.cursoFijo} onChange={(e) => set({ cursoFijo: e.target.value })}>
                    <option value="">Elegí un curso…</option>
                    {CURSOS.map((c) => <option key={c.slug} value={c.nombre}>{c.nombre}</option>)}
                  </select>
                </div>
              </Campo>
            )}
            {est.modo === 'elige' && (
              <label className="cf-sw"><input type="checkbox" checked={est.cursoReq} onChange={(e) => set({ cursoReq: e.target.checked })} /> La pregunta "Curso" es obligatoria</label>
            )}
          </div>

          <div className="cf-sec">
            <p className="cf-sec-t">Preguntas</p>
            <div className="cf-q cf-q-lock"><span className="cf-q-n">✉</span><div><b>Correo electrónico</b> <span className="cf-req">*</span><div className="cf-help" style={{ margin: 0 }}>Siempre se pide, para poder identificar la respuesta: no se puede quitar.</div></div></div>
            {est.preguntas.map((q, i) => (
              <div key={q.id} className="cf-q">
                <div className="cf-q-h">
                  <span className="cf-q-n">{i + 1}</span>
                  <input className={'ctrl' + (errores['q' + q.id] ? ' err' : '')} aria-label={`Pregunta ${i + 1}`} value={q.label} maxLength={LIMITES.pregunta + 20} placeholder="Escribí la pregunta" onChange={(e) => setPreg(q.id, { label: e.target.value })} />
                  <button className="btn-sm" type="button" onClick={() => mover(q.id, -1)} disabled={i === 0} title="Subir" aria-label="Subir">↑</button>
                  <button className="btn-sm" type="button" onClick={() => mover(q.id, 1)} disabled={i === est.preguntas.length - 1} title="Bajar" aria-label="Bajar">↓</button>
                  <button className="btn-sm cf-x" type="button" onClick={() => quitar(q.id)} title="Quitar" aria-label="Quitar pregunta">✕</button>
                </div>
                {errores['q' + q.id] && <div className="cf-err" style={{ margin: '-4px 0 8px 32px' }}>{errores['q' + q.id]}</div>}
                <div className="cf-q-r">
                  <select className="ctrl" aria-label="Tipo de pregunta" value={q.tipoUi} onChange={(e) => setPreg(q.id, { tipoUi: e.target.value, tipoCambiado: true })}>
                    {TIPOS_UI.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                  <label><input type="checkbox" checked={q.req} onChange={(e) => setPreg(q.id, { req: e.target.checked })} /> Obligatoria</label>
                </div>
                {q.tipoUi === 'lista' && (
                  <div className="cf-ops">
                    <textarea className={'ctrl' + (errores['q' + q.id] ? ' err' : '')} aria-label="Opciones" value={q.ops} placeholder={(q.orig && q.orig.tipo === 'select' && !q.tipoCambiado) ? 'Sin opciones propias: usa la lista de cursos' : 'Una opción por línea'} onChange={(e) => setPreg(q.id, { ops: e.target.value })} />
                  </div>
                )}
                {q.tipoUi === 'grilla' && (
                  <div className="cf-ops">
                    <textarea className={'ctrl' + (errores['q' + q.id] ? ' err' : '')} aria-label="Filas" value={q.filas} placeholder={'Filas, una por línea (ej.: Lunes, Martes…)'} onChange={(e) => setPreg(q.id, { filas: e.target.value })} />
                    <textarea className={'ctrl' + (errores['q' + q.id] ? ' err' : '')} aria-label="Columnas" style={{ marginTop: 6 }} value={q.cols} placeholder={'Columnas, una por línea (ej.: 10 a 11, 11 a 12…)'} onChange={(e) => setPreg(q.id, { cols: e.target.value })} />
                  </div>
                )}
              </div>
            ))}
            <button className="btn-sm" type="button" onClick={agregar} disabled={est.preguntas.length >= LIMITES.preguntas}>+ Agregar pregunta</button>
          </div>

          <div className="cf-sec">
            <p className="cf-sec-t">Publicación</p>
            <div className="cf-row">
              <Campo label="Estado" help={est.estado === 'Publicada' ? 'Cualquiera con el enlace puede responder.' : 'Solo se ve desde acá hasta que lo publiques.'}>
                <div className="cf-seg" role="group" aria-label="Estado">
                  {['Borrador', 'Publicada'].concat(est.estado === 'Archivada' ? ['Archivada'] : []).map((x) => (
                    <button key={x} type="button" className={est.estado === x ? 'on' : ''} onClick={() => set({ estado: x })}>{x}</button>
                  ))}
                </div>
              </Campo>
              <Campo label="Etiqueta (opcional)">
                <input className="ctrl" value={est.tipo} maxLength={LIMITES.etiqueta + 10} placeholder="Ej: Encuesta, Trámite, Masterclass" onChange={(e) => set({ tipo: e.target.value })} />
              </Campo>
            </div>
            <Campo label="Enlace" err={errores.slug} help={est.editando ? 'No se puede cambiar: es el enlace que ya compartiste.' : <>fichas-ilce.vercel.app/formulario/<b>{slugActual || '…'}</b></>}>
              <input className={'ctrl' + (errores.slug ? ' err' : '')} value={slugActual} disabled={est.editando} placeholder="se-arma-con-el-titulo" onChange={(e) => set({ slug: e.target.value, slugEditado: true })} />
            </Campo>
          </div>

          <div className="cf-acts">
            <button className="btn btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : (est.editando ? 'Guardar cambios' : 'Crear formulario')}</button>
            <button className="btn" onClick={() => onVolver(false)} disabled={guardando}>Cancelar</button>
          </div>
        </div>

        <div className="cf-side">
          <div className="cf-card">
            <p className="cf-pv-t">Vista previa</p>
            <div className="cf-pv"><FormularioForm form={formVista} vistaPrevia /></div>
            <div className="cf-sum">
              <div><span>Curso</span><b>{est.modo === 'ninguno' ? 'Sin curso' : est.modo === 'fijo' ? (est.cursoFijo || '— sin elegir —') : 'Lo elige quien responde'}</b></div>
              <div><span>Preguntas</span><b>{est.preguntas.length + (est.modo === 'elige' ? 1 : 0)} + correo</b></div>
              <div><span>Estado</span><b>{est.estado}</b></div>
              <div><span>Enlace</span><b>/formulario/{slugActual || '…'}</b></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
