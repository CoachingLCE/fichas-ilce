// Información visual de los roles (Accesos): grupo, descripción corta y funciones permitidas.
// Las funciones permitidas NO están escritas a mano: se calculan llamando a las mismas funciones de lib/permisos.js que usa el resto de la app
// (y el servidor), así que esta pantalla no puede mostrar algo distinto de lo que el sistema permite de verdad.
// Este archivo no cambia ningún permiso ni rol; solo lee.
import {
  tienePermisoInscripciones, tienePermisoCambiarEstado, tienePermisoExportar, tienePermisoDashboard, tienePermisoConstructor,
  tienePermisoAccesos, tienePermisoActividades, tienePermisoGestionActividades, tienePermisoEvaluaciones, tienePermisoHabilitarIntentos,
  tienePermisoAsignarDocentes, tienePermisoVerRespuestasActividades, tienePermisoEmails, tienePermisoAuditoria, tienePermisoFormularios,
  tienePermisoGestionMasterclass, puedeVerComoOtro, tienePermisoEliminarRespuestas
} from './permisos';
import { ROLES } from './constants';

// Tipos: c = consulta · g = gestión · a = administración.
export const TIPOS_CAP = [
  { t: 'c', l: 'Consulta' },
  { t: 'g', l: 'Gestión' },
  { t: 'a', l: 'Administración' }
];

// `clave`: si la persona NO tiene esta función, se nombra en "Sin acceso a…" (son las diferencias que más importan entre roles).
export const CAPACIDADES = [
  { k: 'insc', l: 'Ver inscripciones', t: 'c', fn: tienePermisoInscripciones },
  { k: 'act', l: 'Ver actividades', t: 'c', fn: tienePermisoActividades },
  { k: 'resp', l: 'Ver respuestas', t: 'c', fn: tienePermisoVerRespuestasActividades },
  { k: 'rep', l: 'Ver Reportes', t: 'c', fn: tienePermisoDashboard, clave: true },
  { k: 'emails', l: 'Ver Emails', t: 'c', fn: tienePermisoEmails },
  { k: 'estado', l: 'Cambiar estado de inscripciones', t: 'g', fn: tienePermisoCambiarEstado, clave: true },
  { k: 'export', l: 'Exportar', t: 'g', fn: tienePermisoExportar, clave: true },
  { k: 'ctor', l: 'Constructor de fichas', t: 'g', fn: tienePermisoConstructor, clave: true },
  { k: 'gact', l: 'Crear y editar actividades', t: 'g', fn: tienePermisoGestionActividades, clave: true },
  { k: 'form', l: 'Crear y editar formularios', t: 'g', fn: tienePermisoFormularios },
  { k: 'eval', l: 'Crear y editar evaluaciones finales', t: 'g', fn: tienePermisoEvaluaciones },
  { k: 'habil', l: 'Habilitar intentos extra', t: 'g', fn: tienePermisoHabilitarIntentos },
  { k: 'mc', l: 'Gestionar Masterclass', t: 'g', fn: tienePermisoGestionMasterclass },
  { k: 'docentes', l: 'Asignar docentes (Equipo)', t: 'g', fn: tienePermisoAsignarDocentes, clave: true },
  { k: 'accesos', l: 'Gestionar accesos', t: 'a', fn: tienePermisoAccesos, clave: true },
  { k: 'hist', l: 'Ver el Historial de acciones', t: 'a', fn: tienePermisoAuditoria },
  { k: 'vercomo', l: 'Ver la app como otra persona', t: 'a', fn: puedeVerComoOtro },
  { k: 'elimresp', l: 'Eliminar respuestas de actividades', t: 'a', fn: tienePermisoEliminarRespuestas }
];

// Permisos efectivos de una persona con uno o varios roles: alcanza con que UNO de sus roles permita la función
// (es exactamente cómo evalúa el sistema: lib/permisos.js usa `roles.some(...)`).
export function capacidadesDe(roles) {
  const usuario = { roles: roles || [] };
  return CAPACIDADES.map((c) => ({ ...c, ok: !!(roles && roles.length) && !!c.fn(usuario) }));
}

// Grupos y descripciones. La descripción resume lo que dice la matriz de arriba (revisada contra lib/permisos.js).
export const GRUPOS_ROLES = [
  { id: 'admin', titulo: 'Administración', roles: ['Admin'] },
  { id: 'operativa', titulo: 'Gestión operativa', roles: ['Coordinador', 'Inscripciones'] },
  { id: 'academica', titulo: 'Gestión académica', roles: ['CoordinadorEstudiantes', 'Academico'] },
  { id: 'consulta', titulo: 'Consulta', roles: ['Estudiantes', 'Docente'] }
];

export const INFO_ROL = {
  Admin: { nombre: 'Admin', corta: 'Acceso administrativo completo.', desc: 'Usa todas las funciones del sistema. Es el único rol que administra accesos y ve el Historial.' },
  Coordinador: { nombre: 'Coordinador de inscripciones', corta: 'Gestiona inscripciones, fichas y actividad académica.', desc: 'Gestiona inscripciones y fichas, exporta, ve Reportes y Emails, y también crea actividades, formularios y evaluaciones. No asigna docentes ni administra accesos.' },
  Inscripciones: { nombre: 'Inscripciones', corta: 'Consulta inscripciones y cambia su estado.', desc: 'Trabajo operativo sobre las inscripciones. No exporta, no ve Reportes y no gestiona actividades.' },
  CoordinadorEstudiantes: { nombre: 'Coordinación académica', corta: 'Gestiona actividades y asigna docentes.', desc: 'Gestiona actividades, formularios y evaluaciones, asigna docentes y ve Emails. Consulta inscripciones, pero no cambia su estado ni ve Reportes.' },
  Academico: { nombre: 'Académico', corta: 'Consulta información y gestiona actividades.', desc: 'Consulta inscripciones y Reportes, y gestiona actividades, formularios y evaluaciones. No asigna docentes ni ve Emails.' },
  Estudiantes: { nombre: 'Estudiantes', corta: 'Consulta inscripciones y actividades.', desc: 'Solo lectura de inscripciones y actividades; no cambia nada.' },
  Docente: { nombre: 'Docente', corta: 'Consulta las actividades.', desc: 'Ve las actividades y las respuestas. No gestiona nada más.' }
};

export const nombreRol = (r) => (INFO_ROL[r] && INFO_ROL[r].nombre) || r;
export { ROLES };
