'use client';
import { useEffect, useState } from 'react';

const KEY = 'ilce-fichas-session';

function finDelDia() {
  const f = new Date();
  f.setHours(23, 59, 59, 999);
  return f.getTime();
}
// Vencimiento que trae el token firmado (solo para descartar en el navegador uno vencido; quien lo VERIFICA es el servidor).
function expiraToken(token) {
  try {
    const p = JSON.parse(atob(String(token).split('.')[0].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof p.exp === 'number' ? p.exp : null;
  } catch { return null; }
}
function borrarSesion() {
  try { window.localStorage.removeItem(KEY); window.sessionStorage.removeItem(KEY); } catch { /* */ }
}
// Token firmado de la sesión (o null si no hay sesión, no tiene token —sesión anterior a este cambio— o venció).
function leerTokenGuardado() {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(KEY) || window.sessionStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const t = JSON.parse(raw).token;
    if (!t) return null;
    const exp = expiraToken(t);
    return exp && Date.now() > exp ? null : t;
  } catch { return null; }
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
    // El token firmado se guarda junto a la sesión pero NO se entrega a las pantallas (no entra en el usuario que ven los componentes): solo lo usa el pedido a la API.
    if (datos.token) {
      const exp = expiraToken(datos.token);
      if (exp && Date.now() > exp) { borrarSesion(); return null; } // sesión de 14 días (Admin) o 24 h (resto) vencida: hay que volver a ingresar
    }
    const { _expira, token, ...usuario } = datos;
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
    const { token, ...usuarioSinToken } = usuarioData; // el token se guarda con la sesión pero no forma parte del usuario que ven las pantallas
    const esAdmin = (usuarioSinToken.roles || []).includes('Admin');
    const paraGuardar = esAdmin ? { ...usuarioSinToken, token } : { ...usuarioSinToken, token, _expira: finDelDia() };
    const storage = esAdmin || mantenerSesion ? window.localStorage : window.sessionStorage;
    storage.setItem(KEY, JSON.stringify(paraGuardar));
    setUsuario(usuarioSinToken);
  }
  function logout() {
    window.localStorage.removeItem(KEY);
    window.sessionStorage.removeItem(KEY);
    setUsuario(null);
  }
  return { usuario, cargando, login, logout };
}

// ── Sesión firmada (revisión de seguridad de octubre de 2026) ──────────────────────────────────────────────────────────────────────────────────
// Todo pedido a la API de esta misma app lleva el token de la sesión (Authorization: Bearer …): así el servidor sabe quién sos por el token y no por el email que mande el
// navegador. Se instala UNA vez para toda la app, así no hay que tocar cada pantalla. Si el servidor rechaza con "No autorizado" a una sesión que NO tiene token
// (una sesión anterior a este cambio, cuando el servidor ya exige token), se cierra la sesión y se vuelve al ingreso. Con token, un "No autorizado" no cierra nada
// (puede ser solo que esa persona no tenga permiso para esa acción). Las pantallas públicas del estudiante no tienen sesión, así que no mandan nada.
function instalarFetchConToken() {
  if (typeof window === 'undefined' || window.__ilceFetchConToken) return;
  window.__ilceFetchConToken = true;
  const original = window.fetch.bind(window);
  window.fetch = async function (input, init) {
    let url = '';
    try { url = typeof input === 'string' ? input : (input && input.url) || ''; } catch { /* */ }
    const ruta = url.startsWith('/') && !url.startsWith('//') ? url : (url.startsWith(window.location.origin + '/') ? url.slice(window.location.origin.length) : '');
    const esApi = ruta.startsWith('/api/') && !ruta.startsWith('/api/auth/login');
    const token = esApi ? leerTokenGuardado() : null;
    if (token && typeof input === 'string') {
      const h = new Headers((init && init.headers) || undefined);
      if (!h.has('Authorization')) h.set('Authorization', 'Bearer ' + token);
      init = { ...(init || {}), headers: h };
    }
    const res = await original(input, init);
    if (esApi && !token && res.status === 403 && leerSesionGuardada()) {
      try {
        const d = await res.clone().json();
        if (d && d.error === 'No autorizado') { borrarSesion(); window.location.href = '/'; }
      } catch { /* */ }
    }
    return res;
  };
}
if (typeof window !== 'undefined') instalarFetchConToken();
