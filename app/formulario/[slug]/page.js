import { getFormulario } from '../../../lib/formularios';
import { IsologoDefs, Isologo } from '../../../components/Isologo';
import FormularioForm from '../../../components/FormularioForm';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { metaFormulario } from '../../../lib/ogMeta';

export const dynamic = 'force-dynamic';

// cache(): la lectura de Google Sheets se hace una sola vez por visita aunque la usen la vista previa y la página.
const cargarForm = cache((slug) => getFormulario(slug));

// Vista previa del enlace (WhatsApp, Slack, Telegram): título y descripción por curso. Si algo falla, queda la genérica.
export async function generateMetadata({ params }) {
  try { return metaFormulario(await cargarForm(params.slug)); } catch (e) { return { title: 'ILCE' }; }
}

export default async function FormularioPublico({ params }) {
  const form = await cargarForm(params.slug);
  if (!form) return notFound();
  if (form.estado !== 'Publicada' || !form.campos.length) {
    return (
      <>
        <IsologoDefs />
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '30px 16px 60px' }}>
          <div style={{ width: 560, maxWidth: '100%', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 22, overflow: 'hidden' }}>
            <div style={{ padding: '22px 26px', color: '#fff', background: 'linear-gradient(120deg,#01233f,#065f74 55%,#0595ad)' }}>
              <div style={{ fontFamily: 'Jost', letterSpacing: 4, fontSize: 12, opacity: .85 }}>FORMULARIO</div>
              <div style={{ fontFamily: 'Jost', fontWeight: 500, fontSize: 22, marginTop: 6 }}>{form.titulo}</div>
            </div>
            <div style={{ padding: 26, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}><Isologo size={30} /></div>
              <h1 style={{ fontSize: 18, margin: '0 0 8px' }}>No disponible</h1>
              <p style={{ color: 'rgb(var(--textSec))', fontSize: 14, margin: 0 }}>Este formulario no está publicado.</p>
            </div>
          </div>
        </main>
      </>
    );
  }
  return (<><IsologoDefs /><FormularioForm form={form} /></>);
}
