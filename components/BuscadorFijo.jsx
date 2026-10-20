'use client';
// Buscador fijo (atajo "/"): encuentra tareas y pantallas según lo que la persona puede hacer y la lleva directo.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconoGuia } from './GuiaIconos';

/** Lleva a un destino: { ruta } navega; { accion: 'password' | 'novedades' | 'ayuda' } dispara lo que ya existe en la app. */
export function irADestino(destino, router) {
  if (!destino) return;
  if (destino.ruta) { router.push(destino.ruta); return; }
  if (destino.accion === 'password') window.dispatchEvent(new Event('ilce:cambiar-password'));
  else if (destino.accion === 'novedades') window.dispatchEvent(new Event('ilce:novedades'));
  else if (destino.accion === 'ayuda') { const b = document.querySelector('button[aria-label="Necesito ayuda"]'); if (b) b.click(); }
}

export default function BuscadorFijo({ buscar, onIr, placeholder = 'Buscar una tarea o pantalla (/)' }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [abierto, setAbierto] = useState(false);
  const [sel, setSel] = useState(0);
  const [pos, setPos] = useState(null);
  const ref = useRef(null); const caja = useRef(null);
  const resultados = useMemo(() => (q.trim().length >= 2 ? buscar(q) : []), [q, buscar]);
  useEffect(() => { setSel(0); }, [q]);
  useEffect(() => {
    const f = (e) => {
      const el = e.target; const escribiendo = el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable);
      if (e.key === '/' && !escribiendo && !e.ctrlKey && !e.metaKey && !e.altKey && ref.current && ref.current.offsetParent !== null) { e.preventDefault(); ref.current.focus(); }
    };
    document.addEventListener('keydown', f); return () => document.removeEventListener('keydown', f);
  }, []);
  function medir() { const r = caja.current && caja.current.getBoundingClientRect(); if (r) setPos({ left: r.left, top: r.bottom + 4, width: Math.max(260, Math.min(440, window.innerWidth - r.left - 12)) }); }
  function elegir(r) { if (!r) return; setQ(''); setAbierto(false); if (ref.current) ref.current.blur(); if (onIr) onIr(r.destino); else irADestino(r.destino, router); }
  function teclas(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, resultados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); elegir(resultados[sel]); }
    else if (e.key === 'Escape') { setAbierto(false); if (ref.current) ref.current.blur(); }
  }
  return (
    <div role="search" data-buscador-fijo>
      <div ref={caja} className="flex items-center gap-2 bg-bg border border-border rounded-lg px-2.5 h-9 focus-within:border-accentTeal">
        <span className="text-textMuted"><IconoGuia nombre="buscar" size={15} /></span>
        <input ref={ref} type="search" value={q} placeholder={placeholder} aria-label="Buscar una tarea o pantalla" autoComplete="off" data-buscar-fijo
          onChange={(e) => { setQ(e.target.value); setAbierto(true); medir(); }} onFocus={() => { setAbierto(true); medir(); }} onBlur={() => setTimeout(() => setAbierto(false), 150)} onKeyDown={teclas}
          className="flex-1 min-w-0 bg-transparent outline-none text-[13px] text-text placeholder:text-textMuted" />
      </div>
      {abierto && q.trim().length >= 2 && pos && (
        <ul role="listbox" data-resultados-fijo className="fixed z-[70] bg-surface border border-border rounded-xl shadow-2xl p-1.5 max-h-[70vh] overflow-y-auto" style={{ left: pos.left, top: pos.top, width: pos.width }}>
          {resultados.length ? resultados.map((r, i) => (
            <li key={r.clave} role="option" aria-selected={i === sel} data-resultado={r.grupo} onMouseDown={(e) => { e.preventDefault(); elegir(r); }} onMouseEnter={() => setSel(i)}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer min-h-[44px] ${i === sel ? 'bg-surface2' : ''}`}>
              <span className="text-accentTeal"><IconoGuia nombre={r.icono} size={17} /></span>
              <span className="flex flex-col min-w-0 flex-1"><b className="text-[14px] font-semibold leading-tight">{r.texto}</b><small className="text-[12px] text-textMuted leading-tight truncate">{r.sub}</small></span>
              <span className="text-[11px] text-textMuted border border-border rounded-full px-2 py-0.5 shrink-0">{r.grupo}</span>
            </li>
          )) : <li className="px-3 py-3 text-[13px] text-textMuted">No encontramos nada sobre “{q.trim()}”. Probá con otras palabras.</li>}
        </ul>
      )}
    </div>
  );
}
