import { getFichaDef } from '../../../lib/fichas';
import { IsologoDefs } from '../../../components/Isologo';
import FichaWizard from '../../../components/FichaWizard';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function FichaPublica({ params }) {
  const def = getFichaDef(params.slug);
  if (!def) return notFound();
  return (
    <>
      <IsologoDefs />
      <FichaWizard def={def} />
    </>
  );
}
