'use client';

// Accesos rápidos del equipo. Editá las URLs/íconos según lo que usen en ILCE.
// Aplicaciones de ILCE: la MISMA lista en todas las apps del equipo (pedido de Diego, 17/10/2026). Carga de clases no lleva esta pantalla (es para docentes).
const APLICACIONES = [
  { icono: '📊', color: '#8b5cf6', nombre: 'Gestión', desc: 'Leads, seguimiento, estudiantes y reportes', url: 'https://seguimiento-lead-estudiante.vercel.app/' },
  { icono: '📝', color: '#0595ad', nombre: 'Fichas', desc: 'Fichas de inscripción, actividades y formularios', url: 'https://fichas-ilce.vercel.app/' },
  { icono: '📅', color: '#1a73e8', nombre: 'Cronograma', desc: 'Clases, salas de Zoom y docentes', url: 'https://disponibilidad-zoom.vercel.app/' },
  { icono: '✅', color: '#0f9d58', nombre: 'Presentismo', desc: 'Asistencia de estudiantes por edición', url: 'https://listadopresentismo.vercel.app/' },
  { icono: '🗂️', color: '#ec4899', nombre: 'Tuesday', desc: 'Tablero de contenidos del equipo', url: 'https://tuesday-ilce.vercel.app/' },
  { icono: '📤', color: '#f59e0b', nombre: 'Carga de clases', desc: 'Donde los docentes cargan sus clases', url: 'https://carga-clases-ilce.vercel.app/' },
  { icono: '💲', color: '#22c55e', nombre: 'Valores de los cursos', desc: 'Productos, descuentos y links de pago', url: 'https://seguimiento-lead-estudiante.vercel.app/productos-valores' },
  { icono: '💬', color: '#22d3ee', nombre: 'Feedback', desc: 'Feedback de estudiantes y su panel', url: 'https://ilce-feedback.vercel.app/admin' },
  { icono: '📋', color: '#8b5cf6', nombre: 'Encuestas', desc: '', url: 'https://encuestas-ilce.vercel.app/' },
  { icono: '☑️', color: '#14b8a6', nombre: 'Todo-Tareas', desc: 'Tareas con respaldo en la nube', url: 'https://todo-tareas-navy.vercel.app/' },
  { icono: '✍️', color: '#a855f7', nombre: 'Firma de contratos', desc: 'Firma digital de contratos docentes', url: 'https://ilce-firma-contratos.vercel.app/' }
];

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
  { icono: '✅', nombre: 'Evaluación Coaching Deportivo', url: 'https://www.coachingeducativolider.com/evaluaci%C3%B3nfinal-coachingdeportivo' }
];

function Tarjeta({ h }) {
  // "Estás acá": en la tarjeta de la app que se está usando (se compara la dirección con la de la pantalla).
  let actual = false;
  try { actual = typeof window !== 'undefined' && !!h.desc &&  new URL(h.url).host === window.location.host && new URL(h.url).pathname === '/' ; } catch { /* dirección inválida */ }
  return (
    <a href={h.url} target="_blank" rel="noopener noreferrer"
      className="bg-surface border border-border rounded-2xl px-5 py-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
      style={{ textDecoration: 'none' }}>
      <span style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto', fontSize: 20, background: `${h.color || '#0595ad'}22` }}>{h.icono}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{h.nombre}</span>
          {actual && <span data-actual style={{ fontSize: 11, padding: '2px 8px', borderRadius: 999, background: 'rgb(var(--accentPurple))', color: '#fff', fontWeight: 600 }}>Estás acá</span>}
        </span>
        {h.desc && <span data-desc style={{ display: 'block', fontSize: 12, lineHeight: 1.35, marginTop: 2, color: 'rgb(var(--textSec))' }}>{h.desc}</span>}
      </span>
    </a>
  );
}

export default function Herramientas() {
  return (
    <div style={{ maxWidth: 1100 }}>
      <h3 style={{ fontSize: 17, margin: '0 0 4px' }}>Aplicaciones de ILCE</h3>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 16 }}>Todas las web apps del instituto. Se abren en una pestaña nueva.</p>
      <div data-seccion="aplicaciones" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(240px,100%),1fr))', gap: 12, marginBottom: 26 }}>
        {APLICACIONES.map((h) => <Tarjeta key={h.nombre} h={h} />)}
      </div>
      <h3 style={{ fontSize: 17, margin: '0 0 4px' }}> Accesos rápidos</h3>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 16 }}>Herramientas de uso diario. Se abren en una pestaña nueva.</p>
      <div data-seccion="accesos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(220px,100%),1fr))', gap: 12, marginBottom: 26 }}>
        {ACCESOS_RAPIDOS.map((h) => <Tarjeta key={h.nombre} h={h} />)}
      </div>
      <h3 style={{ fontSize: 15, margin: '0 0 4px' }}> Recursos de ILCE</h3>
      <p className="muted" style={{ fontSize: 12.5, marginTop: 0, marginBottom: 16 }}>Accesos a la web y a los materiales de referencia.</p>
      <div data-seccion="recursos" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(240px,100%),1fr))', gap: 12 }}>
        {RECURSOS.map((r) => <Tarjeta key={r.nombre} h={{ ...r, color: '#0595ad' }} />)}
      </div>
    </div>
  );
}
