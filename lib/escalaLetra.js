'use client';
import { useCallback, useEffect, useState } from 'react';

// Tamaño de la letra elegido por cada persona ("Aa" en la barra lateral). Se guarda en su navegador y vale para las pantallas de datos del panel (clase .zona-lectura).
export const NIVELES = [
  { id: 'normal', escala: 1, etiqueta: 'Normal' },
  { id: 'grande', escala: 1.12, etiqueta: 'Grande' },
  { id: 'muy-grande', escala: 1.25, etiqueta: 'Muy grande' }
];
const KEY = 'ilce-fichas-letra';

/** Tamaño en px que se multiplica por la escala elegida: <div style={{ fontSize: letra(13) }}>. Fuera de la zona de lectura (sin --escala-letra) vale 1. */
export const letra = (px) => `calc(${px}px * var(--escala-letra, 1))`;

export function useEscalaLetra() {
  const [nivel, setNivel] = useState('normal'); // arranca en "normal" también en el servidor; el valor guardado se lee recién al montar (evita diferencias de hidratación)
  useEffect(() => {
    try { const g = window.localStorage.getItem(KEY); if (NIVELES.some((n) => n.id === g)) setNivel(g); } catch { /* navegador sin almacenamiento: queda en normal */ }
  }, []);
  const cambiar = useCallback((id) => {
    if (!NIVELES.some((n) => n.id === id)) return;
    setNivel(id);
    try { window.localStorage.setItem(KEY, id); } catch { /* no se pudo guardar: vale para esta sesión */ }
  }, []);
  const escala = (NIVELES.find((n) => n.id === nivel) || NIVELES[0]).escala;
  return { nivel, escala, cambiar };
}
