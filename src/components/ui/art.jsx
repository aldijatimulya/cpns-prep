// Ilustrasi vektor buatan sendiri (bukan lambang negara, logo instansi, atau foto orang).
// Gedung di sini generik, tanpa tulisan instansi, agar tidak terkesan aplikasi resmi pemerintah.

const WIN = '#5aa0c4'

function Flag({ x, y, w = 74, h = 48 }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M0 0 C${w * 0.25} -6 ${w * 0.6} 6 ${w} 0 L${w} ${h / 2} L0 ${h / 2} Z`} fill="#e63946" />
      <path d={`M0 ${h / 2} L${w} ${h / 2} L${w} ${h} C${w * 0.6} ${h + 6} ${w * 0.25} ${h - 6} 0 ${h} Z`} fill="#fff" />
    </g>
  )
}

function Tree({ x, y, s = 1 }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-4" width="6" height="22" rx="3" fill="#2d6a4f" />
      <circle cx="0" cy="-22" r="26" fill="#2fa36b" />
      <circle cx="-18" cy="-8" r="18" fill="#3dbb7d" />
      <circle cx="18" cy="-8" r="18" fill="#27935f" />
    </g>
  )
}

/** Gedung pemerintahan generik dengan tiang bendera merah putih. */
export function BuildingArt({ className = '' }) {
  return (
    <svg viewBox="0 0 520 300" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bd-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f7fbfd" /><stop offset="1" stopColor="#bdd3e0" /></linearGradient>
        <linearGradient id="bd-roof" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#d3e3ec" /></linearGradient>
      </defs>
      <ellipse cx="300" cy="268" rx="230" ry="14" fill="#06323a" opacity=".18" />
      <rect x="40" y="130" width="130" height="136" rx="4" fill="url(#bd-wall)" />
      <rect x="450" y="130" width="70" height="136" rx="4" fill="url(#bd-wall)" />
      {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => <rect key={`l${r}${c}`} x={58 + c * 38} y={148 + r * 28} width="22" height="16" rx="2" fill={WIN} opacity=".75" />))}
      {[0, 1, 2, 3].map((r) => [0, 1].map((c) => <rect key={`r${r}${c}`} x={462 + c * 28} y={148 + r * 28} width="18" height="16" rx="2" fill={WIN} opacity=".75" />))}
      <rect x="150" y="104" width="320" height="162" rx="4" fill="url(#bd-wall)" />
      <path d="M140 108 L310 48 L480 108 Z" fill="url(#bd-roof)" />
      <path d="M140 108 L310 48 L480 108" fill="none" stroke="#9fbdcc" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="310" cy="84" r="12" fill="#f6b81a" /><circle cx="310" cy="84" r="6" fill="#fff" opacity=".8" />
      <rect x="150" y="112" width="320" height="12" fill="#9fbdcc" opacity=".6" />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <g key={i}>
          <rect x={172 + i * 42} y="128" width="16" height="122" rx="3" fill="#fff" stroke="#c4d8e3" />
          <rect x={168 + i * 42} y="124" width="24" height="7" rx="2" fill="#e5eff5" />
        </g>
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={196 + i * 42} y="150" width="18" height="70" rx="3" fill={WIN} opacity=".55" />)}
      <rect x="136" y="250" width="348" height="9" fill="#cfdfe8" /><rect x="124" y="259" width="372" height="9" fill="#bccfdb" />
      <line x1="92" y1="30" x2="92" y2="130" stroke="#e8f1f5" strokeWidth="4" strokeLinecap="round" />
      <circle cx="92" cy="28" r="5" fill="#f6b81a" />
      <Flag x={96} y={34} />
      <Tree x={24} y={250} s={0.9} />
      <Tree x={508} y={252} s={0.75} />
    </svg>
  )
}

/** Tumpukan buku TWK / TIU / TKP dengan toga. */
export function BooksArt({ className = '' }) {
  const book = (y, x, w, c1, c2, label) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="52" rx="8" fill={c2} />
      <rect x="0" width={w - 10} height="52" rx="8" fill={c1} />
      <rect x={w - 14} y="7" width="12" height="38" rx="3" fill="#fff" opacity=".92" />
      <rect x={w - 14} y="13" width="12" height="2" fill="#cfd8dc" /><rect x={w - 14} y="21" width="12" height="2" fill="#cfd8dc" /><rect x={w - 14} y="29" width="12" height="2" fill="#cfd8dc" />
      <text x="18" y="35" fontSize="24" fontWeight="800" fill="#fff" fontFamily="Plus Jakarta Sans Variable, system-ui, sans-serif">{label}</text>
    </g>
  )
  return (
    <svg viewBox="0 0 300 250" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="150" cy="232" rx="125" ry="12" fill="#06323a" opacity=".18" />
      {book(172, 14, 250, '#2f9e44', '#1f6f31', 'TKP')}
      {book(118, 28, 236, '#1d5fbf', '#123f85', 'TIU')}
      {book(64, 40, 222, '#1b6f8a', '#0e4a60', 'TWK')}
      <g transform="translate(150 44)">
        <path d="M-62 4 L0 -22 L62 4 L0 30 Z" fill="#14343b" />
        <path d="M-34 18 L-34 40 C-14 52 14 52 34 40 L34 18 L0 33 Z" fill="#0e2a30" />
        <line x1="50" y1="9" x2="50" y2="46" stroke="#f6b81a" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="50" r="5" fill="#f6b81a" />
      </g>
    </svg>
  )
}

/** Layar CAT dengan daftar centang dan timer. */
export function MonitorArt({ className = '' }) {
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="160" cy="224" rx="110" ry="9" fill="#06323a" opacity=".18" />
      <rect x="40" y="24" width="240" height="160" rx="14" fill="#102f36" />
      <rect x="50" y="34" width="220" height="140" rx="8" fill="#f4fafb" />
      <rect x="62" y="46" width="70" height="10" rx="5" fill="#14a39a" />
      <rect x="214" y="44" width="46" height="14" rx="7" fill="#f6b81a" />
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(62 ${70 + i * 24})`}>
          <rect width="196" height="18" rx="9" fill={i === 1 ? '#d7f0ec' : '#e8f0f2'} />
          <circle cx="11" cy="9" r="6" fill={i === 1 ? '#0f8f86' : '#b9ccd1'} />
          {i === 1 && <path d="M8 9 l2.4 2.4 L14.5 6.5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
          <rect x="26" y="6" width={90 - i * 10} height="6" rx="3" fill="#b9ccd1" />
        </g>
      ))}
      <rect x="128" y="184" width="64" height="18" rx="4" fill="#1c4a54" />
      <rect x="100" y="200" width="120" height="10" rx="5" fill="#2a6370" />
    </svg>
  )
}

/** Kalender dengan tanda centang. */
export function CalendarArt({ className = '' }) {
  return (
    <svg viewBox="0 0 320 240" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="160" cy="224" rx="110" ry="9" fill="#06323a" opacity=".18" />
      <rect x="70" y="36" width="180" height="170" rx="18" fill="#fff" />
      <path d="M70 54 a18 18 0 0 1 18 -18 h144 a18 18 0 0 1 18 18 v32 h-180 Z" fill="#14a39a" />
      <rect x="108" y="22" width="10" height="28" rx="5" fill="#f6b81a" /><rect x="202" y="22" width="10" height="28" rx="5" fill="#f6b81a" />
      {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
        <rect key={`${r}${c}`} x={88 + c * 38} y={102 + r * 32} width="26" height="20" rx="6" fill={r === 1 && c === 2 ? '#f6b81a' : '#e3eef0'} />
      )))}
      <circle cx="236" cy="188" r="26" fill="#2fa36b" />
      <path d="M224 188 l8 8 l16 -17" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Siluet kota untuk dasar sidebar. */
export function Skyline({ className = '' }) {
  return (
    <svg viewBox="0 0 272 110" className={className} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d="M0 110 V84 q40 -26 80 -8 q40 -22 90 -4 q50 -18 102 6 V110 Z" fill="#14a39a" opacity=".38" />
      <path d="M0 110 V96 q60 -22 120 -6 q80 -20 152 4 V110 Z" fill="#0e8a86" opacity=".5" />
      <g fill="#0b5a62" opacity=".85">
        <rect x="18" y="66" width="14" height="44" /><rect x="34" y="58" width="12" height="52" />
        <path d="M60 110 V74 h26 V110 Z" /><path d="M60 74 q13 -22 26 0 Z" /><rect x="72" y="46" width="2" height="12" />
        <rect x="104" y="40" width="7" height="70" /><rect x="102" y="36" width="11" height="6" />
        <rect x="124" y="70" width="18" height="40" /><rect x="146" y="60" width="14" height="50" />
        <path d="M176 110 V72 h24 V110 Z" /><path d="M176 72 q12 -20 24 0 Z" />
        <rect x="212" y="64" width="16" height="46" /><rect x="232" y="76" width="18" height="34" />
      </g>
    </svg>
  )
}

/** Latar halaman masuk: awan, kota, gedung, dan pita merah putih. Koordinat 1600x900, dipotong (slice) mengikuti layar. */
export function LoginScene({ className = '' }) {
  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9bd1f2" /><stop offset=".55" stopColor="#d9edf8" /><stop offset="1" stopColor="#f2f9fc" /></linearGradient>
        <linearGradient id="ls-wall" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#bcd2df" /></linearGradient>
      </defs>
      <rect width="1600" height="900" fill="url(#ls-sky)" />
      <g fill="#fff" opacity=".9">
        <ellipse cx="300" cy="120" rx="150" ry="38" /><ellipse cx="400" cy="100" rx="90" ry="34" /><ellipse cx="1180" cy="150" rx="170" ry="40" /><ellipse cx="1290" cy="128" rx="100" ry="34" />
        <ellipse cx="820" cy="70" rx="120" ry="26" />
      </g>
      <path d="M520 60 q40 -26 90 -4 q30 14 40 34 q-34 4 -60 -2 q-40 8 -74 -6 q-4 -14 4 -22 Z" fill="#cde3ef" opacity=".6" />
      {/* kota di belakang */}
      <g fill="#8dbad6" opacity=".55">
        <rect x="40" y="600" width="60" height="300" /><rect x="110" y="540" width="70" height="360" /><rect x="190" y="620" width="50" height="280" />
        <rect x="1180" y="580" width="60" height="320" /><rect x="1250" y="520" width="76" height="380" /><rect x="1336" y="610" width="56" height="290" /><rect x="1400" y="560" width="70" height="340" /><rect x="1480" y="630" width="90" height="270" />
      </g>
      {/* monumen generik */}
      <g transform="translate(1010 300)" fill="#c9dbe6" opacity=".85">
        <rect x="0" y="160" width="14" height="440" /><path d="M-6 160 h26 l-13 -26 Z" /><circle cx="7" cy="124" r="12" fill="#f6b81a" />
      </g>
      {/* gedung */}
      <g transform="translate(560 250)">
        <rect x="-70" y="190" width="120" height="470" fill="url(#ls-wall)" opacity=".92" />
        <rect x="0" y="120" width="400" height="540" fill="url(#ls-wall)" />
        <rect x="-6" y="96" width="412" height="30" fill="#d3e3ec" />
        <rect x="130" y="30" width="140" height="70" fill="url(#ls-wall)" /><rect x="120" y="22" width="160" height="12" fill="#c4d8e3" />
        {Array.from({ length: 8 }).map((_, r) => Array.from({ length: 6 }).map((__, c) => <rect key={`${r}${c}`} x={24 + c * 60} y={150 + r * 58} width="38" height="32" rx="3" fill="#5499c1" opacity=".62" />))}
        {Array.from({ length: 8 }).map((_, r) => Array.from({ length: 2 }).map((__, c) => <rect key={`w${r}${c}`} x={-56 + c * 52} y={214 + r * 58} width="32" height="32" rx="3" fill="#5499c1" opacity=".55" />))}
      </g>
      {/* tiang dan bendera */}
      <line x1="500" y1="170" x2="500" y2="640" stroke="#eef5f8" strokeWidth="7" strokeLinecap="round" />
      <circle cx="500" cy="164" r="8" fill="#f6b81a" />
      <g transform="translate(508 176)">
        <path d="M0 0 C46 -16 100 16 168 -2 L168 58 C100 76 46 44 0 60 Z" fill="#e63946" />
        <path d="M0 60 C46 44 100 76 168 58 L168 118 C100 136 46 104 0 120 Z" fill="#fff" />
      </g>
      {/* bukit, pita emas, dan pita merah putih */}
      <path d="M-40 760 C260 700 520 800 820 770 C1100 742 1300 680 1660 700 V900 H-40 Z" fill="#0e8a86" opacity=".93" />
      <path d="M-40 820 C300 770 640 880 980 836 C1250 802 1450 770 1660 790 V900 H-40 Z" fill="#0a5f66" />
      <path d="M-40 740 C250 684 520 780 820 752 C1100 726 1320 650 1660 676" fill="none" stroke="#f6b81a" strokeWidth="9" strokeLinecap="round" />
      <path d="M-40 760 C-10 820 90 860 190 900 H-40 Z" fill="#e63946" opacity=".92" />
      <path d="M-40 790 C10 840 120 880 230 900 H100 C60 870 0 840 -40 830 Z" fill="#fff" opacity=".95" />
      <g transform="translate(240 690)" fill="#2fa36b"><circle r="34" /><circle cx="-26" cy="14" r="24" fill="#3dbb7d" /><circle cx="28" cy="14" r="24" fill="#27935f" /></g>
    </svg>
  )
}
