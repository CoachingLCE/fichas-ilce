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
export function colorCurso(n) {
  if (!n) return CURSO_COLORES[0];
  // Color por posicion del curso en la lista => cada curso conocido tiene uno distinto.
  const idx = CURSOS.findIndex((c) => _normCurso(c.nombre) === _normCurso(n));
  if (idx >= 0) return CURSO_COLORES[idx % CURSO_COLORES.length];
  // Cursos que no esten en la lista: hash estable de respaldo.
  let h = 0; const t = String(n); for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return CURSO_COLORES[h % CURSO_COLORES.length];
}
export function estiloCurso(n) { if (!n) return {}; const c = colorCurso(n); return { color: c, borderColor: c, background: c + '22' }; }
