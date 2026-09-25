'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '../../components/Nav';
import AccesoDenegado from '../../components/AccesoDenegado';
import FichaDrawer from '../../components/FichaDrawer';
import { useSession } from '../../lib/useSession';
import { tienePermisoComunidades } from '../../lib/permisos';

// Las ventas de Comunidades son, ni más ni menos, inscriptos como cualquier otro curso — se
// generan solas al día siguiente de la venta (mismo circuito que /inscritos), solo que acá se
// muestran filtradas a Curso === "Comunidades". Por eso esta pantalla reusa /api/inscritos en vez
// de /api/leads: además de ser el mismo dato, /api/leads pide permiso "operativo" (Admin/
// Coordinador/Inscripciones), que Lourdes/Victoria (rol Estudiantes, con acceso a Comunidades) no
// tienen — /api/inscritos en cambio pide el mismo permiso que ya se usa para entrar a esta pantalla.
export default function ComunidadesPage() {
  const { usuario, logout } = useSession();
  const router = useRouter();
  const [inscritos, setInscritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [fichaLeadId, setFichaLeadId] = useState(null);

  const puedeVer = usuario ? tienePermisoComunidades(usuario) : false;

  useEffect(() => {
    if (!usuario) return;
    if (!puedeVer) return;
    cargarInscritos();
  }, [usuario]);

  async function cargarInscritos() {
    setCargando(true);
    setErrorCarga('');
    try {
      const res = await fetch(`/api/inscritos?solicitanteEmail=${encodeURIComponent(usuario.email)}`);
      const r = await res.json();
      if (!res.ok || r.error) {
        setErrorCarga(r.error || 'No se pudieron cargar las ventas de Comunidades.');
        setInscritos([]);
      } else {
        setInscritos((r.inscritos || []).filter((i) => (i.Curso || '').trim() === 'Comunidades'));
      }
    } catch {
      setErrorCarga('No se pudo conectar con el servidor. Probá de nuevo.');
      setInscritos([]);
    }
    setCargando(false);
  }

  if (!usuario) return null;

  const inscritosFiltrados = inscritos.filter(
    (i) => !busqueda.trim() || (i.NombreEstudiante || '').toLowerCase().includes(busqueda.trim().toLowerCase())
  );
  const ordenados = [...inscritosFiltrados].sort((a, b) => new Date(b.FechaInscripcion) - new Date(a.FechaInscripcion));

  return (
    <div>
      <Nav usuario={usuario} onLogout={() => { logout(); router.push('/'); }} />
      {!puedeVer ? (
        <AccesoDenegado seccion="Comunidades" />
      ) : (
        <div className="max-w-[1100px] mx-auto px-6 pb-16">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
            <h3 className="text-lg font-bold">🌐 Comunidades</h3>
            <input
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre…"
              className="bg-surface2 border border-border rounded-lg px-3 py-1.5 text-sm w-56"
            />
          </div>
          <p className="text-textMuted text-sm mb-5">{ordenados.length} venta{ordenados.length !== 1 ? 's' : ''} de Comunidades.</p>

          {cargando ? (
            <p className="text-textMuted text-sm">Cargando…</p>
          ) : errorCarga ? (
            <p className="text-dangerText text-sm">{errorCarga}</p>
          ) : ordenados.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">🌐</p>
              <p className="text-base font-semibold mb-1">Todavía no hay ventas de Comunidades</p>
              <p className="text-textMuted text-sm">Van a aparecer acá solas, al día siguiente de confirmarse la venta.</p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-surface2">
                  <tr className="text-textSec text-left">
                    <th className="py-2.5 px-3">Nombre</th>
                    <th className="px-3">Fecha</th>
                    <th className="px-3">Email</th>
                    <th className="px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {ordenados.map((i) => (
                    <tr key={i.ID} className="border-t border-border hover:bg-bg/60">
                      <td className="py-2 px-3 font-medium">{i.NombreEstudiante}</td>
                      <td className="px-3 text-textSec">{i.FechaInscripcion ? new Date(i.FechaInscripcion).toLocaleDateString('es-AR') : '—'}</td>
                      <td className="px-3 text-textSec">{i.EmailEstudiante || '—'}</td>
                      <td className="px-3 text-right">
                        <button onClick={() => setFichaLeadId(i.LeadId)} className="text-accentTeal text-xs font-semibold">Ver ficha</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      <FichaDrawer leadId={fichaLeadId} usuario={usuario} onClose={() => setFichaLeadId(null)} />
    </div>
  );
}
