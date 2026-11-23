export default function ProgressRing({ value, size = 132, label, sub }) {
  const r = 52
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, value ?? 0))
  return (
    <div className="ring" style={{ width: size, height: size }} role="img" aria-label={`${label ?? 'Progres'} ${Math.round(v * 100)} persen`}>
      <svg viewBox="0 0 120 120" width={size} height={size}>
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--ring-track)" strokeWidth="11" />
        <circle cx="60" cy="60" r={r} fill="none" stroke="url(#ringg)" strokeWidth="11" strokeLinecap="round"
          strokeDasharray={`${c * v} ${c}`} transform="rotate(-90 60 60)" />
        <defs>
          <linearGradient id="ringg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#2dd4bf" /><stop offset="1" stopColor="#0f766e" /></linearGradient>
        </defs>
      </svg>
      <div className="ring-text"><strong>{Math.round(v * 100)}%</strong>{sub && <small>{sub}</small>}</div>
    </div>
  )
}
