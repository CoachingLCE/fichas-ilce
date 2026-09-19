'use client';
import { useEffect, useState } from 'react';

// Pequeña invitación cálida a hacer una pausa después de cargar/gestionar fichas — mismo
// concepto que se agregó en Presentismo ILCE, ahora acá para todo el equipo. Un mensaje
// distinto por día de la semana, fijo durante todo ese día (nada de rotación aleatoria),
// calculado con la fecha LOCAL del dispositivo de quien está mirando.
const LINK_BLOG = 'https://coachingeducativolider.com/blog';

// Index 0-6 = Date.getDay() (0 = domingo).
const MENSAJES = [
  { titulo: '✨ Prepará la semana con una buena idea', texto: 'Antes de empezar una nueva semana, podés tomarte unos minutos para leer, reflexionar y seguir aprendiendo.' },
  { titulo: '☕ Empezá la semana con una pausa', texto: 'Después de gestionar las fichas, regalate unos minutos para leer y empezar la semana con una nueva idea.' },
  { titulo: '🌱 Una pausa también puede ser aprendizaje', texto: 'Ya revisaste las inscripciones. Ahora, ¿qué tal si te tomás un café y descubrís algo nuevo?' },
  { titulo: '☕ Mitad de semana, momento para parar', texto: 'Entre una tarea y otra, hacé una pequeña pausa. Tenemos una nota para compartir con vos.' },
  { titulo: '💡 Una idea puede cambiar una mirada', texto: 'Después de gestionar las fichas, hacé una pausa y explorá una nueva perspectiva en nuestro blog.' },
  { titulo: '☕ Cerrá la semana con algo para llevarte', texto: 'Terminá de revisar las fichas, preparate un café y dedicá unos minutos a seguir aprendiendo.' },
  { titulo: '🌿 Un momento para vos y para aprender', texto: 'Terminá de revisar las fichas, preparate un mate y dedicá unos minutos a seguir aprendiendo.' }
];

export default function PausaSemanal() {
  // Se calcula recién en el cliente para que sea la fecha local del dispositivo de la
  // persona, y para no arriesgar un mismatch de hidratación entre server y browser.
  const [dia, setDia] = useState(null);
  useEffect(() => { setDia(new Date().getDay()); }, []);
  if (dia === null) return null;
  const m = MENSAJES[dia];

  // Antes ocupaba dos renglones (título + texto) en un panel propio; Diego pidió reducirlo
  // porque en un panel de gestión le quita protagonismo a lo importante. Ahora es una sola
  // línea, discreta, con el mensaje del día abreviado.
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8, borderRadius: 9, padding: '5px 12px', margin: '0 0 12px',
      background: 'rgb(var(--surface2))', opacity: 0.75, border: '1px solid rgb(var(--border))'
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'rgb(var(--textMuted))', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.titulo}</span>
      <a href={LINK_BLOG} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 'auto', flex: 'none', color: 'rgb(var(--accentTeal))', fontWeight: 700, fontSize: 11, textDecoration: 'none', whiteSpace: 'nowrap' }}>
        Leer una nota →
      </a>
    </div>
  );
}
