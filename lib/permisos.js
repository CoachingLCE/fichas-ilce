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
