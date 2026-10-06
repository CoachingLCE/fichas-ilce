import { getFichaDefLive } from '../../../lib/fichas';
import { IsologoDefs, Isologo } from '../../../components/Isologo';
import FichaWizard from '../../../components/FichaWizard';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { metaFichaInscripcion } from '../../../lib/ogMeta';

export const dynamic = 'force-dynamic';

// cache(): la lectura de Google Sheets se hace una sola vez por visita aunque la usen la vista previa y la página.
const cargarDef = cache((slug) => getFichaDefLive(slug));

// Vista previa del enlace (WhatsApp, Slack, Telegram): título y descripción por curso. Si algo falla, queda la genérica.
export async function generateMetadata({ params }) {
  try { return metaFichaInscripcion(await cargarDef(params.slug)); } catch (e) { return { title: 'ILCE' }; }
}

export default async function FichaPublica({ params }) {
  const def = await cargarDef(params.slug);
  if (!def) return notFound();

  // Solo "Publicada" permite completar. Borrador/Cerrada muestran aviso.
  if (def.estado && def.estado !== 'Publicada') {
    const cerrada = def.estado === 'Cerrada';
    return (
      <>
        <IsologoDefs />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '26px 14px 60px' }}>
          <div style={{ width: 394, maxWidth: '100%', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 30, overflow: 'hidden' }}>
            <div style={{ padding: '24px 22px', color: '#fff', background: 'linear-gradient(120deg,#01233f,#065f74 55%,#0595ad)' }}>
              <div style={{ fontFamily: 'Jost', letterSpacing: 4, fontSize: 12, opacity: .85 }}>FORMACIÓN EN</div>
              <div style={{ fontFamily: 'Jost', fontWeight: 500, fontSize: 26, marginTop: 6 }}>{def.curso}</div>
            </div>
            <div style={{ padding: 26, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Isologo size={30} /></div>
              <h1 style={{ fontSize: 19, margin: '0 0 8px' }}>{cerrada ? 'Inscripciones cerradas' : 'Ficha no disponible'}</h1>
              <p style={{ color: 'rgb(var(--textSec))', fontSize: 14, margin: 0 }}>
                {cerrada
                  ? 'Las inscripciones para esta formación están cerradas por el momento. Escribinos y te avisamos cuando abra la próxima edición.'
                  : 'Esta ficha todavía no está publicada. Volvé más tarde.'}
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (<><IsologoDefs /><FichaWizard def={def} /></>);
}
