'use client';
import { useEffect, useState } from 'react';

const KEY = 'ilce-fichas-session';

function finDelDia() {
  const f = new Date();
  f.setHours(23, 59, 59, 999);
  return f.getTime();
}
function leerSesionGuardada() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY) || window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const datos = JSON.parse(raw);
    if (datos._expira && Date.now() > datos._expira) {
      window.localStorage.removeItem(KEY);
      window.sessionStorage.removeItem(KEY);
      return null;
    }
    const { _expira, ...usuario } = datos;
    return usuario;
  } catch {
    return null;
  }
}

export function useSession() {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  useEffect(() => {
    setUsuario(leerSesionGuardada());
    setCargando(false);
    const intervalo = setInterval(() => {
      if (!leerSesionGuardada()) setUsuario(null);
    }, 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);
  function login(usuarioData, mantenerSesion = false) {
    const esAdmin = (usuarioData.roles || []).includes('Admin');
    const paraGuardar = esAdmin ? usuarioData : { ...usuarioData, _expira: finDelDia() };
    const storage = esAdmin || mantenerSesion ? window.localStorage : window.sessionStorage;
    storage.setItem(KEY, JSON.stringify(paraGuardar));
    setUsuario(usuarioData);
  }
  function logout() {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
    setUsuario(null);
  }
  return { usuario, cargando, login, logout };
}
