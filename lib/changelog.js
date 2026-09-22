// Novedades de la app (se muestran en el botón "Novedades"). Más reciente arriba.
export const CHANGELOG = [
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
