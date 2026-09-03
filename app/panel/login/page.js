'use client';
import { useState } from 'react';
import { guardarSesion } from '../../../lib/useSession';
import { Isologo, IsologoDefs } from '../../../components/Isologo';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar(e) {
    e?.preventDefault();
    setError(''); setCargando(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!data.ok) { setError(data.error || 'No se pudo entrar'); setCargando(false); return; }
      guardarSesion(data.token, data.usuario);
      window.location.href = '/panel';
    } catch {
      setError('Error de conexión'); setCargando(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'radial-gradient(60% 50% at 80% -5%,rgba(150,25,143,.14),transparent 60%),radial-gradient(55% 45% at 5% 8%,rgba(5,149,173,.13),transparent 60%)' }}>
      <IsologoDefs />
      <form onSubmit={entrar} style={{ width: 380, maxWidth: '100%', background: 'rgb(var(--surface))', border: '1px solid rgb(var(--border))', borderRadius: 20, padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Isologo size={36} />
          <div style={{ lineHeight: 1 }}>
            <div className="font-display" style={{ fontSize: 11, letterSpacing: 3, color: 'rgb(var(--textSec))' }}>PLATAFORMA ILCE</div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 700 }}>Panel del equipo</div>
          </div>
        </div>
        <label style={lbl}>Email</label>
        <input className="ctrl" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@institutoilce.com" autoComplete="username" />
        <label style={{ ...lbl, marginTop: 12 }}>Contraseña</label>
        <input className="ctrl" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
        {error && <p style={{ color: 'rgb(248 113 113)', fontSize: 13, margin: '12px 0 0' }}>{error}</p>}
        <button className="btn btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={cargando}>
          {cargando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
const lbl = { display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 };
