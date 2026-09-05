'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '../../../lib/useSession';
import ThemeSelector from '../../../components/ThemeSelector';
import { Isologo, IsologoDefs } from '../../../components/Isologo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [mantenerSesion, setMantenerSesion] = useState(true);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const { login } = useSession();
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'No se pudo iniciar sesión'); return; }
      login(data.usuario, mantenerSesion);
      router.push('/panel');
    } catch {
      setError('Error de conexión. Probá de nuevo.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'radial-gradient(60% 50% at 80% -5%,rgba(150,25,143,.14),transparent 60%),radial-gradient(55% 45% at 5% 8%,rgba(5,149,173,.13),transparent 60%)' }}>
      <IsologoDefs />
      <div style={{ position: 'fixed', top: 16, right: 16 }}><ThemeSelector /></div>
      <form onSubmit={handleSubmit} style={{ width: 360, maxWidth: '100%', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 20, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Isologo size={36} />
          <div style={{ lineHeight: 1 }}>
            <div className="font-display" style={{ fontSize: 11, letterSpacing: 3, color: 'rgb(var(--textSec))' }}>PLATAFORMA ILCE</div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>Panel del equipo</div>
          </div>
        </div>
        <label style={lbl}>Email</label>
        <input className="ctrl" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@institutoilce.com" autoComplete="username" />
        <label style={{ ...lbl, marginTop: 12 }}>Contraseña</label>
        <div style={{ position: 'relative' }}>
          <input className="ctrl" type={verPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" style={{ paddingRight: 40 }} />
          <button type="button" onClick={() => setVerPassword(!verPassword)} title={verPassword ? 'Ocultar' : 'Mostrar'}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 0, cursor: 'pointer', fontSize: 15 }}>
            {verPassword ? '🙈' : '👁️'}
          </button>
        </div>
        {error && <p style={{ color: 'rgb(248 113 113)', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgb(var(--textSec))', margin: '14px 0 4px', cursor: 'pointer' }}>
          <input type="checkbox" checked={mantenerSesion} onChange={(e) => setMantenerSesion(e.target.checked)} /> Mantener sesión abierta
        </label>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
        <p style={{ color: 'rgb(var(--textMuted))', fontSize: 12, textAlign: 'center', marginTop: 12 }}>
          ¿No tenés contraseña? Pedile a Diego que te la asigne desde “Accesos”.
        </p>
      </form>
    </main>
  );
}
const lbl = { display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 };
