'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CURSOS, colorCurso } from '../lib/constants';
import FormularioForm from './FormularioForm';
import { estadoNuevo, estadoActividadEspecial, aEstado, validar, aPayload, paraVistaPrevia, slugify, TIPOS_UI, LIMITES } from '../lib/formularioConstructor';
import { LIM_CONF, VARIABLES, urlSegura } from '../lib/formularioConfirmacion';

// Constructor de formularios (pedido de Diego: estilo "Nueva edición" de Presentismo — el formulario a la izquierda, por
// secciones, y una VISTA PREVIA que se va armando en vivo a la derecha). La vista previa es el formulario público REAL
// (FormularioForm), así que lo que se ve acá es exactamente lo que va a ver quien responda.
//
// Un formulario puede NO estar relacionado con ningún curso o programa: "Sin curso ni programa" es el valor por defecto.
const MODOS = [
  ['ninguno', 'Sin curso ni programa', 'Encuestas o trámites que no son de un curso.'],
  ['fijo', 'Un curso fijo', 'Las respuestas quedan en ese curso.'],
  ['elige', 'Que lo elija quien responde', 'Se agrega la pregunta "Curso".']
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
  // Los pasos arrancan cerrados y se abren con un clic (pedido de Diego). Si al guardar hay errores, se abren solos los pasos que los tienen.
  const [abiertos, setAbiertos] = useState({ 1: false, 2: false, 3: false, 4: false });
  const alternar = (n) => setAbiertos((a) => ({ ...a, [n]: !a[n] }));
  const [errorGlobal, setErrorGlobal] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [pvFinal, setPvFinal] = useState(false); // vista previa: formulario o pantalla final
  const [probando, setProbando] = useState(false);
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

  // v1.86.0 · "Después de enviar": mensaje en pantalla y correo automático, por formulario.
  const conf = est.confirmacion;
  const setConf = (parte, patch) => set({ confirmacion: { ...conf, [parte]: { ...conf[parte], ...patch } } });
  const setBoton = (parte, i, patch) => setConf(parte, { botones: conf[parte].botones.map((b, j) => (j === i ? { ...b, ...patch } : b)) });
  const sumarBoton = (parte) => { if (conf[parte].botones.length < LIM_CONF.botones) setConf(parte, { botones: [...conf[parte].botones, { texto: '', url: '' }] }); };
  const quitarBoton = (parte, i) => setConf(parte, { botones: conf[parte].botones.filter((_, j) => j !== i) });
  async function probarCorreo() {
    setProbando(true);
    try {
      const res = await fetch('/api/formularios/prueba-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, formulario: est.titulo, curso: est.modo === 'fijo' ? est.cursoFijo : '', asunto: conf.email.asunto, cuerpo: conf.email.cuerpo, botones: conf.email.botones })
      });
      const d = await res.json();
      if (!d.ok) { setErrorGlobal(d.error || 'No se pudo enviar la prueba'); arriba.current && arriba.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else showToast && showToast('Te mandamos la prueba a ' + d.para);
    } catch { setErrorGlobal('Error de conexión'); }
    setProbando(false);
  }
  const botonesEditor = (parte) => (
    <div className="cf-btns">
      {conf[parte].botones.map((b, i) => {
        const urlMal = b.url.trim() !== '' && !urlSegura(b.url.trim());
        const sinTexto = b.url.trim() !== '' && b.texto.trim() === '';
        const sinUrl = b.texto.trim() !== '' && b.url.trim() === '';
        return (
          <div key={i} className="cf-btn-fila">
            <div className="cf-btn-campos">
              <div>
                <input className={'ctrl' + (sinTexto ? ' err' : '')} aria-label={`Texto del botón ${i + 1}`} value={b.texto} maxLength={LIM_CONF.boton} placeholder="Texto del botón" onChange={(e) => setBoton(parte, i, { texto: e.target.value })} />
                {sinTexto && <div className="cf-err">Falta el texto del botón.</div>}
              </div>
              <div>
                <input className={'ctrl' + (urlMal || sinUrl ? ' err' : '')} aria-label={`Enlace del botón ${i + 1}`} aria-invalid={urlMal || sinUrl} value={b.url} maxLength={LIM_CONF.url} placeholder="https://chat.whatsapp.com/…" onChange={(e) => setBoton(parte, i, { url: e.target.value })} />
                {urlMal && <div className="cf-err">El enlace tiene que empezar con https:// (copialo completo, con el https).</div>}
                {sinUrl && <div className="cf-err">Falta el enlace del botón.</div>}
              </div>
            </div>
            <button className="btn-sm cf-x" type="button" onClick={() => quitarBoton(parte, i)} title="Quitar botón" aria-label="Quitar botón">✕</button>
          </div>
        );
      })}
      {conf[parte].botones.length < LIM_CONF.botones && <button className="btn-sm" type="button" onClick={() => sumarBoton(parte)}>+ Agregar botón (ej.: grupo de WhatsApp)</button>}
    </div>
  );

  async function guardar() {
    const e = validar(est, { slugsExistentes, cursosValidos });
    setErrores(e);
    if (Object.keys(e).length) {
      const claves = Object.keys(e);
      setAbiertos((a) => ({
        ...a,
        1: a[1] || claves.some((k) => ['titulo', 'intro', 'curso'].includes(k)),
        2: a[2] || claves.some((k) => k.startsWith('q')),
        3: a[3] || claves.includes('confirmacion'),
        4: a[4] || claves.includes('slug')
      })); setErrorGlobal('Revisá los campos marcados en rojo.'); arriba.current && arriba.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
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
    <div className="cf-wrap cf-v2" ref={arriba} style={{ maxWidth: 1600 }}>
      <div className="cf-top">
        <button className="btn-sm" onClick={() => onVolver(false)}>← Volver a la lista</button>
        <div>
          <h2 className="cf-h1">{est.editando ? 'Editar formulario' : (preseed && preseed.actividad ? `Nueva actividad especial · ${est.tipo || 'Actividad'}` : 'Nuevo formulario')}</h2>
          <p className="cf-sub">Armá la encuesta o el formulario y mirá, a la derecha, cómo lo va a ver quien responde.</p>
        </div>
      </div>
      {errorGlobal && <div className="cf-bad" role="alert">{errorGlobal}</div>}

      <div className="cf-grid">
        <div className="cf-main">
          <section className="cf-sec cf-step">
            <button type="button" className="cf-step-h" onClick={() => alternar(1)} aria-expanded={abiertos[1]}>
              <span className="cf-step-n">1</span>
              <div className="cf-step-tt"><h3>Información general</h3><p>Título, introducción y a qué curso pertenece.</p></div>
              {!abiertos[1] && <span className="cf-step-sum">{est.titulo.trim() || 'Sin título todavía'}</span>}
              <span className="cf-step-chev" aria-hidden="true">{abiertos[1] ? '▴' : '▾'}</span>
            </button>
            <div className="cf-step-b" hidden={!abiertos[1]}>
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
            <label className="cf-sw cf-sw2"><input type="checkbox" checked={est.anonimo === true} onChange={(e) => set({ anonimo: e.target.checked })} /><span className="cf-switch-t" /><span>Formulario anónimo: no pedir el correo</span></label>
            {est.editando && est.anonimo !== true && <div className="cf-help">Desde ahora no se pide el correo. Lo ya recibido no cambia.</div>}
            {est.modo === 'elige' && (
              <label className="cf-sw cf-sw2"><input type="checkbox" checked={est.cursoReq} onChange={(e) => set({ cursoReq: e.target.checked })} /><span className="cf-switch-t" /><span>La pregunta "Curso" es obligatoria</span></label>
            )}
            </div>
          </section>

          <section className="cf-sec cf-step">
            <button type="button" className="cf-step-h" onClick={() => alternar(2)} aria-expanded={abiertos[2]}>
              <span className="cf-step-n">2</span>
              <div className="cf-step-tt"><h3>Preguntas</h3><p>Lo que va a completar quien responde.</p></div>
              {!abiertos[2] && <span className="cf-step-sum">{est.preguntas.length} {est.preguntas.length === 1 ? 'pregunta' : 'preguntas'} + correo</span>}
              <span className="cf-step-chev" aria-hidden="true">{abiertos[2] ? '▴' : '▾'}</span>
            </button>
            <div className="cf-step-b" hidden={!abiertos[2]}>
            {est.anonimo
              ? <div className="cf-q cf-q-lock"><span className="cf-q-n">✉</span><div><b>Formulario anónimo</b><div className="cf-help" style={{ margin: 0 }}>No se pide el correo: las respuestas figuran como "Anónimo".</div></div></div>
              : <div className="cf-q cf-q-lock"><span className="cf-q-n">✉</span><div><b>Correo electrónico</b> <span className="cf-req">*</span><div className="cf-help" style={{ margin: 0 }}>Se pide siempre, para identificar la respuesta.</div></div></div>}
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
                {q.tipoUi === 'multiple' && (
                  <div className="cf-ops">
                    <textarea className={'ctrl' + (errores['q' + q.id] ? ' err' : '')} aria-label="Opciones" value={q.ops} placeholder="Una opción por línea (se pueden marcar varias)" onChange={(e) => setPreg(q.id, { ops: e.target.value })} />
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
          </section>

          <section className="cf-sec cf-step">
            <button type="button" className="cf-step-h" onClick={() => alternar(3)} aria-expanded={abiertos[3]}>
              <span className="cf-step-n">3</span>
              <div className="cf-step-tt"><h3>Después de enviar</h3><p>Opcional. Si lo dejás vacío, se ve el agradecimiento de siempre.</p></div>
              {!abiertos[3] && <span className="cf-step-sum">{(conf.pantalla.titulo.trim() || conf.pantalla.texto.trim()) ? 'Mensaje propio' : 'Agradecimiento de siempre'}{conf.email.activo && est.anonimo !== true ? ' · Correo activado' : ''}</span>}
              <span className="cf-step-chev" aria-hidden="true">{abiertos[3] ? '▴' : '▾'}</span>
            </button>
            <div className="cf-step-b" hidden={!abiertos[3]}>
            {errores.confirmacion && <div className="cf-err" role="alert" style={{ marginBottom: 12 }}>{errores.confirmacion}</div>}
            <div className="cf-vars" aria-label="Variables disponibles"><span>Se completan solas:</span>{VARIABLES.map(([v, d]) => <code key={v} title={d}>{v}</code>)}</div>

            <div className="cf-sub-card">
              <div className="cf-sub-h"><span className="cf-sub-ic" aria-hidden="true">▣</span><div><b>Mensaje en pantalla</b><small>Lo que se ve apenas se envía el formulario.</small></div></div>
              <div className="cf-f">
                <label>Título</label>
                <input className="ctrl" aria-label="Título del mensaje final" value={conf.pantalla.titulo} maxLength={LIM_CONF.titulo} placeholder="¡Gracias por responder!" onChange={(e) => setConf('pantalla', { titulo: e.target.value })} />
              </div>
              <div className="cf-f">
                <label>Texto</label>
                <textarea className="ctrl" aria-label="Texto del mensaje final" style={{ minHeight: 90, resize: 'vertical' }} value={conf.pantalla.texto} maxLength={LIM_CONF.texto} placeholder={'Ej.: ¡Listo, {nombre}! Tu inscripción quedó registrada. Revisá tu correo y sumate al grupo de WhatsApp para recibir las novedades.'} onChange={(e) => setConf('pantalla', { texto: e.target.value })} />
              </div>
              {botonesEditor('pantalla')}
            </div>

            <div className={'cf-sub-card' + (conf.email.activo && est.anonimo !== true ? ' on' : '')}>
              <div className="cf-sub-h">
                <span className="cf-sub-ic" aria-hidden="true">✉</span>
                <div><b>Correo de confirmación</b><small>{est.anonimo === true ? 'No disponible en formularios anónimos (no piden el correo).' : 'Le llega a quien responde, al correo que dejó.'}</small></div>
                <label className="cf-switch" title="Activar o apagar el correo">
                  <input type="checkbox" aria-label="Mandar un correo automático de confirmación a quien responde" checked={conf.email.activo} disabled={est.anonimo === true} onChange={(e) => setConf('email', { activo: e.target.checked })} />
                  <span className="cf-switch-t" />
                </label>
              </div>
              {conf.email.activo && est.anonimo !== true && (
                <div className="cf-sub-b">
                  <Campo label="Asunto" req>
                    <input className="ctrl" aria-label="Asunto del correo" value={conf.email.asunto} maxLength={LIM_CONF.asunto} placeholder="Ej.: ¡Te esperamos en {formulario}!" onChange={(e) => setConf('email', { asunto: e.target.value })} />
                  </Campo>
                  <Campo label="Mensaje" req help="Párrafos separados por una línea en blanco. Los enlaces con https:// se vuelven tocables.">
                    <textarea className="ctrl" aria-label="Mensaje del correo" style={{ minHeight: 130, resize: 'vertical' }} value={conf.email.cuerpo} maxLength={LIM_CONF.cuerpo} placeholder={'Hola, {nombre}:\n\nRecibimos tu inscripción. Para recibir toda la información y las novedades, sumate al grupo de WhatsApp con el botón de abajo.\n\n¡Gracias!'} onChange={(e) => setConf('email', { cuerpo: e.target.value })} />
                  </Campo>
                  <Campo label="Botones (opcional)">{botonesEditor('email')}</Campo>
                  <div className="cf-test">
                    <button className="btn-sm" type="button" onClick={probarCorreo} disabled={probando || !conf.email.asunto.trim() || !conf.email.cuerpo.trim()}>{probando ? 'Enviando…' : '✉ Enviarme una prueba'}</button>
                    <span className="cf-help">Te llega a {usuario.email}.{est.editando ? '' : ' Los reales salen cuando el formulario está Publicado.'}</span>
                  </div>
                </div>
              )}
            </div>
            </div>
          </section>

          <section className="cf-sec cf-step">
            <button type="button" className="cf-step-h" onClick={() => alternar(4)} aria-expanded={abiertos[4]}>
              <span className="cf-step-n">4</span>
              <div className="cf-step-tt"><h3>Publicación</h3><p>Cuándo se puede responder y con qué enlace.</p></div>
              {!abiertos[4] && <span className="cf-step-sum">{est.estado} · /{slugActual || '…'}</span>}
              <span className="cf-step-chev" aria-hidden="true">{abiertos[4] ? '▴' : '▾'}</span>
            </button>
            <div className="cf-step-b" hidden={!abiertos[4]}>
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
          </section>

          <div className="cf-acts">
            <button className="btn btn-primary" onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : (est.editando ? 'Guardar cambios' : 'Crear formulario')}</button>
            <button className="btn" onClick={() => onVolver(false)} disabled={guardando}>Cancelar</button>
          </div>
        </div>

        <div className="cf-side">
          <div className="cf-card">
            <div className="cf-live"><span className="cf-live-dot" aria-hidden="true" /><div><b>Vista previa</b><small>Mirá cómo se ve, en vivo</small></div></div>
            <div className="cf-seg" role="group" aria-label="Qué mostrar" style={{ marginBottom: 10 }}>
              <button type="button" className={!pvFinal ? 'on' : ''} onClick={() => setPvFinal(false)}>Formulario</button>
              <button type="button" className={pvFinal ? 'on' : ''} onClick={() => setPvFinal(true)}>Pantalla final</button>
            </div>
            <div className="cf-pv"><FormularioForm key={pvFinal ? 'final' : 'form'} form={formVista} vistaPrevia ejemploFinal={pvFinal} /></div>
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
