'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { filtrarTelefono } from '../lib/validacion';

// Campo "Número de WhatsApp": desplegable de país (bandera + prefijo, con buscador) y, al lado, el número. `lib` es lib/whatsapp.js, que se carga recién al llegar a este paso
// (pesa 39 KB). El desplegable se dibuja FUERA de la tarjeta (portal): la tarjeta de la ficha recorta lo que se sale de ella. En celular es una hoja que sube desde abajo.
// Teclado: ↑ ↓ para moverse, Enter para elegir, Esc para cerrar; al abrir el cursor ya está en el buscador.
export default function CampoWhatsapp({ lib, iso, num, onCambio, invalido = false }) {
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState('');
  const [activo, setActivo] = useState(0);
  const [pos, setPos] = useState({ celular: false, style: {} });
  const botonRef = useRef(null);
  const buscadorRef = useRef(null);
  const listaRef = useRef(null);
  const lista = useMemo(() => (lib ? lib.listaPaises() : []), [lib]);
  const resultados = useMemo(() => (lib ? lib.buscarPaises(q, lista) : []), [lib, q, lista]);
  const actual = useMemo(() => lista.find((p) => p.iso === iso) || null, [lista, iso]);
  const resultado = useMemo(() => (lib && num ? lib.normalizarWhatsapp(num, iso) : null), [lib, num, iso]);

  const abrir = useCallback(() => {
    if (!botonRef.current) return;
    const r = botonRef.current.getBoundingClientRect();
    const celular = window.innerWidth <= 640;
    const alto = Math.min(340, window.innerHeight - 24);
    const abajo = window.innerHeight - r.bottom - 12;
    const style = celular ? {} : {
      left: Math.max(8, Math.min(r.left, window.innerWidth - 8 - Math.min(360, window.innerWidth - 16))), width: Math.min(360, window.innerWidth - 16),
      ...(abajo >= 240 || abajo >= r.top ? { top: r.bottom + 6, maxHeight: Math.min(alto, Math.max(200, abajo)) } : { bottom: window.innerHeight - r.top + 6, maxHeight: Math.min(alto, Math.max(200, r.top - 12)) })
    };
    setPos({ celular, style });
    setQ('');
    setActivo(Math.max(0, lista.findIndex((p) => p.iso === iso)));
    setAbierto(true);
  }, [iso, lista]);
  const cerrar = useCallback(() => { setAbierto(false); setTimeout(() => botonRef.current && botonRef.current.focus(), 0); }, []);
  useEffect(() => { if (abierto) { const t = setTimeout(() => buscadorRef.current && buscadorRef.current.focus(), 40); return () => clearTimeout(t); } return undefined; }, [abierto]);
  useEffect(() => { setActivo(0); }, [q]);
  useEffect(() => {
    if (!abierto || !listaRef.current) return;
    const el = listaRef.current.querySelector('[data-activo="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [activo, abierto, resultados]);
  // Si cambia el tamaño de la pantalla con el desplegable abierto, se cierra (evita que quede mal ubicado).
  useEffect(() => {
    if (!abierto) return undefined;
    const f = () => setAbierto(false);
    window.addEventListener('resize', f);
    return () => window.removeEventListener('resize', f);
  }, [abierto]);

  function elegir(p) {
    if (!p) return;
    onCambio({ iso: p.iso, manual: true });
    cerrar();
  }
  function teclas(e) {
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cerrar(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((i) => Math.min(i + 1, Math.max(0, resultados.length - 1))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Home') { e.preventDefault(); setActivo(0); }
    else if (e.key === 'End') { e.preventDefault(); setActivo(Math.max(0, resultados.length - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); elegir(resultados[activo]); }
  }

  if (!lib) {
    return (
      <div className="wa-campo" aria-busy="true">
        <span className="wa-pais wa-pais-carga"><span className="wa-fl" aria-hidden="true">🌐</span><span className="wa-pre">…</span></span>
        <input className="ctrl wa-num" disabled placeholder="Cargando…" aria-label="Número de WhatsApp" />
      </div>
    );
  }

  const ejemplo = iso ? lib.ejemploCelular(iso) : '';
  // Lo que ve la persona mientras escribe: a qué número le vamos a escribir (así, en Argentina, se ve el 9 que agregamos).
  const confirmacion = resultado && resultado.ok ? resultado.internacional : '';
  function alEscribir(e) { onCambio({ num: filtrarTelefono(e.target.value) }); }
  function alPegar(e) {
    const texto = (e.clipboardData || window.clipboardData).getData('text') || '';
    if (!/^\s*(\+|00)/.test(texto)) return;
    const r = lib.normalizarWhatsapp(texto, iso);
    if (r.ok) { e.preventDefault(); onCambio({ iso: r.iso, num: r.nacional, manual: true }); }
  }
  function alSalir() {
    if (!num) return;
    const r = lib.normalizarWhatsapp(num, iso);
    if (r.ok) onCambio({ iso: r.iso, num: r.nacional, ...(r.iso !== iso ? { manual: true } : {}) });
  }

  return (
    <>
      <div className={'wa-campo' + (invalido ? ' wa-malo' : '')}>
        <button type="button" ref={botonRef} className="wa-pais" aria-haspopup="listbox" aria-expanded={abierto}
          aria-label={actual ? `País del número: ${actual.nombre}, ${actual.prefijo}. Tocá para cambiarlo` : 'Elegir el país del número'} onClick={abrir}>
          <span className="wa-fl" aria-hidden="true">{actual ? actual.bandera : '🌐'}</span>
          <span className="wa-pre">{actual ? actual.prefijo : 'Elegí'}</span>
          <span className="wa-car" aria-hidden="true">▾</span>
        </button>
        <input className="ctrl wa-num" type="tel" inputMode="tel" autoComplete="tel-national" name="wa_numero" value={num || ''} onChange={alEscribir} onPaste={alPegar} onBlur={alSalir}
          placeholder={ejemplo ? `Ej.: ${ejemplo}` : 'Tu número de celular'} aria-label="Número de WhatsApp, sin el código del país" aria-invalid={invalido ? 'true' : undefined} />
      </div>
      <div className="help" data-wa-ayuda>
        {actual ? <b>{actual.nombre} ({actual.prefijo}). </b> : <b>Elegí el país de tu número. </b>}{iso ? lib.ayudaWhatsapp(iso) : 'Así sabemos a qué número escribirte.'}
      </div>
      {confirmacion && <div className="wa-ok" data-wa-ok>✓ Te vamos a escribir a <b>{confirmacion}</b></div>}
      {abierto && typeof document !== 'undefined' && createPortal(
        <>
          <div className={'wa-fondo' + (pos.celular ? ' wa-fondo-hoja' : '')} onClick={cerrar} />
          <div className={'wa-pop' + (pos.celular ? ' wa-hoja' : '')} style={pos.celular ? undefined : pos.style} role="dialog" aria-label="Elegir el país del número" onKeyDown={teclas}>
            <div className="wa-busca">
              <input ref={buscadorRef} type="search" role="combobox" aria-expanded="true" aria-controls="wa-lista" aria-autocomplete="list" aria-label="Buscar país o código"
                aria-activedescendant={resultados[activo] ? `wa-op-${resultados[activo].iso}` : undefined} autoComplete="off" autoCapitalize="off" spellCheck={false}
                value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar país o código (ej.: uru, +598)" />
              {pos.celular && <button type="button" className="wa-x" aria-label="Cerrar" onClick={cerrar}>✕</button>}
            </div>
            <ul id="wa-lista" role="listbox" ref={listaRef} className="wa-lista" aria-label="Países">
              {resultados.map((p, i) => (
                <li key={p.iso} role="presentation">
                  {!q && i > 0 && !p.destacado && resultados[i - 1].destacado && <div className="wa-sep" role="separator">Todos los países</div>}
                  <div id={`wa-op-${p.iso}`} role="option" aria-selected={p.iso === iso} data-activo={i === activo ? 'true' : undefined} data-iso={p.iso}
                    className={'wa-op' + (i === activo ? ' act' : '') + (p.iso === iso ? ' sel' : '')} onMouseMove={() => setActivo(i)} onClick={() => elegir(p)}>
                    <span className="wa-fl" aria-hidden="true">{p.bandera}</span><span className="wa-nom">{p.nombre}</span><span className="wa-pre">{p.prefijo}</span>
                  </div>
                </li>
              ))}
              {!resultados.length && <li className="wa-vacio" role="presentation">No encontramos ese país. Probá con el nombre o con el código (ej.: +598).</li>}
            </ul>
          </div>
        </>, document.body)}
    </>
  );
}
