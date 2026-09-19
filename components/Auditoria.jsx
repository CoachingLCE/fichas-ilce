'use client';
import { useEffect, useMemo, useState } from 'react';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Categoriza cada acción para darle color + ícono según lo que se hizo.
const CATS = [
  // Antes "Ficha enviada" (lo que se registra cuando un estudiante completa su ficha de
  // inscripción, ver app/api/inscripcion/route.js) no matcheaba ninguna categoría — quedaba
  // como "otro" (un punto gris, sin ícono ni chip propio) y se perdía entre el resto de las
  // acciones. Ahora tiene su propia categoría para que se pueda ver/filtrar de un vistazo.
  { id: 'ficha', icono: '📋', color: 'rgb(74 222 128)', test: (a) => /ficha (enviad|completad)/i.test(a) },
  { id: 'crear', icono: '🟢', color: '#4ade80', test: (a) => /(cre[oó]|agreg[oó]|dio acceso|public[oó]|nueva|nuevo|import[oó]|carg[oó])/i.test(a) },
  { id: 'editar', icono: '✏️', color: '#fbbf24', test: (a) => /(edit[oó]|corrig|actualiz[oó]|modific[oó]|renombr[oó])/i.test(a) },
  { id: 'estado', icono: '📌', color: 'rgb(var(--accentTeal))', test: (a) => /(estado|inscri|aprob|revisi)/i.test(a) },
  { id: 'eliminar', icono: '🗑️', color: '#f87171', test: (a) => /(elimin[oó]|quit[oó]|borr[oó]|archiv[oó]|baja|rechaz)/i.test(a) },
  { id: 'mail', icono: '📧', color: 'rgb(var(--accentMagenta))', test: (a) => /(mail|correo|email|envi[oó])/i.test(a) },
  { id: 'login', icono: '🔑', color: '#60a5fa', test: (a) => /(inici[oó] sesi[oó]n|login|ingres[oó])/i.test(a) }
];
function catAccion(a) {
  const t = a || '';
  for (const c of CATS) if (c.test(t)) return c;
  return { id: 'otro', icono: '•', color: 'rgb(var(--textSec))' };
}

export default function Auditoria({ usuario }) {
  const [eventos, setEventos] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  useEffect(() => { (async () => {
    const res = await fetch('/api/auditoria?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setEventos(d.ok ? d.eventos : []);
  })(); /* eslint-disable-next-line */ }, []);
  const filtrados = useMemo(() => {
    if (!eventos) return [];
    const qq = norm(q);
    return eventos.filter((e) => {
      if (cat && catAccion(e.accion).id !== cat) return false;
      if (qq && !norm(`${e.usuario} ${e.accion} ${e.detalle} ${e.id}`).includes(qq)) return false;
      return true;
    });
  }, [eventos, q, cat]);
  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  if (!eventos) return <div className="spin" />;

  const CHIPS = [
    ['', 'Todas'], ['ficha', '📋 Ficha completada'], ['crear', '🟢 Creó'], ['editar', '✏️ Editó'], ['estado', '📌 Estado'],
    ['eliminar', '🗑️ Eliminó'], ['mail', '📧 Correo'], ['login', '🔑 Login']
  ];
  return (
    <div>
      <div className="sechead">
        <span className="hcount">{filtrados.length} acción(es) registradas</span>
        <span className="grow" />
        <div className="fsearch" style={{ maxWidth: 260, flex: 'none' }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por usuario, acción, detalle…" /></div>
      </div>
      <div className="fchips" style={{ marginBottom: 12 }}>
        {CHIPS.map(([id, label]) => (
          <button key={id} data-tour={id === 'ficha' ? 'chip-ficha-completada' : undefined} className={'pill' + (cat === id ? ' on' : '')} onClick={() => setCat(id)}>{label}</button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <div className="empty"><div className="ico">🧾</div><h3>Sin registros</h3><p>No hay acciones para ese filtro.</p></div>
      ) : (
        <div className="tablewrap" style={{ maxHeight: '68vh' }}>
          <table>
            <thead><tr><th style={{ minWidth: 120 }}>Fecha</th><th style={{ minWidth: 190 }}>Usuario</th><th style={{ minWidth: 170 }}>Acción</th><th style={{ minWidth: 240 }}>Detalle</th></tr></thead>
            <tbody>{filtrados.map((e, i) => {
              const c = catAccion(e.accion);
              return (
                <tr key={i}>
                  <td className="sec">{fmt(e.fecha)}</td>
                  <td>{e.usuario}</td>
                  <td><b style={{ color: c.color }}>{c.icono} {e.accion}</b></td>
                  <td className="sec">{e.detalle}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
