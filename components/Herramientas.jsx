'use client';

// Accesos rápidos del equipo. Editá las URLs/íconos según lo que usen en ILCE.
// Lista común de herramientas: es la misma en todas las apps del equipo (pedido de Diego, 15/10/2026). Fichas conserva además sus enlaces propios (web, cursos y su Sheet de datos).
const ACCESOS_RAPIDOS = [
  { icono: '', color: '#611f69', nombre: 'Slack', url: 'https://app.slack.com/client/T065ZV5C7FF' },
  { icono: '', color: '#ea4335', nombre: 'Gmail', url: 'https://gmail.com/' },
  { icono: '', color: '#1a73e8', nombre: 'Google Calendar', url: 'https://calendar.google.com/' },
  { icono: '', color: '#0f9d58', nombre: 'Google Drive', url: 'https://drive.google.com/' },
  { icono: '', color: '#0f9d58', nombre: 'Google Sheets', url: 'https://sheets.google.com/' },
  { icono: '', color: '#2d8cff', nombre: 'Zoom', url: 'https://www.zoom.com/' },
  { icono: '🗄️', color: '#a855f7', nombre: 'Baúl IN HOUSE', url: 'https://www.coachingeducativolider.com/ba%C3%BAl-inhouse' }
];

const RECURSOS = [
  { icono: '', nombre: 'Web ILCE', url: 'https://www.coachingeducativolider.com/' },
  { icono: '', nombre: 'Cursos y formaciones', url: 'https://www.coachingeducativolider.com/cursosyformaciones' },
  { icono: '', nombre: 'Google Sheet de datos', url: 'https://docs.google.com/spreadsheets/d/1bVBzwYmlbF6oAdUwZlzgkObO-9LGW5o4hlppCdsXGF4/edit' },
  { icono: '🎓', nombre: 'Volver al campus', url: 'https://campus.institutoilce.com/' },
  { icono: '⚙️', nombre: 'Admin Campus', url: 'https://campus.institutoilce.com/wp-admin/' },
  { icono: '❓', nombre: 'Preguntas frecuentes estudiantes', url: 'https://www.coachingeducativolider.com/preguntas-frecuentes-estudiantes' },
  { icono: '📘', nombre: 'Manual académico', url: 'https://www.coachingeducativolider.com/manualacad%C3%A9mico' },
  { icono: '📗', nombre: 'Manual inscripciones', url: 'https://www.coachingeducativolider.com/manual-inscripciones' },
  { icono: '💲', nombre: 'Valores de los cursos', url: 'https://seguimiento-lead-estudiante.vercel.app/productos-valores' },
  { icono: '✅', nombre: 'Evaluación Coaching Deportivo', url: 'https://www.coachingeducativolider.com/evaluaci%C3%B3nfinal-coachingdeportivo' },
  { icono: '💬', nombre: 'Ver feedback de estudiantes', url: 'https://ilce-feedback.vercel.app/admin' }
];

function Tarjeta({ h }) {
  return (
    <a href={h.url} target="_blank" rel="noopener noreferrer"
      className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
      style={{ textDecoration: 'none' }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: 20, background: `${h.color || '#0595ad'}22` }}>{h.icono}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{h.nombre}</span>
    </a>
  );
}

export default function Herramientas() {
  return (
    <div style={{ maxWidth: 900 }}>
      <h3 style={{ fontSize: 17, margin: '0 0 4px' }}> Accesos rápidos</h3>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 16 }}>Herramientas de uso diario. Se abren en una pestaña nueva.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(220px,100%),1fr))', gap: 12, marginBottom: 26 }}>
        {ACCESOS_RAPIDOS.map((h) => <Tarjeta key={h.nombre} h={h} />)}
      </div>
      <h3 style={{ fontSize: 15, margin: '0 0 4px' }}> Recursos de ILCE</h3>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 16 }}>Accesos a la web y a los materiales de referencia.</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(240px,100%),1fr))', gap: 12 }}>
        {RECURSOS.map((r) => <Tarjeta key={r.nombre} h={{ ...r, color: '#0595ad' }} />)}
      </div>
    </div>
  );
}
