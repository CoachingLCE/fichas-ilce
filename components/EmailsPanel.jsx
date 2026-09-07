'use client';
import { useEffect, useMemo, useState } from 'react';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const AUTOMATIZACIONES = [
  { evento: 'Se completa una ficha de inscripción', para: 'Al estudiante (con botón de WhatsApp)', tipo: 'Confirmación inscripción' },
  { evento: 'Se completa una ficha de inscripción', para: 'Macarena, Alexander y Jesabel', tipo: 'Aviso equipo' },
  { evento: 'Se crea un usuario / se da acceso a un docente', para: 'Al usuario (con su contraseña)', tipo: 'Credenciales acceso' },
  { evento: 'El estudiante responde una actividad (Postwork)', para: 'Al estudiante (con su puntaje)', tipo: 'Resultado actividad' },
  { evento: 'Todos los viernes (automático)', para: 'Sofía, Paula, Lourdes y Victoria', tipo: 'Resumen viernes' }
];

export default function EmailsPanel({ usuario }) {
  const [emails, setEmails] = useState(null);
  const [q, setQ] = useState('');
  const [fTipo, setFTipo] = useState(''); const [fEstado, setFEstado] = useState('');

  useEffect(() => { (async () => {
    const res = await fetch('/api/emails?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setEmails(d.ok ? d.emails : []);
  })(); /* eslint-disable-next-line */ }, []);

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
        <div className="tablewrap" style={{ maxHeight: 'none' }}>
          <table>
            <thead><tr><th style={{ minWidth: 240 }}>Cuándo se envía</th><th style={{ minWidth: 220 }}>A quién</th><th style={{ minWidth: 160 }}>Tipo</th></tr></thead>
            <tbody>{AUTOMATIZACIONES.map((a, i) => (
              <tr key={i}><td>{a.evento}</td><td className="sec">{a.para}</td><td><span className="tagchip">{a.tipo}</span></td></tr>
            ))}</tbody>
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
            <thead><tr><th style={{ minWidth: 120 }}>Fecha</th><th style={{ minWidth: 150 }}>Tipo</th><th style={{ minWidth: 200 }}>Para</th><th style={{ minWidth: 220 }}>Asunto</th><th style={{ minWidth: 90 }}>Estado</th></tr></thead>
            <tbody>{filtrados.map((e, i) => (
              <tr key={i}>
                <td className="sec">{fmt(e.fecha)}</td>
                <td><span className="tagchip">{e.tipo}</span></td>
                <td className="sec">{e.para}</td>
                <td>{e.asunto}</td>
                <td><span className={'badge ' + (e.estado === 'Enviado' ? 'b-Aprobada' : 'b-Observada')}>{e.estado}</span></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>
    </div>
  );
}
