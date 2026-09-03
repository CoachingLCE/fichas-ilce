export function IsologoDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden>
      <defs>
        <linearGradient id="ig" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#96198f" />
          <stop offset=".5" stopColor="#4a128b" />
          <stop offset="1" stopColor="#0595ad" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Isologo({ size = 34 }) {
  return (
    <svg className="mark" viewBox="0 0 100 100" width={size} height={size} aria-label="Instituto ILCE">
      <g>
        <path d="M50 12 A38 38 0 0 1 84 44" strokeWidth="7" />
        <path d="M76 30 A32 32 0 0 1 70 78" strokeWidth="7" />
        <path d="M84 56 A38 38 0 0 1 44 88" strokeWidth="7" />
        <path d="M60 82 A32 32 0 0 1 18 62" strokeWidth="7" />
        <path d="M16 56 A38 38 0 0 1 30 20" strokeWidth="7" />
        <path d="M28 26 A32 32 0 0 1 66 24" strokeWidth="7" />
      </g>
    </svg>
  );
}
