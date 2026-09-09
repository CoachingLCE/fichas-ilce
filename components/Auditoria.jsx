'use client';
import { useEffect, useMemo, useState } from 'react';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Auditoria({ usuario }) {
  const [eventos, setEventos] = useState(null);
  const [q, setQ] = useState('');
  useEffect(() => { (async () => {
    const res = await fetch('/api/auditoria?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setEventos(d.ok ? d.eventos : []);
  })(); /* eslint-disable-next-line */ }, []);
  const filtrados = useMemo(() => {
    if (!eventos) return [];
    const qq = norm(q);
    return qq ? eventos.filter((e) => norm(`${e.usuario} ${e.accion} ${e.detalle} ${e.id}`).includes(qq)) : eventos;
  }, [eventos, q]);
  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  if (!eventos) return <div className="spin" />;
  return (
    <div>
      <div className="sechead">
        <span className="hcount">{filtrados.length} acción(es) registradas</span>
        <span className="grow" />
        <div className="fsearch" style={{ maxWidth: 260, flex: 'none' }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por usuario, acción, detalle…" /></div>
      </div>
      {filtrados.length === 0 ? (
        <div className="empty"><div className="ico">🧾</div><h3>Sin registros</h3><p>Todavía no hay acciones registradas.</p></div>
      ) : (
        <div className="tablewrap" style={{ maxHeight: '68vh' }}>
          <table>
            <thead><tr><th style={{ minWidth: 120 }}>Fecha</th><th style={{ minWidth: 190 }}>Usuario</th><th style={{ minWidth: 150 }}>Acción</th><th style={{ minWidth: 240 }}>Detalle</th></tr></thead>
            <tbody>{filtrados.map((e, i) => (
              <tr key={i}><td className="sec">{fmt(e.fecha)}</td><td>{e.usuario}</td><td><b>{e.accion}</b></td><td className="sec">{e.detalle}</td></tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
