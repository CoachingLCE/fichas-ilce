'use client';
import { useEffect, useMemo, useState } from 'react';
import { APP_URL } from '../lib/constants';

const ESTADO_META = {
  Publicada: { cls: 'pub', label: 'Publicada' },
  Borrador: { cls: 'bor', label: 'Borrador' },
  Cerrada: { cls: 'cer', label: 'Cerrada' }
};

export default function FichasSection({ usuario, rows, onEditar, showToast, puedeEditar }) {
  const [defs, setDefs] = useState(null);
  const [q, setQ] = useState('');
  const [chip, setChip] = useState('Todas');
  const [menuAbierto, setMenuAbierto] = useState(null);

  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  async function cargar() {
    try {
      const res = await fetch('/api/fichas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const data = await res.json();
      if (data.ok) setDefs(data.defs.map((d) => ({ ...d, estado: d.estado || 'Publicada' })));
      else setDefs([]);
    } catch { setDefs([]); }
  }

  const conteos = useMemo(() => {
    const m = {};
    (rows || []).forEach((r) => { if (r.curso) m[r.curso] = (m[r.curso] || 0) + 1; });
    return m;
  }, [rows]);

  const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const filtradas = useMemo(() => {
    if (!defs) return [];
    const qq = norm(q);
    return defs.filter((d) => {
      if (chip === 'Publicadas' && d.estado !== 'Publicada') return false;
      if (chip === 'Borradores' && d.estado !== 'Borrador') return false;
      if (chip === 'Cerradas' && d.estado !== 'Cerrada') return false;
      if (qq) {
        const hay = norm([d.curso, d.titulo, d.slug, (d.ediciones || []).map((e) => e.label).join(' ')].join(' '));
        if (!hay.includes(qq)) return false;
      }
      return true;
    });
  }, [defs, q, chip]);

  const cuenta = (estado) => (defs || []).filter((d) => !estado || d.estado === estado).length;

  async function guardarEstado(d, nuevo) {
    const prev = d.estado;
    setDefs((arr) => arr.map((x) => x.slug === d.slug ? { ...x, estado: nuevo } : x));
    setMenuAbierto(null);
    try {
      const res = await fetch('/api/fichas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug: d.slug, def: { ...d, estado: nuevo } })
      });
      const data = await res.json();
      if (!data.ok) throw new Error();
      showToast(nuevo === 'Publicada' ? '✓ Ficha publicada' : nuevo === 'Cerrada' ? '✓ Ficha cerrada' : '✓ Ficha en borrador');
    } catch {
      setDefs((arr) => arr.map((x) => x.slug === d.slug ? { ...x, estado: prev } : x));
      showToast('⚠ No se pudo actualizar la ficha');
    }
  }
  function copiarLink(d) {
    const url = `${APP_URL}/inscripcion/${d.slug}`;
    navigator.clipboard?.writeText(url);
    showToast('✓ Enlace copiado');
    setMenuAbierto(null);
  }
  function abrirPublica(d) { window.open(`${APP_URL}/inscripcion/${d.slug}`, '_blank'); setMenuAbierto(null); }

  if (!defs) return <div className="spin" />;

  return (
    <div onClick={() => menuAbierto && setMenuAbierto(null)}>
      <div className="fchips">
        {[['Todas', cuenta()], ['Publicadas', cuenta('Publicada')], ['Borradores', cuenta('Borrador')], ['Cerradas', cuenta('Cerrada')]].map(([c, n]) => (
          <button key={c} className={'fchip' + (chip === c ? ' on' : '')} onClick={() => setChip(c)}>{c} <span className="cnt">{n}</span></button>
        ))}
      </div>
      <div className="fbar">
        <div className="fsearch">🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar fichas…" /></div>
        {q && <button className="btn-sm" onClick={() => setQ('')}>Limpiar</button>}
      </div>

      {filtradas.length === 0 ? (
        <div className="empty">
          <div className="ico">🗂️</div>
          {q || chip !== 'Todas'
            ? <><h3>No encontramos fichas con estos filtros</h3><p>Probá con otro término o cambiá el filtro.</p><button className="btn-sm" onClick={() => { setQ(''); setChip('Todas'); }}>Limpiar filtros</button></>
            : <><h3>No hay fichas todavía</h3><p>Creá tu primera ficha desde el Constructor.</p></>}
        </div>
      ) : (
        <div className="fgrid">
          {filtradas.map((d) => {
            const meta = ESTADO_META[d.estado] || ESTADO_META.Publicada;
            const insc = conteos[d.curso] || 0;
            const eds = d.ediciones || [];
            const actualizado = d.actualizado ? fmt(d.actualizado) : '—';
            return (
              <div className="fcard" key={d.slug}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className={'fstate ' + meta.cls}><span className="d" />{meta.label}</span>
                  <span style={{ fontSize: 12, color: 'rgb(var(--textMuted))' }}>Actualizada {actualizado}</span>
                </div>
                <div>
                  <div className="ftitle">{d.curso}</div>
                  <div className="fsub">{eds.length ? (eds.length === 1 ? eds[0].label : `${eds.length} ediciones`) : 'Sin edición cargada'}</div>
                </div>
                <div className="fmeta">
                  <span><span className="ins">{insc}</span> inscripciones</span>
                </div>
                <div className="flink">
                  <span className="u">/inscripcion/{d.slug}</span>
                  <button onClick={() => copiarLink(d)}>Copiar</button>
                </div>
                <div className="factions">
                  <button className="btn-sm" onClick={() => abrirPublica(d)}>👁 Ver</button>
                  {puedeEditar && <button className="btn-sm solid" onClick={() => onEditar(d.slug)}>✎ Editar</button>}
                  <span className="grow" />
                  {puedeEditar && (
                    <div className="fmenu">
                      <button className="btn-sm" onClick={(e) => { e.stopPropagation(); setMenuAbierto(menuAbierto === d.slug ? null : d.slug); }}>•••</button>
                      {menuAbierto === d.slug && (
                        <div className="fmenu-pop" onClick={(e) => e.stopPropagation()}>
                          <button onClick={() => copiarLink(d)}>🔗 Copiar enlace</button>
                          <button onClick={() => abrirPublica(d)}>↗ Abrir pública</button>
                          {d.estado !== 'Publicada' && <button onClick={() => guardarEstado(d, 'Publicada')}>🟢 Publicar</button>}
                          {d.estado !== 'Borrador' && <button onClick={() => guardarEstado(d, 'Borrador')}>🟡 Pasar a borrador</button>}
                          <div className="sep" />
                          {d.estado !== 'Cerrada'
                            ? <button className="danger" onClick={() => guardarEstado(d, 'Cerrada')}>🔴 Cerrar ficha</button>
                            : <button onClick={() => guardarEstado(d, 'Publicada')}>♻ Reabrir ficha</button>}
                          <button onClick={() => { setMenuAbierto(null); showToast('Duplicar y agregar cursos llegan en el próximo lote'); }}>⧉ Duplicar</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function fmt(iso) {
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  const hoy = new Date();
  if (d.toDateString() === hoy.toDateString()) return 'hoy';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
