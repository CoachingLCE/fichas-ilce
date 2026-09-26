// URL pública de la app (para links en emails, QR, etc.)
export const APP_URL = 'https://fichas-ilce.vercel.app';

// Nombres exactos de las pestañas de la Google Sheet
export const TABS = {
  INSCRIPCIONES: 'Inscripciones',
  FICHAS: 'Fichas',
  CONFIG: 'Config',
  HISTORIAL: 'Historial',
  USUARIOS: 'Usuarios',
  ACTIVIDADES: 'Actividades',
  RESPUESTAS_ACT: 'RespuestasActividades',
  DOCENTES: 'Docentes',
  EMAILS: 'Emails',
  FORMULARIOS: 'Formularios',
  RESPUESTAS_FORM: 'RespuestasFormularios',
  MASTERCLASSES: 'Masterclasses',
  RESPUESTAS_MC: 'RespuestasMasterclass'
};

// Esquema (fila de encabezados) de cada pestaña. Se usa en /api/setup para inicializar la hoja.
// Las columnas núcleo son campos estructurados (búsqueda/filtros/stats/export); el resto de las
// respuestas de cada ficha se guardan en "Respuestas JSON".
export const HEADERS = {
  [TABS.INSCRIPCIONES]: [
    'ID', 'Fecha ficha', 'Curso', 'Edición', 'Nombre', 'Apellido', 'Email', 'País',
    'Provincia/Estado', 'Localidad', 'WhatsApp', 'Documento', 'Instagram', 'Profesión',
    'Origen', 'Modalidad', 'Medio contacto', 'Tema salud', 'Sobre vos', 'Comentarios',
    'Consentimiento', 'Inscrito', 'Estado', 'Responsable', 'Token', 'Fecha inicio',
    'Fecha fin', 'Última actualización', 'Respuestas JSON', 'Origen registro'
  ],
  [TABS.FICHAS]: ['Slug', 'Curso', 'Título', 'Estado', 'Definición JSON', 'Actualizado'],
  [TABS.CONFIG]: ['Clave', 'Valor'],
  [TABS.HISTORIAL]: ['Fecha', 'Inscripción ID', 'Usuario', 'Acción', 'Detalle'],
  [TABS.USUARIOS]: ['Email', 'Nombre', 'Roles', 'PasswordHash', 'Activo'],
  [TABS.ACTIVIDADES]: ['Slug', 'Curso', 'Título', 'Estado', 'Preguntas JSON', 'Actualizado'],
  [TABS.RESPUESTAS_ACT]: ['ID', 'Fecha', 'Actividad', 'Curso', 'Edición', 'Email', 'Nombre', 'Puntuación', 'Total', 'Respuestas JSON', 'Duración seg'],
  [TABS.DOCENTES]: ['Email', 'Nombre', 'Curso', 'Edición'],
  // "Payload" (agregada ahora): datos de ejemplo del envío en JSON, para poder reintentar un
  // correo fallido sin tener que rearmarlo a mano. Las filas viejas simplemente no la tienen.
  [TABS.EMAILS]: ['Fecha', 'Tipo', 'Para', 'Asunto', 'Estado', 'Detalle', 'Payload'],
  [TABS.FORMULARIOS]: ['Slug', 'Título', 'Tipo', 'Estado', 'Campos JSON', 'Actualizado'],
  [TABS.RESPUESTAS_FORM]: ['ID', 'Fecha', 'Formulario', 'Curso', 'Email', 'Nombre', 'Edición', 'Respuestas JSON'],
  [TABS.MASTERCLASSES]: ['Slug', 'Título', 'Curso referencia', 'Fecha', 'Horarios', 'Docente', 'Temario', 'Estado', 'Campos JSON', 'Actualizado'],
  [TABS.RESPUESTAS_MC]: ['ID', 'Fecha', 'Masterclass', 'Email', 'Nombre', 'WhatsApp', 'País', 'Ciudad', 'Respuestas JSON']
};

// ---- Datos hardcodeados por defecto (patrón "AMBAS": defaults en código + merge con la Sheet) ----
// Nunca se usa la Sheet como única fuente; si falla o está vacía, la app igual funciona con esto.
export const CURSOS = [
  { slug: 'coaching-deportivo', nombre: 'Coaching Deportivo' },
  { slug: 'coaching-ontologico', nombre: 'Coaching Ontológico' },
  { slug: 'coaching-educativo', nombre: 'Coaching Educativo' },
  { slug: 'coaching-vocacional', nombre: 'Coaching Vocacional' },
  { slug: 'oratoria', nombre: 'Oratoria' },
  { slug: 'coaching-de-equipos', nombre: 'Coaching de Equipos' },
  { slug: 'copywriting-para-redes-sociales', nombre: 'Copywriting para redes sociales' },
  { slug: 'formacion-para-formadores', nombre: 'Formación para Formadores' },
  { slug: 'coaching-inmobiliario', nombre: 'Coaching Inmobiliario' },
  { slug: 'comunidad-ilce', nombre: 'Comunidad ILCE' }
];

// Ediciones por defecto (ej. Deportivo). Después se combinan con la Sheet de Carga de Clases.
export const EDICIONES_DEFAULT = {
  'coaching-deportivo': [
    { id: '15', label: 'Edición 15 — Lunes 31 de agosto', horarios: '🇦🇷 18:00 · 🇧🇴 17:00 · 🇨🇴🇵🇪🇪🇨🇲🇽 16:00 · 🇨🇱🇺🇾 19:00' },
    { id: '16', label: 'Edición 16 — Jueves 24 de septiembre', horarios: '🇦🇷🇺🇾🇧🇷🇨🇱 19:00 · 🇧🇴 18:00 · 🇨🇴🇵🇪🇪🇨 17:00' }
  ]
};

export const PAISES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba', 'Ecuador',
  'El Salvador', 'España', 'Guatemala', 'Honduras', 'México', 'Nicaragua', 'Panamá',
  'Paraguay', 'Perú', 'Puerto Rico', 'Uruguay', 'Venezuela', 'República Dominicana', 'Otro'
];

export const PROVINCIAS_AR = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe',
  'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
];

export const ESTADOS = [
  'Pendiente', 'Iniciada', 'Completada', 'En revisión',
  'Inscrito', 'Observada', 'Rechazada', 'Cancelada'
];

// Normaliza estados viejos de la Sheet a los nombres nuevos (no hace falta migrar datos):
//  'Completa' -> 'Completada'  ·  'Aprobada' -> 'Inscrito'
export function normalizarEstado(e) {
  if (e === 'Completa') return 'Completada';
  if (e === 'Aprobada') return 'Inscrito';
  return e || 'Completada';
}

// ---- Notificaciones ----
// Equipo que recibe el aviso cuando entra una ficha (de cualquier curso).
export const EQUIPO_NOTIF = [
  'Macarena.Juncos@institutoilce.com',
  'Alexander.Juncos@institutoilce.com',
  'Jesabel.Reigada@institutoilce.com'
];

// WhatsApp de contacto para el estudiante (botón del email de confirmación).
export const WHATSAPP_URL = 'https://api.whatsapp.com/send?phone=5491163245246&text=Hola%2C%20ya%20complet%C3%A9%20mi%20ficha%20de%20inscripci%C3%B3n.%20%C2%BFMe%20indican%20cu%C3%A1les%20son%20los%20pr%C3%B3ximos%20pasos%3F';

// ---- Roles (mismos que LEAD-Estudiante, combinables) ----
export const ROLES = ['Admin', 'Coordinador', 'Inscripciones', 'Estudiantes', 'CoordinadorEstudiantes', 'Academico', 'Docente'];
export const PASSWORD_GENERICA = 'Hola123';

const NOMBRE_ROL = {
  Admin: 'Admin', Coordinador: 'Coordinador de inscripciones', Inscripciones: 'Inscripciones',
  Estudiantes: 'Estudiantes', CoordinadorEstudiantes: 'Coordinación académica', Academico: 'Académico', Docente: 'Docente'
};
export function nombreVisibleRoles(rolesArr) {
  if (!rolesArr || !rolesArr.length) return 'Sin rol';
  return rolesArr.map((r) => NOMBRE_ROL[r] || r).join(' + ');
}

// Equipo académico que recibe el resumen de los viernes de las actividades.
export const EQUIPO_ACADEMICO = [
  'sofia.salgueiro@institutoilce.com',
  'paula.arigos@institutoilce.com',
  'lourdes.barrantes@institutoilce.com',
  'Victoria.Defilippe@institutoilce.com',
  'diegolernerdl@gmail.com'
];

// Cursos de referencia para las Masterclass: los cursos existentes + extras (ampliable).
export const CURSOS_REFERENCIA = [
  ...CURSOS.map((c) => c.nombre),
  'PNL',
  'Inteligencia Emocional',
  'Mindfulness'
];

// Un color estable por curso, UNIFICADO en toda la app: el mismo curso siempre recibe
// el mismo color en cualquier pantalla (pills de curso en Inscritos, Actividades, etc.).
// Se evitan verde/amarillo/rojo, reservados a estados.
export const CURSO_COLORES = ['#0595ad', '#96198f', '#7c3aed', '#3b82f6', '#22d3ee', '#db2777', '#0ea5e9', '#a21caf', '#0891b2', '#6366f1'];
const _normCurso = (x) => (x || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
// Mismos colores por curso que la app de cronograma (disponibilidad-zoom), para que sea coherente entre apps.
const COLORES_POR_CURSO = {
  'coaching ontologico': '#7c3aed',
  'coaching ontologico profesional': '#7c3aed',
  'coaching educativo': '#60a5fa',
  'coaching de equipos': '#4ade80',
  'oratoria': '#fb923c',
  'coaching vocacional': '#fbbf24',
  'coaching deportivo': '#f87171',
  'inteligencia emocional': '#f472b6',
  'copywriting para redes sociales': '#c026d3',
  'formacion para formadores': '#a78bfa',
  'coaching inmobiliario': '#0891b2',
  'comunidad ilce': '#22d3ee'
};
export function colorCurso(n) {
  if (!n) return CURSO_COLORES[0];
  const key = _normCurso(n);
  if (COLORES_POR_CURSO[key]) return COLORES_POR_CURSO[key];
  // Cursos que no esten en el mapa: hash estable de respaldo.
  let h = 0; const t = String(n); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return CURSO_COLORES[h % CURSO_COLORES.length];
}
export function estiloCurso(n) { if (!n) return {}; const c = colorCurso(n); return { color: c, borderColor: c, background: c + '22' }; }

// Iniciales para el avatar de color de un curso (Fichas vista Lista, tablas "Por curso" de
// Reportes) — dos letras de las palabras "importantes" del nombre, saltéandose conectores.
const STOP_INICIALES_CURSO = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'para', 'y']);
export function inicialesCurso(nombre) {
  const palabras = (nombre || '').split(/\s+/).filter((p) => p && !STOP_INICIALES_CURSO.has(p.toLowerCase()));
  return (palabras.slice(0, 2).map((p) => p[0]).join('') || (nombre || '?')[0] || '?').toUpperCase();
}

// ---- Ediciones (Constructor de fichas / "Nueva edición" rápida) ----
// La cantidad de clases de estos cursos es siempre la misma (cadencia fija semanal, pedido
// de Diego) — no se tipea a mano, se completa sola según el curso de la ficha. El resto de
// los cursos (Deportivo, Inmobiliario, Copywriting, Formación para Formadores, Comunidad
// ILCE — varios de ellos "a demanda", sin cadencia semanal fija) siguen con carga manual.
// Vive acá (no solo en Constructor.jsx) para que el modal de "Nueva edición" rápida use
// exactamente la misma regla al auto-completar la cantidad de clases.
export const CANTIDAD_CLASES_POR_CURSO = {
  'coaching ontologico': 48,
  'oratoria': 16,
  'coaching de equipos': 16,
  'coaching educativo': 16,
  'coaching vocacional': 16
};
export function cantidadClasesFija(curso) { return CANTIDAD_CLASES_POR_CURSO[_normCurso(curso)] || null; }

// Una edición es "asincrónica" cuando su nombre lo dice (no hay un flag aparte todavía) —
// en ese caso no tiene sentido pedir día/horario ni calcular husos: no hay clase en vivo.
export function esAsincronica(label) { return /asincr/.test(_normCurso(label)); }

// Fecha de fin estimada de una edición: fecha de inicio + (cantidad de clases - 1) semanas.
// Todas las cursadas son semanales (no hay quincenales), así que la cadencia es fija.
// Devuelve '' si falta algún dato.
export function calcularFechaFinEdicion(fecha, cantidadClases) {
  const n = parseInt(cantidadClases, 10);
  if (!fecha || !n || n < 1) return '';
  const dt = new Date(fecha + 'T00:00:00');
  if (isNaN(dt)) return '';
  dt.setDate(dt.getDate() + 7 * (n - 1));
  return dt.toISOString().slice(0, 10);
}
