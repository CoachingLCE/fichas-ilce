'use client';
import { useEffect, useMemo, useState } from 'react';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Categoriza cada acción para darle color + ícono según lo que se hizo.
const CATS = [
  // Antes "Ficha enviada" (lo que se registra cuando un estudiante completa su ficha de
  // inscripción, ver app/api/inscripcion/route.js) no matcheaba ninguna categoría — quedaba
  // como "otro" (un punto gris, sin ícono ni chip propio) y se perdía entre el resto de las
  // acciones. Ahora tiene su propia categoría para que se pueda ver/filtrar de un vistazo.
  { id: 'ficha', icono: '', color: 'rgb(74 222 128)', test: (a) => /ficha (enviad|completad)/i.test(a) },
  { id: 'crear', icono: '🟢', color: '#4ade80', test: (a) => /(cre[oó]|agreg[oó]|dio acceso|public[oó]|nueva|nuevo|import[oó]|carg[oó])/i.test(a) },
  { id: 'editar', icono: '', color: '#fbbf24', test: (a) => /(edit[oó]|corrig|actualiz[oó]|modific[oó]|renombr[oó])/i.test(a) },
  { id: 'estado', icono: '', color: 'rgb(var(--accentTeal))', test: (a) => /(estado|inscri|aprob|revisi)/i.test(a) },
  { id: 'eliminar', icono: '', color: '#f87171', test: (a) => /(elimin[oó]|quit[oó]|borr[oó]|archiv[oó]|baja|rechaz)/i.test(a) },
  { id: 'mail', icono: '', color: 'rgb(var(--accentMagenta))', test: (a) => /(mail|correo|email|envi[oó])/i.test(a) },
  { id: 'login', icono: '', color: '#60a5fa', test: (a) => /(inici[oó] sesi[oó]n|login|ingres[oó])/i.test(a) }
];
function catAccion(a) {
  const t = a || '';
  for (const c of CATS) if (c.test(t)) return c;
  return { id: 'otro', icono: '•', color: 'rgb(var(--textSec))' };
}

export default function Auditoria({ usuario }) {
  const [eventos, setEventos] = useState(null);
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  useEffect(() => { (async () => {
    const res = await fetch('/api/auditoria?solicitanteEmail=' + encodeURIComponent(usuario.email));
    const d = await res.json(); setEventos(d.ok ? d.eventos : []);
  })(); /* eslint-disable-next-line */ }, []);
  const filtrados = useMemo(() => {
    if (!eventos) return [];
    const qq = norm(q);
    return eventos.filter((e) => {
      if (cat && catAccion(e.accion).id !== cat) return false;
      if (qq && !norm(`${e.usuario} ${e.accion} ${e.detalle} ${e.id}`).includes(qq)) return false;
      return true;
    });
  }, [eventos, q, cat]);
  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };

  // Pedido de Diego: "compaginar manteniendo visible lo del mes" — los inicios de sesión (y los
  // intentos fallidos) de una misma persona, uno atrás del otro, ensucian la lista sin aportar
  // nada nuevo cada vez. Se agrupan en una sola fila con "×N" mientras se repite el mismo
  // usuario + misma acción, sin mezclar "Inició sesión" con "Intento de login fallido". El resto
  // de las acciones (ficha completada, creó, editó, etc.) no se toca, fila por fila como siempre.
  // Entre medio se intercala un separador por mes, así nunca se pierde de vista de qué mes es
  // lo que se está mirando aunque se haya compaginado un montón de logins.
  const filas = useMemo(() => {
    const out = [];
    let mesActual = null;
    let grupo = null;
    const cerrarGrupo = () => { if (grupo) { out.push(grupo); grupo = null; } };
    filtrados.forEach((e) => {
      const d = new Date(e.fecha);
      const mesKey = isNaN(d) ? '—' : `${d.getFullYear()}-${d.getMonth()}`;
      if (mesKey !== mesActual) {
        cerrarGrupo();
        mesActual = mesKey;
        out.push({ tipo: 'mes', label: isNaN(d) ? 'Fecha desconocida' : d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }) });
      }
      const c = catAccion(e.accion);
      if (c.id === 'login' && grupo && grupo.usuario === e.usuario && grupo.accion === e.accion) {
        grupo.count++; grupo.primera = e.fecha;
      } else {
        cerrarGrupo();
        if (c.id === 'login') grupo = { tipo: 'grupo', usuario: e.usuario, accion: e.accion, cat: c, ultima: e.fecha, primera: e.fecha, count: 1 };
        else out.push({ tipo: 'evento', ...e });
      }
    });
    cerrarGrupo();
    return out;
  }, [filtrados]);
  if (!eventos) return <div className="spin" />;

  const CHIPS = [
    ['', 'Todas'], ['ficha', ' Ficha completada'], ['crear', '🟢 Creó'], ['editar', ' Editó'], ['estado', ' Estado'],
    ['eliminar', ' Eliminó'], ['mail', ' Correo'], ['login', ' Login']
  ];
  return (
    <div>
      <div className="sechead">
        <span className="hcount">{filtrados.length} acción(es) registradas</span>
        <span className="grow" />
        <div className="fsearch" style={{ maxWidth: 260, flex: 'none' }}> <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por usuario, acción, detalle…" /></div>
      </div>
      <div className="fchips" style={{ marginBottom: 12 }}>
        {CHIPS.map(([id, label]) => (
          <button key={id} data-tour={id === 'ficha' ? 'chip-ficha-completada' : undefined} className={'pill' + (cat === id ? ' on' : '')} onClick={() => setCat(id)}>{label}</button>
        ))}
      </div>
      {filtrados.length === 0 ? (
        <div className="empty"><div className="ico"></div><h3>Sin registros</h3><p className="vacio">No hay acciones para ese filtro.</p></div>
      ) : (
        <div className="tablewrap" style={{ maxHeight: '68vh' }}>
          <table>
            <thead><tr><th style={{ minWidth: 120 }}>Fecha</th><th style={{ minWidth: 190 }}>Usuario</th><th style={{ minWidth: 170 }}>Acción</th><th style={{ minWidth: 240 }}>Detalle</th></tr></thead>
            <tbody>{filas.map((f, i) => {
              if (f.tipo === 'mes') {
                return (
                  <tr key={'mes-' + i} className="aud-mes-row"><td colSpan={4}>{f.label}</td></tr>
                );
              }
              if (f.tipo === 'grupo') {
                return (
                  <tr key={'grupo-' + i}>
                    <td className="sec">{f.count > 1 ? `${fmt(f.primera)} → ${fmt(f.ultima)}` : fmt(f.ultima)}</td>
                    <td>{f.usuario}</td>
                    <td><b style={{ color: f.cat.color }}>{f.cat.icono} {f.accion}</b>{f.count > 1 && <span className="aud-x-cnt"> ×{f.count}</span>}</td>
                    <td className="sec">{f.count > 1 ? `${f.count} veces seguidas` : ''}</td>
                  </tr>
                );
              }
              const c = catAccion(f.accion);
              return (
                <tr key={i}>
                  <td className="sec">{fmt(f.fecha)}</td>
                  <td>{f.usuario}</td>
                  <td><b style={{ color: c.color }}>{c.icono} {f.accion}</b></td>
                  <td className="sec">{f.detalle}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
