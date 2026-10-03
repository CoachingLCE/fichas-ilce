'use client';
import { useEffect, useMemo, useState } from 'react';
import { FiltroChip } from './SelectDropdown';
import { exportarCSV } from '../lib/exportUtils';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Mismo criterio de rangos r\u00e1pidos que ya usa Reportes (Per\u00edodo), para que el registro de
// env\u00edos se pueda acotar sin tener que revisar meses de historial cada vez.
const iso = (d) => d.toISOString().slice(0, 10);
const hace = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d); };
const primerDiaMes = () => { const d = new Date(); d.setDate(1); return iso(d); };
const PERIODOS = [
  { v: 'todo', l: 'Todo' }, { v: 'hoy', l: 'Hoy' }, { v: '7d', l: '7 d\u00edas' },
  { v: '30d', l: '30 d\u00edas' }, { v: 'mes', l: 'Este mes' },
];

// Correos que ya tienen vista previa (usan la misma plantilla que se envía).
const PREVIEWABLES = new Set([
  'Confirmación inscripción', 'Aviso equipo', 'Credenciales acceso',
  'Resultado actividad', 'Aviso actividad docente', 'Resumen viernes'
]);

// Correos que se pueden reintentar automáticamente si fallaron (coincide con REINTENTOS en
// lib/mailer.js). "Credenciales acceso" queda afuera a propósito: no guarda payload reintentable
// porque incluiría la contraseña en texto plano una segunda vez en la planilla.
const REINTENTABLES = new Set([
  'Confirmación inscripción', 'Aviso equipo', 'Resultado actividad', 'Aviso actividad docente', 'Resumen viernes'
]);

// Pedido de Diego (referencia: disponibilidad-zoom/emails): que la columna "Tipo" se distinga
// de un vistazo por color, un color fijo por tipo — no decorativo, mismo criterio que ya se usa
// en el resto de la app (colorCurso, estados). No se toca el estilo base de .tagchip (se usa en
// muchos otros lugares): acá se le pisa el color puntualmente para esta tabla.
const TIPO_COLOR = {
  'Confirmación inscripción': { bg: 'rgba(34,211,238,.14)', fg: 'rgb(34 211 238)' },
  'Aviso equipo': { bg: 'rgba(124,58,237,.16)', fg: 'rgb(167 139 250)' },
  'Credenciales acceso': { bg: 'rgba(251,191,36,.15)', fg: 'rgb(251 191 36)' },
  'Resultado actividad': { bg: 'rgba(74,222,128,.14)', fg: 'rgb(74 222 128)' },
  'Aviso actividad docente': { bg: 'rgba(192,38,211,.15)', fg: 'rgb(224 110 236)' },
  'Resumen viernes': { bg: 'rgba(59,130,246,.15)', fg: 'rgb(96 165 250)' }
};

const AUTOMATIZACIONES = [
  { evento: 'Se completa una ficha de inscripción', para: 'Al estudiante (con botón de WhatsApp)', remitente: 'Instituto ILCE', cc: '—', asunto: '¡Recibimos tu inscripción a [curso]! 🎉', tipo: 'Confirmación inscripción' },
  { evento: 'Se completa una ficha de inscripción', para: 'Macarena, Alexander y Jesabel', remitente: 'Plataforma ILCE', cc: '—', asunto: '📥 Nueva inscripción · [nombre] · [curso]', tipo: 'Aviso equipo' },
  { evento: 'Se crea un usuario / se da acceso a un docente', para: 'Al usuario (con su contraseña)', remitente: 'Plataforma ILCE', cc: '—', asunto: 'Tu acceso al panel de ILCE', tipo: 'Credenciales acceso' },
  { evento: 'El estudiante responde una actividad (Postwork)', para: 'Al estudiante (con su puntaje)', remitente: 'Instituto ILCE', cc: '—', asunto: 'Resultado de tu actividad · [actividad]', tipo: 'Resultado actividad' },
  { evento: 'El estudiante responde una actividad (Postwork)', para: 'Al/los docente(s) del curso/edición', remitente: 'Instituto ILCE', cc: '—', asunto: '📝 [estudiante] completó “[actividad]” · [puntaje]/[total]', tipo: 'Aviso actividad docente' },
  { evento: 'Todos los viernes (automático) — actividades y formularios de la semana', para: 'Sofía, Paula, Lourdes, Victoria y Diego', remitente: 'Plataforma ILCE', cc: '—', asunto: '📊 Resumen semanal · N actividades y M formularios', tipo: 'Resumen viernes' }
];

export default function EmailsPanel({ usuario }) {
  const [emails, setEmails] = useState(null);
  const [q, setQ] = useState('');
  const [fTipo, setFTipo] = useState(''); const [fEstado, setFEstado] = useState('');
  // Pedido de Diego ("deja las del mes, luego que diga ver el resto"): antes arrancaba
  // mostrando TODO el historial de una — ahora arranca acotado a este mes, con un enlace para
  // traer el resto si hace falta (ver "verTodo" más abajo).
  const [periodo, setPeriodo] = useState('mes');
  const [fDesde, setFDesde] = useState(primerDiaMes()); const [fHasta, setFHasta] = useState(hace(0));
  const [preview, setPreview] = useState(null); // { tipo, asunto, html, loading, error, ejemplo }
  const [detalle, setDetalle] = useState(null); // { fecha, tipo, para, asunto, detalle }
  const [reintentando, setReintentando] = useState(null); // índice de fila en curso
  const [avisoReintento, setAvisoReintento] = useState(null); // { i, ok, msg }

  function aplicarPeriodo(v) {
    setPeriodo(v);
    if (v === 'todo') { setFDesde(''); setFHasta(''); }
    else if (v === 'hoy') { setFDesde(hace(0)); setFHasta(hace(0)); }
    else if (v === '7d') { setFDesde(hace(6)); setFHasta(hace(0)); }
    else if (v === '30d') { setFDesde(hace(29)); setFHasta(hace(0)); }
    else if (v === 'mes') { setFDesde(primerDiaMes()); setFHasta(hace(0)); }
  }

  async function cargarEmails() {
    const res = await fetch('/api/emails?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setEmails(d.ok ? d.emails : []);
  }
  useEffect(() => { cargarEmails(); /* eslint-disable-next-line */ }, []);

  async function reintentar(e, i) {
    setReintentando(i); setAvisoReintento(null);
    try {
      const res = await fetch('/api/emails/reintentar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, tipo: e.tipo, payload: e.payload })
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo reenviar');
      setAvisoReintento({ i, ok: true, msg: '✅ Reenviado. Va a aparecer como una fila nueva en el registro.' });
      cargarEmails();
    } catch (err) {
      setAvisoReintento({ i, ok: false, msg: '❌ ' + (err.message || 'No se pudo reenviar') });
    } finally {
      setReintentando(null);
    }
  }

  async function abrirPreview(tipo) {
    if (!PREVIEWABLES.has(tipo)) return;
    setPreview({ tipo, loading: true });
    try {
      const res = await fetch(`/api/emails/preview?tipo=${encodeURIComponent(tipo)}&solicitanteEmail=${encodeURIComponent(usuario.email)}`);
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo cargar');
      setPreview({ tipo, asunto: d.asunto, html: d.html, ejemplo: d.ejemplo });
    } catch (e) {
      setPreview({ tipo, error: e.message || 'Error inesperado' });
    }
  }

  // Hay envíos más viejos que el recorte de "Este mes" por default — habilita el enlace "Ver
  // el resto" (independiente de los otros filtros, solo mira la fecha).
  const hayMasAfuera = periodo === 'mes' && (emails || []).some((e) => (e.fecha || '').slice(0, 10) < fDesde);

  const tipos = useMemo(() => [...new Set((emails || []).map((e) => e.tipo).filter(Boolean))].sort(), [emails]);
  const filtrados = useMemo(() => {
    const qq = norm(q);
    return (emails || []).filter((e) => {
      if (fTipo && e.tipo !== fTipo) return false;
      if (fEstado && e.estado !== fEstado) return false;
      if (fDesde && (e.fecha || '').slice(0, 10) < fDesde) return false;
      if (fHasta && (e.fecha || '').slice(0, 10) > fHasta) return false;
      if (qq && !norm(`${e.para} ${e.asunto} ${e.tipo}`).includes(qq)) return false;
      return true;
    });
  }, [emails, q, fTipo, fEstado, fDesde, fHasta]);

  // KPIs del registro de envíos ya filtrado — para que de un vistazo se vea si algo se está
  // rompiendo, sin tener que contar filas a mano. No toca ninguna métrica de Reportes.
  const kpis = useMemo(() => {
    const total = filtrados.length;
    const fallidos = filtrados.filter((e) => e.estado !== 'Enviado').length;
    const tasa = total ? Math.round(((total - fallidos) / total) * 100) : null;
    return { total, fallidos, tasa };
  }, [filtrados]);

  const hayFiltros = !!(q || fTipo || fEstado || periodo !== 'todo');
  function limpiarFiltros() { setQ(''); setFTipo(''); setFEstado(''); aplicarPeriodo('todo'); }
  const chips = [];
  if (fTipo) chips.push(['Tipo: ' + fTipo, () => setFTipo('')]);
  if (fEstado) chips.push(['Estado: ' + fEstado, () => setFEstado('')]);
  if (periodo !== 'todo') chips.push(['Período: ' + (PERIODOS.find((p) => p.v === periodo)?.l || periodo), () => aplicarPeriodo('todo')]);

  // Formato D/M/AAAA (pedido de Diego para las fechas de todo fichas-ilce), con hora — acá
  // importa la hora exacta de envío, no solo el día.
  const fmt = (fechaIso) => { const d = new Date(fechaIso); return isNaN(d) ? fechaIso : d.toLocaleString('es-AR', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }); };
  // Pedido de Diego (03/10/2026): marcar los envíos de las últimas 48 horas con "Enviado
  // recientemente" — a diferencia del criterio de Fichas/Actividades (por día calendario), acá
  // es una ventana de horas reales desde el envío, así que a las 48hs exactas desaparece sola,
  // sin esperar al cambio de día.
  const esEnvioReciente = (fechaIso) => {
    const d = new Date(fechaIso);
    if (isNaN(d)) return false;
    const horas = (Date.now() - d.getTime()) / 3600000;
    return horas >= 0 && horas <= 48;
  };

  function exportarEnvios() {
    exportarCSV('registro-emails.csv', [
      ['fecha', 'Fecha'], ['tipo', 'Tipo'], ['para', 'Para'], ['asunto', 'Asunto'], ['estado', 'Estado']
    ], filtrados.map((e) => ({ ...e, fecha: fmt(e.fecha) })));
  }

  return (
    <div>
      {/* Automatizaciones */}
      <div className="panel">
        <div className="sechead">
          <span className="htitle">Mails automáticos que genera el sistema</span>
          <span className="hcount">{AUTOMATIZACIONES.length} automatización(es)</span>
        </div>
        <p className="muted" style={{ fontSize: 12.5, margin: '0 0 10px' }}>Tocá un correo con 👁 para ver una vista previa de lo que recibe la persona.</p>
        <div className="tablewrap" style={{ maxHeight: 'none' }}>
          <table>
            <thead><tr><th style={{ minWidth: 210 }}>Cuándo se envía</th><th style={{ minWidth: 190 }}>A quién</th><th style={{ minWidth: 150 }}>De / CC</th><th style={{ minWidth: 240 }}>Asunto</th><th style={{ minWidth: 180 }}>Tipo</th></tr></thead>
            <tbody>{AUTOMATIZACIONES.map((a, i) => {
              const verMas = PREVIEWABLES.has(a.tipo);
              return (
                <tr key={i} className={verMas ? 'clickable' : ''} onClick={verMas ? () => abrirPreview(a.tipo) : undefined} style={verMas ? { cursor: 'pointer' } : undefined}>
                  <td>{a.evento}</td>
                  <td className="sec">{a.para}</td>
                  <td className="sec">{a.remitente}{a.cc && a.cc !== '—' ? ` · cc: ${a.cc}` : ''}</td>
                  <td className="sec">{a.asunto}</td>
                  <td><span className="tagchip" style={TIPO_COLOR[a.tipo] ? { background: TIPO_COLOR[a.tipo].bg, color: TIPO_COLOR[a.tipo].fg, borderColor: 'transparent' } : undefined}>{a.tipo}</span>{verMas && <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 500, color: 'rgb(var(--accentTeal))' }}>👁 Ver correo</span>}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      </div>

      {/* Registro en vivo */}
      <div className="panel">
        <div className="sechead">
          <span className="htitle">Registro de envíos</span>
          <span className="hcount">{emails ? filtrados.length : 0} envío(s)</span>
          {hayMasAfuera && <button className="linklike" style={{ fontSize: 12 }} onClick={() => aplicarPeriodo('todo')}>Ver el resto (fuera de este mes) →</button>}
          <span className="grow" />
          <div className="fsearch" style={{ maxWidth: 240, flex: 'none' }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" /></div>
          <button className="btn-sm" disabled={!emails || filtrados.length === 0} onClick={exportarEnvios}>⬇ Exportar CSV</button>
        </div>

        {emails && emails.length > 0 && (
          <div className="metrica-grid">
            <div className="metrica"><div className="metrica-val">{kpis.total}</div><div className="metrica-lbl">Envíos (con los filtros de abajo)</div></div>
            <div className="metrica"><div className={'metrica-val' + (kpis.fallidos > 0 ? ' bad' : '')}>{kpis.fallidos}</div><div className="metrica-lbl">Fallidos</div></div>
            <div className="metrica"><div className={'metrica-val' + (kpis.tasa === null ? '' : kpis.tasa === 100 ? ' good' : kpis.tasa < 80 ? ' bad' : ' warn')}>{kpis.tasa === null ? '—' : kpis.tasa + '%'}</div><div className="metrica-lbl">Tasa de éxito</div></div>
          </div>
        )}

        <div className="fchips" style={{ margin: '0 0 10px' }}>
          {PERIODOS.map((p) => <button key={p.v} className={'fchip' + (periodo === p.v ? ' on' : '')} onClick={() => aplicarPeriodo(p.v)}>{p.l}</button>)}
        </div>
        <div className="filters">
          <select className="fsel" value={fTipo} onChange={(e) => setFTipo(e.target.value)}><option value="">Tipo: todos</option>{tipos.map((t) => <option key={t}>{t}</option>)}</select>
          <select className="fsel" value={fEstado} onChange={(e) => setFEstado(e.target.value)}><option value="">Estado: todos</option><option>Enviado</option><option>Falló</option></select>
          {hayFiltros && <button className="btn-sm" onClick={limpiarFiltros}>Limpiar filtros</button>}
        </div>
        {chips.length > 0 && (
          <div className="repx-chips-row">
            {chips.map(([lbl, clear], i) => <FiltroChip key={i} label={lbl} onClear={clear} />)}
          </div>
        )}
        {!emails ? <div className="spin" /> : filtrados.length === 0 ? (
          <div className="empty"><div className="ico">✉️</div><h3>Sin envíos registrados</h3><p>Cuando el sistema mande un correo, va a aparecer acá.</p></div>
        ) : (
          /* Pedido de Diego: "bajale tamaño a la letra así entra en una línea y achicala un
             poco en ancho" (antes necesitaba scroll horizontal) — clase propia con tipografía
             más chica, columnas más angostas y "Para"/"Asunto" truncados con "…" (el texto
             completo queda disponible al pasar el mouse, por el title). Altura del contenedor
             también un poco más alta ("agrandar un poco más la tabla"). */
          <div className="tablewrap tablewrap-emailslog" style={{ maxHeight: '72vh' }}><table>
            <thead><tr><th style={{ minWidth: 120 }}>Fecha</th><th style={{ minWidth: 110 }}>Tipo</th><th style={{ minWidth: 160 }}>Para</th><th style={{ minWidth: 170 }}>Asunto</th><th style={{ minWidth: 72 }}>Estado</th><th style={{ minWidth: 120 }}>Acciones</th></tr></thead>
            <tbody>{filtrados.map((e, i) => {
              const fallo = e.estado !== 'Enviado';
              const puedeReintentar = fallo && REINTENTABLES.has(e.tipo) && e.payload;
              const aviso = avisoReintento && avisoReintento.i === i ? avisoReintento : null;
              return (
                <tr key={i}>
                  <td className="sec">
                    <div>{fmt(e.fecha)}</div>
                    {esEnvioReciente(e.fecha) && <span className="badge-enviado-reciente">Enviado recientemente</span>}
                  </td>
                  <td><span className="tagchip" style={TIPO_COLOR[e.tipo] ? { background: TIPO_COLOR[e.tipo].bg, color: TIPO_COLOR[e.tipo].fg, borderColor: 'transparent' } : undefined}>{e.tipo}</span></td>
                  <td className="sec tablewrap-emailslog-trunc" title={e.para}>{e.para}</td>
                  <td className="tablewrap-emailslog-trunc" title={e.asunto}>{e.asunto}</td>
                  <td><span className={'badge ' + (e.estado === 'Enviado' ? 'b-Aprobada' : 'b-Observada')}>{e.estado}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {fallo && e.detalle && <button className="btn-sm" onClick={() => setDetalle(e)}>Ver detalle</button>}
                      {puedeReintentar && (
                        <button className="btn-sm" disabled={reintentando === i} onClick={() => reintentar(e, i)}>
                          {reintentando === i ? '⏳ Reintentando…' : '↻ Reintentar'}
                        </button>
                      )}
                      {aviso && <span style={{ fontSize: 12, color: aviso.ok ? 'rgb(var(--accentTeal))' : '#e07a7a' }}>{aviso.msg}</span>}
                    </div>
                  </td>
                </tr>
              );
            })}</tbody>
          </table></div>
        )}
      </div>

      {/* Modal de detalle de error */}
      {detalle && (
        <div className="preview-ov" onClick={() => setDetalle(null)}>
          <div className="preview-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="preview-head">
              <div style={{ minWidth: 0 }}>
                <div className="preview-kd">Detalle del error · {detalle.tipo}</div>
                <div className="preview-asunto">{detalle.asunto}</div>
              </div>
              <button className="btn-sm" onClick={() => setDetalle(null)}>✕ Cerrar</button>
            </div>
            <div className="preview-body" style={{ padding: 20 }}>
              <p className="sec" style={{ margin: '0 0 6px' }}>Para: {detalle.para}</p>
              <p className="sec" style={{ margin: '0 0 14px' }}>Fecha: {fmt(detalle.fecha)}</p>
              <div className="note">{detalle.detalle || 'Sin detalle registrado.'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista previa */}
      {preview && (
        <div className="preview-ov" onClick={() => setPreview(null)}>
          <div className="preview-card" onClick={(e) => e.stopPropagation()}>
            <div className="preview-head">
              <div style={{ minWidth: 0 }}>
                <div className="preview-kd">Vista previa · {preview.tipo}{preview.ejemplo ? ' · datos de ejemplo' : ''}</div>
                {preview.asunto && <div className="preview-asunto">{preview.asunto}</div>}
              </div>
              <button className="btn-sm" onClick={() => setPreview(null)}>✕ Cerrar</button>
            </div>
            <div className="preview-body">
              {preview.loading ? <div className="spin" style={{ margin: '40px auto' }} />
                : preview.error ? <div className="note" style={{ margin: 16 }}>No se pudo cargar la vista previa: {preview.error}</div>
                  : <iframe title="Vista previa del correo" srcDoc={preview.html} className="preview-frame" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
