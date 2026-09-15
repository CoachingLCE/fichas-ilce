'use client';
import { useEffect, useMemo, useState } from 'react';
import { APP_URL } from '../lib/constants';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Formularios({ usuario, showToast }) {
  const [sub, setSub] = useState('lista');
  return (
    <div>
      <div className="subtabs">
        <button className={sub === 'lista' ? 'on' : ''} onClick={() => setSub('lista')}>Formularios</button>
        <button className={sub === 'respuestas' ? 'on' : ''} onClick={() => setSub('respuestas')}>Respuestas</button>
      </div>
      {sub === 'lista' && <Lista usuario={usuario} showToast={showToast} />}
      {sub === 'respuestas' && <Respuestas usuario={usuario} />}
    </div>
  );
}

function Lista({ usuario, showToast }) {
  const [forms, setForms] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/formularios?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudieron cargar los formularios');
      setForms(d.formularios || []);
    } catch (e) { setError(e.message || 'Error de conexión'); setForms([]); }
  })(); /* eslint-disable-next-line */ }, []);
  if (error) return <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{error}. Revisá que exista la pestaña “Formularios” en la Sheet.</p></div>;
  if (!forms) return <div className="spin" />;
  if (forms.length === 0) return <div className="empty"><div className="ico">📝</div><h3>No hay formularios cargados</h3><p>Pegá las definiciones en la pestaña Formularios de la Sheet.</p></div>;
  return (
    <div className="fgrid">
      {forms.map((f) => (
        <div className="fcard" key={f.slug}>
          <div className="fcard-top">
            <span className={'fstate ' + (f.estado === 'Publicada' ? 'pub' : 'bor')}><span className="d" />{f.estado}</span>
            <span className="tagchip">{f.tipo || 'Formulario'}</span>
          </div>
          <div className="ftitle" style={{ fontSize: 18 }}>{f.titulo}</div>
          <div className="fsub">{f.campos.length} campos</div>
          <div className="fspacer" />
          <div><div className="acard-link-label">Enlace</div>
            <div className="flink"><span className="u">/formulario/{f.slug}</span>
              <button onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/formulario/${f.slug}`); showToast('✓ Enlace copiado'); }}>Copiar</button></div></div>
          <div className="factions">
            <a className="btn-sm solid" style={{ flex: 1, justifyContent: 'center' }} href={`${APP_URL}/formulario/${f.slug}`} target="_blank" rel="noreferrer">👁 Abrir</a>
          </div>
        </div>
      ))}
    </div>
  );
}

function Respuestas({ usuario }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [fForm, setFForm] = useState('');
  const [abierto, setAbierto] = useState(null);
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/formularios/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudieron cargar las respuestas');
      setData(d.respuestas || []);
    } catch (e) { setError(e.message || 'Error de conexión'); setData([]); }
  })(); /* eslint-disable-next-line */ }, []);
  const forms = useMemo(() => [...new Set((data || []).map((x) => x.formulario).filter(Boolean))].sort(), [data]);
  const filtradas = useMemo(() => {
    const qq = norm(q);
    return (data || []).filter((x) => {
      if (fForm && x.formulario !== fForm) return false;
      if (qq && !norm(`${x.nombre} ${x.email} ${x.curso} ${x.edicion}`).includes(qq)) return false;
      return true;
    });
  }, [data, q, fForm]);
  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  if (error) return <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{error}. Revisá que exista la pestaña “RespuestasFormularios” en la Sheet.</p></div>;
  if (!data) return <div className="spin" />;
  return (
    <div>
      <div className="filters">
        <div className="fsearch" style={{ maxWidth: 260 }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email…" /></div>
        <select className="fsel" value={fForm} onChange={(e) => setFForm(e.target.value)}><option value="">Formulario: todos</option>{forms.map((x) => <option key={x}>{x}</option>)}</select>
        {(q || fForm) && <button className="btn-sm" onClick={() => { setQ(''); setFForm(''); }}>Limpiar</button>}
      </div>
      <p className="count">{filtradas.length} respuesta(s)</p>
      {filtradas.length === 0 ? <div className="empty"><div className="ico">📭</div><h3>Sin respuestas</h3><p>No hay respuestas para estos filtros.</p></div> : (
        <div className="tablewrap"><table>
          <thead><tr><th style={{ minWidth: 110 }}>Fecha</th><th style={{ minWidth: 150 }}>Nombre</th><th style={{ minWidth: 180 }}>Email</th><th style={{ minWidth: 130 }}>Curso</th><th style={{ minWidth: 70 }}>Edic.</th><th style={{ minWidth: 160 }}>Formulario</th><th style={{ minWidth: 70 }}></th></tr></thead>
          <tbody>{filtradas.map((x) => (
            <>
              <tr key={x.id} onClick={() => setAbierto(abierto === x.id ? null : x.id)}>
                <td className="sec">{(x.fecha || '').slice(0, 10)}</td>
                <td><b>{x.nombre || '—'}</b></td>
                <td className="sec">{x.email}</td>
                <td>{x.curso || '—'}</td>
                <td>{x.edicion || '—'}</td>
                <td>{x.formulario}</td>
                <td className="teal" style={{ color: 'rgb(var(--accentTeal))', fontWeight: 700 }}>{abierto === x.id ? 'Ocultar' : 'Ver'}</td>
              </tr>
              {abierto === x.id && (
                <tr><td colSpan={7} style={{ background: 'rgb(var(--surface2))' }}>
                  <div style={{ padding: '10px 6px', display: 'grid', gap: 8 }}>
                    {Object.entries(x.r || {}).filter(([k]) => !['email', 'nombre', 'curso', 'edicion'].includes(k)).map(([k, v]) => (
                      <div key={k}><div style={{ fontSize: 11.5, color: 'rgb(var(--textMuted))', textTransform: 'capitalize' }}>{k}</div><div style={{ fontSize: 13.5 }}>{String(v)}</div></div>
                    ))}
                  </div>
                </td></tr>
              )}
            </>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}
