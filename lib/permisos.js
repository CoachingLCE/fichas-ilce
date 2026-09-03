// Roles de la plataforma (§16 del brief). SuperAdmin = Diego.
export const ROLES = ['SuperAdmin', 'Admin', 'Coordinador', 'Responsable', 'Consulta'];

const CAPS = {
  verInscripciones: ['SuperAdmin', 'Admin', 'Coordinador', 'Responsable', 'Consulta'],
  cambiarEstado: ['SuperAdmin', 'Admin', 'Coordinador', 'Responsable'],
  exportar: ['SuperAdmin', 'Admin', 'Coordinador'],
  verDashboard: ['SuperAdmin', 'Admin', 'Coordinador', 'Consulta'],
  constructor: ['SuperAdmin', 'Admin'],
  gestionarUsuarios: ['SuperAdmin']
};

export function can(rol, cap) {
  return (CAPS[cap] || []).includes(rol);
}
