'use client';
import { useState, useEffect } from 'react';

const KEY = 'ilce_session';

export function guardarSesion(token, usuario) {
  localStorage.setItem(KEY, JSON.stringify({ token, usuario, t: Date.now() }));
}
export function cerrarSesion() {
  localStorage.removeItem(KEY);
  window.location.href = '/panel/login';
}
export function leerSesion() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (!s || !s.token) return null;
    // el token trae exp; si venció, lo limpiamos
    const body = s.token.split('.')[0];
    const data = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    if (!data.exp || Date.now() > data.exp) { localStorage.removeItem(KEY); return null; }
    return s;
  } catch { return null; }
}

export function useSession() {
  const [sesion, setSesion] = useState(undefined); // undefined = cargando
  useEffect(() => { setSesion(leerSesion()); }, []);
  return sesion;
}

// fetch autenticado (agrega el Bearer token)
export async function authFetch(url, opts = {}) {
  const s = leerSesion();
  const headers = { ...(opts.headers || {}) };
  if (s) headers.Authorization = 'Bearer ' + s.token;
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) { cerrarSesion(); }
  return res;
}
