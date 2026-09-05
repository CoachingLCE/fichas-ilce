import { readSheet } from './sheets';
import { TABS } from './constants';

export {
  tienePermisoInscripciones,
  tienePermisoCambiarEstado,
  tienePermisoExportar,
  tienePermisoDashboard,
  tienePermisoConstructor,
  tienePermisoAccesos
} from './permisos';

// Busca el usuario en la hoja "Usuarios" (Email, Nombre, Roles, PasswordHash, Activo).
export async function findUsuario(email) {
  const usuarios = await readSheet(TABS.USUARIOS);
  const match = usuarios.find(
    (u) => (u.Email || '').trim().toLowerCase() === (email || '').trim().toLowerCase()
  );
  if (!match) return null;
  return {
    email: match.Email,
    nombre: match.Nombre,
    roles: (match.Roles || '').split(/[,+]/).map((r) => r.trim()).filter(Boolean),
    passwordHash: match.PasswordHash || '',
    activo: (match.Activo || '') !== 'FALSE' && (match.Activo || '').toLowerCase() !== 'no',
    _rowIndex: match._rowIndex
  };
}

export function tieneRol(usuario, rol) {
  return !!usuario && (usuario.roles || []).includes(rol);
}
