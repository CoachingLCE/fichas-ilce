// Permisos puros (reciben { roles: [...] }). Sin dependencias de servidor, para usar
// tanto en componentes cliente como en API routes. Roles combinables (estilo LEAD).

function tiene(usuario, lista) {
  return !!usuario && (usuario.roles || []).some((r) => lista.includes(r));
}

export function tienePermisoInscripciones(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'Inscripciones', 'Estudiantes', 'CoordinadorEstudiantes', 'Academico']);
}
export function tienePermisoCambiarEstado(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'Inscripciones']);
}
export function tienePermisoExportar(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador']);
}
export function tienePermisoDashboard(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'Academico']);
}
export function tienePermisoConstructor(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador']);
}
export function tienePermisoAccesos(usuario) {
  return tiene(usuario, ['Admin']);
}

// ---- Actividades (Postwork) / área académica ----
export function tienePermisoActividades(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'CoordinadorEstudiantes', 'Academico', 'Docente', 'Estudiantes']);
}
export function tienePermisoGestionActividades(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'CoordinadorEstudiantes', 'Academico']);
}
// ---- Evaluaciones finales (v1.75.0) ----
// Crear/editar evaluaciones: el mismo equipo que gestiona actividades. Habilitar un intento extra a un estudiante: coordinación (es una decisión con costo, se cobra aparte).
export function tienePermisoEvaluaciones(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'CoordinadorEstudiantes', 'Academico']);
}
export function tienePermisoHabilitarIntentos(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'CoordinadorEstudiantes']);
}
export function tienePermisoAsignarDocentes(usuario) {
  return tiene(usuario, ['Admin', 'CoordinadorEstudiantes']);
}
// Ve TODAS las respuestas (sin filtro por docente). Pedido de Diego ("quiero que todos puedan
// ver las respuestas"): ya no se filtra por rol ni por curso/edición asignado — cualquier
// usuario autenticado ve todas las respuestas. Antes quedaba filtrado en
// /api/actividades/respuestas (ver "Mostrando solo tus cursos/ediciones asignados." en
// Actividades.jsx, ese aviso ya no debería aparecerle a nadie).
export function tienePermisoVerTodasRespuestas(usuario) {
  return !!usuario;
}

// Ver la pantalla de Respuestas (de actividades / de formularios). Pedido de Diego ("quiero que
// todos puedan ver las respuestas"): a diferencia de tienePermisoActividades/
// tienePermisoFormularios (que siguen gobernando quién puede GESTIONAR — crear/editar
// actividades y formularios), ver lo ya respondido no depende del rol.
export function tienePermisoVerRespuestasActividades(usuario) {
  return !!usuario;
}
export function tienePermisoVerRespuestasFormularios(usuario) {
  return !!usuario;
}

// Ver la pantalla de Emails (automatizaciones + registro).
export function tienePermisoEmails(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'CoordinadorEstudiantes']);
}

// Historial de acciones (auditoría completa): solo Admin.
export function tienePermisoAuditoria(usuario) {
  return tiene(usuario, ['Admin']);
}

// Formularios (intro / feedback / staff): ver respuestas y gestionar.
export function tienePermisoFormularios(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'CoordinadorEstudiantes', 'Academico']);
}

// Masterclass: la ven todos los del equipo; gestión y respuestas para coordinación/admin.
export function tienePermisoMasterclass(usuario) { return !!usuario && (usuario.roles || []).length > 0; }
export function tienePermisoGestionMasterclass(usuario) {
  return tiene(usuario, ['Admin', 'Coordinador', 'CoordinadorEstudiantes']);
}

// "Ver como": previsualizar la app como otra persona (solo Admin).
export function puedeVerComoOtro(usuario) {
  return tiene(usuario, ['Admin']);
}

// Pedido de Diego ("Super Admin puede eliminar rtas"): borrar una respuesta de actividad ya
// enviada. En este sistema el rol tope es 'Admin' (no existe un rol "Super Admin" aparte), así
// que es a ese rol al que se refiere — acción sensible, se restringe más que
// tienePermisoGestionActividades (que sí puede Coordinador/CoordinadorEstudiantes/Academico).
export function tienePermisoEliminarRespuestas(usuario) {
  return tiene(usuario, ['Admin']);
}

// Eliminar una ficha completa (una inscripción) del listado: acción irreversible. Pedido de Diego (15/10/2026): "Diegolernerd tiene que tener un botón para eliminar fichas".
// Se restringe a SU usuario (cuenta que empieza con "diegolernerd", ej. diegolernerdl@gmail.com) y además con rol Admin: no a cualquier Admin. Para sumar a otra persona, agregar su
// email acá (la comprobación se repite en el servidor: /api/inscripciones, DELETE).
export const EMAILS_ELIMINAR_FICHAS = [];
export function tienePermisoEliminarFichas(usuario) {
  if (!tiene(usuario, ['Admin'])) return false;
  const email = String(usuario.email || '').trim().toLowerCase();
  return /^diegolernerd/.test(email) || EMAILS_ELIMINAR_FICHAS.includes(email);
}
