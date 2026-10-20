'use client';
// "¿Qué necesitás hacer?": tarjetas por tarea, según lo que la persona puede hacer; cada una lleva directo.
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { IconoGuia } from './GuiaIconos';
import { irADestino } from './BuscadorFijo';

export default function QueNecesitas({ tareas, visibles = 8, onIr }) {
  const router = useRouter();
  const [todas, setTodas] = useState(false);
  if (!tareas.length) return null;
  const mostrar = todas ? tareas : tareas.slice(0, visibles);
  return (
    <section className="mb-5 no-print" data-que-necesitas aria-label="¿Qué necesitás hacer?">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h2 className="text-sm font-semibold">¿Qué necesitás hacer?</h2>
        {tareas.length > visibles && <button type="button" onClick={() => setTodas((v) => !v)} className="text-xs text-accentTeal font-semibold min-h-[32px] px-1" data-accion="ver-todas-tareas">{todas ? 'Ver menos' : `Ver las ${tareas.length} tareas`}</button>}
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
