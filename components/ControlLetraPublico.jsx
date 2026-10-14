'use client';
import { useEffect } from 'react';
import { useEscalaLetra } from '../lib/escalaLetra';
import TamanoLetra from './TamanoLetra';

// Fila con el control "A A A" al final de la banda turquesa de las pantallas del estudiante (ficha, actividades y formularios). `oculto` en las vistas previas del panel: ahí no va.
// Mientras está en pantalla marca <html> con .escala-publica (lo que activa los tamaños escalables); el guion del <head> ya lo hizo antes de cargar, esto cubre la navegación interna.
export default function ControlLetraPublico({ oculto = false }) {
  const { nivel, cambiar } = useEscalaLetra();
  useEffect(() => {
    if (oculto) return undefined;
    document.documentElement.classList.add('escala-publica');
    return () => document.documentElement.classList.remove('escala-publica');
  }, [oculto]);
  if (oculto) return null;
  return <div className="ctl-letra-fila"><TamanoLetra variante="banda" nivel={nivel} onCambiar={cambiar} /></div>;
}
