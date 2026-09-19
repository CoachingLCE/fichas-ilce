'use client';
import { useEffect, useMemo, useState } from 'react';

// Solo lectura: quién figura como docente/staff, en qué curso y edición. El alta/baja de
// acceso real (usuario + contraseña) se gestiona en Presentismo ILCE, no acá — ver nota abajo.
// Pedido de Diego: "agregar una pestaña que muestre el equipo y que diga que acá no se puede
// levantar los datos, se levantan de acá [Presentismo] para dar acceso".
const LINK_PRESENTISMO = 'https://listadopresentismo.vercel.app/docentes';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

export default function Equipo({ usuario }) {
  const [docentes, setDocentes] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/docentes?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) { setError(d.error || 'No se pudo cargar'); setDocentes([]); return; }
      setDocentes(d.docentes || []);
    } catch {
      setError('No se pudo conectar con el servidor.'); setDocentes([]);
    }
  })(); /* eslint-disable-next-line */ }, []);

  const filtrados = useMemo(() => {
    if (!docentes) return [];
    const qq = norm(q);
    return docentes.filter((d) => !qq || norm(`${d.nombre} ${d.email} ${d.curso} ${d.edicion}`).includes(qq));
  }, [docentes, q]);

  const porPersona = useMemo(() => {
    const m = new Map();
    filtrados.forEach((d) => {
      const k = (d.email || '').toLowerCase();
      if (!m.has(k)) m.set(k, { nombre: d.nombre, email: d.email, asignaciones: [] });
      m.get(k).asignaciones.push({ curso: d.curso, edicion: d.edicion });
    });
    return [...m.values()].sort((a, b) => (a.nombre || a.email).localeCompare(b.nombre || b.email, 'es'));
  }, [filtrados]);

  if (!docentes) return <div className="spin" />;

  return (
    <div>
      <div className="note" style={{ marginBottom: 16 }}>
        📋 Esta pantalla es solo de consulta: acá <b>no se dan de alta ni de baja</b> accesos de docentes. El equipo, su curso/edición y la contraseña se gestionan en{' '}
        <a href={LINK_PRESENTISMO} target="_blank" rel="noopener noreferrer" style={{ color: 'rgb(var(--accentTeal))', fontWeight: 700 }}>Presentismo ILCE</a>
        {' '}— lo que ves acá es lo que ya está asignado en <b>Fichas</b> (Constructor → Ediciones → Docentes).
      </div>

      <div className="sechead">
        <span className="hcount">{porPersona.length} persona(s) · {filtrados.length} asignación(es)</span>
        <span className="grow" />
        <div className="fsearch" style={{ maxWidth: 260, flex: 'none' }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email, curso, edición…" /></div>
      </div>

      {error && <div className="note" style={{ borderLeftColor: 'rgb(248 113 113)' }}>{error}</div>}

      {porPersona.length === 0 ? (
        <div className="empty"><div className="ico">👥</div><h3>Sin equipo asignado</h3><p>Todavía no hay docentes/staff cargados en ningún curso.</p></div>
      ) : (
        <div className="tablewrap" style={{ maxHeight: '68vh' }}>
          <table>
            <thead><tr><th style={{ minWidth: 190 }}>Nombre</th><th style={{ minWidth: 220 }}>Email</th><th>Cursos / Ediciones</th></tr></thead>
            <tbody>{porPersona.map((p) => (
              <tr key={p.email}>
                <td><b>{p.nombre || '—'}</b></td>
                <td className="sec">{p.email}</td>
                <td>
                  <div className="tagcloud">
                    {p.asignaciones.map((a, i) => (
                      <span className="tc" key={i}>{a.curso}{a.edicion ? <> · Ed. <b>{a.edicion}</b></> : ''}</span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
