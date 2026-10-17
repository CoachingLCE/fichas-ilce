import { getEvaluacion } from '../../../lib/evaluaciones';
import { estadoEfectivoEval } from '../../../lib/evaluacionesLogica';
import { IsologoDefs, Isologo } from '../../../components/Isologo';
import EvaluacionForm from '../../../components/EvaluacionForm';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { metaCompartible } from '../../../lib/ogMeta';

export const dynamic = 'force-dynamic';

const cargar = cache((slug) => getEvaluacion(slug));

// Vista previa del enlace: no se muestra el título (puede anticipar el contenido), solo el curso.
export async function generateMetadata({ params }) {
  try {
    const ev = await cargar(params.slug);
    if (!ev) return { title: 'No encontrado · ILCE', robots: { index: false, follow: false } };
    return metaCompartible({ titulo: `Evaluación final · ${ev.curso}`, descripcion: `Evaluación final de ${ev.curso} del Instituto ILCE.` });
  } catch { return { title: 'ILCE' }; }
}

const fechaLegible = (iso) => {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00:00');
  if (isNaN(dt)) return iso;
  return dt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default async function EvaluacionPublica({ params }) {
  const ev = await cargar(params.slug);
  if (!ev) return notFound();
  const efectivo = estadoEfectivoEval(ev, Date.now());
  if (efectivo !== 'Publicada' || ev.preguntas.length === 0) {
    const titulo = efectivo === 'Programada' ? 'Todavía no disponible' : efectivo === 'Cerrada' ? 'Evaluación cerrada' : 'Evaluación no disponible';
    const mensaje = efectivo === 'Programada'
      ? `Esta evaluación va a estar disponible a partir del ${fechaLegible(ev.fechaDisponible)}${ev.horaDisponible ? ` a las ${ev.horaDisponible}` : ''}. Volvé a entrar ese día${ev.horaDisponible ? ', después de esa hora' : ''}.`
      : efectivo === 'Cerrada'
      ? `El período para rendir esta evaluación finalizó el ${fechaLegible(ev.fechaCierre)}.`
      : 'Esta evaluación todavía no está publicada. Volvé más tarde.';
    return (
      <>
        <IsologoDefs />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '26px 14px 60px' }}>
          <div style={{ width: 394, maxWidth: '100%', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 30, overflow: 'hidden' }}>
            <div style={{ padding: '24px 22px', color: '#fff', background: 'linear-gradient(120deg,#01233f,#065f74 55%,#0595ad)' }}>
              <div style={{ fontFamily: 'Jost', letterSpacing: 4, fontSize: 12, opacity: .85 }}>EVALUACIÓN FINAL</div>
              <div style={{ fontFamily: 'Jost', fontWeight: 500, fontSize: 24, marginTop: 6 }}>{ev.curso}</div>
            </div>
            <div style={{ padding: 26, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Isologo size={30} /></div>
              <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>{titulo}</h1>
              <p style={{ color: 'rgb(var(--textSec))', fontSize: 14, margin: 0 }}>{mensaje}</p>
            </div>
          </div>
        </main>
      </>
    );
  }
  return (<><IsologoDefs /><EvaluacionForm slug={ev.slug} titulo={ev.titulo} curso={ev.curso} /></>);
}
