// Tareas y pantallas de Fichas para el buscador fijo y las tarjetas "¿Qué necesitás hacer?". Cada una respeta el MISMO permiso que su solapa.
// destino: { tab } abre esa solapa del panel; { accion: 'crear' } abre "+ Crear"; { accion: 'password' | 'ayuda' | 'novedades' } dispara lo que ya existe.
import {
  tienePermisoInscripciones, tienePermisoCambiarEstado, tienePermisoExportar, tienePermisoDashboard, tienePermisoConstructor, tienePermisoAccesos, tienePermisoActividades,
  tienePermisoGestionActividades, tienePermisoAsignarDocentes, tienePermisoEmails, tienePermisoAuditoria, tienePermisoFormularios, tienePermisoVerRespuestasActividades,
  tienePermisoVerRespuestasFormularios, tienePermisoEvaluaciones
} from './permisos';
import { buscarEnGuia, tareasPermitidas as permitidas } from './guiaComun';

const puedeCrear = (u) => tienePermisoConstructor(u) || tienePermisoGestionActividades(u) || tienePermisoFormularios(u) || tienePermisoEvaluaciones(u);
const puedeVerRespuestas = (u) => tienePermisoVerRespuestasActividades(u) || tienePermisoVerRespuestasFormularios(u) || tienePermisoInscripciones(u);

export const TAREAS = [
  { id: 'fichas', icono: 'lista', titulo: 'Ver las fichas de inscripción', sub: 'Las fichas de cada formación', palabras: 'fichas inscripcion formularios cursos ediciones', destino: { tab: 'fichas' } },
  { id: 'crear', icono: 'mas', titulo: 'Crear una ficha, actividad o formulario', sub: 'Con el botón “+ Crear”', palabras: 'crear nueva ficha actividad formulario evaluacion armar constructor', ok: puedeCrear, destino: { accion: 'crear' } },
  { id: 'respuestas', icono: 'usuarios', titulo: 'Ver las respuestas recibidas', sub: 'Inscripciones, actividades y formularios', palabras: 'respuestas inscripciones recibidas inscriptos personas datos', ok: puedeVerRespuestas, destino: { tab: 'respuestas' } },
  { id: 'estado', icono: 'lapiz', titulo: 'Cambiar el estado de una inscripción', sub: 'Pendiente, pagada, anulada…', palabras: 'cambiar estado inscripcion pagada pendiente anulada', ok: tienePermisoCambiarEstado, destino: { tab: 'inscripciones' } },
  { id: 'exportar', icono: 'documento', titulo: 'Descargar las inscripciones', sub: 'Archivo para Excel', palabras: 'descargar exportar excel csv bajar archivo inscripciones', ok: tienePermisoExportar, destino: { tab: 'inscripciones' } },
  { id: 'actividades', icono: 'novedades', titulo: 'Ver actividades y formularios', sub: 'Los que ya están armados', palabras: 'actividades formularios postwork evaluaciones', ok: (u) => tienePermisoActividades(u) || tienePermisoFormularios(u), destino: { tab: 'actividadesyformularios' } },
  { id: 'buscar', icono: 'buscar', titulo: 'Buscar una ficha o inscripción', sub: 'Por nombre, mail o curso', palabras: 'buscar encontrar persona ficha inscripcion mail whatsapp', destino: { tab: 'buscador' } },
  { id: 'reportes', icono: 'grafico', titulo: 'Ver los reportes', sub: 'Números por curso, estado y país', palabras: 'reportes resumen dashboard metricas inscripciones curso pais origen', ok: tienePermisoDashboard, destino: { tab: 'reportes' } },
  { id: 'emails', icono: 'mail', titulo: 'Ver si salieron los mails', sub: 'Avisos y errores de envío', palabras: 'emails mails correos enviados fallaron avisos', ok: tienePermisoEmails, destino: { tab: 'emails' } },
  { id: 'equipo', icono: 'birrete', titulo: 'Asignar docentes a una edición', sub: 'Equipo docente', palabras: 'equipo docentes asignar edicion staff profesores', ok: tienePermisoAsignarDocentes, destino: { tab: 'equipo' } },
  { id: 'accesos', icono: 'llave', titulo: 'Dar acceso a una persona', sub: 'Roles y contraseña temporal', palabras: 'acceso usuario persona agregar nueva invitar rol contraseña', ok: tienePermisoAccesos, destino: { tab: 'accesos' } },
  { id: 'auditoria', icono: 'ojo', titulo: 'Ver quién hizo qué', sub: 'Historial de acciones', palabras: 'historial quien hizo acciones auditoria registro', ok: tienePermisoAuditoria, destino: { tab: 'auditoria' } },
  { id: 'password', icono: 'candado', titulo: 'Cambiar mi contraseña', sub: 'Elegir una nueva', palabras: 'cambiar contrasena clave password', destino: { accion: 'password' } },
  { id: 'ayuda', icono: 'ayuda', titulo: 'Necesito ayuda', sub: 'Recorrido paso a paso', palabras: 'ayuda recorrido tutorial guia como funciona', destino: { accion: 'ayuda' } },
  { id: 'novedades', icono: 'novedades', titulo: 'Ver las novedades', sub: 'Qué cambió en la app', palabras: 'novedades cambios version nuevo', destino: { accion: 'novedades' } },
  { id: 'herramientas', icono: 'herramienta', titulo: 'Abrir Herramientas', sub: 'Accesos a las demás apps', palabras: 'herramientas apps accesos enlaces', destino: { tab: 'herramientas' } }
];
export const PANTALLAS = [
  { ruta: 'fichas', label: 'Fichas', palabras: 'fichas inscripcion' }, { ruta: 'actividadesyformularios', label: 'Actividades y formularios', palabras: 'actividades formularios', ok: (u) => tienePermisoActividades(u) || tienePermisoFormularios(u) },
  { ruta: 'respuestas', label: 'Respuestas', palabras: 'respuestas inscripciones', ok: puedeVerRespuestas }, { ruta: 'reportes', label: 'Reportes', palabras: 'reportes resumen', ok: tienePermisoDashboard },
  { ruta: 'emails', label: 'Emails', palabras: 'emails correos', ok: tienePermisoEmails }, { ruta: 'equipo', label: 'Equipo docente', palabras: 'equipo docentes', ok: tienePermisoAsignarDocentes },
  { ruta: 'accesos', label: 'Accesos', palabras: 'accesos usuarios roles', ok: tienePermisoAccesos }, { ruta: 'auditoria', label: 'Historial de acciones', palabras: 'historial auditoria', ok: tienePermisoAuditoria },
  { ruta: 'buscador', label: 'Buscador', palabras: 'buscador buscar' }, { ruta: 'herramientas', label: 'Herramientas', palabras: 'herramientas apps' }
].map((p) => ({ ...p, destinoTab: p.ruta }));
export const tareasDe = (usuario) => permitidas(TAREAS, usuario);
// En esta app las pantallas son solapas: el destino es { tab } en vez de una ruta.
export const buscarGuia = (consulta, usuario) => buscarEnGuia(consulta, TAREAS, PANTALLAS, usuario).map((r) => (r.grupo === 'Pantalla' ? { ...r, destino: { tab: r.destino.ruta } } : r));
