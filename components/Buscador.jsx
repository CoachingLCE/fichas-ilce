'use client';
import { useEffect, useState, useRef } from 'react';

const CLAVE_BUSQUEDAS = 'ilce-buscador-recientes';
const CLAVE_VISTOS = 'ilce-buscador-vistos';

function leer(clave) { try { return JSON.parse(localStorage.getItem(clave) || '[]'); } catch { return []; } }
function guardarBusqueda(texto) {
  try {
    const previas = leer(CLAVE_BUSQUEDAS);
    const actualizadas = [texto, ...previas.filter((t) => t.toLowerCase() !== texto.toLowerCase())].slice(0, 8);
    localStorage.setItem(CLAVE_BUSQUEDAS, JSON.stringify(actualizadas));
  } catch { /* */ }
}
function guardarVisto(item) {
  try {
    const previos = leer(CLAVE_VISTOS);
    const actualizados = [item, ...previos.filter((p) => !(p.tipo === item.tipo && p.id === item.id))].slice(0, 10);
    localStorage.setItem(CLAVE_VISTOS, JSON.stringify(actualizados));
  } catch { /* */ }
}

const ICONO_TIPO = { 'Inscripción': '📋', 'Ficha': '📝', 'Actividad': '🧩', 'Formulario': '🗒️' };
const COLOR_TIPO = { 'Inscripción': 'var(--accentTeal)', 'Ficha': 'var(--accentPurple)', 'Actividad': 'var(--accentMagenta)', 'Formulario': 'var(--accentTeal2)' };
function IconoTipo({ tipo, size = 20 }) {
  const c = COLOR_TIPO[tipo] || 'var(--textMuted)';
  return (
    <span className="busc-icochip" style={{ width: size + 14, height: size + 14, background: `rgb(${c} / .14)`, color: `rgb(${c})`, fontSize: size - 3 }}>
      {ICONO_TIPO[tipo] || '•'}
    </span>
  );
}

function Resaltado({ texto, q }) {
  if (!texto || !q) return texto || '';
  const idx = texto.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return texto;
  return (<>{texto.slice(0, idx)}<b style={{ color: 'rgb(var(--accentTeal))' }}>{texto.slice(idx, idx + q.length)}</b>{texto.slice(idx + q.length)}</>);
}

export default function Buscador({ usuario, irA, setQInscripciones }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [recientes, setRecientes] = useState([]);
  const [vistos, setVistos] = useState([]);
  const timer = useRef(null);

  useEffect(() => { setRecientes(leer(CLAVE_BUSQUEDAS)); setVistos(leer(CLAVE_VISTOS)); }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const texto = q.trim();
    if (texto.length < 2) { setResultados([]); return; }
    timer.current = setTimeout(async () => {
      setCargando(true);
      try {
        const res = await fetch(`/api/buscador?q=${encodeURIComponent(texto)}&solicitanteEmail=${encodeURIComponent(usuario.email)}`);
        const d = await res.json();
        setResultados(d.ok ? d.resultados : []);
        guardarBusqueda(texto); setRecientes(leer(CLAVE_BUSQUEDAS));
      } catch { setResultados([]); }
      setCargando(false);
    }, 300);
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line
  }, [q]);

  function abrir(r) {
    guardarVisto({ tipo: r.tipo, id: r.id, titulo: r.titulo, sub: r.sub });
    setVistos(leer(CLAVE_VISTOS));
    if (r.tab === 'inscripciones' && setQInscripciones) setQInscripciones(r.q || r.titulo || '');
    irA?.(r.tab);
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="busc-hero">
        <span className="busc-hero-ico">🔎</span>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar fichas, inscripciones, actividades, formularios…" />
        {q && <button className="busc-hero-clear" onClick={() => setQ('')} title="Limpiar">✕</button>}
      </div>

      {q.trim().length < 2 ? (
        <div style={{ display: 'grid', gap: 22 }}>
          {recientes.length > 0 && (
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Últimas búsquedas</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {recientes.map((r) => (
                  <button key={r} className="btn-sm" onClick={() => setQ(r)}>🔍 {r}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Últimos vistos</div>
            {vistos.length === 0 ? (
              <p className="muted" style={{ fontSize: 13 }}>Todavía no abriste ningún resultado desde el buscador.</p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {vistos.map((v, i) => (
                  <div key={v.tipo + v.id + i} className="busc-card"
                    style={{ borderLeft: `3px solid rgb(${COLOR_TIPO[v.tipo] || 'var(--border)'} / .6)` }}
                    onClick={() => abrir({ ...v, tab: v.tipo === 'Inscripción' ? 'inscripciones' : v.tipo === 'Ficha' ? 'fichas' : v.tipo === 'Actividad' ? 'actividades' : 'formularios' })}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <IconoTipo tipo={v.tipo} size={16} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.titulo}</div>
                        <div className="muted" style={{ fontSize: 11.5 }}>{v.tipo}{v.sub ? ` · ${v.sub}` : ''}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : cargando ? (
        <div className="spin" />
      ) : resultados.length === 0 ? (
        <div className="empty"><div className="ico">🔎</div><h3>Sin resultados</h3><p>Probá con otro nombre, email o curso.</p></div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {resultados.map((r, i) => (
            <div key={r.tipo + r.id + i} className="busc-card"
              style={{ borderLeft: `3px solid rgb(${COLOR_TIPO[r.tipo] || 'var(--border)'} / .7)` }} onClick={() => abrir(r)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconoTipo tipo={r.tipo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}><Resaltado texto={r.titulo} q={q} /></div>
                  <div className="muted" style={{ fontSize: 12 }}>{r.sub}{r.extra ? ` · ${r.extra}` : ''}</div>
                </div>
                <span className="tagchip">{r.tipo}</span>
                {r.estado && <span className={'fstate ' + (r.estado === 'Publicada' || r.estado === 'Completada' || r.estado === 'Inscrito' ? 'pub' : r.estado === 'Borrador' ? 'bor' : '')}><span className="d" />{r.estado}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
