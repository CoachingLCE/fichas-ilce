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

const ICONO_TIPO = { 'Inscripción': '', 'Ficha': '', 'Actividad': '', 'Formulario': '' };
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

const TIPOS_FILTRO = ['Inscripción', 'Ficha', 'Actividad', 'Formulario'];
const PLURAL_TIPO = { 'Inscripción': 'Inscripciones', 'Ficha': 'Fichas', 'Actividad': 'Actividades', 'Formulario': 'Formularios' };

export default function Buscador({ usuario, irA, setQInscripciones }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [recientes, setRecientes] = useState([]);
  const [vistos, setVistos] = useState([]);
  // Pedido de Diego ("placeholder inteligente"): chips para filtrar rápido por tipo de
  // resultado, sin tener que repetir la búsqueda — se filtra sobre lo que ya trajo la API.
  const [tipoFiltro, setTipoFiltro] = useState('Todos');
  const timer = useRef(null);

  useEffect(() => { setRecientes(leer(CLAVE_BUSQUEDAS)); setVistos(leer(CLAVE_VISTOS)); }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    const texto = q.trim();
    if (texto.length < 2) { setResultados([]); setTipoFiltro('Todos'); return; }
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

  const porTipo = {};
  resultados.forEach((r) => { porTipo[r.tipo] = (porTipo[r.tipo] || 0) + 1; });
  const resultadosFiltrados = tipoFiltro === 'Todos' ? resultados : resultados.filter((r) => r.tipo === tipoFiltro);

  function abrir(r) {
    guardarVisto({ tipo: r.tipo, id: r.id, titulo: r.titulo, sub: r.sub });
    setVistos(leer(CLAVE_VISTOS));
    if (r.tab === 'inscripciones' && setQInscripciones) setQInscripciones(r.q || r.titulo || '');
    irA?.(r.tab);
  }

  return (
    <div style={{ maxWidth: 760 }}>
      <div className="busc-hero">
        <span className="busc-hero-ico"></span>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email, teléfono, DNI o curso…" />
        {q && <button className="busc-hero-clear" onClick={() => setQ('')} title="Limpiar"></button>}
      </div>
      {q.trim().length < 2 && (
        <p className="muted busc-hint">Ejemplos: María González · 11 5555-5555 · Coaching Ontológico</p>
      )}

      {/* Pedido de Diego: chips para filtrar rápido por tipo de resultado, una vez que ya hay
          resultados — no repiten la búsqueda, solo recortan lo que ya trajo la API. */}
      {q.trim().length >= 2 && !cargando && resultados.length > 0 && (
        <div className="busc-chips">
          <button className={'fchip' + (tipoFiltro === 'Todos' ? ' on' : '')} onClick={() => setTipoFiltro('Todos')}>Todos <span className="cnt">{resultados.length}</span></button>
          {TIPOS_FILTRO.filter((t) => porTipo[t] > 0).map((t) => (
            <button key={t} className={'fchip' + (tipoFiltro === t ? ' on' : '')} onClick={() => setTipoFiltro(t)}>{ICONO_TIPO[t]} {PLURAL_TIPO[t]} <span className="cnt">{porTipo[t]}</span></button>
          ))}
        </div>
      )}
      {q.trim().length >= 2 && !cargando && (
        <p className="muted busc-cnt">
          {resultados.length === 0 ? '0 resultados' : tipoFiltro === 'Todos'
            ? `${resultados.length} resultado${resultados.length === 1 ? '' : 's'} encontrado${resultados.length === 1 ? '' : 's'}`
            : `Mostrando ${resultadosFiltrados.length} de ${resultados.length} resultados`}
        </p>
      )}

      {q.trim().length < 2 ? (
        <div style={{ display: 'grid', gap: 22 }}>
          {recientes.length > 0 && (
            <div>
              <div className="muted" style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Últimas búsquedas</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {recientes.map((r) => (
                  <button key={r} className="btn-sm" onClick={() => setQ(r)}> {r}</button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="muted" style={{ fontSize: 12, fontWeight: 500, marginBottom: 8 }}>Últimos vistos</div>
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
                        <div style={{ fontWeight: 500, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.titulo}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{v.tipo}{v.sub ? ` · ${v.sub}` : ''}</div>
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
        <div className="empty empty-sm"><p>No encontramos resultados para "{q.trim()}". Probá con otro nombre, email, teléfono o curso.</p></div>
      ) : resultadosFiltrados.length === 0 ? (
        <div className="empty empty-sm"><p>No hay resultados de este tipo. <button className="linklike" onClick={() => setTipoFiltro('Todos')}>Ver todos</button></p></div>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {resultadosFiltrados.map((r, i) => (
            <div key={r.tipo + r.id + i} className="busc-card"
              style={{ borderLeft: `3px solid rgb(${COLOR_TIPO[r.tipo] || 'var(--border)'} / .7)` }} onClick={() => abrir(r)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <IconoTipo tipo={r.tipo} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}><Resaltado texto={r.titulo} q={q} /></div>
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
