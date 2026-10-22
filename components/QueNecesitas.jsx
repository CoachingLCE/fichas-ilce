'use client';
// "¿Qué necesitás hacer?": tarjetas por tarea, según lo que la persona puede hacer; cada una lleva directo.
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconoGuia } from './GuiaIconos';
import { irADestino } from './BuscadorFijo';

// Fecha de hoy en hora local (YYYY-MM-DD): cambia justo a medianoche.
function hoyLocal() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }

export default function QueNecesitas({ tareas, visibles = 8, onIr }) {
  const router = useRouter();
  const [todas, setTodas] = useState(false);
  // Se puede cerrar con la cruz: queda oculto hasta las 00:01 del día siguiente (se guarda la fecha de hoy en este navegador).
  const [visible, setVisible] = useState(null); // null = todavía no se miró (no se dibuja nada para evitar el parpadeo)
  useEffect(() => {
    try { setVisible(localStorage.getItem('ilce-que-necesitas-cerrado') !== hoyLocal()); } catch { setVisible(true); }
  }, []);
  const cerrarPorHoy = () => { setVisible(false); try { localStorage.setItem('ilce-que-necesitas-cerrado', hoyLocal()); } catch { /* sin almacenamiento: se cierra igual hasta recargar */ } };
  if (!tareas.length || !visible) return null;
  const mostrar = todas ? tareas : tareas.slice(0, visibles);
  return (
    <section className="mb-5 no-print" data-que-necesitas aria-label="¿Qué necesitás hacer?">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-sm font-semibold">¿Qué necesitás hacer?</h2>
        <div className="flex items-center gap-1">
          {tareas.length > visibles && <button type="button" onClick={() => setTodas((v) => !v)} className="text-xs text-accentTeal font-semibold min-h-[32px] px-1" data-accion="ver-todas-tareas">{todas ? 'Ver menos' : `Ver las ${tareas.length} tareas`}</button>}
          <button type="button" onClick={cerrarPorHoy} className="w-8 h-8 rounded-lg text-textMuted hover:text-text hover:bg-surface2 flex items-center justify-center" aria-label="Ocultar por hoy" title="Ocultar hasta mañana" data-accion="cerrar-tareas">✕</button>
        </div>
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill,minmax(min(230px,100%),1fr))' }} data-tareas>
        {mostrar.map((t) => (
          <button key={t.id} type="button" onClick={() => (onIr ? onIr(t.destino) : irADestino(t.destino, router))} data-tarea={t.id}
            className="flex items-start gap-3 text-left bg-surface border border-border rounded-xl p-3 hover:border-accentTeal transition-colors min-h-[56px]">
            <span className="mt-0.5 w-8 h-8 rounded-lg bg-surface2 text-accentTeal flex items-center justify-center shrink-0"><IconoGuia nombre={t.icono} size={17} /></span>
            <span className="flex flex-col min-w-0"><strong className="text-[13.5px] font-semibold leading-tight">{t.titulo}</strong><span className="text-[12px] text-textMuted leading-snug mt-0.5">{t.sub}</span></span>
          </button>
        ))}
      </div>
    </section>
  );
}
