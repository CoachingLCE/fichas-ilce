// Pasos del recorrido guiado ("❓ Necesito ayuda") de Fichas ILCE.
// Cada paso: { id, tab, selector, titulo, texto, accion, requiere }.
// `tab` es la pestaña del panel donde vive el elemento (el tour cambia de pestaña solo si
// hace falta); si es null, el paso se muestra sin tocar la pestaña actual.
// `requiere` es una clave de permisos (ver PERMISOS en TourGuiado.jsx); si el usuario no la
// tiene, el paso se salta solo.

export const TOUR_PASOS = [
  {
    id: 'bienvenida',
    tab: 'fichas',
    selector: null,
    titulo: '¡Bienvenido/a a Fichas ILCE!',
    texto: 'Acá se administran las fichas de inscripción, las inscripciones completadas, las actividades, los formularios y los accesos de cada curso. Te mostramos rápido dónde está cada cosa.'
  },
  {
    id: 'fichas',
    tab: 'fichas',
    selector: null,
    titulo: 'Fichas de inscripción',
    texto: '"Fichas de inscripción" y "Fichas completadas" viven bajo la misma pestaña, con sub-pestañas arriba. En cada ficha, el botón "✎ Editar" / "+ Cargar edición" abre el Constructor para esa ficha.'
  },
  {
    id: 'inscripciones',
    tab: 'inscripciones',
    selector: null,
    titulo: 'Fichas completadas',
    texto: 'Acá están todas las inscripciones ya enviadas. Los filtros (Estado, Curso, Edición) son chips: tocá uno para activarlo y de nuevo para sacarlo. "+ Más filtros" suma País y rango de fechas.'
  },
  {
    id: 'nav-buscador',
    tab: null,
    selector: '[data-tour="nav-buscador"]',
    titulo: 'Buscador global',
    texto: 'Con la lupa buscás por nombre, email, título o edición entre fichas, inscripciones, actividades y formularios a la vez, sin tener que saber en qué pestaña está cada cosa.'
  },
  {
    id: 'dashboard',
    tab: 'dashboard',
    selector: null,
    titulo: 'Dashboard',
    texto: 'Panorama general con KPIs y desgloses (por curso, edición, país, estado, origen), con los mismos chips de filtro que en Fichas completadas.',
    requiere: 'dashboard'
  },
  {
    id: 'reportes',
    tab: 'reportes',
    selector: null,
    titulo: 'Reportes',
    texto: 'Los números totales (total, últimos 7 días, pendientes, en revisión, % completadas) y el desglose por curso, estado y mes.',
    requiere: 'dashboard'
  },
  {
    id: 'actividades',
    tab: 'actividades',
    selector: null,
    titulo: 'Actividades',
    texto: 'Las actividades que completan los estudiantes durante el curso. El selector "Ordenar por" te deja agruparlas por curso y clase, por nombre, por estado o por cantidad de preguntas.',
    requiere: 'actividades'
  },
  {
    id: 'formularios',
    tab: 'formularios',
    selector: null,
    titulo: 'Formularios',
    texto: 'Encuestas y formularios independientes de las actividades (por ejemplo, relevamientos al final de una edición).',
    requiere: 'formularios'
  },
  {
    id: 'emails',
    tab: 'emails',
    selector: null,
    titulo: 'Emails',
    texto: 'Los mails automáticos que manda el sistema: cuándo se envía cada uno, a quién, de/CC, asunto y tipo.',
    requiere: 'emails'
  },
  {
    id: 'accesos',
    tab: 'accesos',
    selector: null,
    titulo: 'Accesos',
    texto: 'Quién puede entrar al panel y con qué rol. Desde acá se da de alta a una persona nueva o se le cambia el rol a alguien.',
    requiere: 'accesos'
  },
  {
    id: 'auditoria',
    tab: 'auditoria',
    selector: '[data-tour="chip-ficha-completada"]',
    titulo: 'Historial de acciones',
    texto: 'Queda registrada toda la actividad importante del sistema. El chip "📋 Ficha completada" filtra específicamente los momentos en que un estudiante terminó de completar su ficha.',
    requiere: 'auditoria'
  },
  {
    id: 'ver-como',
    tab: null,
    selector: '[data-tour="ver-como"]',
    titulo: 'Ver como otra persona',
    texto: 'Elegí a alguien del sistema para ver exactamente qué pantallas y botones le aparecen — es solo lectura, no se guarda nada mientras estás en este modo.',
    requiere: 'verComo'
  }
];

export const TAREAS_AYUDA = [
  { id: 'cargar-edicion', label: 'Quiero cargar la edición de una ficha', pasoInicial: 'fichas' },
  { id: 'buscar-algo', label: 'Quiero buscar algo rápido', pasoInicial: 'nav-buscador' },
  { id: 'ver-numeros', label: 'Quiero ver los números de Reportes', pasoInicial: 'reportes', requiere: 'dashboard' },
  { id: 'quien-completo', label: 'Quiero ver quién completó una ficha', pasoInicial: 'auditoria', requiere: 'auditoria' },
  { id: 'dar-alta', label: 'Quiero dar de alta a una persona', pasoInicial: 'accesos', requiere: 'accesos' },
  { id: 'ver-como-otro', label: 'Quiero ver la app como otra persona', pasoInicial: 'ver-como', requiere: 'verComo' }
];
