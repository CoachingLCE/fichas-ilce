'use client';
import { NIVELES } from '../lib/escalaLetra';

// Control "Aa": tres botones (Normal / Grande / Muy grande). Mismo estilo que el selector de tema que tiene al lado.
const TAM = { normal: 11, grande: 14, 'muy-grande': 17 };
export default function TamanoLetra({ nivel, onCambiar, variante = 'panel' }) {
  if (variante === 'banda') {
    // Sobre la banda turquesa de la ficha, las actividades y los formularios del estudiante (estilos en globals.css: .ctl-letra).
    return (
      <div className="ctl-letra" role="radiogroup" aria-label="Tamaño de la letra">
        {NIVELES.map((n) => (
          <button key={n.id} type="button" role="radio" aria-checked={nivel === n.id} aria-label={`Letra ${n.etiqueta.toLowerCase()}`} title={`Tamaño de la letra: ${n.etiqueta}`} onClick={() => onCambiar(n.id)} style={{ fontSize: TAM[n.id] + 2 }}>A</button>
        ))}
      </div>
    );
  }
  return (
    <div role="radiogroup" aria-label="Tamaño de la letra" data-tour="tamano-letra"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: 'rgb(var(--surface2))', border: '1px solid rgb(var(--border))', borderRadius: 10, padding: 2 }}>
      {NIVELES.map((n) => (
        <button key={n.id} type="button" role="radio" aria-checked={nivel === n.id} aria-label={`Letra ${n.etiqueta.toLowerCase()}`} title={`Tamaño de la letra: ${n.etiqueta}`} onClick={() => onCambiar(n.id)}
          style={{
            width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 0, cursor: 'pointer',
            fontSize: TAM[n.id], fontWeight: 600, lineHeight: 1, color: nivel === n.id ? '#fff' : 'inherit',
            background: nivel === n.id ? 'linear-gradient(135deg,rgb(var(--accentPurple)),rgb(var(--accentMagenta)))' : 'transparent'
          }}>
          A
        </button>
      ))}
    </div>
  );
}
