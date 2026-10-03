'use client';
import { useEffect, useRef, useState } from 'react';
import { APP_VERSION, APP_UPDATED_AT } from '../lib/version';
import { CHANGELOG } from '../lib/changelog';

const CLAVE_ULTIMA_VISTA = 'ilce-fichas-ultima-version-vista';

export default function VersionBadge() {
  const [abierto, setAbierto] = useState(false);
  const [hayNovedades, setHayNovedades] = useState(false);
  const [verAnteriores, setVerAnteriores] = useState(false);
  const fecha = new Date(APP_UPDATED_AT + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const scrollRef = useRef(null);
  const observerRef = useRef(null);

  // Parpadea mientras la ultima version vista sea distinta de la actual; al hacer clic se marca como vista.
  useEffect(() => {
    try { if (localStorage.getItem(CLAVE_ULTIMA_VISTA) !== APP_VERSION) setHayNovedades(true); } catch (e) { /* */ }
  }, []);

  // Pedido de Diego: que el panel arranque "apagado" y se vaya "prendiendo" a medida que se lee,
  // como si acompañara la lectura — no es un fade parejo al abrir, es por renglón y atado al
  // scroll: cada ítem empieza opaco y se ilumina solo cuando entra a la franja de lectura de
  // arriba (los que ya se ven al abrir se iluminan enseguida; los de más abajo, a medida que se
  // llega a ellos). Una vez que un ítem se iluminó, se queda así (no se vuelve a apagar).
  useEffect(() => {
    const root = scrollRef.current;
    if (!abierto || !root) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('nov-lit'); obs.unobserve(entry.target); }
      });
    }, { root, rootMargin: '0px 0px -40% 0px', threshold: 0.15 });
    root.querySelectorAll('.nov-line').forEach((el) => obs.observe(el));
    observerRef.current = obs;
    return () => obs.disconnect();
  }, [abierto, verAnteriores]);

  function abrir() {
    setAbierto(true);
    setHayNovedades(false);
    try { localStorage.setItem(CLAVE_ULTIMA_VISTA, APP_VERSION); } catch (e) { /* */ }
  }

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const delMes = CHANGELOG.filter((e) => (e.fecha || '').slice(0, 7) === mesActual);
  const paraMostrar = verAnteriores ? CHANGELOG : (delMes.length ? delMes : CHANGELOG.slice(0, 1));
  const hayMasParaVer = !verAnteriores && paraMostrar.length < CHANGELOG.length;

  return (
    <>
      <button onClick={abrir} title="Ver novedades"
        className={'fixed bottom-3 right-4 text-[11px] text-textMuted bg-surface2 border border-border rounded-full px-3 py-1 z-40 no-print hover:text-text hover:border-accentTeal transition-colors' + (hayNovedades ? ' version-badge-novedad' : '')}>
        v{APP_VERSION} · Actualizado {fecha}
      </button>
      {abierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setAbierto(false)}>
          <div ref={scrollRef} className="relative bg-surface2 border border-border rounded-2xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-base font-bold">📋 Novedades de la app</p>
              <button onClick={() => setAbierto(false)} className="text-textMuted hover:text-text">✕</button>
            </div>
            <div className="space-y-5">
              {paraMostrar.map((e) => (
                <div key={e.version}>
                  <p className="text-sm font-semibold text-accentTeal mb-1.5">
                    v{e.version} · {new Date(e.fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </p>
                  <ul className="space-y-1">
                    {e.cambios.map((c, i) => (
                      <li key={i} className="nov-line text-textSec text-xs flex gap-2"><span className="text-accentPurple">•</span><span>{c}</span></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            {hayMasParaVer && (
              <button onClick={() => setVerAnteriores(true)} className="mt-4 text-xs text-accentTeal hover:underline">Ver novedades anteriores →</button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
