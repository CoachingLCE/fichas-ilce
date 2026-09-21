'use client';
// Gráfico de línea/área liviano en SVG puro (sin librerías nuevas) para "evolución en el
// tiempo" en Reportes. Pensado para series cortas (30-365 puntos): una sola serie principal
// (área + línea) y, opcional, una o más series secundarias solo de línea (para "por estado").
export default function MiniChart({ series, height = 180, formatValue = (v) => v }) {
  const w = 640, h = height;
  const padL = 8, padR = 8, padT = 10, padB = 22;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const principal = series[0];
  const puntos = (principal && principal.data) || [];
  if (puntos.length === 0) return <p className="muted" style={{ fontSize: 13 }}>Sin datos todavía.</p>;

  const max = Math.max(1, ...series.flatMap((s) => s.data.map((d) => d.v)));
  const n = puntos.length;
  const x = (i) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => padT + innerH - (v / max) * innerH;

  const pathLinea = (data) => data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(d.v).toFixed(1)}`).join(' ');
  const pathArea = (data) => `${pathLinea(data)} L ${x(data.length - 1).toFixed(1)} ${(padT + innerH).toFixed(1)} L ${x(0).toFixed(1)} ${(padT + innerH).toFixed(1)} Z`;

  // Etiquetas del eje X: máximo ~6, repartidas parejo para no amontonar texto.
  const pasoEtiqueta = Math.max(1, Math.ceil(n / 6));

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height, display: 'block', overflow: 'visible' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="mchArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--accentTeal))" stopOpacity="0.28" />
            <stop offset="100%" stopColor="rgb(var(--accentTeal))" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* líneas guía horizontales, muy sutiles */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={padL} x2={w - padR} y1={padT + innerH * (1 - f)} y2={padT + innerH * (1 - f)} stroke="rgb(var(--border))" strokeOpacity="0.5" strokeWidth="1" />
        ))}
        <path d={pathArea(puntos)} fill="url(#mchArea)" stroke="none" />
        <path d={pathLinea(puntos)} fill="none" stroke="rgb(var(--accentTeal))" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {series.slice(1).map((s, si) => (
          <path key={s.nombre || si} d={pathLinea(s.data)} fill="none" stroke={s.color || 'rgb(var(--accentPurple))'} strokeWidth="2" strokeDasharray={si % 2 ? '4 3' : ''} strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
        ))}
        {puntos.map((d, i) => (
          <circle key={i} cx={x(i)} cy={y(d.v)} r={n > 60 ? 0 : 3} fill="rgb(var(--accentTeal))">
            <title>{d.label}: {formatValue(d.v)}</title>
          </circle>
        ))}
        {puntos.map((d, i) => (i % pasoEtiqueta === 0 || i === n - 1) && (
          <text key={'lb' + i} x={x(i)} y={h - 4} fontSize="10" textAnchor="middle" fill="rgb(var(--textMuted))">{d.label}</text>
        ))}
      </svg>
      {series.length > 1 && (
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 6 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgb(var(--textSec))' }}><i style={{ width: 10, height: 2, background: 'rgb(var(--accentTeal))', display: 'inline-block' }} />{principal.nombre || 'Total'}</span>
          {series.slice(1).map((s, si) => (
            <span key={si} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgb(var(--textSec))' }}><i style={{ width: 10, height: 2, background: s.color || 'rgb(var(--accentPurple))', display: 'inline-block' }} />{s.nombre}</span>
          ))}
        </div>
      )}
    </div>
  );
}
