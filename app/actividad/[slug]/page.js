import { getActividad, estadoEfectivo } from '../../../lib/actividades';
import { IsologoDefs, Isologo } from '../../../components/Isologo';
import ActividadForm from '../../../components/ActividadForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

const fechaLegible = (iso) => {
  if (!iso) return '';
  const dt = new Date(iso + 'T00:00:00');
  if (isNaN(dt)) return iso;
  return dt.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
};

export default async function ActividadPublica({ params }) {
  const act = await getActividad(params.slug);
  if (!act) return notFound();
  const efectivo = estadoEfectivo(act);
  const disponible = efectivo === 'Publicada' && act.preguntas.length > 0;

  if (!disponible) {
    const mensaje = efectivo === 'Programada'
      ? `Esta actividad va a estar disponible a partir del ${fechaLegible(act.fechaDisponible)}. Volvé a entrar ese día.`
      : 'Esta actividad todavía no está publicada. Volvé más tarde.';
    return (
      <>
        <IsologoDefs />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '26px 14px 60px' }}>
          <div style={{ width: 394, maxWidth: '100%', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 30, overflow: 'hidden' }}>
            <div style={{ padding: '24px 22px', color: '#fff', background: 'linear-gradient(120deg,#01233f,#065f74 55%,#0595ad)' }}>
              <div style={{ fontFamily: 'Jost', letterSpacing: 4, fontSize: 11, opacity: .85 }}>ACTIVIDAD</div>
              <div style={{ fontFamily: 'Jost', fontWeight: 700, fontSize: 24, marginTop: 6 }}>{act.curso}</div>
            </div>
            <div style={{ padding: 26, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Isologo size={30} /></div>
              <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>{efectivo === 'Programada' ? 'Todavía no disponible' : 'Actividad no disponible'}</h1>
              <p style={{ color: 'rgb(var(--textSec))', fontSize: 14, margin: 0 }}>{mensaje}</p>
            </div>
          </div>
        </main>
      </>
    );
  }
  return (<><IsologoDefs /><ActividadForm act={act} /></>);
}
