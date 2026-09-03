// URL pública de la app (para links en emails, QR, etc.)
export const APP_URL = 'https://fichas-ilce.vercel.app';

// Nombres exactos de las pestañas de la Google Sheet
export const TABS = {
  INSCRIPCIONES: 'Inscripciones',
  FICHAS: 'Fichas',
  CONFIG: 'Config',
  HISTORIAL: 'Historial',
  USUARIOS: 'Usuarios'
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
  [TABS.USUARIOS]: ['Email', 'Nombre', 'Rol', 'Hash', 'Activo']
};

// ---- Datos hardcodeados por defecto (patrón "AMBAS": defaults en código + merge con la Sheet) ----
// Nunca se usa la Sheet como única fuente; si falla o está vacía, la app igual funciona con esto.
export const CURSOS = [
  { slug: 'coaching-deportivo', nombre: 'Coaching Deportivo' },
  { slug: 'coaching-ontologico', nombre: 'Coaching Ontológico' },
  { slug: 'coaching-educativo', nombre: 'Coaching Educativo' },
  { slug: 'coaching-vocacional', nombre: 'Coaching Vocacional' },
  { slug: 'oratoria', nombre: 'Oratoria' },
  { slug: 'coaching-de-equipos', nombre: 'Coaching de Equipos' }
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
  'Pendiente', 'Iniciada', 'Completa', 'En revisión',
  'Aprobada', 'Observada', 'Rechazada', 'Cancelada'
];
