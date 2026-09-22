'use client';
import { useEffect, useMemo, useState } from 'react';
import { APP_URL } from '../lib/constants';

const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export default function Formularios({ usuario, showToast }) {
  const [sub, setSub] = useState('lista');
  return (
    <div>
      <div className="subtabs">
        <button className={sub === 'lista' ? 'on' : ''} onClick={() => setSub('lista')}>Formularios</button>
        <button className={sub === 'respuestas' ? 'on' : ''} onClick={() => setSub('respuestas')}>Respuestas</button>
      </div>
      {sub === 'lista' && <Lista usuario={usuario} showToast={showToast} />}
      {sub === 'respuestas' && <Respuestas usuario={usuario} showToast={showToast} />}
    </div>
  );
}

function Lista({ usuario, showToast }) {
  const [forms, setForms] = useState(null);
  const [error, setError] = useState('');
  // Mismo patrón de "dos vistas" (tarjetas/lista) que ya existe en Actividades, con su propia
  // clave de localStorage para no pisar la preferencia de esa otra sección.
  const [vista, setVista] = useState('cards');
  useEffect(() => {
    try {
      const v = localStorage.getItem('ilce-formularios-vista');
      if (v === 'cards' || v === 'lista') setVista(v);
    } catch { /* */ }
  }, []);
  const cambiarVista = (v) => { setVista(v); try { localStorage.setItem('ilce-formularios-vista', v); } catch { /* */ } };
  const [conteos, setConteos] = useState(null); // { [nombreNormalizado]: cantidad de respuestas }
  const normNombre = (v) => (v || '').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿?¡!.,;:]/g, '').replace(/\s+/g, ' ').trim();
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/formularios?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudieron cargar los formularios');
      setForms(d.formularios || []);
    } catch (e) { setError(e.message || 'Error de conexión'); setForms([]); }
  })(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/formularios/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      const m = {};
      if (d.ok) (d.respuestas || []).forEach((x) => { const k = normNombre(x.formulario); m[k] = (m[k] || 0) + 1; });
      setConteos(m);
    } catch { setConteos({}); }
  })(); /* eslint-disable-next-line */ }, []);
  const nResp = (f) => (conteos ? (conteos[normNombre(f.titulo)] || 0) : null);
  if (error) return <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{error}. Revisá que exista la pestaña “Formularios” en la Sheet.</p></div>;
  if (!forms) return <div className="spin" />;
  if (forms.length === 0) return <div className="empty"><div className="ico">📝</div><h3>No hay formularios cargados</h3><p>Pegá las definiciones en la pestaña Formularios de la Sheet.</p></div>;
  return (
    <div>
      <div className="sechead">
        <span className="hcount">{forms.length} formulario{forms.length === 1 ? '' : 's'}</span>
        <span className="grow" />
        <div className="vista-toggle">
          <button className={vista === 'cards' ? 'on' : ''} onClick={() => cambiarVista('cards')} title="Ver en tarjetas">▦</button>
          <button className={vista === 'lista' ? 'on' : ''} onClick={() => cambiarVista('lista')} title="Ver en lista">☰</button>
        </div>
      </div>
      {vista === 'lista' ? (
        <div className="tablewrap"><table>
          <thead><tr><th>Formulario</th><th>Tipo</th><th>Estado</th><th>Campos</th><th>Respuestas</th><th>Enlace</th><th></th></tr></thead>
          <tbody>{forms.map((f) => (
            <tr key={f.slug}>
              <td className="ins-name">{f.titulo}</td>
              <td>{f.tipo ? <span className="cchip">{f.tipo}</span> : '—'}</td>
              <td><span className={'fstate ' + (f.estado === 'Publicada' ? 'pub' : 'bor')}><span className="d" />{f.estado}</span></td>
              <td className="sec">{f.campos.length}</td>
              <td>{nResp(f) === null ? <span className="sec">…</span> : (nResp(f) > 0 ? <span className="cnt" style={{ fontWeight: 700 }}>{nResp(f)}</span> : <span className="sec">0</span>)}</td>
              <td className="sec">/formulario/{f.slug}</td>
              <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <button className="btn-sm" onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/formulario/${f.slug}`); showToast('✓ Enlace copiado'); }}>Copiar</button>{' '}
                <a className="btn-sm solid" href={`${APP_URL}/formulario/${f.slug}`} target="_blank" rel="noreferrer">👁</a>
              </td>
            </tr>
          ))}</tbody>
        </table></div>
      ) : (
        <div className="fgrid">
          {forms.map((f) => (
            <div className="fcard" key={f.slug}>
              <div className="fcard-top">
                <span className={'fstate ' + (f.estado === 'Publicada' ? 'pub' : 'bor')}><span className="d" />{f.estado}</span>
                <span className="tagchip">{f.tipo || 'Formulario'}</span>
              </div>
              <div className="ftitle" style={{ fontSize: 18 }}>{f.titulo}</div>
              <div className="fsub">{f.campos.length} campos{nResp(f) !== null ? ` · ${nResp(f)} respuesta${nResp(f) === 1 ? '' : 's'}` : ''}</div>
              <div className="fspacer" />
              <div><div className="acard-link-label">Enlace</div>
                <div className="flink"><span className="u">/formulario/{f.slug}</span>
                  <button onClick={() => { navigator.clipboard?.writeText(`${APP_URL}/formulario/${f.slug}`); showToast('✓ Enlace copiado'); }}>Copiar</button></div></div>
              <div className="factions">
                <a className="btn-sm solid" style={{ flex: 1, justifyContent: 'center' }} href={`${APP_URL}/formulario/${f.slug}`} target="_blank" rel="noreferrer">👁 Abrir</a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Respuestas({ usuario, showToast }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [fForm, setFForm] = useState('');
  const [abierto, setAbierto] = useState(null);
  const [importarAbierto, setImportarAbierto] = useState(false);
  const [orden, setOrden] = useState({ col: 'fecha', dir: 'desc' });

  async function cargar() {
    try {
      const res = await fetch('/api/formularios/respuestas?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudieron cargar las respuestas');
      setData(d.respuestas || []);
    } catch (e) { setError(e.message || 'Error de conexión'); setData([]); }
  }
  useEffect(() => { cargar(); /* eslint-disable-next-line */ }, []);
  const forms = useMemo(() => [...new Set((data || []).map((x) => x.formulario).filter(Boolean))].sort(), [data]);
  const filtradas = useMemo(() => {
    const qq = norm(q);
    return (data || []).filter((x) => {
      if (fForm && x.formulario !== fForm) return false;
      if (qq && !norm(`${x.nombre} ${x.email} ${x.curso} ${x.edicion}`).includes(qq)) return false;
      return true;
    });
  }, [data, q, fForm]);
  const ordenadas = useMemo(() => {
    const { col, dir } = orden;
    const val = (x) => (col === 'fecha' ? (x.fecha || '') : (x[col] || '')).toString().toLowerCase();
    const arr = [...filtradas].sort((a, b) => { const va = val(a), vb = val(b); const c = va < vb ? -1 : va > vb ? 1 : 0; return dir === 'asc' ? c : -c; });
    return arr;
  }, [filtradas, orden]);
  const ordenarPor = (col) => setOrden((o) => (o.col === col ? { col, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { col, dir: 'asc' }));
  const flecha = (col) => (orden.col === col ? (orden.dir === 'asc' ? ' ▲' : ' ▼') : '');
  const fmt = (iso) => { const d = new Date(iso); return isNaN(d) ? iso : d.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }); };
  if (error) return <div className="empty"><div className="ico">⚠️</div><h3>No se pudo cargar</h3><p>{error}. Revisá que exista la pestaña “RespuestasFormularios” en la Sheet.</p></div>;
  if (!data) return <div className="spin" />;
  return (
    <div>
      <div className="filters">
        <div className="fsearch" style={{ maxWidth: 260 }}>🔎 <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, email…" /></div>
        <select className="fsel" value={fForm} onChange={(e) => setFForm(e.target.value)}><option value="">Formulario: todos</option>{forms.map((x) => <option key={x}>{x}</option>)}</select>
        {(q || fForm) && <button className="btn-sm" onClick={() => { setQ(''); setFForm(''); }}>Limpiar</button>}
        <span className="spacer" />
        <button className="btn-sm solid" onClick={() => setImportarAbierto(true)}>📥 Importar respuestas históricas</button>
      </div>
      {importarAbierto && (
        <ImportarRespuestas
          usuario={usuario}
          onCerrar={() => setImportarAbierto(false)}
          onImportado={() => { setImportarAbierto(false); setData(null); cargar(); showToast && showToast('✓ Respuestas importadas'); }}
        />
      )}
      <p className="count">{filtradas.length} respuesta(s)</p>
      {filtradas.length === 0 ? <div className="empty"><div className="ico">📭</div><h3>Sin respuestas</h3><p>No hay respuestas para estos filtros.</p></div> : (
        <div className="tablewrap"><table>
          <thead><tr>
            <th style={{ minWidth: 110, cursor: 'pointer' }} onClick={() => ordenarPor('fecha')}>Fecha{flecha('fecha')}</th>
            <th style={{ minWidth: 150, cursor: 'pointer' }} onClick={() => ordenarPor('nombre')}>Nombre{flecha('nombre')}</th>
            <th style={{ minWidth: 180, cursor: 'pointer' }} onClick={() => ordenarPor('email')}>Email{flecha('email')}</th>
            <th style={{ minWidth: 130, cursor: 'pointer' }} onClick={() => ordenarPor('curso')}>Curso{flecha('curso')}</th>
            <th style={{ minWidth: 70, cursor: 'pointer' }} onClick={() => ordenarPor('edicion')}>Edic.{flecha('edicion')}</th>
            <th style={{ minWidth: 160, cursor: 'pointer' }} onClick={() => ordenarPor('formulario')}>Formulario{flecha('formulario')}</th>
            <th style={{ minWidth: 70 }}></th>
          </tr></thead>
          <tbody>{ordenadas.map((x) => (
            <>
              <tr key={x.id} onClick={() => setAbierto(abierto === x.id ? null : x.id)}>
                <td className="sec">{(x.fecha || '').slice(0, 10)}</td>
                <td><b>{x.nombre || '—'}</b></td>
                <td className="sec">{x.email}</td>
                <td>{x.curso || '—'}</td>
                <td>{x.edicion || '—'}</td>
                <td>{x.formulario}</td>
                <td className="teal" style={{ color: 'rgb(var(--accentTeal))', fontWeight: 700 }}>{abierto === x.id ? 'Ocultar' : 'Ver'}</td>
              </tr>
              {abierto === x.id && (
                <tr><td colSpan={7} style={{ background: 'rgb(var(--surface2))' }}>
                  <div style={{ padding: '10px 6px', display: 'grid', gap: 8 }}>
                    {Object.entries(x.r || {}).filter(([k]) => !['email', 'nombre', 'curso', 'edicion', 'importadoDe'].includes(k)).map(([k, v]) => (
                      <div key={k}><div style={{ fontSize: 11.5, color: 'rgb(var(--textMuted))', textTransform: 'capitalize' }}>{k}</div><div style={{ fontSize: 13.5 }}>{String(v)}</div></div>
                    ))}
                  </div>
                </td></tr>
              )}
            </>
          ))}</tbody>
        </table></div>
      )}
    </div>
  );
}

// Importación de encuestas viejas (por ejemplo, respuestas de Google Forms de antes de que
// existiera este formulario en la app). El archivo (.csv o .xlsx, tal cual lo exporta Google
// Forms) se parsea acá mismo en el navegador con la misma librería que ya se usa para
// exportar a Excel — así los datos de estudiantes reales nunca se transcriben a mano.
function ImportarRespuestas({ usuario, onCerrar, onImportado }) {
  const [forms, setForms] = useState(null);
  const [slug, setSlug] = useState('');
  const [tituloManual, setTituloManual] = useState('');
  const [curso, setCurso] = useState('');
  const [edicion, setEdicion] = useState('');
  const [filas, setFilas] = useState(null);
  const [nombreArchivo, setNombreArchivo] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [resultado, setResultado] = useState(null);

  useEffect(() => { (async () => {
    try {
      const res = await fetch('/api/formularios?solicitanteEmail=' + encodeURIComponent(usuario.email));
      const d = await res.json();
      if (d.ok) setForms(d.formularios || []);
    } catch { /* si falla, el select de formularios queda vacío y no se puede importar */ }
  })(); /* eslint-disable-next-line */ }, []);

  async function onArchivo(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setResultado(null); setFilas(null); setNombreArchivo(file.name);
    try {
      const XLSX = await import('xlsx');
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const hoja = wb.Sheets[wb.SheetNames[0]];
      const nuevasFilas = XLSX.utils.sheet_to_json(hoja, { defval: '' });
      if (nuevasFilas.length === 0) { setError('El archivo no tiene filas de datos.'); return; }
      setFilas(nuevasFilas);
    } catch (err) {
      setError('No se pudo leer el archivo. Probá exportarlo de nuevo desde Google Forms (Respuestas → ⋮ → Descargar respuestas).');
    }
  }

  async function importar() {
    if ((!slug && !tituloManual.trim()) || !filas) return;
    setCargando(true); setError(''); setResultado(null);
    try {
      const res = await fetch('/api/formularios/importar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ solicitanteEmail: usuario.email, slug, tituloManual, curso, edicion, filas })
      });
      const d = await res.json();
      if (!d.ok) throw new Error(d.error || 'No se pudo importar');
      setResultado(d);
    } catch (err) {
      setError(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  }

  const columnas = filas && filas.length > 0 ? Object.keys(filas[0]) : [];

  return (
    <div className="mwrap on">
      <div className="modal" style={{ maxWidth: 540 }}>
        <h3>📥 Importar respuestas históricas</h3>
        <p className="muted" style={{ fontSize: 12.5, margin: '4px 0 14px' }}>
          Subí el archivo tal cual lo bajaste de Google Forms (Respuestas → ⋮ → Descargar respuestas, en .csv o .xlsx).
          Se lee acá mismo en tu navegador — nada se transcribe a mano, así no hay riesgo de cargar mal un nombre o un email de un estudiante real.
        </p>

        {!resultado ? (<>
          <div className="fgroup-label">Formulario de destino</div>
          <select className="ctrl" value={slug} onChange={(e) => { setSlug(e.target.value); if (e.target.value) setTituloManual(''); }} style={{ width: '100%', marginBottom: 8 }}>
            <option value="">{forms ? 'Elegí un formulario…' : 'Cargando formularios…'}</option>
            {(forms || []).map((f) => <option key={f.slug} value={f.slug}>{f.titulo}</option>)}
          </select>
          {!slug && (
            <input className="ctrl" style={{ width: '100%', marginBottom: 10 }} value={tituloManual} onChange={(e) => setTituloManual(e.target.value)}
              placeholder="…o escribí el nombre si es una encuesta vieja que no está en la lista (ej: Coaching Deportivo — encuesta 2025)" />
          )}

          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input className="ctrl" style={{ flex: 1 }} value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Curso (ej: Coaching Deportivo)" />
            <input className="ctrl" style={{ flex: 1 }} value={edicion} onChange={(e) => setEdicion(e.target.value)} placeholder="Edición (si no viene en el archivo)" />
          </div>

          <div className="fgroup-label">Archivo (.csv o .xlsx)</div>
          <input type="file" accept=".csv,.xlsx,.xls" onChange={onArchivo} style={{ marginBottom: 10 }} />

          {error && <p style={{ color: 'rgb(248 113 113)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}

          {filas && (
            <div className="note" style={{ marginBottom: 14 }}>
              <b>{filas.length}</b> fila(s) detectadas en «{nombreArchivo}», con {columnas.length} columna(s):
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{columnas.slice(0, 6).join(' · ')}{columnas.length > 6 ? '…' : ''}</div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button className="btn-sm" onClick={onCerrar}>Cancelar</button>
            <button className="btn-sm solid" disabled={(!slug && !tituloManual.trim()) || !filas || cargando} onClick={importar}>
              {cargando ? 'Importando…' : filas ? `Importar ${filas.length} fila(s)` : 'Importar'}
            </button>
          </div>
        </>) : (<>
          <div className="note" style={{ borderLeftColor: 'rgb(74 222 128)', marginBottom: 14 }}>
            ✓ Se importaron <b>{resultado.importadas}</b> respuesta(s) nueva(s).
            {resultado.omitidasDuplicadas > 0 && <><br />{resultado.omitidasDuplicadas} ya estaban cargadas (mismo email y fecha) y se omitieron para no duplicar.</>}
            {resultado.omitidasSinEmail > 0 && <><br />{resultado.omitidasSinEmail} fila(s) no tenían un email detectable y se omitieron.</>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn-sm solid" onClick={onImportado}>Listo</button>
          </div>
        </>)}
      </div>
    </div>
  );
}
