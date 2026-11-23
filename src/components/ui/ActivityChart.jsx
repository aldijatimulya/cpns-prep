// Grafik area sederhana untuk aktivitas harian (soal dijawab per hari).
export default function ActivityChart({ days, target }) {
  const W = 560, H = 190, padL = 30, padR = 12, padT = 14, padB = 28
  const max = Math.max(target ?? 0, ...days.map((d) => d.n), 5)
  const step = (W - padL - padR) / Math.max(1, days.length - 1)
  const x = (i) => padL + i * step
  const y = (n) => padT + (1 - n / max) * (H - padT - padB)
  const pts = days.map((d, i) => `${x(i)},${y(d.n)}`)
  const line = `M${pts.join(' L')}`
  const area = `${line} L${x(days.length - 1)},${H - padB} L${x(0)},${H - padB} Z`
  const ticks = [0, 0.5, 1].map((t) => Math.round(max * t))
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} role="img"
      aria-label={`Soal dijawab per hari: ${days.map((d) => `${d.label} ${d.n}`).join(', ')}`}>
      <defs>
        <linearGradient id="areag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#14b8a6" stopOpacity=".35" /><stop offset="1" stopColor="#14b8a6" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={padL} x2={W - padR} y1={y(t)} y2={y(t)} stroke="var(--line)" />
          <text x={padL - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{t}</text>
        </g>
      ))}
      {target > 0 && <line x1={padL} x2={W - padR} y1={y(target)} y2={y(target)} stroke="var(--muted)" strokeDasharray="4 4" />}
      <path d={area} fill="url(#areag)" />
      <path d={line} fill="none" stroke="#0f766e" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {days.map((d, i) => (
        <g key={d.key}>
          <circle cx={x(i)} cy={y(d.n)} r="4" fill="var(--surface)" stroke="#0f766e" strokeWidth="2.5" />
          <text x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{d.label}</text>
        </g>
      ))}
    </svg>
  )
}
