import { CURSOS } from '../../../lib/constants';
import { Isologo, IsologoDefs } from '../../../components/Isologo';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function FichaPublica({ params }) {
  const curso = CURSOS.find((c) => c.slug === params.slug);
  if (!curso) return notFound();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '26px 14px 60px' }}>
      <IsologoDefs />
      <div style={{ width: 394, maxWidth: '100%', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 30, overflow: 'hidden' }}>
        <div style={{ padding: '24px 22px 20px', color: '#fff', background: 'linear-gradient(120deg,#01233f 0%,#065f74 52%,#0595ad 100%)' }}>
          <div className="font-display" style={{ letterSpacing: 4, fontSize: 11, opacity: .85 }}>FORMACIÓN EN</div>
          <div className="font-display" style={{ fontWeight: 700, fontSize: 26, lineHeight: 1.05, marginTop: 6 }}>{curso.nombre}</div>
        </div>
        <div style={{ padding: '22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <Isologo size={26} />
            <span style={{ color: 'rgb(var(--textSec))', fontSize: 13 }}>Instituto ILCE</span>
          </div>
          <h1 style={{ fontSize: 19, margin: '0 0 6px' }}>Ficha de inscripción</h1>
          <p style={{ color: 'rgb(var(--textSec))', fontSize: 14, marginTop: 0 }}>
            El formulario funcional (pasos, autoguardado y validaciones) se activa en el próximo despliegue.
            Este esqueleto confirma que la ruta pública, la marca y el ruteo por curso funcionan.
          </p>
          <div style={{ marginTop: 18, fontSize: 12, color: 'rgb(var(--textMuted))' }}>Ruta: /inscripcion/{curso.slug}</div>
        </div>
      </div>
    </main>
  );
}
