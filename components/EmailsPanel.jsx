'use client';
import { useEffect, useMemo, useState } from 'react';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

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

const AUTOMATIZACIONES = [
  { evento: 'Se completa una ficha de inscripción', para: 'Al estudiante (con botón de WhatsApp)', remitente: 'Instituto ILCE', cc: '—', asunto: '¡Recibimos tu inscripción a [curso]! 🎉', tipo: 'Confirmación inscripción' },
  { evento: 'Se completa una ficha de inscripción', para: 'Macarena, Alexander y Jesabel', remitente: 'Plataforma ILCE', cc: '—', asunto: '📥 Nueva inscripción · [nombre] · [curso]', tipo: 'Aviso equipo' },
  { evento: 'Se crea un usuario / se da acceso a un docente', para: 'Al usuario (con su contraseña)', remitente: 'Plataforma ILCE', cc: '—', asunto: 'Tu acceso al panel de ILCE', tipo: 'Credenciales acceso' },
  { evento: 'El estudiante responde una actividad (Postwork)', para: 'Al estudiante (con su puntaje)', remitente: 'Instituto ILCE', cc: '—', asunto: 'Resultado de tu actividad · [actividad]', tipo: 'Resultado actividad' },
  { evento: 'El estudiante responde una actividad (Postwork)', para: 'Al/los docente(s) del curso/edición', remitente: 'Instituto ILCE', cc: '—', asunto: '📝 [estudiante] completó “[actividad]” · [puntaje]/[total]', tipo: 'Aviso actividad docente' },
  { evento: 'Todos los viernes (automático)', para: 'Sofía, Paula, Lourdes y Victoria', remitente: 'Plataforma ILCE', cc: '—', asunto: '📊 Resumen académico · N respuestas esta semana', tipo: 'Resumen viernes' }
];

export default function EmailsPanel({ usuario }) {
  const [emails, setEmails] = useState(null);
  const [q, setQ] = useState('');
  const [fTipo, setFTipo] = useState(''); const [fEstado, setFEstado] = useState('');
  const [preview, setPreview] = useState(null); // { tipo, asunto, html, loading, error, ejemplo }
  const [detalle, setDetalle] = useState(null); // { fecha, tipo, para, asunto, detalle }
  const [reintentando, setReintentando] = useState(null); // índice de fila en curso
  const [avisoReintento, setAvisoReintento] = useState(null); // { i, ok, msg }

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

  const tipos = useMemo(() => [...new Set((emails || []).map((e) => e.tipo).filter(Boolean))].sort(), [emails]);
  const filtrados = useMemo(() => {
    const qq = norm(q);
    return (emails || []).filter((e) => {
      if (fTipo && e.tipo !== fTipo) return false;
      if (fEstado && e.estado !== fEstado) return false;
      if (qq && !norm(`${e.para} ${e.asunto} ${e.tipo}`).includes(qq)) return false;
      return true;
    });
  }, [emails, q, fTipo, fEstado]);

  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };

  return (
    <div>
      {/* Automatizaciones */}
      <div className="panel">
        <h3>Mails automáticos que genera el sistema</h3>
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
                  <td><span className="tagchip">{a.tipo}</span>{verMas && <span style={{ marginLeft: 8, fontSize: 12.5, fontWeight: 700, color: 'rgb(var(--accentTeal))' }}>👁 Ver correo</span>}</td>
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
          <span className="grow" />
          <div className="fsearch" style={{ maxWidth: 240, flex: 'none' }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar…" /></div>
        </div>
        <div className="filters">
          <select className="fsel" value={fTipo} onChange={(e) => setFTipo(e.target.value)}><option value="">Tipo: todos</option>{tipos.map((t) => <option key={t}>{t}</option>)}</select>
          <select className="fsel" value={fEstado} onChange={(e) => setFEstado(e.target.value)}><option value="">Estado: todos</option><option>Enviado</option><option>Falló</option></select>
          {(q || fTipo || fEstado) && <button className="btn-sm" onClick={() => { setQ(''); setFTipo(''); setFEstado(''); }}>Limpiar</button>}
        </div>
        {!emails ? <div className="spin" /> : filtrados.length === 0 ? (
          <div className="empty"><div className="ico">✉️</div><h3>Sin envíos registrados</h3><p>Cuando el sistema mande un correo, va a aparecer acá.</p></div>
        ) : (
          <div className="tablewrap"><table>
            <thead><tr><th style={{ minWidth: 120 }}>Fecha</th><th style={{ minWidth: 150 }}>Tipo</th><th style={{ minWidth: 200 }}>Para</th><th style={{ minWidth: 220 }}>Asunto</th><th style={{ minWidth: 90 }}>Estado</th><th style={{ minWidth: 160 }}>Acciones</th></tr></thead>
            <tbody>{filtrados.map((e, i) => {
              const fallo = e.estado !== 'Enviado';
              const puedeReintentar = fallo && REINTENTABLES.has(e.tipo) && e.payload;
              const aviso = avisoReintento && avisoReintento.i === i ? avisoReintento : null;
              return (
                <tr key={i}>
                  <td className="sec">{fmt(e.fecha)}</td>
                  <td><span className="tagchip">{e.tipo}</span></td>
                  <td className="sec">{e.para}</td>
                  <td>{e.asunto}</td>
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
