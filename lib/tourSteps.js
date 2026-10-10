// Pasos del recorrido guiado (" Necesito ayuda") de Fichas ILCE.
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
    texto: '"Fichas de inscripción" y "Fichas completadas" viven bajo la misma pestaña, con sub-pestañas arriba. En cada ficha, el botón " Editar" / "+ Cargar edición" abre el Constructor para esa ficha. Para crear una ficha nueva se usa "+ Crear".'
  },
  {
    id: 'crear',
    tab: null,
    selector: '[data-tour="crear"]',
    titulo: '+ Crear',
    texto: 'Desde acá se da de alta una ficha de inscripción, una actividad o un formulario: apretás "+ Crear", elegís qué querés crear y seguís los pasos. Solo te aparecen las cosas que tu rol puede crear.',
    requiere: 'crear'
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
    id: 'reportes',
    tab: 'reportes',
    selector: null,
    titulo: 'Reportes',
    texto: 'El Dashboard se unificó acá: resumen general, KPIs y desgloses (por curso, edición, país, estado, origen), más los números totales (últimos 7 días, pendientes, en revisión, % completadas). Quienes gestionan formularios ven además la solapa "Alertas", con los formularios publicados que llevan más de 30 días sin recibir respuestas (esa lista también llega en el correo de los viernes).',
    requiere: 'dashboard'
  },
  {
    id: 'actividadesyformularios',
    tab: 'actividadesyformularios',
    selector: null,
    titulo: 'Actividades y formularios',
    texto: 'Gestión de las actividades y postworks de cada curso, y de los formularios públicos (encuestas, inscripciones y trámites) — antes eran dos pestañas separadas, ahora viven juntas acá. Para crear una actividad o un formulario nuevo, se usa "+ Crear".',
    requiere: 'actividadesyformularios'
  },
  {
    id: 'respuestas',
    tab: 'respuestas',
    selector: null,
    titulo: 'Respuestas',
    texto: 'Las respuestas ya cargadas de actividades y de formularios — las puede ver cualquier persona con acceso al sistema.',
    requiere: 'respuestas'
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
    id: 'equipo',
    tab: 'equipo',
    selector: null,
    titulo: 'Equipo Docente',
    texto: 'El equipo docente y su asignación a cursos y ediciones.',
    requiere: 'equipo'
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
    texto: 'Queda registrada toda la actividad importante del sistema. El chip " Ficha completada" filtra específicamente los momentos en que un estudiante terminó de completar su ficha.',
    requiere: 'auditoria'
  },
  {
    id: 'ver-como',
    tab: null,
    selector: '[data-tour="ver-como"]',
    titulo: 'Ver como otra persona',
    texto: 'Elegí a alguien del sistema para ver exactamente qué pantallas y botones le aparecen — es solo lectura, no se guarda nada mientras estás en este modo.',
    requiere: 'verComo'
  },

  // ---- Cómo se crea cada cosa (solo dentro de las tareas "Quiero crear…", no en el recorrido completo) ----
  {
    id: 'crear-ficha-1', soloTarea: true, tab: null, selector: '[data-tour="crear"]',
    titulo: 'Crear una ficha de inscripción',
    texto: 'Apretá "+ Crear" y elegí "Ficha de inscripción". Elegí el curso, apretá "Siguiente →" y después "Crear y continuar →": se abre el Constructor de la ficha de ese curso.',
    requiere: 'constructor'
  },
  {
    id: 'crear-ficha-2', soloTarea: true, tab: 'fichas', selector: null,
    titulo: 'El Constructor de la ficha',
    texto: 'Tiene cuatro secciones: "Información de la ficha" (el título), "Ediciones" (las que están abiertas), "Campos del formulario" (qué se le pregunta al estudiante) y "Configuración" (a quién le llegan las respuestas y el mensaje que ve al terminar). Con "Vista previa de la ficha" ves cómo la va a ver.',
    requiere: 'constructor'
  },
  {
    id: 'crear-ficha-3', soloTarea: true, tab: 'fichas', selector: null,
    titulo: 'Guardar y compartir la ficha',
    texto: 'Apretá "Guardar". Si queda en estado "Publicada", cualquiera con el enlace puede completarla; si la dejás en "Borrador" no es visible. La ficha aparece en "Fichas de inscripción", con su enlace para copiar.',
    requiere: 'constructor'
  },
  {
    id: 'crear-act-1', soloTarea: true, tab: 'actividadesyformularios', selector: null,
    titulo: 'Crear una actividad',
    texto: 'Apretá "+ Crear" y elegí "Actividad": elegís el curso, la clase (opcional) y cuántas preguntas va a tener, y se abre el editor. También podés usar "+ Nueva actividad" desde la lista de esta pestaña.',
    requiere: 'gestionActividades'
  },
  {
    id: 'crear-act-2', soloTarea: true, tab: 'actividadesyformularios', selector: null,
    titulo: 'El editor de la actividad',
    texto: 'El editor es una sola página: a la izquierda están "Información general", "Preguntas" y "Fechas y configuración", y a la derecha la vista previa de lo que va a ver el estudiante, que acompaña la pregunta que estás editando. En cada pregunta escribís el enunciado y las opciones y marcás la correcta; "+ Agregar pregunta" suma otra, y también podés duplicarlas, reordenarlas o reutilizar una de otra actividad.',
    requiere: 'gestionActividades'
  },
  {
    id: 'crear-act-3', soloTarea: true, tab: 'actividadesyformularios', selector: null,
    titulo: 'Guardar o publicar la actividad',
    texto: '"Guardar borrador" la deja sin publicar. "Publicar" te pide confirmar; si le pusiste una fecha de disponibilidad que todavía no llegó, queda "Programada" hasta ese día.',
    requiere: 'gestionActividades'
  },
  {
    id: 'crear-form-1', soloTarea: true, tab: 'actividadesyformularios', selector: null,
    titulo: 'Crear un formulario',
    texto: 'Apretá "+ Crear" y elegí "Formulario": se abre el constructor (también podés usar "+ Nuevo formulario" desde la lista). Completá el título y, si querés, una introducción.',
    requiere: 'formularios'
  },
  {
    id: 'crear-form-2', soloTarea: true, tab: 'actividadesyformularios', selector: null,
    titulo: 'Curso y preguntas',
    texto: 'Elegí el curso: "Sin curso ni programa" (para encuestas o trámites que no son de ningún curso), "Un curso fijo" o "Que lo elija quien responde". Después agregás las preguntas (texto corto, párrafo, lista de opciones o escala del 1 al 5); el correo siempre se pide. A la derecha ves cómo lo va a ver quien responde.',
    requiere: 'formularios'
  },
  {
    id: 'crear-form-3', soloTarea: true, tab: 'actividadesyformularios', selector: null,
    titulo: 'Guardar y compartir el formulario',
    texto: 'En "Publicación" elegí el estado: "Borrador" (solo lo ves vos) o "Publicada" (cualquiera con el enlace puede responder). Apretá "Crear formulario" y copiá el enlace desde la lista. Para cambiarlo después, "Editar". Las respuestas se ven en "Respuestas" → "Respuestas formularios".',
    requiere: 'formularios'
  }
];

export const TAREAS_AYUDA = [
  { id: 'cargar-edicion', label: 'Quiero cargar la edición de una ficha', pasoInicial: 'fichas' },
  { id: 'buscar-algo', label: 'Quiero buscar algo rápido', pasoInicial: 'nav-buscador' },
  { id: 'ver-numeros', label: 'Quiero ver los números de Reportes', pasoInicial: 'reportes', requiere: 'dashboard' },
  { id: 'crear-ficha', label: 'Quiero crear una ficha de inscripción', secuencia: ['crear-ficha-1', 'crear-ficha-2', 'crear-ficha-3'], requiere: 'constructor' },
  { id: 'crear-actividad', label: 'Quiero crear una actividad', secuencia: ['crear-act-1', 'crear-act-2', 'crear-act-3'], requiere: 'gestionActividades' },
  { id: 'crear-formulario', label: 'Quiero crear un formulario', secuencia: ['crear-form-1', 'crear-form-2', 'crear-form-3'], requiere: 'formularios' },
  { id: 'ver-actividades', label: 'Quiero ver las actividades y los formularios', pasoInicial: 'actividadesyformularios', requiere: 'actividadesyformularios' },
  { id: 'ver-docente', label: 'Quiero ver la asignación del equipo docente', pasoInicial: 'equipo', requiere: 'equipo' },
  { id: 'quien-completo', label: 'Quiero ver quién completó una ficha', pasoInicial: 'auditoria', requiere: 'auditoria' },
  { id: 'dar-alta', label: 'Quiero dar de alta a una persona', pasoInicial: 'accesos', requiere: 'accesos' },
  { id: 'ver-como-otro', label: 'Quiero ver la app como otra persona', pasoInicial: 'ver-como', requiere: 'verComo' }
];
