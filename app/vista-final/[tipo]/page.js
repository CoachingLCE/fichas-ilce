import { IsologoDefs } from '../../../components/Isologo';
import FichaWizard from '../../../components/FichaWizard';
import FormularioForm from '../../../components/FormularioForm';
import ActividadForm from '../../../components/ActividadForm';
import EvaluacionForm from '../../../components/EvaluacionForm';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Vista de ejemplo · ILCE', robots: { index: false, follow: false } };

// Pantallas finales con datos de EJEMPLO: las muestra la pestaña "Emails" del panel dentro de un marco. No lee ni guarda nada.
const FICHA = { slug: 'ejemplo', curso: 'Coaching Ontológico', estado: 'Publicada', campos: [] };
const FORM = { slug: 'ejemplo', titulo: 'Título del formulario', tipo: 'Encuesta', estado: 'Publicada', campos: [], intro: '', cursoFijo: '', anonimo: true };
const ACT = { slug: 'ejemplo', curso: 'Coaching Ontológico', titulo: 'Título de la actividad', clase: '1', edicion: '', mostrarResultado: true, feedbackInmediato: false, preguntas: [{ pregunta: 'Pregunta', tipo: 'multiple', opciones: ['A', 'B'] }] };

export default function VistaFinal({ params }) {
  const t = params.tipo;
  let contenido = null;
  if (t === 'ficha') contenido = <FichaWizard def={FICHA} ejemploFinal />;
  else if (t === 'formulario') contenido = <FormularioForm form={FORM} vistaPrevia ejemploFinal />;
  else if (t === 'actividad') contenido = <ActividadForm act={ACT} modoPreview ejemploFinal />;
  else if (t === 'evaluacion-aprobada') contenido = <EvaluacionForm slug="ejemplo" titulo="Título de la evaluación final" curso="Coaching Ontológico" ejemploFinal="aprobada" />;
  else if (t === 'evaluacion-no-aprobada') contenido = <EvaluacionForm slug="ejemplo" titulo="Título de la evaluación final" curso="Coaching Ontológico" ejemploFinal="no_aprobada" />;
  else return notFound();
  return (<><IsologoDefs />{contenido}</>);
}
