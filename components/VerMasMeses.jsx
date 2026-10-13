'use client';
import { nombreMes } from '../lib/respuestasPorMes';

// Pie común de las pantallas de "Respuestas": cuántas se ven y el botón para sumar el mes anterior ("Ver más · Septiembre 2026 (23)").
// `conConteo=false` cuando la pantalla ya muestra el conteo arriba (Fichas completadas).
export default function VerMasMeses({ visibles, total, proximoMes, onVerMas, etiqueta = 'respuestas', conConteo = true }) {
  if (!total) return null;
  return (
    <div data-pie="meses" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap', margin: '16px 0 4px' }}>
      {conConteo && <span className="muted" style={{ fontSize: 13 }}>Mostrando <b>{visibles}</b> de <b>{total}</b> {etiqueta}</span>}
      {proximoMes && <button className="btn-sm solid" onClick={onVerMas}>Ver más · {nombreMes(proximoMes.clave)} ({proximoMes.cantidad})</button>}
    </div>
  );
}
