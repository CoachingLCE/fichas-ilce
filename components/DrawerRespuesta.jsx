'use client';
import { useEffect, useRef } from 'react';

// Panel lateral con el detalle de UNA respuesta. Es el mismo que ya usaba "Respuestas fichas" (cabecera con el nombre, cuerpo con los datos) y ahora lo usan
// también "Respuestas actividades" y "Respuestas formularios" (pedido del equipo: una sola forma de ver las respuestas, la más directa: tocar la fila).
// Se cierra con la X, tocando fuera del panel o con la tecla Esc, y devuelve el foco a donde estaba.
export default function DrawerRespuesta({ abierto, onCerrar, nombre, sub, chips = [], etiqueta = 'Detalle de la respuesta', children }) {
  const cerrarRef = useRef(null);
  const alCerrar = useRef(onCerrar);
  alCerrar.current = onCerrar;
  useEffect(() => {
    if (!abierto) return undefined;
    const previo = document.activeElement;
    const alTeclear = (e) => { if (e.key === 'Escape') { e.stopPropagation(); alCerrar.current && alCerrar.current(); } };
    document.addEventListener('keydown', alTeclear);
    const t = setTimeout(() => { if (cerrarRef.current) cerrarRef.current.focus(); }, 60);
    return () => {
      document.removeEventListener('keydown', alTeclear); clearTimeout(t);
      if (previo && typeof previo.focus === 'function') { try { previo.focus(); } catch { /* */ } }
    };
  }, [abierto]);
  return (
    <>
      <div className={'ov' + (abierto ? ' on' : '')} onClick={() => alCerrar.current && alCerrar.current()} />
      <aside className={'drawer' + (abierto ? ' on' : '')} role="dialog" aria-modal="true" aria-label={etiqueta} aria-hidden={!abierto}>
        {abierto && (
          <>
            <div className="dr-head">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div className="dr-name">{nombre || '—'}</div>
                  {sub && <div style={{ fontSize: 12, color: 'rgb(var(--textMuted))', marginTop: 2 }}>{sub}</div>}
                </div>
                <button ref={cerrarRef} className="btn-sm" onClick={() => alCerrar.current && alCerrar.current()} aria-label="Cerrar"></button>
              </div>
              {chips.length > 0 && (
                <div style={{ marginTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  {chips.map((c, i) => <span key={i} className="badge" style={c.color ? { color: c.color } : undefined}>{c.texto}</span>)}
                </div>
              )}
            </div>
            <div className="dr-body">{children}</div>
          </>
        )}
      </aside>
    </>
  );
}
