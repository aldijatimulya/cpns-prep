// Ilustrasi sendiri (bukan lambang negara atau foto orang): kartu soal, target, dan buku.
export default function HeroArt() {
  return (
    <svg viewBox="0 0 360 240" className="heroart" aria-hidden="true">
      <circle cx="270" cy="60" r="70" fill="#ffffff" opacity=".08" />
      <circle cx="90" cy="200" r="60" fill="#ffffff" opacity=".07" />
      <g transform="translate(70 40)">
        <rect width="190" height="140" rx="16" fill="#fff" />
        <rect x="18" y="20" width="90" height="10" rx="5" fill="#99d8d0" />
        <rect x="18" y="42" width="150" height="8" rx="4" fill="#d9ece9" />
        <rect x="18" y="62" width="150" height="22" rx="8" fill="#e8f6f3" />
        <circle cx="32" cy="73" r="6" fill="#0f766e" />
        <rect x="46" y="70" width="90" height="6" rx="3" fill="#99d8d0" />
        <rect x="18" y="92" width="150" height="22" rx="8" fill="#f3f7f7" />
        <circle cx="32" cy="103" r="6" fill="#c3d3d3" />
        <rect x="46" y="100" width="70" height="6" rx="3" fill="#d4e0e0" />
      </g>
      <g transform="translate(250 120)">
        <circle r="42" fill="#fde68a" /><circle r="29" fill="#fff" /><circle r="16" fill="#f59e0b" /><circle r="6" fill="#fff" />
      </g>
      <g transform="translate(36 150) rotate(-8)">
        <rect width="86" height="14" rx="4" fill="#5eead4" /><rect y="14" width="86" height="14" rx="4" fill="#2dd4bf" />
        <rect y="28" width="86" height="14" rx="4" fill="#99f6e4" />
      </g>
    </svg>
  )
}
