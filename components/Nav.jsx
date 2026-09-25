'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import ThemeSelector from './ThemeSelector';
import Logo from './Logo';
import {
  tienePermisoOperativo, tienePermisoEstudiantes, tienePermisoResumenEstudiantes, tienePermisoAcademicoVer,
  tienePermisoDiplomas, tienePermisoComunidades, tienePermisoReportes, tienePermisoResumenDiario,
  tienePermisoInformesRRSS, tienePermisoAuditoria, tienePermisoBajas, tienePermisoAccesos,
  tienePermisoProductosVer, tienePermisoMensajesVer, tienePermisoEmails
} from '../lib/permisos';
import { nombreVisibleRoles } from '../lib/constants';
import { leerUsuarioReal, getVerComo, aplicarVerComo, quitarVerComo, EMAIL_VERCOMO } from '../lib/useSession';

// Se mantiene por compatibilidad con imports viejos (`import { puedeVerOperativo } from '.../Nav'`)
// — Dashboard y Seguimiento la usan como su chequeo real de acceso (ya no para ocultar del menú,
// que ahora se muestra completo a cualquier usuario logueado).
export const puedeVerOperativo = tienePermisoOperativo;

// Cada ítem lleva su función de permiso (la misma que usa la pantalla de destino para decidir si
// muestra el contenido o "Acceso denegado") — así el menú puede avisar de antemano que ese botón
// no le va a servir a esta persona (o a quien se está previsualizando con "Ver como"), en vez de
// dejarla entrar para recién ahí encontrarse con que no tiene acceso.
const NAV_PRINCIPAL = [
  { href: '/dashboard', label: 'Dashboard', permiso: tienePermisoOperativo },
  { href: '/seguimiento', label: 'Seguimiento', permiso: tienePermisoOperativo }
];

const GESTION = { label: 'Académico', principal: null, items: [
  { href: '/inscritos', label: 'Estudiantes', permiso: tienePermisoEstudiantes },
  { href: '/resumen-estudiantes', label: 'Inscripciones', permiso: tienePermisoResumenEstudiantes },
  { href: '/academico', label: 'Académico', permiso: tienePermisoAcademicoVer },
  { href: '/diplomas', label: 'Diplomas', permiso: tienePermisoDiplomas },
  { href: '/comunidades', label: 'Comunidades', permiso: tienePermisoComunidades }
] };

const REPORTES = { label: 'Reportes', principal: '/reportes', permisoPrincipal: tienePermisoReportes, items: [
  { href: '/resumen-diario', label: 'Resumen diario', permiso: tienePermisoResumenDiario },
  { href: '/informes-rrss', label: 'Informes RRSS', permiso: tienePermisoInformesRRSS },
  { href: '/auditoria', label: 'Historial de acciones', permiso: tienePermisoAuditoria },
  { href: '/bajas', label: 'Bajas', permiso: tienePermisoBajas },
  { href: '/accesos', label: 'Accesos', permiso: tienePermisoAccesos }
] };

const CONFIGURACION = { label: 'Configuración', principal: null, items: [
  { href: '/productos-valores', label: 'Productos y Valores', permiso: tienePermisoProductosVer },
  { href: '/mensajes', label: 'Mensajes frecuentes', permiso: tienePermisoMensajesVer },
  { href: '/emails', label: 'Emails', permiso: tienePermisoEmails },
  { href: '/fichas-enviadas', label: 'Fichas enviadas', permiso: tienePermisoOperativo }
] };

// Chip individual — mismo look para todo (principal, ítems sueltos y de grupo). Si "usuario" (la
// persona real, o a quien se está previsualizando con "Ver como") no tiene el permiso de ese ítem,
// se sigue mostrando y se puede seguir clickeando (el destino ya sabe mostrar "Acceso denegado"),
// pero con menos brillo — para que se note de entrada que ese botón no le va a andar.
function Chip({ href, label, pathname, onClick, destacado, accesible = true }) {
  const activo = pathname === href;
  return (
    <Link href={href} onClick={onClick} title={!accesible ? 'Es probable que no tengas acceso a esta sección' : undefined}
      className={`h-8 flex items-center px-3 rounded-lg text-[13px] font-medium whitespace-nowrap transition-colors ${
        !accesible ? 'opacity-40 hover:opacity-70' : ''
      } ${
        activo ? 'bg-accentPurple/15 text-accentPurple' : destacado ? 'text-text font-semibold hover:bg-surface2' : 'text-textSec hover:text-text hover:bg-surface2'
      }`}>
      {label}
    </Link>
  );
}

// Un grupo (Gestión / Reportes / Configuración): etiqueta chica + todos sus ítems ya abiertos,
// nunca hay que clickear nada para verlos.
function Grupo({ grupo, pathname, onClick, usuario }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="text-textMuted text-[11px] uppercase tracking-wide font-semibold mr-0.5">{grupo.label}</span>
      {grupo.principal && (
        <Chip href={grupo.principal} label="Ver todo" pathname={pathname} onClick={onClick} destacado
          accesible={!grupo.permisoPrincipal || grupo.permisoPrincipal(usuario)} />
      )}
      {grupo.items.map((it) => (
        <Chip key={it.href} href={it.href} label={it.label} pathname={pathname} onClick={onClick}
          accesible={!it.permiso || it.permiso(usuario)} />
      ))}
    </div>
  );
}

function Divisor() {
  return <span className="hidden lg:block w-px h-5 bg-border shrink-0" />;
}

export default function Nav({ usuario, onLogout }) {
  const pathname = usePathname();
  const [menuMovil, setMenuMovil] = useState(false);
  const [real, setReal] = useState(null);
  const [personas, setPersonas] = useState([]);
  const [vc, setVc] = useState(null);
  useEffect(() => {
    const r = leerUsuarioReal(); setReal(r); setVc(getVerComo());
    if (r && r.email === EMAIL_VERCOMO) {
      fetch(`/api/usuarios?list=true&solicitanteEmail=${encodeURIComponent(r.email)}`).then((x) => x.json())
        .then((d) => { if (d.usuarios) setPersonas(d.usuarios
          .filter((u) => u.Activo && u.Email && u.Email !== EMAIL_VERCOMO)
          .map((u) => ({ email: u.Email, nombre: u.Nombre, roles: (u.Roles || '').split(',').map((x) => x.trim()).filter(Boolean) }))); }).catch(() => {});
    }
  }, []);
  const puedeVerComo = real && real.email === EMAIL_VERCOMO;
  function elegirVerComo(email) {
    if (!email) { quitarVerComo(); window.location.reload(); return; }
    const u = personas.find((x) => x.email === email);
    if (u) { aplicarVerComo(u); window.location.reload(); }
  }

  return (
    <div className="border-b border-border no-print">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* LOGO */}
          <Link href="/dashboard" className="shrink-0">
            <Logo height={36} />
          </Link>

          {/* ACCIONES — buscador, herramientas y tema: SIEMPRE visibles (aunque la ventana sea
              angosta, ej. usada al lado de WhatsApp Web) — antes se ocultaban del todo por debajo
              de "lg" y solo quedaban accesibles abriendo el menú hamburguesa. */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <Link href="/buscador" title="Buscador"
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-base transition-colors ${
                pathname === '/buscador' ? 'bg-accentPurple text-white' : 'bg-surface2 border border-border text-textSec hover:text-text hover:border-accentTeal'
              }`}>
              🔍
            </Link>
            <Link href="/herramientas" title="Herramientas"
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-base transition-colors ${
                pathname === '/herramientas' ? 'bg-accentPurple text-white' : 'bg-surface2 border border-border text-textSec hover:text-text hover:border-accentTeal'
              }`}>
              ⚡
            </Link>
            <ThemeSelector />
            {puedeVerComo && (
              <select value={vc ? vc.email : ''} onChange={(e) => elegirVerComo(e.target.value)} title="Ver la app como otra persona (solo lectura)"
                className="hidden md:block bg-surface2 border border-border rounded-lg text-[12px] px-2 h-9 text-textSec hover:border-accentTeal max-w-[170px]">
                <option value="">👁 Ver como…</option>
                {personas.map((p) => <option key={p.email} value={p.email}>{p.nombre}</option>)}
              </select>
            )}
            {usuario && (
              <div className="hidden md:block text-right text-sm pl-2 border-l border-border">
                <p className="font-semibold leading-tight">{usuario.nombre}</p>
                <p className="text-textSec text-[11px] leading-tight">{nombreVisibleRoles(usuario.roles)}</p>
                <button onClick={onLogout} className="text-[11px] text-textMuted underline">Salir</button>
              </div>
            )}
          </div>

          {/* BOTÓN HAMBURGUESA — mobile/tablet */}
          <button onClick={() => setMenuMovil((v) => !v)}
            className="lg:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-surface2 border border-border text-lg shrink-0">
            {menuMovil ? '✕' : '☰'}
          </button>
        </div>

        {puedeVerComo && vc && (
          <div className="no-print flex items-center gap-3 text-[12px] bg-accentPurple/15 border border-accentPurple/40 text-text rounded-lg px-3 py-1.5 mb-2">
            <span>👁 Estás viendo la app <b>como {vc.nombre}</b> (solo lectura).</span>
            <button onClick={() => elegirVerComo('')} className="underline ml-auto whitespace-nowrap">Salir del modo vista</button>
          </div>
        )}
        {/* NAV — desktop: todo a la vista, sin clics para desplegar nada */}
        <nav className="hidden lg:flex items-center gap-2.5 flex-wrap pb-3">
          <Link href="/nuevo-lead"
            className={`h-8 flex items-center px-3.5 rounded-lg text-[13px] font-semibold whitespace-nowrap shadow-sm transition-all ${
              pathname === '/nuevo-lead'
                ? 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white shadow-accentPurple/30'
                : 'bg-gradient-to-r from-accentPurple to-accentMagenta text-white opacity-90 hover:opacity-100'
            }`}>
            + Nuevo lead
          </Link>
          {NAV_PRINCIPAL.map((item) => <Chip key={item.href} href={item.href} label={item.label} pathname={pathname} destacado accesible={!item.permiso || item.permiso(usuario)} />)}
          <Divisor />
          <Grupo grupo={GESTION} pathname={pathname} usuario={usuario} />
          <Divisor />
          <Grupo grupo={REPORTES} pathname={pathname} usuario={usuario} />
          <Divisor />
          <Grupo grupo={CONFIGURACION} pathname={pathname} usuario={usuario} />
        </nav>
      </div>

      {/* MENÚ MOBILE — todo apilado */}
      {menuMovil && (
        <div className="lg:hidden border-t border-border px-4 pb-4 pt-3 space-y-4 max-h-[75vh] overflow-y-auto">
          <Link href="/nuevo-lead" onClick={() => setMenuMovil(false)}
            className="flex items-center justify-center h-10 rounded-lg text-sm font-semibold bg-gradient-to-r from-accentPurple to-accentMagenta text-white">
            + Nuevo lead
          </Link>

          <div className="flex flex-wrap gap-1.5">
            {NAV_PRINCIPAL.map((item) => <Chip key={item.href} href={item.href} label={item.label} pathname={pathname} onClick={() => setMenuMovil(false)} destacado accesible={!item.permiso || item.permiso(usuario)} />)}
          </div>

          {[GESTION, REPORTES, CONFIGURACION].map((grupo) => (
            <div key={grupo.label}>
              <p className="text-textMuted text-[11px] uppercase tracking-wide font-semibold mb-1.5">{grupo.label}</p>
              <div className="flex flex-col gap-0.5">
                {grupo.principal && (() => {
                  const accesiblePrincipal = !grupo.permisoPrincipal || grupo.permisoPrincipal(usuario);
                  return (
                    <Link href={grupo.principal} onClick={() => setMenuMovil(false)}
                      title={accesiblePrincipal ? undefined : 'Es probable que no tengas acceso a esta sección'}
                      className={`px-3 py-2 rounded-lg text-sm ${pathname === grupo.principal ? 'bg-accentPurple/15 text-accentPurple font-semibold' : 'text-textSec hover:bg-surface2'} ${accesiblePrincipal ? '' : 'opacity-40 hover:opacity-70'}`}>
                      Ver todo
                    </Link>
                  );
                })()}
                {grupo.items.map((it) => {
                  const accesibleItem = !it.permiso || it.permiso(usuario);
                  return (
                    <Link key={it.href} href={it.href} onClick={() => setMenuMovil(false)}
                      title={accesibleItem ? undefined : 'Es probable que no tengas acceso a esta sección'}
                      className={`px-3 py-2 rounded-lg text-sm ${pathname === it.href ? 'bg-accentPurple/15 text-accentPurple font-semibold' : 'text-textSec hover:bg-surface2'} ${accesibleItem ? '' : 'opacity-40 hover:opacity-70'}`}>
                      {it.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Buscador/Herramientas/Tema ya están siempre visibles arriba en el header — acá solo
              queda el usuario, para las pantallas angostas donde el header lo oculta (< md). */}
          {usuario && (
            <div className="flex items-center justify-end pt-3 border-t border-border md:hidden">
              <div className="text-right text-sm">
                <p className="font-semibold leading-tight">{usuario.nombre}</p>
                <p className="text-textSec text-[11px] leading-tight">{nombreVisibleRoles(usuario.roles)}</p>
                <button onClick={onLogout} className="text-[11px] text-textMuted underline">Salir</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
