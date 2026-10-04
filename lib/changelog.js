// Novedades de la app (se muestran en el botón "Novedades"). Más reciente arriba.
export const CHANGELOG = [
  {
    version: '1.29.0',
    fecha: '2026-10-04',
    cambios: [
      'Fichas en celular: las tarjetas de cada ficha se pasaban del borde derecho de la pantalla (quedaban cortados el botón "Fichas completadas" y el ícono de enlace). Ahora entran completas y los botones se acomodan en dos filas. En celular, la vista de tarjetas pasa a ser la que se abre por defecto (si alguien ya eligió una vista, se respeta).',
      'Accesos en celular: la descripción de qué permite cada rol estaba cortada contra el borde y no se podía leer; ahora se muestra completa. El formulario "Agregar nuevo usuario" pasa a una sola columna para que los campos no queden angostos.',
      'Las grillas con ancho mínimo fijo ahora se adaptan a pantallas angostas para que nada se salga del borde.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '1.28.0',
    fecha: '2026-10-04',
    cambios: [
      'Mejor lectura en todo el panel y en la ficha pública: ningún texto es más chico que 12 px (había unos 100 textos de 9 a 11 px, sobre todo en Reportes, filtros, chips y etiquetas).',
      'Inscripciones en celular: ahora se muestran como tarjetas con lo principal (nombre, estado, curso, edición, fecha, país y WhatsApp) en lugar de una tabla que se desplazaba de costado y escondía el estado y el WhatsApp. Al tocar una tarjeta se abre el mismo detalle de siempre. En pantallas grandes la tabla sigue igual.',
      'La barra superior del panel en celular pasó de tres filas a una fila de pestañas que se desplaza con el dedo (la pestaña activa se centra sola), y ocupa casi la mitad de alto.',
      'Ficha pública: el cartel "Recuperamos tu ficha" tenía texto oscuro sobre fondo oscuro y casi no se leía; ahora se lee bien.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '1.27.0',
    fecha: '2026-10-04',
    cambios: [
      'El botón "Necesito ayuda" pasa a ser neutro para no competir con la acción principal de cada pantalla. En celular es solo el ícono.',
      'Las novedades y la versión ahora también se abren desde ese botón de ayuda. En celular se saca el cartelito de versión que se superponía con el contenido.',
      'El menú de ayuda, el recorrido guiado y las novedades ahora se cierran con la tecla Esc.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '1.26.0',
    fecha: '2026-10-04',
    cambios: [
      'Se eliminaron todos los cuadros del navegador (los de "Aceptar / Cancelar" y los avisos con "OK"): ahora son cuadros y avisos de la propia app, que respetan el modo claro u oscuro, se cierran con Esc o haciendo clic afuera, y arrancan con "Cancelar" seleccionado para evitar borrar algo por error.',
      'Ficha de inscripción (formulario público): si el envío falla (por un rechazo del servidor o por falta de conexión), el mensaje ahora queda visible sobre el botón "Enviar inscripción" en vez de un aviso que desaparece. Los datos cargados no se pierden.',
      'Actividades, Formularios y Constructor: las confirmaciones de eliminar, cerrar, despublicar y salir sin guardar ahora dicen con claridad qué se va a hacer, con el botón de la acción en rojo cuando es destructiva.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '1.25.0',
    fecha: '2026-10-04',
    cambios: [
      'Mejor lectura: el texto atenuado (aclaraciones, fechas, ayudas) tenía muy poco contraste en modo claro y oscuro. Ahora se lee bien en los dos modos.',
      'Los violetas, magentas y el turquesa de la app pasan a los tonos del manual de marca de ILCE (el degradado se mantiene).',
      'Se puede navegar con el teclado viendo dónde está el foco, y los controles del navegador (casillas, listas) respetan el modo claro u oscuro.',
      'Login: ahora dice en qué app estás, el ojito para ver la contraseña es un ícono (antes un emoji), y el texto de ayuda ya no nombra a una persona.',
      'No se cambió ningún dato, flujo ni cálculo existente.'
    ]
  },
  {
    version: '1.24.4',
    fecha: '2026-10-03',
    cambios: [
      'Se corrigió una pantalla de error ("Algo salió mal") que podía aparecer en cualquier pestaña del panel: faltaba una función de permisos (agregada hace unas versiones, para que cualquiera pueda ver Respuestas) en el código que había quedado subido — no afectaba a todos por igual, dependía de si ese archivo específico se había subido bien.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.24.3',
    fecha: '2026-10-03',
    cambios: [
      'Causa probable del login caído: el link "Hablar por WhatsApp" del mail de confirmación leía la pestaña Inscripciones completa en cada clic, usando la misma cuenta de Google que el login — un mail masivo con ese link, con muchos clics juntos, agota la cuota de lecturas por minuto de Google y deja a todos afuera (incluido el login), aunque Google Sheets en sí no esté caído.',
      'Ese link ahora redirige a WhatsApp al instante, sin esperar a Google Sheets, y el registro del clic (que es solo una métrica, no afecta la inscripción) tiene un límite de cuántas veces por minuto puede leer la planilla — pasado ese límite simplemente no anota la fecha esa vez, pero el clic nunca se demora ni se rompe.',
      'Si el login vuelve a fallar por este motivo, ahora el log de Vercel muestra el error real que devuelve Google (por ejemplo, cuota agotada), no solo "no respondió a tiempo".',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.24.2',
    fecha: '2026-10-03',
    cambios: [
      'Login: cuando Google Sheets tarda en responder, antes se veía el mensaje genérico "Error de conexión. Probá de nuevo." sin explicar qué pasaba en realidad (el servidor fallaba sin capturar el error). Ahora: se reintenta una vez automáticamente, y si igual falla, el mensaje dice claramente que no se pudo conectar con la base de datos y que conviene probar de nuevo en un minuto.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.24.1',
    fecha: '2026-10-03',
    cambios: [
      'Reportes: las tarjetas de números de arriba de cada sección (Total de fichas, Completadas, En proceso, Nuevas, y las mismas de Fichas/Actividades/Formularios/Cursos/Estudiantes) ahora son más chicas — menos espacio vacío, mismo dato.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.24.0',
    fecha: '2026-10-03',
    cambios: [
      'Reportes → Evolución de inscripciones: el filtro de rango (30 días/3 meses/etc.) se reemplazó por un combo de mes; "Nuevas por día" ahora superpone el mes elegido contra el mes anterior en el mismo gráfico, con un indicador "▲/▼X% vs. mes anterior".',
      'Reportes → Por país: cada fila ahora muestra la bandera del país. Origen de inscripciones: cada canal tiene su ícono (Instagram, Facebook, Google, LinkedIn, Recomendación, Otro) y se corrigió un caso donde "Instagram" y "✅ Instagram" se contaban como dos canales distintos en vez de uno solo.',
      'Reportes → Por edición: cada tarjeta muestra solo el número de edición (ej. "53"), sin repetir "Ed." delante (la sección ya se llama "Por edición").',
      'Los textos de ayuda de cada pestaña (arriba de cada sección) ahora tienen un brillo animado para que se noten más.',
      'Se revisó el botón "❓ Necesito ayuda": el paso del recorrido sobre "Respuestas" dependía de un permiso de gestión que ya no aplica (ver v1.23.0, ahora cualquiera puede ver las respuestas) y podía no aparecerle a alguien que sí tiene acceso a esa pantalla — corregido.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.23.0',
    fecha: '2026-10-03',
    cambios: [
      'Respuestas de actividades y de formularios: ahora cualquier persona con acceso a la app puede verlas (antes dependía del rol, y un Docente u otros roles no veían nada o solo sus cursos asignados).',
      'Actividades: el título de cada actividad y el estado "Publicada" dejaron de ir en negrita en el listado; en Respuestas de actividades y de formularios, "Nombre" reemplaza a "Estudiante" como encabezado, la columna "Ver" ahora siempre muestra el botón, y "Actividad"/"Formulario" se colorean según el curso.',
      'Respuestas de formularios: se puede eliminar una respuesta ya enviada (Admin), igual que ya se podía en Respuestas de actividades; y el detalle de una respuesta abierta ahora muestra los campos en una sola línea cada uno, no apilados.',
      'Reportes: "Resumen del período" ahora acomoda las tarjetas en 2 o 3 columnas cuando hay lugar, en vez de una lista de una sola columna; "Por curso" ya no corta las últimas filas con scroll interno; "Evolución de inscripciones" ahora explica con un ícono ℹ️ qué significa cada número (Nuevas/Completadas/Pendientes son sobre las fichas creadas en el período, no un total histórico de toda la vida de la app).',
      'Emails → Registro de envíos: arranca mostrando el mes actual con un enlace para ver el resto; la tabla es más alta, con letra más chica y columnas más angostas para que entre sin scroll horizontal; las tarjetas de arriba (Envíos/Fallidos/Tasa de éxito) son más chicas.',
      'Fichas de inscripción: se sacó el combo "Ordenar" (la lista queda siempre alfabética) y se achicó el espacio entre la barra de arriba y la tabla.',
      'Se sacó la negrita de todo el proyecto: títulos, botones, badges, chips y textos que antes se veían en negrita ahora usan un peso de letra más liviano en toda la app.',
      'Ficha de inscripción pública: se corrigió un ancho fijo que en el paso 2 y 3 del formulario podía angostar de más la pantalla en un celular, obligando a hacer scroll horizontal.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.22.0',
    fecha: '2026-10-03',
    cambios: [
      'Buscador: ahora tolera errores de tipeo (por ejemplo, un apellido con una letra de más o de menos igual aparece entre los resultados).',
      'Buscador: nuevos chips para filtrar los resultados por tipo (Inscripciones/Fichas/Actividades/Formularios) y un contador que muestra cuántos resultados hay en total y cuántos quedan mostrados con el chip elegido.',
      'Buscador: el texto de ejemplo debajo del buscador ahora sugiere qué se puede buscar (nombre, teléfono, curso).',
      'Fichas, Actividades y Formularios: cuando un filtro no encuentra nada, el aviso ahora es una sola línea chica en vez del cartel grande con ícono.',
      'Sigue la prolijidad visual pedida para las pestañas Fichas y Respuestas (ver v1.21.0): menos espacio vacío y tipografías más chicas y parejas en toda la app.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.21.0',
    fecha: '2026-10-03',
    cambios: [
      'Barra de navegación de arriba: ahora entra en una sola línea en pantallas de notebook (antes se cortaba en dos filas). Se acortaron los nombres largos de algunas pestañas ("Fichas de inscripción" → "Fichas", "Actividades y formularios" → "Actividades", "Respuestas de fichas, actividades y formularios" → "Respuestas", "Equipo Docente" → "Equipo", "Historial de acciones" → "Historial") y se achicaron un poco los botones y espacios de toda la barra; el nombre completo de cada pestaña sigue apareciendo al pasar el mouse por encima.',
      'Un Docente ahora puede ver las respuestas de actividades de todos los cursos y ediciones, no solo las propias asignadas (antes quedaba filtrado y le aparecía el aviso "Mostrando solo tus cursos/ediciones asignados").',
      'Fichas de inscripción: al pasar el mouse sobre el nombre del curso (que ya se podía clickear para editar) ahora se subraya, para que se note que es clickeable.',
      'Fichas de inscripción: se sacó la negrita de las etiquetas "Sincrónica"/"Asincrónica" en la columna "Próximas ediciones".',
      'Pestañas "Fichas" y "Respuestas": ajuste general de prolijidad visual — menos negrita en títulos secundarios, chips y badges; tipografías y espacios (filas de tabla, tarjetas, paneles, título y bajada de cada sección) más compactos y parejos entre sí. No se cambió ningún filtro, acción ni funcionalidad.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.20.0',
    fecha: '2026-10-03',
    cambios: [
      'Se sacó la fuente "Dosis" del texto normal de toda la app — era una fuente de trazo parejo pensada para títulos, que se leía "gorda" incluso en peso normal. El texto ahora usa la fuente del sistema (más liviana); Dosis se sigue usando donde ya estaba puesta a propósito (títulos grandes, números).',
      'Inscripciones: el selector "Respuestas fichas / Respuestas actividades / Respuestas formularios" ahora también aparece en la pestaña Inscripciones (antes solo vivía en "Respuestas", así que al entrar desde ahí el selector desaparecía).',
      'Barra de arriba: "Ver como" + usuario + "Salir" ahora quedan en la misma fila que el resto de la navegación (antes, por una regla vieja, cada uno terminaba en su propia línea).',
      'Actividades → Respuestas y detalle de una actividad: la columna "Edición" muestra solo el número (ej. "57" en vez de "Ed. 57") ya que la cabecera de la columna ya dice "Edición".',
      'Fichas completadas, Respuestas de actividades y Respuestas de formularios: las tres tablas ahora empiezan igual, con Fecha primero y Nombre/Estudiante segundo.',
      'Filtros de Inscripciones: "Estado" va debajo de "Filtros rápidos" (no al lado) y los chips de ambos grupos son más chicos.',
      'Reportes: la navegación de pestañas (Resumen/Fichas/Actividades/.../Formularios) ahora es una fila de píldoras con ícono y color propio por pestaña, en vez de un control de un solo color.',
      'Respuestas de actividades: los combos de Curso, Edición y Actividad ahora tienen el mismo look "chip" chico que el resto de los filtros de la app.',
      'Respuestas de formularios: se sacó el cuadro de búsqueda repetido (el buscador de texto vive en un solo lugar, el ícono 🔎 de arriba de todo) y el combo de Formulario pasa al mismo estilo chip chico.',
      'Fichas de inscripción: el botón "Editar" de la lista quedó más chico y más transparente, menos pesado visualmente.',
      'Panel de "Novedades de la app": ahora arranca "apagado" y cada línea se va iluminando sola a medida que se llega a ella leyendo hacia abajo.',
      'Nuevo: el Admin puede eliminar una respuesta de actividad ya cargada (por ejemplo, una prueba cargada por error), desde Respuestas de actividades.',
      'Historial de acciones: los inicios de sesión (y los intentos fallidos) de una misma persona, uno atrás del otro, se agrupan en una sola fila con "×N" en vez de ensuciar la lista — se agregó también un separador por mes para no perder de vista en qué mes se está mirando.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.19.0',
    fecha: '2026-10-03',
    cambios: [
      'Se sacó la semi-negrita que pesaba sobre todo el texto de la app (venía de una regla global que afectaba cada letra de cada pantalla) — ahora el texto normal pesa lo que tiene que pesar, sin competir con lo que sí es importante.',
      'El logo quedó corregido: ahora sí aparece a la izquierda de "+ Crear" (en la versión anterior, por una regla de estilo que había quedado vieja, terminaba cayendo al final de la fila de navegación en vez de al principio).',
      'Fichas de inscripción: ahora se puede hacer clic directamente sobre el nombre del curso en la lista para abrir su edición en el Constructor — antes había que buscar el botón "Editar" aparte.',
      'Inscripciones: se sacaron los filtros por combo (Curso, Edición, País y rango de fechas con "+ Más filtros") — queda un solo tipo de filtro, los chips ("Filtros rápidos" y "Estado"), que ahora van uno al lado del otro para ocupar mucha menos altura en la pantalla.',
      'Constructor de fichas: se bajó un poco más el peso de los nombres de curso en la lista de la izquierda, para que no compitan visualmente con el resto.',
      'Emails → "Mails automáticos" y el registro de envíos reales: la columna "Tipo" ahora muestra un color propio por tipo de mail (igual de criterio que los colores por curso), para distinguirlos de un vistazo.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.18.0',
    fecha: '2026-10-03',
    cambios: [
      'Fechas en formato D/M/AAAA (sin ceros adelante) en "Próxima edición" de Fichas, en Panel y en Emails — antes algunas se mostraban como "05/08/25" o con nombre de mes, ahora todas usan el mismo formato corto.',
      'Actividades → Respuestas: el puntaje ahora se colorea según el resultado sobre 10 (rojo 1-3, naranja 4-5, amarillo 6-8, verde 9-10), para distinguir de un vistazo quién necesita repaso.',
      'Filtros y chips con estética más prolija: el grupo "Filtros rápidos" (Hoy/Esta semana/Argentina/Exterior) ahora usa un color propio (teal) distinto al de "Estado" (magenta), para diferenciar un grupo de filtros del otro. Se unificó también el estilo base de todos los chips.',
      'Se sacaron botones de búsqueda repetidos en Actividades y en la lista de Fichas (el buscador ya vive en un solo lugar: el ícono 🔎 de arriba de todo).',
      '"Actividades y formularios" → "Formularios": se sacó el selector interno "Formularios / Respuestas" (estaba repetido, ya se llega a "Respuestas" desde "Respuestas de fichas, actividades y formularios" arriba).',
      'Nuevo: igual que ya pasaba en "Fichas completadas", ahora Actividades y Formularios también muestran "🟢 Cargada hoy" o "✨ Nueva" cuando se acaban de subir. Importante — paso manual pendiente: para que esto se vea hay que agregar a mano el encabezado "Creado" en la columna siguiente a "Actualizado", tanto en la hoja Actividades como en la hoja Formularios. Los datos ya se guardan desde esta versión, pero no se ven en la tabla hasta agregar esos dos encabezados.',
      'Emails: cuando un envío se hizo en las últimas 48 horas (contadas desde la hora exacta de envío, no desde la medianoche), aparece una etiqueta "Enviado recientemente" debajo de la fecha.',
      'El logo ahora va a la izquierda del botón "+ Crear", en la misma fila de navegación (antes estaba arriba, en su propia fila, separado del resto).',
      'El buscador 🔎 y el selector de tema (☀️/🌙/🕒) se movieron: ahora están a la derecha de "Historial de acciones", en vez de sueltos en la esquina superior derecha.',
      'Se sacó el negrita de: los números de "Inscriptos" (columna Inscripciones de Fichas), el nombre del curso en la lista de Fichas, y el nombre del estudiante y el curso en Actividades → Respuestas — quedan con el mismo peso que el resto del texto, menos "gritones".',
      'Constructor de fichas: el nombre de cada curso en la lista de la izquierda ahora se muestra con su color propio (el mismo que usa el resto de la app), en vez de un color parejo para todos.',
      'Constructor de fichas: se corrigió la jerarquía tipográfica de toda la pantalla — los títulos de ficha son más grandes, los títulos de sección (Información/Ediciones/Campos/Configuración) se ven como encabezados reales (ya no como letra chica en mayúsculas), y los labels de los campos pesan menos que su contenido. Se sacaron bordes y fondos de más: las secciones ya no se ven como tarjetas apiladas, y la lista de ediciones ahora se lee como una lista (separador fino) en vez de tarjetas grandes. La vista previa lateral se achicó un poco para no competir con el editor.',
      'Constructor de fichas: el nombre de cada edición ya no va en negrita, y la fecha ahora aclara "Inicio: ..." y "Fin: ..." en vez de solo "fecha → fecha" (podía no quedar claro cuál era cuál).',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.17.0',
    fecha: '2026-10-03',
    cambios: [
      'Mail "Resumen académico semanal": los nombres de los cursos ahora aparecen coloreados (mismo color por curso que ya se usa en toda la app) para distinguirlos de un vistazo cuando hay varios en una misma tabla.',
      'Nuevo: seguimiento de clics en "💬 Hablar por WhatsApp" del mail de confirmación de inscripción. Cada clic queda registrado con fecha, y en "Fichas completadas" hay una columna nueva, más ancha, "Clic en \'hablar por whatsapp\'" que muestra un check cuando la persona hizo clic. Importante: para que se vea, hace falta agregar a mano el encabezado "Click WhatsApp" en la celda AE1 (la columna siguiente a "Origen registro") de la hoja Inscripciones — los clics ya quedan guardados desde que se suba esta versión, pero no se van a poder ver en la tabla hasta que se agregue ese encabezado.',
      '"Fichas completadas" y "Respuestas" (dentro de Actividades y formularios) ahora muestran primero las más recientes.',
      'En esas mismas dos tablas: las fichas/respuestas de hoy dicen "🟢 Inscrito hoy", y las de los últimos 1 a 9 días muestran una insignia "✨ Ficha nueva" que parpadea para llamar la atención. De ahí en más, la fecha de siempre.',
      'Tabla de "Fichas completadas": el curso ahora se muestra con un punto de color + texto (en vez del chip con fondo y borde de antes), para que se parezca más a cómo está armada la tabla de "Próximas clases" de disponibilidad-zoom. País y Edición se muestran igual, sin el recuadro. Mismos datos y mismo color por curso de siempre, solo cambia la presentación.',
      'Actividades → Respuestas: se reordenaron las columnas para que coincidan con las de "Fichas completadas" (Estudiante, Curso, Edición, Actividad, Email, Tiempo, Puntaje, Fecha) y el curso también aparece coloreado.',
      'Se sacó la pestaña "Respuestas" de adentro de Actividades y formularios (ya estaba repetida: es la misma vista que "Respuestas de fichas, actividades y formularios" arriba) y también se sacó el botón "Reportes" de ahí adentro (también repetido, ya está arriba como pestaña propia).',
      'Se sacó el selector "Fichas de inscripción / Fichas completadas" de adentro de Fichas, por el mismo motivo: "Fichas completadas" ya se ve desde "Respuestas de fichas, actividades y formularios".',
      'Nombres de pestañas más claros: "Fichas" ahora dice "Fichas de inscripción", y "Respuestas" ahora dice "Respuestas de fichas, actividades y formularios".',
      'El cartel de "Novedades de la app" ahora tiene un degradado sutil arriba cuando se abre.',
      'No se cambió ningún otro dato ni cálculo existente.'
    ]
  },
  {
    version: '1.16.0',
    fecha: '2026-10-03',
    cambios: [
      'Resumen (Reportes): "Por país" y "Origen de inscripciones" ahora se muestran lado a lado (50%/50%, una debajo de la otra en pantallas chicas) como tablas compactas de dos columnas (Nombre + Cantidad) en vez de barras horizontales largas — mismo dato y mismo cálculo de siempre, solo cambia cómo se ve.',
      '"Por edición" también se volvió compacto: en vez de una lista vertical con barras, ahora es una grilla de varias columnas que aprovecha el ancho disponible. No se tocó qué ediciones se muestran ni cómo se cuentan.',
      'A pedido de Diego: el dashboard queda mucho más corto — estas tres secciones ocupaban varias pantallas de alto y ahora entran en una fracción de ese espacio, sin perder ningún dato.',
      'Mails más confiables: "Resultado de tu actividad" (al estudiante) y "Actividad completada" (al docente) ahora reintentan el envío automáticamente hasta 2 veces (con una pequeña espera entre intentos) antes de darse por vencidos — antes, si Gmail fallaba una sola vez (corte momentáneo, límite de envíos, etc.), el mail se perdía y quedaba solo como "Falló" en Emails, dependiendo de que alguien entrara a reintentarlo a mano. Aplica a los 6 tipos de mail por igual (incluida la confirmación de inscripción), no solo a estos dos.',
      'Importante sobre el aviso a docentes: si ningún docente está asignado a ese curso/edición en la pestaña Docentes, hoy no se le avisa a nadie (no es un error, no queda ni un "Falló" — directamente no hay a quién avisarle). Si a Diego le pasa que "no le llegó al docente", vale la pena revisar primero que el docente esté cargado con el curso y la edición correctos ahí.',
      'No se cambió ningún otro dato, cálculo ni comportamiento de Reportes ni de los mails existentes.'
    ]
  },
  {
    version: '1.15.0',
    fecha: '2026-10-03',
    cambios: [
      'Reportes: 4 reportes nuevos, a pedido de Diego.',
      'Reporte de Actividades: se agregan las columnas Edición, Estudiantes, Respondieron y Participación (antes solo mostraba Respuestas/Promedio/Tiempo, que se mantienen al final). "Estudiantes" es el universo de inscriptos en el curso o, si la actividad tiene una Edición propia asignada, en esa edición puntual.',
      'Nuevo: pestaña "Preguntas" — antes era una tabla colapsada dentro de Actividades, ahora es su propio reporte, con cantidad de respuestas, correctas, incorrectas y % de aciertos por pregunta, filtrable por curso/actividad/texto de la pregunta y ordenable (mayor o menor % de aciertos).',
      'Nuevo: pestaña "Respuestas" — elegís una actividad y ves, pregunta por pregunta, la distribución de opciones elegidas (opción múltiple y Verdadero/Falso) o la lista completa de respuestas (abiertas, con fecha y estudiante). El Excel/CSV/PDF exporta todo el detalle ya filtrado por los filtros de arriba (Curso/Edición/Docente/Período).',
      'Nuevo: pestaña "Campos" — distribución de cómo respondieron los estudiantes a "¿Cómo llegaste a nosotros?", "Modalidad de cursada" y "Medio de contacto preferido" (las respuestas "Otro: ..." se agrupan en una sola barra "Otro" para que se pueda leer).',
      'Encontramos de paso un hueco real: los "campos personalizados" que se pueden definir en Constructor → "Editar campos" → "Personalizados" no se muestran hoy en la ficha pública (FichaWizard no los lee) ni se guardan en ningún lado, así que no hay datos que reportar todavía para esos — se lo avisamos a Diego, no se inventó nada. El Reporte de Campos usa los 3 campos que la ficha sí pide hoy.',
      'Nuevo: exportar a PDF, en los tres reportes que ya tenían Excel/CSV (se suma como tercera opción en el mismo botón "Exportar") — tabla prolija con el nombre del reporte y los filtros activos arriba.',
      'No se tocó ningún cálculo ni dato existente de Actividades, Cursos, Estudiantes ni Formularios — todo lo que ya funcionaba sigue funcionando exactamente igual.'
    ]
  },
  {
    version: '1.14.0',
    fecha: '2026-10-02',
    cambios: [
      'Actividades: revisión completa de la sección de gestión (crear/editar), a pedido de Diego. Se verificó primero qué ya existía para no duplicar ni romper nada, y se agregó lo que faltaba.',
      'Nuevo: "Duplicar actividad" ahora copia también las preguntas y toda la configuración (antes solo copiaba los datos básicos), queda en estado Borrador y con un nombre de clase editable antes de guardar.',
      'Nuevo: orden manual de actividades. En el selector "Ordenar" hay una opción nueva, "Orden manual (arrastrar)", que respeta la posición que Diego le haya dado a cada actividad dentro de su curso/edición; las que todavía no tienen un orden manual asignado caen al final, en el orden de siempre.',
      'Nuevo: "Programar publicación" ahora acepta fecha Y hora (antes solo fecha) — una actividad programada para "hoy a las 20:00" no aparece disponible antes de esa hora. Compatible con todas las actividades que ya tenían solo fecha: siguen funcionando igual (disponibles desde el inicio del día).',
      'Nuevo: "Cerrar actividad ahora", en el menú "…" del editor — cierra la actividad en el momento (pide confirmación explicando qué va a pasar), sin tener que esperar a que llegue una fecha de cierre programada.',
      'Nuevo: "Despublicar", en el mismo menú "…" — vuelve la actividad a Borrador (dejar de estar visible para los estudiantes) sin borrar nada; las respuestas que ya tiene quedan intactas.',
      'Nuevo: "Eliminar actividad", en el mismo menú — pide confirmación explicando que no se puede deshacer, y si la actividad ya tiene respuestas, avisa cuántas tiene y aclara que esas respuestas no se borran (quedan en el historial), solo desaparece la actividad del listado.',
      'Nuevo: "Reutilizar pregunta existente" al armar las preguntas de una actividad — deja elegir una pregunta ya cargada en otra actividad y agrega una copia (la original no se toca).',
      'Nuevo: "Vista previa" (Desktop y Mobile) — muestra exactamente la misma pantalla que va a ver el estudiante, con las preguntas y el diseño reales de la actividad tal como está en ese momento (no es una maqueta aparte).',
      'Nuevo: "Guardar borrador" y "Publicar" ahora son dos botones separados y siempre visibles al pie del editor (antes era un solo botón que cambiaba de función según el paso) — Publicar pide confirmación antes (explicando si va a quedar visible de inmediato o programada) y, al guardar, muestra un mensaje distinto según el caso ("✓ Actividad publicada correctamente" / "✓ Actividad guardada como borrador").',
      'Nuevo: indicador de guardado siempre visible en el editor (Guardando… / ✓ Guardado / ⚠ Error al guardar), para no tener que adivinar si el trabajo quedó guardado.',
      'Nuevo: si una actividad ya tiene respuestas registradas, el editor muestra un aviso permanente arriba, y pide confirmación (explicando qué puede pasar con el puntaje ya calculado) antes de eliminar una pregunta o cambiarle el tipo.',
      'Se corrigió de paso un problema en el guardado rápido de Edición/Clase/Estado desde la tabla del listado: no estaba guardando la hora de disponibilidad ni el orden manual de una actividad, así que una edición rápida podía borrar sin querer esos dos datos si ya estaban cargados.',
      'No se agregó ninguna métrica, estadística ni reporte dentro de Actividades (pedido explícito de Diego) — todo el análisis de resultados y participación sigue estando solo en Reportes.'
    ]
  },
  {
    version: '1.13.0',
    fecha: '2026-10-02',
    cambios: [
      'Emails: rediseño de la sección. "Registro de envíos" ahora tiene 3 números arriba (Envíos, Fallidos, Tasa de éxito) que se recalculan solos con los filtros que tengas puestos, para detectar de un vistazo si algo se está rompiendo sin tener que contar filas.',
      'Emails: nuevo filtro rápido de período (Todo / Hoy / 7 días / 30 días / Este mes) para el registro de envíos, y los filtros activos (Tipo, Estado, Período) ahora se ven como etiquetas que podés sacar de a una, con un botón "Limpiar filtros" — mismo estilo que ya usa Reportes.',
      'Emails: nuevo botón para exportar a CSV el registro de envíos tal cual lo estés filtrando en ese momento.',
      'No se tocó ninguna plantilla de correo, ni cómo ni cuándo se envía cada mail automático — todo eso sigue funcionando exactamente igual, solo cambió cómo se ve y se filtra el panel.',
      'No se agregó ninguna distinción "Sesión" vs. "Clase": confirmado con Diego que no hace falta.'
    ]
  },
  {
    version: '1.12.0',
    fecha: '2026-10-02',
    cambios: [
      'Vista del estudiante (la pantalla donde responde una actividad): rediseño completo. Antes de empezar se ven siempre, juntos y sin que uno tape al otro, las instrucciones (si la actividad tiene), la cantidad de preguntas y la fecha límite (si tiene) — antes, cuando había instrucciones, la cantidad de preguntas quedaba oculta.',
      'Vista del estudiante: las preguntas ahora están numeradas (1. 2. 3. …) y cada una se ve como un bloque propio, más fácil de leer en el celular. Las de opción múltiple y verdadero/falso tienen botones grandes, fáciles de tocar, con la opción elegida bien marcada.',
      'Vista del estudiante: nuevo indicador de guardado automático, siempre visible mientras se responde (✓ Respuestas guardadas en este dispositivo / Guardando… / ⚠ No se pudo guardar). Guarda un borrador en el celu/computadora de quien responde a medida que va contestando, así si se cierra la página o se cuelga por error no se pierde lo ya hecho — es un guardado local de ese dispositivo, no es un guardado en el servidor (eso implicaría un cambio más grande, no se hizo).',
      'Vista del estudiante: al llegar a la última pregunta, "Enviar actividad" ahora pide una confirmación ("¿Querés enviar tus respuestas? Una vez enviada, no vas a poder modificarlas") antes de mandar la respuesta. La pantalla final pasa a decir "¡Actividad completada! 🎉".',
      'Nuevo: si alguien ya completó una actividad y vuelve a entrar con el mismo correo, ve directamente "Ya completaste esta actividad" con la fecha y el puntaje, en vez de poder responderla de nuevo (antes no había ningún aviso ni control — ahora además el servidor rechaza un segundo envío con el mismo correo aunque alguien insista).',
      'Nuevo: cada actividad puede tener una "Fecha de cierre" opcional (en Constructor de actividades, junto a la fecha de disponibilidad) — pasada esa fecha, la actividad deja de poder responderse y en vez del formulario se ve "Actividad cerrada… el período para completarla finalizó el [fecha]". Es opcional: una actividad sin fecha de cierre funciona exactamente igual que antes (sin límite).',
      'Nuevo: cada actividad puede tener instrucciones para el estudiante (opcional), editables en el mismo paso del Constructor donde ya se carga la fecha de disponibilidad.',
      'No se agregó el tipo de pregunta "escala del 1 al 5" porque hoy no existe en los datos de ninguna actividad — agregarlo requeriría definir primero cómo se carga y se corrige ese tipo de pregunta en el Constructor, y eso no estaba pedido para esta vuelta.',
      'No se tocó la corrección de respuestas, el cálculo de puntaje, ni los correos que se envían al estudiante y a los docentes — siguen funcionando exactamente igual que antes.'
    ]
  },
  {
    version: '1.11.0',
    fecha: '2026-10-02',
    cambios: [
      'Reportes: rediseño completo. La navegación pasa a ser Resumen · Fichas · Actividades · Cursos · Estudiantes · Formularios — "Inscripciones" se renombra a "Fichas" (misma lógica) y se agregan dos secciones nuevas: "Cursos" (ediciones, estudiantes, actividades y % participación por curso, con detalle al hacer clic) y "Estudiantes" (una fila por ficha: en cuántas actividades de ese curso participó cada uno).',
      'Reportes: nuevo filtro global "Docente" (en "Más filtros", junto a Curso/Edición/Estado) — muestra solo las fichas, cursos, estudiantes y respuestas de Formularios de los cursos/ediciones que tiene asignados ese docente en "Equipo Docente". En Actividades el filtro de Docente restringe por curso (las actividades son del curso completo, no de una edición puntual — mismo criterio que ya regía para Edición ahí).',
      'Reportes → Actividades: la tabla "Análisis de preguntas" pasa a llamarse "Preguntas con menor porcentaje de aciertos" y ordena por defecto de menor a mayor % de aciertos, con las columnas en el orden Actividad · Pregunta · Curso · Respuestas · % correcto.',
      '"No duplicar análisis fuera de Reportes" (pedido de Diego): se saca de Actividades un reporte duplicado que ya no se podía abrir desde ningún botón (había quedado inalcanzable) y la barra de KPIs (Respuestas/Estudiantes/Actividades/Promedio) de la pestaña "Respuestas", que repetía números que ya muestra Reportes.',
      'Nada de esto cambia datos ni fórmulas existentes: "Fichas"/Resumen/Formularios funcionan exactamente igual que antes, solo con la navegación reordenada.'
    ]
  },
  {
    version: '1.10.0',
    fecha: '2026-10-02',
    cambios: [
      'Constructor: rediseño completo de la pantalla. Encabezado nuevo (Constructor / nombre del curso / última modificación), navegación por secciones (Información · Ediciones · Campos · Configuración) que lleva directo a cada una con un clic, estado de guardado bien visible en todo momento (🟢 Guardado / 🟡 Guardando… / 🟠 Cambios sin guardar / 🔴 Error al guardar, con botón Reintentar — ya no depende solo del toast), y "Ver ficha pública" subido junto a Guardar.',
      'Constructor: "Campos" y "Configuración" dejan de estar escondidas en secciones colapsadas por default — ahora muestran siempre un resumen (cuántos campos activos/personalizados, destinatarios, notificaciones) con un botón para abrir el detalle completo.',
      'Constructor: cada edición se ve como una tarjeta con su estado (🟢 En curso / 📅 Próxima / ⚪ Finalizada, calculado solo a partir de las fechas que ya cargás — no es un dato nuevo para cargar) en vez de todo en una sola línea técnica. Al editar una edición, los datos quedan separados en Identificación, Docencia y Cursada, con la fecha de fin calculada destacada ("📅 Finaliza el...").',
      'Constructor: agregar un campo personalizado ahora abre un mini-formulario propio (nombre, tipo, botón Agregar) en vez de 3 controles sueltos en una fila.',
      'Constructor: la vista previa ahora tiene selector Desktop | Mobile — en Mobile se ve dentro de un marco de teléfono, para chequear rápido cómo queda en celular.',
      'Constructor: si hay varias fichas, la lista de la izquierda ahora tiene buscador, un punto de color con el estado de cada una, y marca con un punto naranja si la que estás editando tiene cambios sin guardar.',
      'Constructor: no se tocó ninguna lógica existente (autosave, cálculo de fechas y husos horarios, campos activos/personalizados, orden con drag & drop, destinatarios) — todo sigue funcionando igual, solo cambió cómo se ve.'
    ]
  },
  {
    version: '1.09.2',
    fecha: '2026-09-29',
    cambios: [
      '"❓ Necesito ayuda": se actualiza el contenido del recorrido — tenía pasos rotos que apuntaban a pestañas que ya no existen ("Dashboard", "Actividades" y "Formularios" por separado, fusionadas hace tiempo en "Reportes" y "Actividades y formularios"), y faltaban "Respuestas" y "Equipo Docente".'
    ]
  },
  {
    version: '1.09.1',
    fecha: '2026-09-29',
    cambios: [
      'El boton de version (abajo a la derecha) ahora parpadea cuando hay novedades que todavia no viste, y se apaga al hacer clic. El cartel muestra las novedades del mes, con un link para ver las anteriores.'
    ]
  },
  {
    version: '1.09.0',
    fecha: '2026-09-28',
    cambios: [
      'Nuevo asistente de "+ Crear": elegis que crear (inscripcion / actividad / formulario), despues el curso, y para actividades ademas la clase y la cantidad de preguntas; el editor abre con todo pre-armado. (Formulario con alta guiada llega en la proxima etapa.)'
    ]
  },
  {
    version: '1.08.0',
    fecha: '2026-09-28',
    cambios: [
      'El rol Coordinador ahora puede ver y armar actividades y formularios (y sus respuestas), ademas de lo que ya podia.'
    ]
  },
  {
    version: '1.07.0',
    fecha: '2026-09-28',
    cambios: [
      'La sub-pestaña "Reportes" dentro de Actividades ahora lleva directo a la seccion Reportes (todo el analisis en un solo lugar).',
      'Se quito el boton "Buscar" que estaba debajo de los filtros en Fichas (la busqueda esta arriba, en la lupa).'
    ]
  },
  {
    version: '1.06.0',
    fecha: '2026-09-28',
    cambios: [
      'Respuestas: ahora hay 3 chips arriba — Respuestas fichas, Respuestas actividades y Respuestas formularios — para ir directo a cada tipo de respuesta.'
    ]
  },
  {
    version: '1.05.0',
    fecha: '2026-09-28',
    cambios: [
      'Actividades y formularios: al entrar aparece un selector fijo arriba con "Actividades" y "Formularios" para alternar entre ambos, en vez del paso previo de elegir y volver.'
    ]
  },
  {
    version: '1.04.1',
    fecha: '2026-09-28',
    cambios: [
      'Se corrigio el error que impedia crear/editar fichas de inscripcion (un efecto quedaba mal ubicado y rompia la pantalla). Ya se puede abrir el editor normalmente.'
    ]
  },
  {
    version: '1.04.0',
    fecha: '2026-09-28',
    cambios: [
      'Listado (tabla) de Fichas: cada fila ahora tiene el borde de color de su curso a la izquierda y resalta al pasar el mouse, como el listado del cronograma.'
    ]
  },
  {
    version: '1.03.0',
    fecha: '2026-09-28',
    cambios: [
      'Tarjetas de Fichas: el borde izquierdo de color de cada curso ahora es solido y mas marcado (como en el cronograma de disponibilidad-zoom), en vez de apagado.'
    ]
  },
  {
    version: '1.02.2',
    fecha: '2026-09-28',
    cambios: [
      'Se quito el boton "+ Nueva ficha" (el alta de cursos nuevos todavia no esta disponible, no hacia nada util).'
    ]
  },
  {
    version: '1.02.1',
    fecha: '2026-09-28',
    cambios: [
      'Constructor de fichas: se blindo contra un estado invalido que podia tirar un error al abrirlo (ahora, si la seleccion no es valida, cae en la primera ficha o muestra un cargando en vez de romper).'
    ]
  },
  {
    version: '1.02.0',
    fecha: '2026-09-28',
    cambios: [
      'Nueva edicion: el Docente ahora se elige de un desplegable precargado con el equipo docente del curso (con opcion "Otro" para escribir uno nuevo), en vez de tipearlo a mano.'
    ]
  },
  {
    version: '1.01.0',
    fecha: '2026-09-28',
    cambios: [
      'Fichas de inscripción → "Crear edición": ahora ocupa toda la pantalla (no un modal chico), con el tipo de cursada en un combo arriba de todo — Sincrónica / Asincrónica / A demanda — y una vista previa que se va completando al costado a medida que se cargan los datos, mismo criterio que ya usa listadopresentismo en su propia "Nueva edición".',
      '"A demanda" marca el curso entero como disponible siempre sin ediciones programadas (mismo campo que ya usa Coaching Inmobiliario), en vez de crear una edición nueva.'
    ]
  },
  {
    version: '1.00.0',
    fecha: '2026-09-26',
    cambios: [
      'Fichas de inscripción → menú ⋮ de una ficha → "Crear edición": ahora abre primero un modal liviano (número de edición sugerido solo, fecha de la primera clase o "es asincrónica", cantidad de clases y docente) en vez de ir directo al Constructor completo; al crear, se abre el Constructor de esa ficha para revisar/ajustar el resto de los campos si hace falta.',
      'Constructor de fichas: cada edición ahora tiene un campo "Docente" (texto libre), visible también en el resumen de la tarjeta.',
      'La barra de navegación de arriba ahora es flotante: se oculta al bajar y reaparece al subir (o al estar cerca del principio de la página), igual que en seguimiento-lead-estudiante.',
      'Actividades: nuevo tipo de pregunta "Respuesta abierta" (además de opción múltiple y verdadero/falso) — no se autocorrige, queda para revisar a mano en "Respuestas", donde ahora se puede ver el detalle completo de lo que escribió cada estudiante.',
      'Emails: la tabla de "Mails automáticos que genera el sistema" se ve más ancha.'
    ]
  },
  {
    version: '0.99.0',
    fecha: '2026-09-25',
    cambios: [
      '"Actividades" y "Formularios" se unifican en una sola pestaña "Actividades y formularios": al entrar se elige "Fichas de actividades" o "Ficha de formularios". Se agrega la pestaña "Respuestas", con el mismo selector para ver las respuestas de actividades o de formularios.',
      'Reportes: "Por país" y "Origen de inscripciones" ahora se muestran en una tabla de dos columnas (colapsable), en vez de una lista larga de barras.',
      'Historial de acciones: la tabla ahora se pagina de a 50 registros, con botones para moverse entre páginas.',
      'Constructor de fichas: si una edición es "Cursada Asincrónica", ya no pide día ni horario (no aplican).',
      'Constructor de fichas: la cantidad de clases se completa sola para los cursos con cadencia fija (48 en Coaching Ontológico; 16 en Oratoria, Coaching de Equipos, Coaching Educativo y Coaching Vocacional) — ya no se tipea a mano. Se saca el selector "Semanal/Quincenal": todas las cursadas son semanales.',
      'Constructor de fichas: el texto de fecha de fin calculada ahora aclara cómo se calculó (cantidad de clases y fecha de inicio).',
      'Fichas de inscripción: la tabla se ve más ancha y más alta (menos scroll interno), marca si una ficha tiene ediciones sincrónicas y/o asincrónicas, y para Coaching Inmobiliario "Próxima edición" ahora dice "No aplica".'
    ]
  },
  {
    version: '0.98.0',
    fecha: '2026-09-25',
    cambios: [
      'El botón "+ Crear" se mueve a la barra de arriba, antes de "Fichas" (estaba abajo, al lado de la descripción de cada pantalla).',
      'Actividades: en el detalle de una actividad, Edición y Clase ahora se pueden editar haciendo clic directo (como ya se podía desde la lista) — antes solo se veían como texto fijo.',
      'Actividades: el detalle de una actividad ahora queda centrado en la pantalla (antes quedaba pegado a la izquierda en pantallas anchas).'
    ]
  },
  {
    version: '0.97.0',
    fecha: '2026-09-25',
    cambios: [
      'Nuevo botón "+ Crear" arriba de cada pantalla: abre un selector (Inscripción / Actividad / Formulario) y te lleva directo al alta de lo que elijas. Reemplaza al botón suelto "+ Crear nueva ficha de inscripción" que estaba en Fichas, que ya se saca.',
      'Actividades: se saca la pestaña "Docentes" de adentro (duplicaba, con alta/baja de acceso incluida, lo que ya hace la pantalla "Equipo Docente" del menú principal — quedaba un lugar de más para lo mismo).',
      'Emails: en el resumen académico semanal, los datos de la tabla (estudiante, curso, actividad) ya no se cortan en dos líneas.'
    ]
  },
  {
    version: '0.96.0',
    fecha: '2026-09-25',
    cambios: [
      'Corrección de color: el botón principal de las tarjetas de Actividades ("✎ Editar") y de Formularios ("👁 Abrir"), y el botón "Volver al Campus", usaban un gradiente celeste que no se usa en ningún otro lugar de la app — ahora usan el mismo gradiente violeta-magenta que el resto de los botones principales (Nueva actividad, pestañas activas, etc.).',
      'Las tarjetas de Actividades/Formaciones ahora resaltan con un brillo violeta al pasar el mouse, en vez de un borde celeste suelto — mismo criterio de color que el resto de la app.'
    ]
  },
  {
    version: '0.95.0',
    fecha: '2026-09-25',
    cambios: [
      'Actividades: arriba de la lista se agregan tarjetas KPI (Actividades, Publicadas, Programadas, Preguntas cargadas, Respuestas recibidas, Promedio de aciertos) con la misma estructura simple de las tarjetas "HOY" de Cronograma — número grande y label chica, sin decoración. Los números salen de las actividades cargadas y del reporte real de RespuestasActividades.'
    ]
  },
  {
    version: '0.94.0',
    fecha: '2026-09-25',
    cambios: [
      'Paleta de colores unificada con la app de Cronograma (disponibilidad-zoom): fondo casi negro en vez de navy, y los tres colores de acento (celeste, violeta, magenta) pasan a los mismos tonos vivos de esa app. También se corrigen los colores de éxito/alerta/error en modo claro, que antes usaban fondos pensados para modo oscuro.'
    ]
  },
  {
    version: '0.93.0',
    fecha: '2026-09-25',
    cambios: [
      'Fichas de inscripción: se saca el cuadro de búsqueda de texto libre de arriba de la lista (quedaba un segundo buscador aparte del global) — ahora hay un botón "🔎 Buscar" que lleva directo a la pestaña Buscador, igual que en Actividades.'
    ]
  },
  {
    version: '0.92.0',
    fecha: '2026-09-25',
    cambios: [
      'Formularios (vista Tarjetas): mismo diseño premium "Formaciones" que ya tienen Fichas y Actividades (antes tenía su propio estilo con el botón "Abrir" grande y la etiqueta "ENLACE" separada).',
      'Actividades (vista Lista): las columnas Edición y Clase ahora se editan con un click directo en la tabla, sin tener que abrir "✎ Editar" — Edición acepta un número o la palabra "Todas".'
    ]
  },
  {
    version: '0.91.0',
    fecha: '2026-09-25',
    cambios: [
      'Detalle de una actividad: encabezado con avatar de color del curso, y las preguntas ahora tienen un número circular y la respuesta correcta se marca con un ✓ en vez de solo el color de fondo.',
      'Buscador global: barra de búsqueda "hero" más grande con foco resaltado, e íconos por tipo (Ficha/Inscripción/Actividad/Formulario) en chips de color en vez de emojis sueltos; las tarjetas de resultados y de "últimos vistos" ahora tienen un acento de color por tipo y efecto hover.'
    ]
  },
  {
    version: '0.90.0',
    fecha: '2026-09-25',
    cambios: [
      'Actividades (vista Tarjetas): las tarjetas pasan al mismo diseño premium "Formaciones" que ya tienen las Fichas — punto de color + título a la izquierda, estado a la derecha, datos en líneas simples, enlace en chip y botones Ver/Duplicar/Editar abajo.',
      'Barra de navegación superior: ahora todas las pestañas se ven como píldoras (fondo y borde visibles), no solo la que está activa — mismo estilo agrupado que la app de Cronograma.'
    ]
  },
  {
    version: '0.89.0',
    fecha: '2026-09-25',
    cambios: [
      'Se elimina la pestaña Dashboard: todo lo que mostraba (KPIs, ⚠ Atención, Evolución, Por curso/estado/edición/país/origen) ahora vive dentro de Reportes → Resumen. Un link viejo con ?tab=dashboard manda directo a Reportes.',
      'Reportes: se suman los paneles "Por país", "Origen de inscripciones" y "Por edición" que solo estaban en el Dashboard, más un aviso cuando hay fichas con País/Origen sin un dato válido.',
      'Reportes: los gráficos de evolución ahora son una curva suave con relleno degradado (antes eran líneas rectas quebradas), y las tarjetas de KPI tienen un acento de color arriba y el ícono en un chip.',
      '"Por curso" (en Reportes y en Fichas) ahora muestra un avatar circular con las iniciales del curso en su mismo color, igual que en la vista Lista de Fichas.'
    ]
  },
  {
    version: '0.88.0',
    fecha: '2026-09-25',
    cambios: [
      'Fichas de inscripción (vista Tarjetas): mismo rediseño que la vista Lista — calco de la tarjeta "Formaciones" de disponibilidad-zoom, con punto de color + título + badge arriba, datos en líneas simples y la próxima edición destacada en negrita (antes eran dos "cajas" grandes de número).',
      'El botón "+ Crear nueva ficha de inscripción" ahora está siempre visible en Fichas, tanto en "Fichas de inscripción" como en "Fichas completadas" (antes desaparecía en esta última).',
      'En Actividades (lista y respuestas) se sacó el buscador de texto propio de cada vista — el buscador de toda la app queda solo en la pestaña "Buscador" (🔎), con un botón directo para ir ahí; los filtros de Curso/Edición/Estado siguen igual.',
      'Orden del menú principal: ahora es Fichas → Actividades → Formularios → Dashboard → Reportes → …'
    ]
  },
  {
    version: '0.87.0',
    fecha: '2026-09-25',
    cambios: [
      'Fichas de inscripción (vista Lista): cada curso ahora tiene un avatar circular con sus iniciales en su mismo color, y la URL pública se ve como un chip de código con su botón de copiar al lado.',
      'Las sub-pestañas "Fichas de inscripción" / "Fichas completadas" pasan de un subrayado a píldoras con ícono (la activa en el mismo degradado violeta→magenta del resto de la app).',
      'El botón "Inscripciones" de la vista en tarjetas ahora dice "Fichas completadas", para que coincida con el nombre real de esa pestaña.'
    ]
  },
  {
    version: '0.86.0',
    fecha: '2026-09-25',
    cambios: [
      'Los chips activos (Filtros rápidos, Estado) volvieron a tener el degradado violeta→magenta con texto blanco de disponibilidad-zoom — una segunda definición de estilo más nueva en el archivo les estaba ganando la pantalla y los dejaba "apagados".',
      'En los Formularios, la escala del 1 al 5 ahora se pinta más clara cerca del 1 y más oscura cerca del 5 (antes todos los números activos se veían del mismo color).'
    ]
  },
  {
    version: '0.85.0',
    fecha: '2026-09-25',
    cambios: [
      'Ahora hay un único buscador en toda la app (el de la pestaña "Buscador", 🔎 arriba a la derecha) — se sacó el segundo cuadro de búsqueda que había suelto en "Fichas completadas" (Inscripciones), que duplicaba esa función.',
      'Si llegás a "Fichas completadas" con una búsqueda ya cargada (por ejemplo, desde un resultado del Buscador), ahora se ve como un filtro más, con su propio botón para sacarlo — antes quedaba invisible y sin forma de limpiarlo.'
    ]
  },
  {
    version: '0.84.0',
    fecha: '2026-09-23',
    cambios: [
      'Colores de curso ahora coinciden con los de la app de cronograma (disponibilidad-zoom): Ontologico violeta, Educativo azul, Equipos verde, Oratoria naranja, Vocacional amarillo, Deportivo rojo, etc.'
    ]
  },
  {
    version: '0.83.0',
    fecha: '2026-09-23',
    cambios: [
      'Los chips de filtro (estados, etc.) ahora tienen el mismo estilo que el cronograma de disponibilidad-zoom: pill transparente con borde cuando estan inactivos y degradado violeta cuando estan activos.'
    ]
  },
  {
    version: '0.82.2',
    fecha: '2026-09-23',
    cambios: [
      'Reportes de Actividades: "Ver por pregunta" ya muestra el detalle por pregunta. Estaba vacio en las actividades que tienen texto introductorio, porque el reporte no leia bien ese formato.'
    ]
  },
  {
    version: '0.82.1',
    fecha: '2026-09-23',
    cambios: [
      'Reportes de Actividades: el cruce entre respuestas y actividad ahora tolera diferencias de acentos, signos y espacios en el nombre, para que no queden actividades sin su reporte por un nombre escrito distinto.'
    ]
  },
  {
    version: '0.82.0',
    fecha: '2026-09-23',
    cambios: [
      'Reportes: el grafico de Evolucion de inscripciones se rediseño con el estilo de Informes RRSS — mini-paneles (Nuevas, Completadas, Pendientes) con lineas limpias y, al pasar el mouse, el dia y el numero.'
    ]
  },
  {
    version: '0.81.0',
    fecha: '2026-09-14',
    cambios: [
      'Tarjetas de Fichas: la URL de inscripcion se muestra compacta con botones para copiar y abrir, y las tarjetas tienen una sombra sutil y un poco mas de aire.'
    ]
  },
  {
    version: '0.80.1',
    fecha: '2026-09-14',
    cambios: [
      'Fichas (vista tabla): la columna de ediciones ahora se llama \"Proximas ediciones\", igual que en las tarjetas.'
    ]
  },
  {
    version: '0.80.0',
    fecha: '2026-09-14',
    cambios: [
      'Tarjetas de Fichas: las acciones principales (Editar, Ver publica, Inscripciones, Copiar enlace) ahora estan visibles en la tarjeta, y el menu de tres puntos queda solo para acciones secundarias.'
    ]
  },
  {
    version: '0.79.0',
    fecha: '2026-09-14',
    cambios: [
      'Al terminar un formulario, se ofrecen 3 accesos: leer una nota del Blog, volver al Campus y seguir a ILCE en Instagram. Tambien se corrigio el enlace al Campus en la pantalla final de las actividades.'
    ]
  },
  {
    version: '0.78.0',
    fecha: '2026-09-14',
    cambios: [
      'Fichas: ahora se ve la URL de inscripcion completa, el contenido usa un poco mas de ancho, y los nombres de cada curso aparecen con su color (el mismo unificado del resto de la app).'
    ]
  },
  {
    version: '0.77.0',
    fecha: '2026-09-14',
    cambios: [
      'El resumen semanal de los viernes ahora incluye tanto las actividades como los formularios completados en la semana, y suma a Diego a los destinatarios.'
    ]
  },
  {
    version: '0.76.0',
    fecha: '2026-09-14',
    cambios: [
      'La tabla de mails automaticos ahora muestra tambien el remitente (De / CC) y el Asunto de cada correo, ademas de cuando se envia, a quien y el tipo.'
    ]
  },
  {
    version: '0.75.0',
    fecha: '2026-09-14',
    cambios: [
      'Cada seccion ahora muestra arriba una breve descripcion de para que sirve ("Aqui encontras...") en lugar del breadcrumb y el titulo repetido.'
    ]
  },
  {
    version: '0.74.1',
    fecha: '2026-09-14',
    cambios: [
      'Cada curso ahora tiene un color propio y distinto (antes algunos compartian color), manteniendose igual en todas las pantallas.'
    ]
  },
  {
    version: '0.74.0',
    fecha: '2026-09-14',
    cambios: [
      'Colores de curso unificados: cada curso tiene un unico color que se repite igual en todas las pantallas (Fichas completadas, Actividades, etc.). Antes solo Actividades los tenia.'
    ]
  },
  {
    version: '0.73.0',
    fecha: '2026-09-14',
    cambios: [
      'Barra de navegacion superior rediseñada al estilo de la app de seguimiento: logo y controles arriba, y las pestanas en su propia fila debajo (sin desbordarse), con la pestana activa marcada de forma mas sutil.'
    ]
  },
  {
    version: '0.72.2',
    fecha: '2026-09-14',
    cambios: [
      'El contenido usa un ancho mayor (1440px) para que las tablas entren mejor y no se corte texto como la URL de inscripcion.'
    ]
  },
  {
    version: '0.72.1',
    fecha: '2026-09-14',
    cambios: [
      'Accesos: el texto de los permisos por rol ahora entra bien (se quito un limite de ancho que lo apretaba).'
    ]
  },
  {
    version: '0.72.0',
    fecha: '2026-09-14',
    cambios: [
      'Tarjetas de Fichas: la metrica de ediciones ahora se llama "Proximas ediciones"; muestra "Aun no hay nada cargado" cuando no hay ediciones, y "On demand" para los cursos de modalidad on demand.'
    ]
  },
  {
    version: '0.71.0',
    fecha: '2026-09-14',
    cambios: [
      'Actividades ahora comparte el mismo sistema visual que Fichas completadas: filtros con buscador iguales, Edicion como chip, columna Acciones, y cada curso con su propio color de pill para distinguirlos de un vistazo.'
    ]
  },
  {
    version: '0.70.0',
    fecha: '2026-09-14',
    cambios: [
      'Toda la app usa ahora la tipografia de marca (Dosis) tambien en los titulos, no solo en el texto. Los colores ya eran los de la identidad ILCE.'
    ]
  },
  {
    version: '0.69.2',
    fecha: '2026-09-14',
    cambios: [
      'Reportes: ya no aparece "Invalid Date" en la evolucion mensual cuando alguna ficha tiene la fecha vacia o mal cargada.'
    ]
  },
  {
    version: '0.69.1',
    fecha: '2026-09-14',
    cambios: [
      'Barra de navegacion superior mas prolija: una sola fila pareja de pestanas, sin los titulos Gestion/Configuracion que la descolgaban.'
    ]
  },
  {
    version: '0.69.0',
    fecha: '2026-09-14',
    cambios: [
      'Refinamiento visual (1/varios): todo el contenido vive ahora en una grilla unica de ancho comodo y centrada, y la barra superior quedo alineada con el contenido de abajo. Primer paso para que toda la app se vea como un solo producto.'
    ]
  },
  {
    version: '0.68.1',
    fecha: '2026-09-14',
    cambios: [
      'La edicion de las inscripciones ahora toma solo el numero, aunque en la planilla este escrita como "3° edicion" o "Edicion n° 3". Asi el filtro de Edicion deja de mostrar duplicados de la misma edicion.'
    ]
  },
  {
    version: '0.68.0',
    fecha: '2026-09-14',
    cambios: [
      'Los formularios publicos pueden tener un texto introductorio (instrucciones, aclaraciones) que se muestra en un recuadro arriba de las preguntas.'
    ]
  },
  {
    version: '0.67.1',
    fecha: '2026-09-14',
    cambios: [
      'Arreglado el contador de respuestas de la lista de Formularios: mostraba 0 en algunos formularios (como "¿Como venis hasta aca?") aunque tuvieran respuestas, por diferencias de signos o acentos en el nombre. Ahora cuenta bien.'
    ]
  },
  {
    version: '0.67.0',
    fecha: '2026-09-14',
    cambios: [
      'Las actividades pueden tener un texto introductorio propio (consignas, si es opcional, etc.) que se muestra al estudiante antes de empezar.'
    ]
  },
  {
    version: '0.66.0',
    fecha: '2026-09-14',
    cambios: [
      'Los formularios publicos se ven mucho mejor: mas anchos y aprovechando el espacio, con la cabecera y el curso destacados, las preguntas mejor separadas, las valoraciones agrupadas en una seccion con la consigna arriba, escalas 1-5 mas grandes y faciles de tocar, y el boton de enviar mas visible. No cambiaron las preguntas ni como se envia.'
    ]
  },
  {
    version: '0.65.0',
    fecha: '2026-09-14',
    cambios: [
      'El grafico de Evolucion de inscripciones ahora usa un motor de graficos profesional (mismo look que los reportes de la app de seguimiento): ejes limpios, tooltip al pasar el mouse, y lineas mas prolijas. Junto con los KPIs de arriba, se lee mucho mejor.'
    ]
  },
  {
    version: '0.64.0',
    fecha: '2026-09-14',
    cambios: [
      'Grafico \"Evolucion de inscripciones\" renovado: ahora arriba muestra los numeros clave (Nuevas, Completadas, Pendientes y Tasa de completitud), y cuando Pendientes es 0 en el periodo ya no dibuja la linea pegada abajo. Se lee mucho mas rapido.'
    ]
  },
  {
    version: '0.63.1',
    fecha: '2026-09-14',
    cambios: [
      'Arreglado: los formularios con curso fijado (por ejemplo la Encuesta de sesiones de Coaching Ontologico) aparecian como \"No disponible\" en su enlace publico y con 0 campos en la lista. Ahora se leen bien.'
    ]
  },
  {
    version: '0.63.0',
    fecha: '2026-09-14',
    cambios: [
      'La lista de Formularios ahora muestra cuantas respuestas tiene cada formulario, tanto en la vista tabla (nueva columna Respuestas) como en las tarjetas.'
    ]
  },
  {
    version: '0.62.0',
    fecha: '2026-09-14',
    cambios: [
      'Formularios > Respuestas: se puede ordenar la tabla haciendo clic en cualquier encabezado (Fecha, Nombre, Email, Curso, Edicion, Formulario); un segundo clic invierte el orden.'
    ]
  },
  {
    version: '0.61.0',
    fecha: '2026-09-14',
    cambios: [
      'Fichas completadas: los filtros de Curso, Edicion y Pais dejaron de ser una pared de botones — ahora son selectores con buscador (elegis y buscas), mucho mas compactos. Estado y filtros rapidos siguen como chips, y los filtros activos se muestran con su chip y Limpiar.'
    ]
  },
  {
    version: '0.60.0',
    fecha: '2026-09-21',
    cambios: [
      'Reportes: segundo rediseño ("centro de análisis" v2), sobre la misma base de datos y fórmulas de siempre — no cambió ningún cálculo ni endpoint, solo cómo se ve y se navega. Header propio separado de los filtros; la navegación Resumen/Inscripciones/Actividades/Formularios pasa a ser un control segmentado. Los filtros de fecha ahora son presets de un clic (Hoy, 7 días, 30 días, Este mes, Trimestre, Personalizado) y Curso/Edición/Estado se agrupan en un panel "Más filtros" para no saturar la barra. Los indicadores arriba de cada pestaña bajan a un máximo de 4 por vista, sin emojis, con un dato de contexto real debajo (por ejemplo "12% vs. 30 días previos" en vez de solo un número suelto). Se eliminaron las listas de barras que repetían la misma información que la tabla de al lado (Por curso, Resultados por actividad, Por formulario): ahora la barra vive dentro de la fila de la tabla. El embudo de Inscripciones se separó en "Proceso de inscripción" y "Salidas del proceso", con una tasa de finalización general destacada arriba. Se sumó "Resumen del período": frases con los datos reales del momento (curso con más fichas, tasa de finalización, variación vs. el período anterior) — nunca texto inventado. "Análisis de preguntas" en Actividades queda colapsado por defecto (era la sección más densa y menos usada); "Resultados por actividad" suma una vista de Tarjetas además de la de Tabla. Los colores de estado (verde/ámbar/rojo) ahora salen de tres variables de tema (--good/--warn/--bad) en vez de estar sueltos por el código, y todos los emoji se reemplazaron por íconos lineales dibujados a mano (sin librerías nuevas).'
    ]
  },
  {
    version: '0.59.0',
    fecha: '2026-09-21',
    cambios: [
      'Constructor de fichas de inscripción: ahora el rol Coordinador también puede guardar cambios (antes solo Admin, y daba "Sin permiso"). Este ajuste se había subido directo a GitHub desde otro chat mientras se trabajaba acá en Actividades; se incorpora en esta versión para que no se pierda con la próxima entrega.'
    ]
  },
  {
    version: '0.58.0',
    fecha: '2026-09-21',
    cambios: [
      'Actividades: rediseño completo de la gestión (primera etapa; Formularios llega en la próxima). Crear/editar una actividad ahora es un asistente de 4 pasos (Información, Preguntas, Configuración, Revisar) con vista previa real antes de publicar. En Preguntas: se puede elegir el tipo (Opción múltiple o Verdadero/Falso), reordenar arrastrando o con ↑/↓, y duplicar una pregunta. Nuevo botón "Duplicar" para copiar una actividad entera (ideal para pasar de una clase a la siguiente). El listado ahora se puede filtrar por Curso, Edición y Estado, agrupar por curso y edición, y cada actividad tiene su propia ficha de detalle (con configuración y preguntas de solo lectura) además del editor. Se sumaron tres campos nuevos por actividad: Edición (si se completa, el estudiante ya no la tiene que tipear al responder — se corrige lo mismo del lado del servidor), Fecha de disponibilidad (la actividad figura como "Programada" hasta ese día y no se puede responder antes) y Mostrar/ocultar el puntaje al estudiante al terminar (igual se corrige y se guarda todo, solo cambia qué ve en pantalla). Nuevo estado "Archivada": queda oculta del listado por default (con un botón para volver a mostrarla) pero no se borra nada. Todos los datos nuevos viven en la misma celda que ya se usaba para las preguntas — no hace falta tocar la Google Sheet a mano ni se corre riesgo de desalinear columnas. Límite de intentos y tiempo límite por actividad quedan para la próxima etapa.'
    ]
  },
  {
    version: '0.57.0',
    fecha: '2026-09-21',
    cambios: [
      'Validación de datos en todos los formularios públicos: los campos de Nombre/Apellido ya no aceptan números, y los de Número de edición y WhatsApp ya no aceptan letras (se filtra mientras se escribe, y se vuelve a chequear del lado del servidor antes de guardar). Se corrigió en la ficha de inscripción de cada curso, en la actividad (postwork) y en los Formularios armados con el Constructor — por ejemplo, el de "Sumate al equipo ILCE" ya no dejaba pasar cosas como un nombre "646" o un WhatsApp "fassaffs".'
    ]
  },
  {
    version: '0.56.0',
    fecha: '2026-09-21',
    cambios: [
      'Reportes: rediseño completo como centro de análisis. Nueva estructura en 4 pestañas (Resumen, Inscripciones, Actividades, Formularios) con una barra de filtros global (Curso, Edición, Estado, Fecha), botón único de Actualizar y Exportar (Excel/CSV, respeta los filtros activos). Los números, cursos y estados importantes ahora son clickeables y llevan directo a Fichas completadas con ese filtro aplicado. Se agregaron gráficos de evolución (línea/área, sin librerías nuevas), la tabla "Cursos + Actividades" se integró dentro de Actividades como "Participación por curso" (ya no es una pestaña aparte), y se sumó una columna de Tiempo promedio por actividad (el dato ya se calculaba pero no se mostraba en ningún lado). No se tocó ninguna fórmula existente ni los permisos por rol — todo lo que ya funcionaba (embudo, por curso, por mes, análisis de preguntas) sigue funcionando, solo con mejor navegación y presentación.'
    ]
  },
  {
    version: '0.55.0',
    fecha: '2026-09-21',
    cambios: [
      'Fichas de inscripción: rediseño completo de la vista Tarjetas. Cada tarjeta ahora muestra solo lo esencial (estado, título, inscriptos, ediciones, próxima edición y URL) con más jerarquía y menos cajas dentro de cajas; el número de inscriptos y de ediciones son clickeables y llevan directo al listado o al editor. El grid ya no tiene scroll horizontal (4 columnas en pantallas grandes, bajando a 1 en celular). No se tocó ninguna función existente (editar, publicar, copiar URL, vista previa, permisos, filtros u orden): todo sigue funcionando igual, solo cambió cómo se ve.'
    ]
  },
  {
    version: '0.54.0',
    fecha: '2026-09-21',
    cambios: [
      'Formularios: la lista ahora tiene las mismas dos vistas que Actividades (tarjetas ▦ / lista ☰), con el mismo botón para cambiar entre una y otra. Antes solo se podía ver como tarjetas en una fila con scroll horizontal.'
    ]
  },
  {
    version: '0.53.2',
    fecha: '2026-09-21',
    cambios: [
      'Constructor de fichas: "Guardar" podía fallar con un aviso genérico ("No pudimos guardar los cambios") que no decía por qué. Igual que en Reportes y Formularios, un error transitorio al leer/escribir la planilla rompía el guardado a mitad de camino sin dar el motivo real. Ahora el aviso incluye el error puntual, para poder distinguir una falla pasajera de una que se repite siempre.'
    ]
  },
  {
    version: '0.53.1',
    fecha: '2026-09-19',
    cambios: [
      'Corregido: Reportes → Actividades volvió a romperse ("e.preguntas.map is not a function") si alguna actividad tenía en la Sheet una celda "Preguntas JSON" que no era una lista válida. Ahora esa actividad se trata como si no tuviera preguntas cargadas, en vez de romper todo el reporte.',
      'Formularios y Formularios → Respuestas: antes, si fallaba la lectura de la Sheet por cualquier motivo (demora, cuota de Google, etc.), la pantalla mostraba "No hay formularios cargados / Pegá las definiciones..." como si la pestaña estuviera vacía — aunque tuviera filas cargadas. Ahora se ve el error real, para poder distinguir "está vacío" de "algo falló al leer".'
    ]
  },
  {
    version: '0.53.0',
    fecha: '2026-09-19',
    cambios: [
      'Reportes → Actividades: nueva pestaña "Cursos + Actividades" que cruza los inscriptos de cada curso (Fichas) contra quiénes participaron en sus actividades — inscriptos, realizaron actividades, % de participación y promedio, con detalle al hacer clic en un curso. Usa únicamente datos reales: cuando falta información para calcular un valor, se muestra "—" en vez de inventar un número.',
      'Reportes → Actividades: nuevo panel "Preguntas con menor % de aciertos", con todas las preguntas de todas las actividades ordenables por menor/mayor % de aciertos o por actividad, y detalle expandible por pregunta. Solo se calcula el % cuando hay al menos 3 respuestas para esa pregunta.',
      'Reportes: revisión de responsive para notebooks y tablets — las tablas anchas ahora scrollean horizontalmente en vez de aplastar columnas, los KPIs se acomodan mejor en pantallas chicas y el selector de orden ocupa todo el ancho en celulares.',
      'Corregido: Reportes → Actividades a veces mostraba "No se pudo cargar / Unexpected end of JSON input" y quedaba roto. La causa era que un error transitorio al leer la planilla (timeout, demora de Google) rompía el cálculo del reporte a mitad de camino y el navegador recibía una respuesta vacía. Ahora, si algo falla, se ve un mensaje de error real en vez de romperse.'
    ]
  },
  {
    version: '0.52.1',
    fecha: '2026-09-19',
    cambios: [
      'Fichas de inscripción: el botón "Crear nueva ficha de inscripción" estaba pegado al margen derecho, lejos de las sub-pestañas (Fichas de inscripción / Fichas completadas). Ahora queda junto a ellas, las tres opciones agrupadas.',
      'La pestaña "Equipo" pasa a llamarse "Equipo Docente".'
    ]
  },
  {
    version: '0.52.0',
    fecha: '2026-09-19',
    cambios: [
      'Actividades (Postwork): si se completa una actividad con el mail de prueba diegolernerdl@gmail.com, ya no se guarda la respuesta ni se dispara ningún correo (ni al estudiante ni a los docentes) — la pantalla igual muestra el puntaje, para poder probar el flujo completo en producción sin ensuciar los datos reales.',
      'Emails: la vista previa (pestaña Comunicaciones) ahora cubre los 6 tipos de correo que manda el sistema, no solo 2 — se sumaron Credenciales de acceso, Resultado de actividad, Aviso al docente y Resumen de los viernes.',
      'Emails: en el registro de envíos, un correo que falló ahora tiene botón "Ver detalle" (el error puntual) y, salvo el de credenciales, "↻ Reintentar" — reenvía el correo reconstruyéndolo desde los datos que quedaron guardados, sin tocar el registro original.',
      'Emails: se completaron los datos que faltaban en el correo de confirmación (fecha) y en el aviso al equipo (origen), y el resumen de los viernes ahora también guarda el mail del estudiante en cada fila.'
    ]
  },
  {
    version: '0.51.1',
    fecha: '2026-09-19',
    cambios: [
      'Rol Académico: ahora también puede crear/gestionar Actividades (Postwork) y Formularios (antes solo los veía). Ya tenía acceso a Dashboard y Reportes — se actualizó la descripción del rol en Accesos para que quede clara.'
    ]
  },
  {
    version: '0.51.0',
    fecha: '2026-09-19',
    cambios: [
      'Fichas de inscripción: el acceso al Constructor ahora es un botón "Crear nueva ficha de inscripción" al lado de las sub-pestañas (Fichas de inscripción / Fichas completadas), en vez de estar adentro del encabezado. Se sacó también el cartel "Cargá ediciones" con el botón "Cargar edición" que quedaba duplicado con esto.',
      'Dashboard: los números de "Por estado", "Por curso", "Por edición" y "Por país" ahora se pueden apretar — cada barra/chip lleva directo a Fichas completadas filtrado por ese valor puntual, para ver de qué fichas se trata (el bloque "Sin datos" de País no es clickeable porque agrupa varios valores sucios distintos, no uno solo).',
      'Reportes → Inscripciones: nueva tabla "Mes a mes, por curso" — la misma ventana de los últimos 6 meses, cruzada por curso.'
    ]
  },
  {
    version: '0.50.0',
    fecha: '2026-09-19',
    cambios: [
      'Nueva pestaña "Equipo" (en Gestión): lista de solo lectura de quién figura como docente/staff, en qué curso y edición. Aclara arriba que el alta/baja de accesos se gestiona en Presentismo ILCE, no acá — esta pantalla solo muestra lo que ya está asignado desde el Constructor de fichas.',
      '"Ver como…" (arriba a la derecha): antes era un menú nativo del navegador de 180px de ancho, y con nombres y roles largos (por ejemplo "Coordinación académica") la lista aparecía recortada en varios navegadores. Ahora es un menú propio, con buscador, que no tiene ese límite.'
    ]
  },
  {
    version: '0.49.0',
    fecha: '2026-09-19',
    cambios: [
      'Fichas de inscripción: la tabla ahora es más ancha y suma las columnas "Próxima edición" y "Actualizado"; se sacó la fila de tarjetas (Fichas / Con ediciones / Requieren atención) del encabezado; se agregó un botón "🎨 Constructor" directo en el encabezado para no tener que entrar a una ficha primero.',
      'Reportes: ahora tiene sub-pestañas (Inscripciones / Actividades / Formularios). Inscripciones suma un resumen ejecutivo con la variación real de altas de los últimos 30 días contra los 30 anteriores, un embudo por estado y una tabla por curso con % completado. Actividades y Formularios muestran participación, promedios y las actividades con menor puntaje para revisar primero.',
      'Dashboard: rediseño completo a partir de una devolución muy detallada. Los filtros (Período, Edición, Curso, Estado, País) pasaron de filas enteras de botones a una sola barra compacta de menús desplegables, varios con buscador — antes, solo la lista de ediciones ya ocupaba media pantalla.',
      'Dashboard: se corrigió una inconsistencia real en los números — el % que decía "Completadas" en realidad sumaba Completada + En revisión + Inscrito, por eso podía marcar casi 100% aunque "Completadas" (75 fichas) fuera un 6%. Ahora "Completadas" es el conteo real de ese estado, y el % se llama "Avance" y mide cuántas fichas llegaron a Inscripto.',
      'Dashboard: los campos País y Origen a veces traían valores que no correspondían (por ejemplo "SI", "True", o el nombre de un estado como "Inscrito"). Ya no aparecen como si fueran un país o un canal real: en los gráficos y en el filtro de País se agrupan aparte ("Sin datos" / "Sin informar"). La fila de cada ficha sigue mostrando el valor tal cual está en la planilla, para poder ubicarla y corregirla ahí.',
      'Dashboard: nuevo panel "⚠ Atención" debajo de los números, con lo que conviene mirar primero — fichas en revisión, cursos con menor avance, y cuántas fichas tienen País/Origen sin un dato válido. Solo aparece si hay algo que atender.',
      'Dashboard: se reordenó todo — ahora los números importantes aparecen primero, después Atención, y los módulos de abajo (Evolución, Por estado, Por curso, Por edición, Origen, Por país) son menos pero más grandes y fáciles de leer. Se sacó el cartel que mandaba a "Reportes" a buscar los totales: cada pantalla ahora se entiende sola.',
      'El mensaje institucional del día ("Un momento para vos…") ahora ocupa una sola línea angosta en vez de un cartel de dos renglones.'
    ]
  },
  {
    version: '0.48.1',
    fecha: '2026-09-19',
    cambios: [
      'Ajuste de pulido en el recorrido guiado ("❓ Necesito ayuda"): el cartel de cada paso ya no se pasaba del ancho de la pantalla en celulares angostos.'
    ]
  },
  {
    version: '0.48.0',
    fecha: '2026-09-19',
    cambios: [
      'Formularios → Respuestas: nuevo botón "📥 Importar respuestas históricas". Subís el .csv o .xlsx tal cual lo exportás de Google Forms (Respuestas → ⋮ → Descargar respuestas) y se carga directo — el archivo se lee en el navegador, no hay que pegar los datos ni transcribirlos a mano, así no hay riesgo de cargar mal el nombre, el email o una respuesta de un estudiante real.',
      'La importación evita duplicados si subís el mismo archivo dos veces, y avisa si alguna fila no tenía email y quedó afuera. Queda registrada en el Historial de acciones.',
      'No hace falta que el formulario ya exista en la app: se puede elegir uno de la lista o escribir el nombre de una encuesta vieja (por ejemplo, una de años anteriores) directamente al importar.'
    ]
  },
  {
    version: '0.47.0',
    fecha: '2026-09-19',
    cambios: [
      'Constructor de fichas → Ediciones: nuevo cálculo automático de la fecha de fin, a partir de la fecha de inicio, la cantidad de clases y la frecuencia (semanal/quincenal) de esa edición. Se ve tanto en el editor como en el título de la edición cerrada.',
      'Dashboard y Reportes: agregado un cartel corto en cada uno para que se entienda la diferencia — Dashboard es para explorar filtrando en el momento, Reportes tiene los totales generales y la evolución mes a mes.'
    ]
  },
  {
    version: '0.46.0',
    fecha: '2026-09-19',
    cambios: [
      'Filtros de "Fichas completadas" y del Dashboard: unificados en un solo criterio visual. Antes se mezclaban chips (Estado, Edición) con menús desplegables (Curso, País) — ahora todo es chips, salvo el rango de fechas.',
      'Nuevo botón "❓ Necesito ayuda" (abajo a la derecha): un recorrido guiado por las secciones del panel, o tareas puntuales ("quiero cargar la edición de una ficha", "quiero ver quién completó una ficha", etc.), que se adapta a lo que tu rol puede ver.'
    ]
  },
  {
    version: '0.45.0',
    fecha: '2026-09-19',
    cambios: [
      'Nueva pestaña "Reportes": ahí viven ahora los números que antes estaban sueltos en "Fichas completadas" (Total, últimos 7 días, pendientes, en revisión, % completadas), más el desglose por curso, por estado y por mes.',
      'Nuevo Buscador (ícono 🔎 de arriba): busca por nombre, email, título o edición entre fichas, inscripciones, actividades y formularios a la vez, con búsquedas recientes y últimos vistos.',
      '"Fichas completadas": la tabla de resultados ahora es más alta, para ver más filas sin scrollear tanto.',
      'Corregido: la pestaña activa del menú de arriba, en modo oscuro, casi no se distinguía del resto ("no se ve") — quedaba pisada por un estilo viejo. Ahora siempre se ve con el mismo contraste (texto blanco sobre degradé).',
      'Corregido: al hacer clic en "Cargar edición" en una ficha, la app a veces mostraba la pantalla de error. Se blindó la carga de fichas guardadas y ahora, si algo falla, se ve un aviso claro con botón de reintentar en vez de romperse.',
      'Historial de acciones: cuando un estudiante completa una ficha de inscripción, ahora aparece con su propio ícono y chip de filtro ("📋 Ficha completada") en vez de perderse como un punto genérico.'
    ]
  },
  {
    version: '0.44.0',
    fecha: '2026-09-19',
    cambios: [
      'Constructor de fichas: rediseñado en 3 columnas (lista de fichas | edición | vista previa en vivo), reemplazando la guía paso a paso. Información y Ediciones quedan siempre visibles; Campos y Configuración se pliegan abajo. Se abre desde "Fichas de inscripción".',
      '"Fichas de inscripción" y "Fichas completadas" se unificaron en una sola pestaña ("Fichas"), con sub-pestañas adentro en vez de competir como dos pestañas al mismo nivel.',
      'Actividades: nuevo selector de orden (por curso y clase, por nombre, por curso, por estado o por cantidad de preguntas). Por defecto ordena por curso y luego por clase.',
      'Actividades y Formularios: la tarjeta que ve el estudiante ahora muestra el logo de ILCE, y al terminar una actividad aparece un pie con "Volver al campus", una invitación a leer una nota del blog, y los accesos a Instagram, WhatsApp y YouTube.'
    ]
  },
  {
    version: '0.43.0',
    fecha: '2026-09-19',
    cambios: [
      'Constructor de fichas: nueva guía paso a paso (Información → Ediciones → Campos → Orden → Configuración → Vista previa), con guardado automático, indicador de progreso y "continuar donde dejaste". Se abre desde "Fichas de inscripción" (ya no es una pestaña aparte).',
      'Campos de la ficha: ahora se pueden activar/desactivar, reordenar (arrastrando) y agregar campos personalizados. Se guarda en la ficha; conectarlo para que la ficha pública use ese orden es el próximo paso.',
      'Pestañas de arriba: las que tu rol no puede abrir ahora se ven atenuadas.',
      '"Fichas de inscripción" en vista Lista: tabla más ancha y alta, encabezado fijo al scrollear, y nueva columna con la URL de inscripción (truncada, con botón de copiar).',
      'Actividades: la vista por defecto ahora es Lista (antes Tarjetas), igual que Fichas de inscripción.'
    ]
  },
  {
    version: '0.42.1',
    fecha: '2026-09-14',
    cambios: [
      'Se quito "Herramientas" del panel (del menu y del boton rapido de arriba).'
    ]
  },
  {
    version: '0.42.0',
    fecha: '2026-09-14',
    cambios: [
      'Historial de acciones con color: cada accion se muestra con un color e icono segun lo que se hizo (crear en verde, editar en amarillo, eliminar en rojo, login en azul, etc.), y se puede filtrar por tipo de accion.'
    ]
  },
  {
    version: '0.41.0',
    fecha: '2026-09-14',
    cambios: [
      'Fichas y Actividades ahora se pueden ver en Tarjetas o en Lista, con un boton para cambiar arriba a la derecha. La app recuerda tu preferencia.'
    ]
  },
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
