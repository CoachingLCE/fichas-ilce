'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CURSOS, colorCurso, APP_URL } from '../lib/constants';
import { slugify } from '../lib/formularioConstructor';
import { validarDefEval, parseMails, textoReglas, formatoPuntos } from '../lib/evaluacionesLogica';

// Constructor de Evaluaciones finales: reglas del examen (tiempo, intentos, espera, puntaje), disponibilidad, avisos y preguntas.
// Usa las mismas clases visuales (cf-*) que el constructor de formularios.

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

const preguntaVacia = () => ({ id: Math.random().toString(36).slice(2, 9), situacion: '', pregunta: '', opciones: ['', '', ''], correcta: 0, justificacion: '' });
const estadoNuevo = () => ({
  editando: false, slug: '', slugTocado: false, titulo: '', curso: '', estado: 'Borrador', edicion: '', intro: '',
  fechaDisponible: '', horaDisponible: '', fechaCierre: '',
  tiempoMin: '60', intentos: '2', esperaDias: '7', puntosPorPregunta: '1', puntajeAprobacion: '', ordenAleatorio: true, mostrarRevision: true, revelarSiReintenta: false,
  mailsStaff: '', linkDiploma: '', contacto: '', preguntas: [preguntaVacia()]
});
const aEstado = (e) => ({
  editando: true, slug: e.slug, slugTocado: true, titulo: e.titulo || '', curso: e.curso || '', estado: e.estado || 'Borrador', edicion: e.edicion || '', intro: e.intro || '',
  fechaDisponible: e.fechaDisponible || '', horaDisponible: e.horaDisponible || '', fechaCierre: e.fechaCierre || '',
  tiempoMin: String(e.tiempoMin ?? 0), intentos: String(e.intentos ?? 1), esperaDias: String(e.esperaDias ?? 0), puntosPorPregunta: String(e.puntosPorPregunta ?? 1),
  puntajeAprobacion: e.puntajeAprobacion > 0 ? String(e.puntajeAprobacion) : '', ordenAleatorio: e.ordenAleatorio !== false, mostrarRevision: e.mostrarRevision !== false, revelarSiReintenta: e.revelarSiReintenta === true,
  mailsStaff: (e.mailsStaff || []).join('\n'), linkDiploma: e.linkDiploma || '', contacto: e.contacto || '',
  preguntas: (e.preguntas || []).map((p) => ({ ...preguntaVacia(), ...p, opciones: p.opciones && p.opciones.length ? [...p.opciones] : ['', '', ''] }))
});
const num = (v, def = 0) => { const n = Number(String(v).replace(',', '.')); return Number.isFinite(n) ? n : def; };
const aPayload = (e) => ({
  slug: e.slug.trim(), titulo: e.titulo.trim(), curso: e.curso, estado: e.estado, edicion: e.edicion.trim(), intro: e.intro,
  fechaDisponible: e.fechaDisponible, horaDisponible: e.fechaDisponible ? e.horaDisponible : '', fechaCierre: e.fechaCierre,
  tiempoMin: Math.max(0, Math.floor(num(e.tiempoMin))), intentos: Math.max(1, Math.floor(num(e.intentos, 1))), esperaDias: Math.max(0, Math.floor(num(e.esperaDias))),
  puntosPorPregunta: num(e.puntosPorPregunta, 1), puntajeAprobacion: num(e.puntajeAprobacion, 0),
  ordenAleatorio: e.ordenAleatorio, mostrarRevision: e.mostrarRevision, revelarSiReintenta: e.revelarSiReintenta,
  mailsStaff: parseMails(e.mailsStaff), linkDiploma: e.linkDiploma.trim(), contacto: e.contacto.trim(),
  preguntas: e.preguntas.map(({ situacion, pregunta, opciones, correcta, justificacion }) => ({ situacion, pregunta, opciones, correcta, justificacion }))
});

export default function ConstructorEvaluacion({ usuario, slugInicial, onVolver, showToast }) {
  const [lista, setLista] = useState(null);
  const [est, setEst] = useState(null);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [tituloOriginal, setTituloOriginal] = useState('');
  const [conIntentos, setConIntentos] = useState(false);
  const arriba = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/evaluaciones?solicitanteEmail=' + encodeURIComponent(usuario.email));
        const d = await res.json();
        if (!d.ok) throw new Error(d.error || 'No se pudieron cargar las evaluaciones');
        setLista(d.evaluaciones || []);
        if (slugInicial) {
          const e = (d.evaluaciones || []).find((x) => x.slug === slugInicial);
          if (!e) { setNoEncontrado(true); return; }
          setEst(aEstado(e)); setTituloOriginal(e.titulo || ''); setConIntentos((e.conteo?.intentos || 0) > 0);
        } else setEst(estadoNuevo());
      } catch (e) { setError(e.message || 'Error de conexión'); setLista([]); setEst(slugInicial ? null : estadoNuevo()); }
    })();
    // eslint-disable-next-line
  }, []);

  const resumen = useMemo(() => {
    if (!est) return null;
    const p = aPayload(est); const n = p.preguntas.length; const total = Math.round(n * p.puntosPorPregunta * 100) / 100;
    const min = p.puntajeAprobacion > 0 ? p.puntajeAprobacion : Math.round(total * 0.6 * 100) / 100;
    return { n, total, min, reglas: textoReglas({ tiempoMin: p.tiempoMin, intentos: p.intentos, esperaDias: p.esperaDias }), pp: p.puntosPorPregunta };
  }, [est]);

  if (noEncontrado) return <div className="empty"><div className="ico"></div><h3>No encontramos esa evaluación</h3><p>Puede que se haya eliminado.</p><button className="btn-sm" onClick={() => onVolver(false)}>Volver a la lista</button></div>;
  if (!est) return <div className="spin" />;

  const set = (cambios) => setEst((e) => ({ ...e, ...cambios }));
  const setTitulo = (t) => setEst((e) => ({ ...e, titulo: t, slug: e.slugTocado || e.editando ? e.slug : slugify(t) }));
  const setPreg = (id, c) => setEst((e) => ({ ...e, preguntas: e.preguntas.map((q) => (q.id === id ? { ...q, ...c } : q)) }));
  const setOpc = (id, j, v) => setEst((e) => ({ ...e, preguntas: e.preguntas.map((q) => (q.id === id ? { ...q, opciones: q.opciones.map((o, k) => (k === j ? v : o)) } : q)) }));
  const agregarOpc = (id) => setEst((e) => ({ ...e, preguntas: e.preguntas.map((q) => (q.id === id && q.opciones.length < 6 ? { ...q, opciones: [...q.opciones, ''] } : q)) }));
  const quitarOpc = (id, j) => setEst((e) => ({
    ...e, preguntas: e.preguntas.map((q) => {
      if (q.id !== id || q.opciones.length <= 2) return q;
      const opciones = q.opciones.filter((_, k) => k !== j);
      const correcta = q.correcta === j ? 0 : (q.correcta > j ? q.correcta - 1 : q.correcta);
      return { ...q, opciones, correcta };
    })
  }));
  const mover = (id, d) => setEst((e) => {
    const i = e.preguntas.findIndex((q) => q.id === id); const k = i + d;
    if (i < 0 || k < 0 || k >= e.preguntas.length) return e;
    const arr = [...e.preguntas]; [arr[i], arr[k]] = [arr[k], arr[i]];
    return { ...e, preguntas: arr };
  });
  const duplicar = (id) => setEst((e) => { const i = e.preguntas.findIndex((q) => q.id === id); const c = { ...e.preguntas[i], id: preguntaVacia().id, opciones: [...e.preguntas[i].opciones] }; const arr = [...e.preguntas]; arr.splice(i + 1, 0, c); return { ...e, preguntas: arr }; });
  const quitar = (id) => setEst((e) => (e.preguntas.length <= 1 ? e : { ...e, preguntas: e.preguntas.filter((q) => q.id !== id) }));

  async function guardar() {
    const payload = aPayload(est);
    let falla = null;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) falla = 'El enlace solo puede tener minúsculas, números y guiones.';
    else if (!est.editando && (lista || []).some((x) => x.slug === payload.slug)) falla = 'Ya existe una evaluación con ese enlace.';
    else falla = validarDefEval(payload);
    if (falla) { setError(falla); arriba.current && arriba.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
    setGuardando(true); setError('');
    try {
      const res = await fetch('/api/evaluaciones', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ solicitanteEmail: usuario.email, crear: !est.editando, ...payload }) });
      const d = await res.json();
      if (!d.ok) { setError(d.error || 'No se pudo guardar'); setGuardando(false); arriba.current && arriba.current.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      showToast && showToast(est.editando ? 'Evaluación guardada' : 'Evaluación creada');
      onVolver(true);
    } catch { setError('Error de conexión'); setGuardando(false); }
  }

  const tituloCambio = est.editando && tituloOriginal && est.titulo.trim() !== tituloOriginal.trim();
  const urlPublica = est.slug ? `${APP_URL}/evaluacion/${est.slug}` : '';
  const multiIntento = num(est.intentos, 1) > 1;

  return (
    <div className="cf-wrap" ref={arriba} style={{ maxWidth: 980 }}>
      <div className="cf-top">
        <button className="btn-sm" onClick={() => onVolver(false)}>← Volver a la lista</button>
        <div>
          <h2 className="cf-h1">{est.editando ? 'Editar evaluación final' : 'Nueva evaluación final'}</h2>
          <p className="cf-sub">Un examen con tiempo límite, intentos, días de espera y puntaje mínimo. Las respuestas se corrigen en el servidor.</p>
        </div>
      </div>
      {error && <div className="cf-bad" role="alert">{error}</div>}

      <div className="cf-card">
        <div className="cf-sec">
          <p className="cf-sec-t">Información general</p>
          <Campo label="Título" req help={tituloCambio ? 'Ojo: los intentos ya guardados están asociados al título anterior.' : (conIntentos ? 'Esta evaluación ya tiene intentos guardados: el título no se puede cambiar.' : null)}>
            <input className="ctrl" value={est.titulo} disabled={conIntentos} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Evaluación final · Coaching Deportivo" />
          </Campo>
          <Campo label="Enlace" req help={urlPublica ? `Link para los estudiantes: ${urlPublica}` : 'Se arma solo a partir del título.'}>
            <input className="ctrl" value={est.slug} disabled={est.editando} onChange={(e) => set({ slug: slugify(e.target.value), slugTocado: true })} placeholder="evaluacion-final-coaching-deportivo" />
          </Campo>
          <Campo label="Curso" req>
            <div className="cf-curso">
              <span className="cf-dot" style={{ background: est.curso ? colorCurso(est.curso) : 'rgb(var(--textMuted))' }} />
              <select className="ctrl" value={est.curso} onChange={(e) => set({ curso: e.target.value })}>
                <option value="">Elegí un curso…</option>
                {CURSOS.map((c) => <option key={c.slug} value={c.nombre}>{c.nombre}</option>)}
              </select>
            </div>
          </Campo>
          <Campo label="Edición" help="Opcional. Si la dejás vacía, cada estudiante indica su número de edición al empezar.">
            <input className="ctrl" value={est.edicion} onChange={(e) => set({ edicion: e.target.value.replace(/[^0-9a-zA-Z ]/g, '') })} placeholder="Ej: 35" style={{ maxWidth: 160 }} />
          </Campo>
          <Campo label="Introducción" help="Se muestra antes de empezar (opcional).">
            <textarea className="ctrl" style={{ minHeight: 70, resize: 'vertical' }} value={est.intro} onChange={(e) => set({ intro: e.target.value })} placeholder="Instrucciones, qué evalúa, recomendaciones…" />
          </Campo>
          <Campo label="Estado">
            <select className="ctrl" value={est.estado} onChange={(e) => set({ estado: e.target.value })} style={{ maxWidth: 220 }}>
              <option value="Borrador">Borrador (no visible)</option>
              <option value="Publicada">Publicada</option>
              <option value="Archivada">Archivada</option>
            </select>
          </Campo>
        </div>

        <div className="cf-sec">
          <p className="cf-sec-t">Reglas del examen</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
            <Campo label="Tiempo límite (minutos)" help="0 = sin límite. El cronómetro lo controla el servidor.">
              <input className="ctrl" inputMode="numeric" value={est.tiempoMin} onChange={(e) => set({ tiempoMin: e.target.value.replace(/\D/g, '') })} />
            </Campo>
            <Campo label="Cantidad de intentos" help="Intentos incluidos. Después queda bloqueado hasta que un admin habilite otro.">
              <input className="ctrl" inputMode="numeric" value={est.intentos} onChange={(e) => set({ intentos: e.target.value.replace(/\D/g, '') })} />
            </Campo>
            <Campo label="Días de espera entre intentos" help={multiIntento ? '0 = puede reintentar enseguida.' : 'Solo aplica si hay más de un intento.'}>
              <input className="ctrl" inputMode="numeric" value={est.esperaDias} disabled={!multiIntento} onChange={(e) => set({ esperaDias: e.target.value.replace(/\D/g, '') })} />
            </Campo>
            <Campo label="Puntos por pregunta">
              <input className="ctrl" inputMode="decimal" value={est.puntosPorPregunta} onChange={(e) => set({ puntosPorPregunta: e.target.value.replace(/[^0-9.,]/g, '') })} />
            </Campo>
            <Campo label="Puntaje mínimo para aprobar" help={`Vacío = 60% del total (${formatoPuntos(Math.round(resumen.total * 0.6 * 100) / 100)} pts).`}>
              <input className="ctrl" inputMode="decimal" value={est.puntajeAprobacion} placeholder={String(formatoPuntos(Math.round(resumen.total * 0.6 * 100) / 100))} onChange={(e) => set({ puntajeAprobacion: e.target.value.replace(/[^0-9.,]/g, '') })} />
            </Campo>
          </div>
          <label className="cf-sw" style={{ display: 'flex' }}><input type="checkbox" checked={est.ordenAleatorio} onChange={(e) => set({ ordenAleatorio: e.target.checked })} /> Orden aleatorio de las preguntas (distinto en cada intento)</label>
          <label className="cf-sw" style={{ display: 'flex' }}><input type="checkbox" checked={est.mostrarRevision} onChange={(e) => set({ mostrarRevision: e.target.checked })} /> Al terminar, mostrar la respuesta correcta y la justificación de cada pregunta</label>
          {est.mostrarRevision && multiIntento && (
            <label className="cf-sw" style={{ display: 'flex', marginLeft: 26 }}><input type="checkbox" checked={est.revelarSiReintenta} onChange={(e) => set({ revelarSiReintenta: e.target.checked })} /> Mostrarla también a quien no aprobó y todavía puede reintentar</label>
          )}
          {est.mostrarRevision && multiIntento && <div className="cf-help" style={{ color: est.revelarSiReintenta ? 'rgb(251 191 36)' : undefined }}>{est.revelarSiReintenta ? 'Atención: quien no aprueba verá las respuestas correctas y podría usarlas en el siguiente intento.' : 'Por defecto, quien no aprobó y todavía tiene intentos no ve las respuestas correctas: se muestran al aprobar o al agotar los intentos.'}</div>}
          <div className="cf-help" style={{ marginTop: 10 }}><b>Resumen:</b> {resumen.n} pregunta{resumen.n === 1 ? '' : 's'} × {formatoPuntos(resumen.pp)} pt = {formatoPuntos(resumen.total)} puntos · se aprueba con {formatoPuntos(resumen.min)} · {resumen.reglas}</div>
        </div>

        <div className="cf-sec">
          <p className="cf-sec-t">Disponibilidad</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))', gap: 12 }}>
            <Campo label="Abre el día"><input className="ctrl" type="date" value={est.fechaDisponible} onChange={(e) => set({ fechaDisponible: e.target.value })} /></Campo>
            <Campo label="A las (opcional)"><input className="ctrl" type="time" value={est.horaDisponible} disabled={!est.fechaDisponible} onChange={(e) => set({ horaDisponible: e.target.value })} /></Campo>
            <Campo label="Cierra el día" help="Hasta el final de ese día (hora de Argentina)."><input className="ctrl" type="date" value={est.fechaCierre} onChange={(e) => set({ fechaCierre: e.target.value })} /></Campo>
          </div>
        </div>

        <div className="cf-sec">
          <p className="cf-sec-t">Comunicación</p>
          <Campo label="Mails del equipo a avisar" help="Reciben un aviso cada vez que alguien termina la evaluación. Uno por línea o separados por coma.">
            <textarea className="ctrl" style={{ minHeight: 60, resize: 'vertical' }} value={est.mailsStaff} onChange={(e) => set({ mailsStaff: e.target.value })} placeholder="coordinacion@institutoilce.com" />
          </Campo>
          <Campo label="Link del diploma" help="Quien aprueba lo ve en pantalla y en el mail de resultado.">
            <input className="ctrl" value={est.linkDiploma} onChange={(e) => set({ linkDiploma: e.target.value })} placeholder="https://…" />
          </Campo>
          <Campo label="Contacto para pedir otro intento" help="Se muestra a quien agotó sus intentos (un mail o WhatsApp).">
            <input className="ctrl" value={est.contacto} onChange={(e) => set({ contacto: e.target.value })} placeholder="estudiantes@institutoilce.com" />
          </Campo>
        </div>

        <div className="cf-sec">
          <p className="cf-sec-t">Preguntas ({est.preguntas.length})</p>
          {est.preguntas.map((q, i) => (
            <div key={q.id} className="cf-q">
              <div className="cf-q-h">
                <span className="cf-q-n">{i + 1}</span>
                <input className="ctrl" aria-label={`Pregunta ${i + 1}`} value={q.pregunta} onChange={(e) => setPreg(q.id, { pregunta: e.target.value })} placeholder="Escribí la pregunta" />
                <button className="btn-sm" type="button" onClick={() => mover(q.id, -1)} disabled={i === 0} title="Subir">↑</button>
                <button className="btn-sm" type="button" onClick={() => mover(q.id, 1)} disabled={i === est.preguntas.length - 1} title="Bajar">↓</button>
                <button className="btn-sm" type="button" onClick={() => duplicar(q.id)} title="Duplicar">⧉</button>
                <button className="btn-sm cf-x" type="button" onClick={() => quitar(q.id)} disabled={est.preguntas.length <= 1} title="Quitar">✕</button>
              </div>
              <textarea className="ctrl" style={{ minHeight: 50, resize: 'vertical', marginBottom: 8 }} value={q.situacion} onChange={(e) => setPreg(q.id, { situacion: e.target.value })} placeholder="Situación o caso previo a la pregunta (opcional)" />
              <div className="cf-help" style={{ marginBottom: 4 }}>Opciones — marcá la correcta:</div>
              {q.opciones.map((o, j) => (
                <div key={j} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <input type="radio" name={'c-' + q.id} checked={q.correcta === j} onChange={() => setPreg(q.id, { correcta: j })} title="Respuesta correcta" aria-label={`Opción ${j + 1} correcta`} />
                  <input className="ctrl" value={o} onChange={(e) => setOpc(q.id, j, e.target.value)} placeholder={`Opción ${j + 1}`} />
                  <button className="btn-sm" type="button" onClick={() => quitarOpc(q.id, j)} disabled={q.opciones.length <= 2} title="Quitar opción">✕</button>
                </div>
              ))}
              {q.opciones.length < 6 && <button className="btn-sm" type="button" onClick={() => agregarOpc(q.id)}>+ Opción</button>}
              <textarea className="ctrl" style={{ minHeight: 50, resize: 'vertical', marginTop: 8 }} value={q.justificacion} onChange={(e) => setPreg(q.id, { justificacion: e.target.value })} placeholder="Justificación de la respuesta correcta (se muestra al terminar si la revisión está activada)" />
            </div>
          ))}
          <button className="btn-sm" type="button" onClick={() => set({ preguntas: [...est.preguntas, preguntaVacia()] })}>+ Agregar pregunta</button>
        </div>

        <div className="cf-sec" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button className="btn btn-primary" style={{ flex: 'none', padding: '10px 22px' }} onClick={guardar} disabled={guardando}>{guardando ? 'Guardando…' : (est.editando ? 'Guardar cambios' : 'Crear evaluación')}</button>
          <button className="btn-sm" onClick={() => onVolver(false)} disabled={guardando}>Cancelar</button>
          <span className="cf-help" style={{ margin: 0 }}>Para probarla sin guardar nada ni mandar mails, entrá al enlace con el mail de pruebas.</span>
        </div>
      </div>
    </div>
  );
}
