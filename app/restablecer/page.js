'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import ThemeSelector from '../../components/ThemeSelector';
import { Isologo, IsologoDefs } from '../../components/Isologo';

export default function Restablecer() {
  const [token, setToken] = useState(null);          // null = todavía leyendo; '' = no hay enlace
  const [password, setPassword] = useState('');
  const [repetir, setRepetir] = useState('');
  const [ver, setVer] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get('token') || '';
    setToken(t);
    try { window.history.replaceState(null, '', window.location.pathname); } catch { /* el código queda solo en memoria: no en la barra de direcciones ni en el historial */ }
  }, []);

  async function enviar(e) {
    e.preventDefault(); setError('');
    if (password !== repetir) { setError('Las dos contraseñas no coinciden.'); return; }
    setCargando(true);
    try {
      const res = await fetch('/api/auth/restablecer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, password }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error || 'No se pudo guardar la contraseña.'); return; }
      setListo(true);
    } catch { setError('Error de conexión. Probá de nuevo.'); }
    finally { setCargando(false); }
  }

  const inputCls = 'w-full bg-bg border border-border rounded-lg px-3 py-2 text-sm mb-3';
  return (
    <div className="flex justify-center pt-24 px-6">
      <IsologoDefs />
      <div className="fixed top-4 right-4"><ThemeSelector /></div>
      <div className="w-80 bg-surface2 border border-border rounded-2xl p-7">
        <div className="flex justify-center mb-3"><Isologo size={44} /></div>
        <h1 className="text-center font-display text-lg font-bold text-text leading-tight">Contraseña nueva</h1>
        {token === null ? null : listo ? (
          <div data-listo>
            <p className="text-center text-textSec text-[13px] mt-2 mb-5" role="status">¡Listo! Tu contraseña se cambió. Ya podés ingresar con la nueva.</p>
            <Link href="/" className="block w-full text-center bg-gradient-to-r from-accentPurple to-accentMagenta text-white rounded-lg py-2.5 font-semibold text-sm">Ir a ingresar</Link>
          </div>
        ) : !token ? (
          <div data-sin-enlace>
            <p className="text-center text-textSec text-[13px] mt-2 mb-5" role="alert">Este enlace no es válido o ya lo abriste. Pedí uno nuevo desde la pantalla de ingreso.</p>
            <Link href="/" className="block w-full text-center bg-surface border border-border text-text rounded-lg py-2.5 font-semibold text-sm">Volver al ingreso</Link>
          </div>
        ) : (
          <>
            <p className="text-center text-textSec text-[13px] mb-5 mt-0.5">Elegí una contraseña nueva para tu usuario.</p>
            <form onSubmit={enviar}>
              <label htmlFor="nueva-password" className="text-[13px] font-semibold text-textSec block mb-1">Contraseña nueva</label>
              <input id="nueva-password" type={ver ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
              <label htmlFor="repetir-password" className="text-[13px] font-semibold text-textSec block mb-1">Repetila</label>
              <input id="repetir-password" type={ver ? 'text' : 'password'} required autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} className={inputCls} />
              <label className="flex items-center gap-2 text-[13px] text-textSec mb-1 cursor-pointer min-h-[32px]">
                <input type="checkbox" className="accent-accentMagenta w-4 h-4" checked={ver} onChange={(e) => setVer(e.target.checked)} /> Mostrar las contraseñas
              </label>
              <p className="text-textMuted text-[13px] mb-3">Mínimo 8 caracteres, con letras y números.</p>
              {error && <p role="alert" className="text-warningText text-[13px] mb-3" data-error>{error}</p>}
              <button type="submit" disabled={cargando} className="w-full bg-gradient-to-r from-accentPurple to-accentMagenta text-white rounded-lg py-2.5 font-semibold text-sm disabled:opacity-60">{cargando ? 'Guardando…' : 'Guardar contraseña'}</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
