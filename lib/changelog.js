// Novedades de la app (se muestran en el botón "Novedades"). Más reciente arriba.
export const CHANGELOG = [
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
