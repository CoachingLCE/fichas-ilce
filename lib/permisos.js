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
  return tiene(usuario, ['Admin']);
}
export function tienePermisoAccesos(usuario) {
  return tiene(usuario, ['Admin']);
}

// ---- Actividades (Postwork) / área académica ----
export function tienePermisoActividades(usuario) {
  return tiene(usuario, ['Admin', 'CoordinadorEstudiantes', 'Academico', 'Docente', 'Estudiantes']);
}
export function tienePermisoGestionActividades(usuario) {
  return tiene(usuario, ['Admin', 'CoordinadorEstudiantes']);
}
export function tienePermisoAsignarDocentes(usuario) {
  return tiene(usuario, ['Admin', 'CoordinadorEstudiantes']);
}
// Ve TODAS las respuestas (sin filtro por docente).
export function tienePermisoVerTodasRespuestas(usuario) {
  return tiene(usuario, ['Admin', 'CoordinadorEstudiantes', 'Academico']);
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
  return tiene(usuario, ['Admin', 'CoordinadorEstudiantes']);
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
