// Novedades de la app (se muestran en el botón "Novedades"). Más reciente arriba.
export const CHANGELOG = [
  {
    version: '0.40.0',
    fecha: '2026-09-14',
    cambios: [
      '"Ver como": si sos Admin, arriba a la derecha podes elegir ver la app tal cual la ve otra persona (por ejemplo un docente o estudiante), en modo vista. Sirve para revisar que ve cada rol. Salis con un clic.'
    ]
  },
  {
    version: '0.39.0',
    fecha: '2026-09-14',
    cambios: [
      'La lista de Actividades ahora tiene buscador: filtra al instante por nombre, curso, numero de clase y estado. (Fichas e Inscripciones ya buscaban por multiples campos.)'
    ]
  },
  {
    version: '0.38.0',
    fecha: '2026-09-14',
    cambios: [
      'En Fichas de inscripcion, el resumen de arriba (Fichas, Con ediciones, Requieren atencion) ahora se ve como bloques con numero grande, mas claro y menos cargado.'
    ]
  },
  {
    version: '0.37.0',
    fecha: '2026-09-14',
    cambios: [
      'Sistema de chips unificado en toda la app: misma forma y tipografia, diferenciados por funcion — filtros (violeta suave al seleccionar), estados (color por estado), curso (teal) y datos como cantidad/edicion/pais (neutro). Look mas limpio y coherente.'
    ]
  },
  {
    version: '0.36.1',
    fecha: '2026-09-14',
    cambios: [
      'La seccion "Auditoria" ahora se llama "Historial de acciones" tambien en el menu.'
    ]
  },
  {
    version: '0.36.0',
    fecha: '2026-09-14',
    cambios: [
      'El filtro de Edicion en Fichas completadas ahora esta ordenado por numero (1, 2, 3...) y se muestra como chips clickeables en vez de un desplegable.'
    ]
  },
  {
    version: '0.35.0',
    fecha: '2026-09-14',
    cambios: [
      'Las actividades ahora tienen un numero de clase, asi cada una se identifica como Curso - Clase N - Titulo (por ejemplo, Coaching Deportivo - Clase 14 - Analisis funcional). Las actividades ya cargadas siguen funcionando igual.'
    ]
  },
  {
    version: '0.34.0',
    fecha: '2026-09-14',
    cambios: [
      'El menu del panel ahora es plano como en la app de seguimiento: no hay mas desplegables Gestion/Configuracion; todas las secciones se ven siempre, agrupadas con una etiqueta chica.'
    ]
  },
  {
    version: '0.33.0',
    fecha: '2026-09-14',
    cambios: [
      'Las pestañas del panel ahora usan un estado activo mas sutil (violeta suave), igual que en la app de seguimiento, en vez de la pildora violeta fuerte.'
    ]
  },
  {
    version: '0.32.1',
    fecha: '2026-09-14',
    cambios: [
      'Arreglado: el logo se veia duplicado (el logo nuevo ya trae el texto Instituto ILCE y quedaba repetido al lado). Ahora aparece una sola vez.'
    ]
  },
  {
    version: '0.32.0',
    fecha: '2026-09-14',
    cambios: [
      'En Fichas de inscripcion, cada ficha con inscriptos ahora tiene un boton "Ver listado de inscriptos" que lleva directo a la lista filtrada por ese curso.'
    ]
  },
  {
    version: '0.31.0',
    fecha: '2026-09-14',
    cambios: [
      'Fichas completadas: las tarjetas de metricas ahora tienen un color propio sutil y, en celulares, la tabla muestra solo lo esencial (Nombre, Curso, Edicion y Estado).'
    ]
  },
  {
    version: '0.30.0',
    fecha: '2026-09-14',
    cambios: [
      'Fichas completadas mas visual: nombre y apellido juntos, chips de color para pais (con bandera), edicion y curso, fechas amigables (Hoy, Ayer, 31 ago 2026), tarjetas con iconos y filas mas comodas de leer.'
    ]
  },
  {
    version: '0.29.0',
    fecha: '2026-09-14',
    cambios: [
      'Cuando un estudiante completa una actividad, ahora los docentes asignados a ese curso/edicion reciben un mail con el aviso y el puntaje. Los docentes se asignan desde Actividades > Docentes (Coordinacion academica ya puede hacerlo).'
    ]
  },
  {
    version: '0.28.0',
    fecha: '2026-09-14',
    cambios: [
      'Se sumaron dos cursos nuevos: Coaching Inmobiliario y Comunidad ILCE. Ya podes armarles la ficha (titulo, bienvenida y ediciones) desde el Constructor y tienen su enlace publico de inscripcion.'
    ]
  },
  {
    version: '0.27.0',
    fecha: '2026-09-14',
    cambios: [
      'La zona de filtros de Fichas completadas quedo mas ordenada: los chips estan agrupados por seccion (Filtros rapidos, Estado, Filtros) y se muestra cuantos filtros hay activos.'
    ]
  },
  {
    version: '0.26.0',
    fecha: '2026-09-14',
    cambios: [
      'Crear ediciones es mas facil: en el Constructor cargas la fecha y la hora en horario de Argentina y con un boton se calcula solo el horario para todos los paises (Bolivia, Colombia, Peru, Ecuador, Mexico, Chile, Uruguay, Brasil y España), respetando el horario de verano de cada uno. Igual podes editarlo a mano.'
    ]
  },
  {
    version: '0.25.0',
    fecha: '2026-09-14',
    cambios: [
      'La seccion "Estudiantes inscriptos" ahora se llama "Fichas completadas". Los estados cambiaron: "Completa" pasa a "Completada" (lleno la ficha) y "Aprobada" pasa a "Inscrito" (pago y se inscribio). Los registros viejos se muestran solos con el nombre nuevo.'
    ]
  },
  {
    version: '0.24.0',
    fecha: '2026-09-14',
    cambios: [
      'Rediseño del paso Datos personales de la ficha: formulario mas ancho y en dos columnas, campos agrupados por seccion, modalidad de cursada en tarjetas con descripcion, mejores ejemplos en cada campo y navegacion mas clara. Se aplica a todas las fichas.'
    ]
  },
  {
    version: '0.23.0',
    fecha: '2026-09-14',
    cambios: [
      'En la seccion Emails ahora podes tocar un correo automatico (por ejemplo el de confirmacion de inscripcion) y ver una vista previa de lo que recibe la persona, con el boton de WhatsApp incluido.'
    ]
  },
  {
    version: '0.22.0',
    fecha: '2026-09-14',
    cambios: [
      'Pantalla final de inscripcion renovada: mensaje de exito mas claro, aviso del correo enviado, y un boton principal para consultar por WhatsApp (con mensaje que ya trae la edicion cargada). Ademas Cargar otra ficha y Volver al inicio.'
    ]
  },
  {
    version: '0.21.0',
    fecha: '2026-09-14',
    cambios: [
      'Ahora todos los usuarios ven todas las secciones en el menu del panel. Si entras a una seccion sin permiso, aparece un aviso de acceso bloqueado en lugar de que el boton desaparezca. Los datos siguen protegidos: sin permiso no se cargan.'
    ]
  },
  {
    version: '0.20.0',
    fecha: '2026-09-14',
    cambios: [
      'Nuevo logo oficial del Instituto ILCE en la pantalla de inicio, el encabezado del panel y la pagina de estado. Cambia solo entre modo claro y oscuro.'
    ]
  },
  {
    version: '0.19.0',
    fecha: '2026-09-09',
    cambios: [
      'Menú superior más limpio y agrupado: Fichas · Estudiantes · Dashboard · Gestión ▾ · Configuración ▾.',
      'Pantalla Fichas tipo dashboard: header compacto, indicadores visuales, alerta compacta con acción, y una sola acción principal por ficha (según su estado) con el resto en ⋮.'
    ]
  },
  {
    version: '0.18.0',
    fecha: '2026-09-09',
    cambios: [
      'El login ahora es la pantalla de inicio (raíz del sitio). La verificación de estado quedó en /estado.',
      'Renombrado: “Fichas de inscripción” y “Estudiantes inscriptos”.',
      'Módulo Formularios: Introducción, Feedback y “Equipo ILCE” (del lote anterior).'
    ]
  },
  {
    version: '0.17.0',
    fecha: '2026-09-09',
    cambios: [
      'Nuevo módulo Formularios (no-quiz): texto, texto largo y escala 1-5, con selección de curso.',
      'Se prearmaron 3 formularios: Introducción a la cursada, Feedback de cursada y “Yo quiero ser parte del Equipo ILCE”.',
      'Sección Formularios en el panel (Admin y Coordinación académica): lista + respuestas con detalle.'
    ]
  },
  {
    version: '0.16.0',
    fecha: '2026-09-09',
    cambios: [
      'Los Postwork se responden como tarjetas: una pregunta por vez, más anchas, con barra de progreso.',
      'Fichas: tarjetas más prolijas y parejas, ediciones con número/fecha/inscriptos, “sin ediciones” integrado (no como alerta), y jerarquía de botones (Editar principal).',
      'Se renombró la marca a “ILCE” (sin “Plataforma”).'
    ]
  },
  {
    version: '0.15.0',
    fecha: '2026-09-08',
    cambios: [
      'Login rediseñado (mismo estilo que el CRM) con marca ILCE.',
      'Botones de Buscador y Herramientas en la barra superior.',
      'Nueva sección Auditoría (Historial de acciones), visible solo para Admin, con buscador.'
    ]
  },
  {
    version: '0.14.0',
    fecha: '2026-09-08',
    cambios: [
      'Dashboard rediseñado y compacto: chips de período modernos, filtros activos como chips con ✕, KPIs chicos y gráficos ejecutivos (por edición/país/estado como chips con contador).',
      'Inscripciones: KPIs reales arriba de la tabla (total, 7 días, pendientes, en revisión, % completadas) y chips rápidos (Hoy, Esta semana, Este mes, Argentina, Exterior).'
    ]
  },
  {
    version: '0.13.0',
    fecha: '2026-09-08',
    cambios: [
      'Fichas como panel de gestión: cabecera con resumen (con/sin ediciones) y botón Nueva ficha, y banner de alerta de fichas sin ediciones.',
      'Tarjetas rediseñadas: nº de inscripciones protagonista, lista de ediciones con su conteo, última actualización y aviso “Publicada · sin ediciones”.',
      'Buscador por nombre/edición/URL/estado con contador de resultados, y orden por nombre / recientes / inscripciones.',
      'Menú ••• con acciones reales: Vista previa, Copiar URL, Ver inscripciones, Crear edición, Cambiar estado, Archivar (Eliminar/Duplicar quedan para cursos dinámicos).'
    ]
  },
  {
    version: '0.12.0',
    fecha: '2026-09-08',
    cambios: [
      'Navegación en pestañas ARRIBA (barra superior) en lugar de la barra lateral.',
      'Nueva pantalla Herramientas: accesos rápidos del equipo (editables).',
      'Auto-recuperación tras deploy: si se sube una versión nueva con la app abierta, se recarga sola en vez de romperse.'
    ]
  },
  {
    version: '0.11.0',
    fecha: '2026-09-08',
    cambios: [
      'Se sumaron los 8 cursos oficiales (incl. Copywriting y Formación para Formadores) como fichas administrables.',
      'Pantalla Fichas rediseñada: tarjetas de igual altura, métricas de ediciones e inscripciones, URL prolija con “✓ Copiado”, menú de acciones alineado y sin “Actualizada —” vacío.',
      'Actividades: ahora se registra (de forma interna) el tiempo que tarda cada estudiante en las nuevas respuestas; se ve en Respuestas y como promedio en Reportes.'
    ]
  },
  {
    version: '0.10.0',
    fecha: '2026-09-06',
    cambios: [
      'Reportes de actividades: por actividad, promedio general y % de acierto por pregunta, destacando las preguntas que más se erran.',
      'Respeta el alcance del docente (solo sus cursos/ediciones asignados).'
    ]
  },
  {
    version: '0.9.2',
    fecha: '2026-09-06',
    cambios: [
      'Nueva pestaña Emails en el panel: lista de todos los mails automáticos que genera el sistema + registro en vivo de los envíos, con buscador y filtros.',
      'Visible para Admin, Coordinador de inscripciones y Coordinación académica.'
    ]
  },
  {
    version: '0.9.1',
    fecha: '2026-09-06',
    cambios: [
      'Nueva solapa “Historial de accesos” dentro de Accesos (solo Admin): altas/bajas de usuarios y docentes, cambios de rol, restablecimientos de contraseña e inicios de sesión, con buscador.',
      'La baja de un docente ahora también queda registrada.'
    ]
  },
  {
    version: '0.9.0',
    fecha: '2026-09-06',
    cambios: [
      'Coordinación académica puede dar de alta el acceso de docentes en un solo paso: al asignarlos se les crea el usuario (rol Docente) y se les envía la contraseña por mail.',
      'Al quitar una asignación solo se saca el alcance; el login se gestiona desde Accesos.'
    ]
  },
  {
    version: '0.8.2',
    fecha: '2026-09-06',
    cambios: [
      'Pulido de UI/UX del panel: navegación de Actividades más clara, cabeceras y botones alineados.',
      'Tarjetas de actividad más prolijas (enlace etiquetado, botones parejos).',
      'Respuestas: resumen (respuestas/estudiantes/actividades/promedio), filtros y buscador.',
      'Docentes: curso/edición como chips y confirmación antes de quitar.',
      'Mejoras responsive (barra lateral y tablas en mobile).'
    ]
  },
  {
    version: '0.8.1',
    fecha: '2026-09-06',
    cambios: [
      'Nueva pestaña Emails: registro automático de cada correo enviado (tipo, destinatario, asunto, estado).'
    ]
  },
  {
    version: '0.8.0',
    fecha: '2026-09-05',
    cambios: [
      'Nuevo módulo Actividades (Postwork): quizzes con puntaje y corrección automática.',
      'Formulario público /actividad/… con envío y email de resultado al estudiante.',
      'Panel académico: crear/editar actividades, ver respuestas y asignar docentes por curso/edición.',
      'Los docentes ven solo las respuestas de sus cursos/ediciones asignados.',
      'Resumen automático de los viernes al equipo académico (cron).'
    ]
  },
  {
    version: '0.7.0',
    fecha: '2026-09-05',
    cambios: [
      'Constructor visual de 3 zonas: cursos · editor · vista previa en vivo.',
      'Ediciones editables (agregar, quitar, reordenar) que ya impactan en el formulario público.',
      'Título, bienvenida y estado se reflejan en la ficha pública; Borrador/Cerrada muestran aviso.',
      'Estado de guardado (sin cambios / cambios sin guardar / guardando) y aviso al salir sin guardar.'
    ]
  },
  {
    version: '0.6.0',
    fecha: '2026-09-05',
    cambios: [
      'Inscripciones: smart chips por estado con contadores en vivo.',
      'Filtros primarios + “Más filtros”, y filtros activos como chips que se quitan con un clic.',
      'Expediente reorganizado por secciones, con copiar email/WhatsApp y abrir WhatsApp.',
      'Dashboard: selector de período y KPIs clickeables que llevan a Inscripciones filtradas.'
    ]
  },
  {
    version: '0.5.0',
    fecha: '2026-09-05',
    cambios: [
      'Nueva sección Fichas: una card por curso con estado, inscripciones reales, link público y acciones.',
      'Smart chips (Todas/Publicadas/Borradores/Cerradas), buscador y estados vacíos.',
      'Avisos con toast en vez de alertas del navegador.',
      'Renombrados los roles: "Coordinador de inscripciones" y "Coordinación académica".'
    ]
  },
  {
    version: '0.4.0',
    fecha: '2026-09-05',
    cambios: [
      'Gestión de Accesos: crear usuarios, editar roles, ver/reenviar contraseña, activar/desactivar y eliminar.',
      'Roles combinables (Admin, Coordinador, Inscripciones, Estudiantes, Coord. Estudiantes, Académico).',
      'Selector de tema claro / oscuro / automático por horario.',
      'Se quitó la columna Responsable de la tabla, filtros y expediente.',
      'Botón de Novedades (este que estás viendo).'
    ]
  },
  {
    version: '0.3.0',
    fecha: '2026-09-04',
    cambios: [
      'Panel del equipo: tabla con búsqueda, filtros, columnas y exportación CSV/Excel.',
      'Expediente con historial y cambio de estado.',
      'Dashboard con métricas y embudo.',
      'Email al estudiante con botón de WhatsApp + aviso automático al equipo.'
    ]
  },
  {
    version: '0.2.0',
    fecha: '2026-09-03',
    cambios: ['Ficha pública funcional: pasos, autoguardado, validaciones, lógica condicional y envío.']
  }
];
