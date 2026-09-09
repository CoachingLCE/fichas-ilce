import { readSheet, readHeaders } from '../lib/sheets';
import { TABS, CURSOS } from '../lib/constants';
import { Isologo, IsologoDefs } from '../components/Isologo';

export const dynamic = 'force-dynamic';

async function estadoSheet() {
  const tabs = Object.values(TABS);
  const resultados = [];
  let okGlobal = true;
  for (const t of tabs) {
    try {
      const headers = await readHeaders(t);
      const filas = await readSheet(t);
      resultados.push({ tab: t, ok: true, headers: headers.length, filas: filas.length });
    } catch (e) {
      okGlobal = false;
      resultados.push({ tab: t, ok: false, error: e.message });
    }
  }
  return { okGlobal, resultados };
}

export default async function Home() {
  let estado = null, errorFatal = null;
  try {
    estado = await estadoSheet();
  } catch (e) {
    errorFatal = e.message;
  }

  return (
    <main style={{ minHeight: '100vh', padding: '40px 20px', maxWidth: 820, margin: '0 auto' }}>
      <IsologoDefs />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <Isologo size={40} />
        <div style={{ lineHeight: 1 }}>
          <div className="font-display" style={{ fontSize: 11, letterSpacing: 3, color: 'rgb(var(--textSec))' }}>INSTITUTO</div>
          <div className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: 1 }}>ILCE</div>
        </div>
      </div>
      <h1 style={{ fontSize: 26, margin: '10px 0 4px' }}>Fichas de Inscripción</h1>
      <p style={{ color: 'rgb(var(--textSec))', marginTop: 0 }}>
        Esqueleto desplegado correctamente. Esta pantalla verifica la conexión con la Google Sheet.
      </p>

      <section style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Estado de la Sheet</h2>
        {errorFatal ? (
          <p style={{ color: 'rgb(var(--accentMagenta))' }}>❌ No se pudo conectar: {errorFatal}</p>
        ) : (
          <>
            <p style={{ margin: '0 0 12px', color: estado.okGlobal ? 'rgb(74 222 128)' : 'rgb(251 191 36)' }}>
              {estado.okGlobal ? '✓ Conexión OK — el service account tiene acceso.' : '⚠ Conexión parcial — revisá las pestañas marcadas.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '8px 16px', fontSize: 14 }}>
              <b style={{ color: 'rgb(var(--textMuted))' }}>Pestaña</b>
              <b style={{ color: 'rgb(var(--textMuted))' }}>Encabezados</b>
              <b style={{ color: 'rgb(var(--textMuted))' }}>Filas</b>
              {estado.resultados.map((r) => (
                <FilaEstado key={r.tab} r={r} />
              ))}
            </div>
          </>
        )}
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Inicializar esquema</h2>
        <p style={{ color: 'rgb(var(--textSec))', marginTop: 0 }}>
          Si las pestañas están sin encabezados, escribí el esquema una sola vez llamando a{' '}
          <code style={code}>/api/setup?token=TU_SETUP_TOKEN</code> (usá el valor de la env var <code style={code}>SETUP_TOKEN</code>).
          Esto prueba también el permiso de <b>escritura</b>.
        </p>
      </section>

      <section style={card}>
        <h2 style={{ fontSize: 16, marginTop: 0 }}>Fichas públicas (demo)</h2>
        <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.9 }}>
          {CURSOS.map((c) => (
            <li key={c.slug}>
              <a href={`/inscripcion/${c.slug}`} style={{ color: 'rgb(var(--accentTeal))' }}>/inscripcion/{c.slug}</a>
              <span style={{ color: 'rgb(var(--textMuted))' }}> — {c.nombre}</span>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ color: 'rgb(var(--textMuted))', fontSize: 12, marginTop: 30 }}>
        fichas-ilce · v0.2 · ficha pública funcional activa
      </p>
    </main>
  );
}

function FilaEstado({ r }) {
  return (
    <>
      <span>{r.ok ? '✓' : '❌'} {r.tab}</span>
      <span style={{ color: 'rgb(var(--textSec))' }}>{r.ok ? r.headers : '—'}</span>
      <span style={{ color: 'rgb(var(--textSec))' }}>{r.ok ? r.filas : (r.error || '—')}</span>
    </>
  );
}

const card = {
  background: 'rgb(var(--surface))',
  border: '1px solid rgb(var(--border))',
  borderRadius: 16,
  padding: '18px 20px',
  marginTop: 18
};
const code = { background: 'rgb(var(--surface2))', border: '1px solid rgb(var(--border))', borderRadius: 6, padding: '2px 6px', fontSize: 13 };
