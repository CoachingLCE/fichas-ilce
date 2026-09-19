'use client';
import { useEffect, useState } from 'react';
import { ROLES, nombreVisibleRoles } from '../lib/constants';

export default function Accesos({ usuario }) {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoPassword, setNuevoPassword] = useState('');
  const [nuevoRoles, setNuevoRoles] = useState(['Inscripciones']);
  const [mensaje, setMensaje] = useState('');
  const [enviandoA, setEnviandoA] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState({});
  const [editandoRoles, setEditandoRoles] = useState(null);
  const [rolesEnEdicion, setRolesEnEdicion] = useState([]);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  useEffect(() => { cargarUsuarios(); }, []);

  async function cargarUsuarios() {
    setCargando(true);
    const r = await fetch(`/api/usuarios?list=true&solicitanteEmail=${encodeURIComponent(usuario.email)}`).then((res) => res.json());
    setUsuarios((r.usuarios || []).filter((u) => u.Email));
    setCargando(false);
  }
  async function agregarUsuario(e) {
    e.preventDefault(); setMensaje('');
    const r = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, nuevoEmail, nombre: nuevoNombre, roles: nuevoRoles, password: nuevoPassword }) }).then((res) => res.json());
    if (r.error) { setMensaje(`⚠️ ${r.error}`); return; }
    setMensaje(r.emailEnviado ? `✓ Usuario creado y contraseña enviada a ${nuevoEmail}` : `Usuario creado, pero no se pudo enviar el mail a ${nuevoEmail}.`);
    setNuevoEmail(''); setNuevoNombre(''); setNuevoPassword(''); setNuevoRoles(['Inscripciones']); cargarUsuarios();
  }
  async function restablecer(targetEmail) {
    setEnviandoA(targetEmail); setMensaje('');
    const r = await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, targetEmail, nuevaPassword: '' }) }).then((res) => res.json());
    setMensaje(r.emailEnviado ? `✓ Contraseña reseteada a "Hola123" y enviada a ${targetEmail}` : `Contraseña reseteada, pero no se pudo enviar el mail.`);
    setEnviandoA(''); cargarUsuarios();
  }
  function empezarEdicionRoles(u) { setEditandoRoles(u.Email); setRolesEnEdicion((u.Roles || '').split(/[,+]/).map((r) => r.trim()).filter(Boolean)); }
  async function guardarRoles(email) {
    setMensaje('');
    const r = await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, targetEmail: email, nuevosRoles: rolesEnEdicion }) }).then((res) => res.json());
    setMensaje(r.error ? `⚠️ ${r.error}` : `✓ Roles actualizados para ${email}`);
    setEditandoRoles(null); cargarUsuarios();
  }
  async function toggleActivo(u) {
    setMensaje('');
    const r = await fetch('/api/usuarios', { method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, targetEmail: u.Email, activo: !u.Activo }) }).then((res) => res.json());
    setMensaje(r.error ? `⚠️ ${r.error}` : (u.Activo ? `Usuario ${u.Email} desactivado` : `✓ Usuario ${u.Email} reactivado`));
    cargarUsuarios();
  }
  async function confirmarYEliminar() {
    if (!confirmarEliminar) return; setMensaje('');
    const r = await fetch('/api/usuarios', { method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ solicitanteEmail: usuario.email, targetEmail: confirmarEliminar.Email }) }).then((res) => res.json());
    setMensaje(r.error ? `⚠️ ${r.error}` : `✓ Usuario ${confirmarEliminar.Email} eliminado`);
    setConfirmarEliminar(null); cargarUsuarios();
  }

  // La solapa "Historial de accesos" (login/altas/bajas) se sacó de acá — ese registro ya
  // está afuera, como su propia hoja de navegación ("Historial de acciones", ver Auditoria.jsx),
  // que además cubre más que solo accesos. Tenerlo duplicado acá adentro era confuso.
  return (
    <div style={{ maxWidth: 900 }}>
      <div className="panel">
        <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>🔐 Permisos por rol</p>
        <table style={{ fontSize: 12.5 }}>
          <tbody>
            {[
              ['Admin', 'Todo el sistema, incluido Constructor y Accesos (exclusivos de Admin).'],
              ['Coordinador de inscripciones', 'Inscripciones (ver y cambiar estado), Dashboard y Exportar. No ve Constructor ni Accesos.'],
              ['Inscripciones', 'Ver inscripciones y cambiar estado. No exporta ni ve Dashboard/Constructor.'],
              ['Estudiantes', 'Solo lectura de inscripciones.'],
              ['Coordinación académica', 'Gestiona Actividades (Postwork) y asigna docentes; ve Formularios, Emails y Masterclass. No ve inscripciones ni Accesos.'],
              ['Académico', 'Lectura de inscripciones, Dashboard y Reportes; gestiona Actividades (Postwork) y Formularios (puede crearlos, no solo verlos). No asigna docentes ni ve Accesos.']
            ].map(([r, d]) => (
              <tr key={r} style={{ borderBottom: '1px solid rgb(var(--border))' }}>
                <td style={{ padding: '7px 10px 7px 0', fontWeight: 700, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{r}</td>
                <td style={{ padding: '7px 0', color: 'rgb(var(--textSec))' }}>{d}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ color: 'rgb(var(--textMuted))', fontSize: 11, marginTop: 8 }}>Los roles se pueden combinar (ej. Coordinador + Academico).</p>
      </div>

      <div className="panel">
        <h3>Gestión de accesos</h3>
        {mensaje && <p style={{ color: 'rgb(74 222 128)', fontSize: 13, marginBottom: 10 }}>{mensaje}</p>}
        {cargando ? <p className="muted">Cargando…</p> : (
          <div style={{ marginBottom: 18 }}>
            {usuarios.map((u, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid rgb(var(--border))', fontSize: 14, flexWrap: 'wrap', opacity: u.Activo ? 1 : 0.5 }}>
                <div style={{ flex: 1, minWidth: 160 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{u.Nombre}</p>
                  <p style={{ color: 'rgb(var(--textMuted))', fontSize: 12, margin: 0 }}>{u.Email}</p>
                </div>
                {editandoRoles === u.Email ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    {ROLES.map((rol) => (
                      <label key={rol} style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 12 }}>
                        <input type="checkbox" checked={rolesEnEdicion.includes(rol)}
                          onChange={(e) => setRolesEnEdicion((prev) => e.target.checked ? [...prev, rol] : prev.filter((r) => r !== rol))} />{nombreVisibleRoles([rol])}
                      </label>
                    ))}
                    <button className="btn-sm solid" onClick={() => guardarRoles(u.Email)}>Guardar</button>
                    <button className="btn-sm" onClick={() => setEditandoRoles(null)}>Cancelar</button>
                  </div>
                ) : (
                  <button className="btn-sm" onClick={() => empezarEdicionRoles(u)} title="Editar roles">
                    {nombreVisibleRoles((u.Roles || '').split(/[,+]/).map((r) => r.trim()).filter(Boolean))} ✏️
                  </button>
                )}
                {u.passwordActual ? (
                  <button className="btn-sm" style={{ fontFamily: 'monospace', minWidth: 92, justifyContent: 'center' }}
                    onClick={() => setMostrarPassword((p) => ({ ...p, [u.Email]: !p[u.Email] }))} title="Mostrar/ocultar">
                    {mostrarPassword[u.Email] ? u.passwordActual : '••••••••'}
                  </button>
                ) : <span className="badge b-Pendiente">sin contraseña</span>}
                <button className="btn-sm" disabled={enviandoA === u.Email} onClick={() => restablecer(u.Email)}>
                  {enviandoA === u.Email ? 'Enviando…' : 'Restablecer'}
                </button>
                <button className="btn-sm" onClick={() => toggleActivo(u)}>{u.Activo ? 'Desactivar' : 'Reactivar'}</button>
                <button className="btn-sm" style={{ color: 'rgb(248 113 113)', borderColor: 'rgba(248,113,113,.3)' }} onClick={() => setConfirmarEliminar(u)}>🗑</button>
              </div>
            ))}
          </div>
        )}

        <hr style={{ border: 0, borderTop: '1px solid rgb(var(--border))', margin: '4px 0 16px' }} />
        <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Agregar nuevo usuario</p>
        <form onSubmit={agregarUsuario} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div><label style={lbl}>Email</label><input required type="email" className="ctrl" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} placeholder="nombre@institutoilce.com" /></div>
          <div><label style={lbl}>Nombre</label><input required className="ctrl" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} /></div>
          <div><label style={lbl}>Contraseña</label><input className="ctrl" value={nuevoPassword} onChange={(e) => setNuevoPassword(e.target.value)} placeholder='Vacío = "Hola123"' /></div>
          <div><label style={lbl}>Rol(es)</label>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', paddingTop: 6 }}>
              {ROLES.map((rol) => (
                <label key={rol} style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 13 }}>
                  <input type="checkbox" checked={nuevoRoles.includes(rol)}
                    onChange={(e) => setNuevoRoles((prev) => e.target.checked ? [...prev, rol] : prev.filter((r) => r !== rol))} />{nombreVisibleRoles([rol])}
                </label>
              ))}
            </div>
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 'none', padding: '11px 22px' }}>+ Dar acceso (envía la contraseña por mail)</button>
          </div>
        </form>
      </div>

      {confirmarEliminar && (
        <div className="mwrap on">
          <div className="modal">
            <p style={{ fontWeight: 700, marginTop: 0 }}>¿Eliminar este usuario?</p>
            <p style={{ color: 'rgb(var(--textSec))', fontSize: 14 }}>{confirmarEliminar.Nombre} ({confirmarEliminar.Email}) — no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => setConfirmarEliminar(null)}>Cancelar</button>
              <button className="btn-sm" style={{ flex: 1, justifyContent: 'center', background: 'rgb(248 113 113)', color: '#fff', borderColor: 'transparent' }} onClick={confirmarYEliminar}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
const lbl = { fontSize: 12, fontWeight: 700, display: 'block', marginBottom: 5, color: 'rgb(var(--textSec))' };
