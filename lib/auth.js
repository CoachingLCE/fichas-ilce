import { readSheet } from './sheets';
import { TABS } from './constants';
import { verificarToken, sesionEstricta } from './sesionFirmada';

export {
  tienePermisoInscripciones,
  tienePermisoCambiarEstado,
  tienePermisoExportar,
  tienePermisoDashboard,
  tienePermisoConstructor,
  tienePermisoAccesos,
  tienePermisoActividades,
  tienePermisoGestionActividades,
  tienePermisoAsignarDocentes,
  tienePermisoVerTodasRespuestas,
  tienePermisoVerRespuestasActividades,
  tienePermisoVerRespuestasFormularios,
  tienePermisoEmails,
  tienePermisoAuditoria,
  tienePermisoFormularios,
  tienePermisoMasterclass,
  tienePermisoGestionMasterclass,
  tienePermisoEliminarRespuestas
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

const normEmail = (e) => String(e || '').trim().toLowerCase();
let ultimoAvisoSinToken = 0;

/**
 * Quién hace el pedido. Reemplaza a findUsuario(<email que manda el navegador>) en las rutas de la API (revisión de seguridad de octubre de 2026).
 *  · Con token válido: el usuario es el del TOKEN (no el email declarado). Si el email declarado es otra persona, solo un Admin puede actuar como ella ("Ver como").
 *  · Con un token presente pero inválido, vencido o manipulado: null (se rechaza siempre).
 *  · Un usuario desactivado deja de poder usar su token en el acto.
 *  · Un token con la marca "cp" (entró con una contraseña genérica o temporal) solo vale donde se pasa permitirTemporal: la ruta que cambia la contraseña.
 *  · Sin token: etapa de transición -> se acepta el email como hasta ahora (y se deja un aviso en los logs); con SESION_ESTRICTA=1 -> null.
 * Devuelve lo mismo que findUsuario (el usuario o null), así las rutas siguen con su `if (!usuario) 403` de siempre.
 */
export async function usuarioDeSolicitud(request, emailDeclarado, { permitirTemporal = false } = {}) {
  const cab = (request && request.headers && typeof request.headers.get === 'function' && request.headers.get('authorization')) || '';
  const m = /^Bearer\s+(\S+)\s*$/i.exec(cab);
  if (m) {
    const t = verificarToken(m[1]);
    if (!t) return null;
    if (t.cp && !permitirTemporal) return null; // entró con una contraseña genérica/temporal: su sesión solo sirve para cambiarla
    const real = await findUsuario(t.email);
    if (!real || real.activo === false) return null;
    const decl = normEmail(emailDeclarado);
    if (!decl || decl === normEmail(real.email)) return real;
    if ((real.roles || []).includes('Admin')) return findUsuario(decl); // "Ver como": un Admin actúa como otra persona
    return null; // un usuario común no puede hacerse pasar por otro
  }
  if (sesionEstricta()) return null;
  if (Date.now() - ultimoAvisoSinToken > 60 * 1000) { ultimoAvisoSinToken = Date.now(); console.warn('[sesion] pedido sin token aceptado por el email declarado (etapa de transición)'); }
  return findUsuario(emailDeclarado);
}
