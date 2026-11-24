import gedung from '../../assets/login/gedung.webp'
import peta from '../../assets/login/peta.webp'
import siluet from '../../assets/login/siluet.webp'

// Latar halaman masuk: langit, awan, peta Indonesia, gedung (tanpa tulisan), bendera Merah Putih, dan gelombang hijau-teal.
// Hanya dekorasi: seluruh elemen disembunyikan dari pembaca layar dan tidak bisa diklik.
export default function LoginScene({ className = '' }) {
  return (
    <div className={`login-scene ${className}`} aria-hidden="true">
      <div className="ls-sky" />
      <div className="ls-dots" />

      <svg className="ls-clouds" viewBox="0 0 1600 500" preserveAspectRatio="xMidYMin slice" focusable="false">
        <defs><filter id="ls-blur" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="9" /></filter></defs>
        <g fill="#fff" filter="url(#ls-blur)" opacity=".92">
          <ellipse cx="190" cy="120" rx="170" ry="34" /><ellipse cx="290" cy="96" rx="110" ry="36" />
          <ellipse cx="860" cy="60" rx="150" ry="24" /><ellipse cx="960" cy="44" rx="80" ry="22" />
          <ellipse cx="1330" cy="190" rx="200" ry="38" /><ellipse cx="1440" cy="160" rx="120" ry="34" />
          <ellipse cx="640" cy="300" rx="130" ry="20" opacity=".7" />
        </g>
      </svg>

      <img className="ls-map" src={peta} alt="" draggable="false" />
      <img className="ls-skyline" src={siluet} alt="" draggable="false" />
      <div className="ls-pole" />
      <svg className="ls-flag" viewBox="0 0 260 170" focusable="false">
        <defs>
          <linearGradient id="ls-red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#c8102e" /><stop offset=".45" stopColor="#ef3340" /><stop offset="1" stopColor="#d4182f" /></linearGradient>
          <linearGradient id="ls-white" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#e9eef2" /><stop offset=".5" stopColor="#ffffff" /><stop offset="1" stopColor="#d6dee4" /></linearGradient>
        </defs>
        <path d="M0 6 C50 -12 90 22 135 6 C180 -10 215 18 255 4 L258 82 C216 98 182 70 136 86 C92 102 50 68 0 86 Z" fill="url(#ls-red)" />
        <path d="M0 86 C50 68 92 102 136 86 C182 70 216 98 258 82 L262 160 C220 176 184 148 138 164 C94 180 50 146 0 164 Z" fill="url(#ls-white)" />
        <path d="M0 6 C50 -12 90 22 135 6 C180 -10 215 18 255 4 L255 20 C215 34 180 8 135 22 C90 38 50 4 0 22 Z" fill="#fff" opacity=".16" />
      </svg>

      <img className="ls-building" src={gedung} alt="" draggable="false" />

      <svg className="ls-ribbon-tr" viewBox="0 0 300 320" focusable="false">
        <path d="M300 30 C230 40 190 110 110 150 C170 150 230 120 300 100 Z" fill="#d4182f" />
        <path d="M300 100 C230 120 170 150 110 150 C150 175 230 150 300 150 Z" fill="#fff" />
      </svg>

      <svg className="ls-wave" viewBox="0 0 1600 260" preserveAspectRatio="none" focusable="false">
        <defs>
          <linearGradient id="ls-w1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0b6f73" /><stop offset=".6" stopColor="#12a39b" /><stop offset="1" stopColor="#0e8a86" /></linearGradient>
          <linearGradient id="ls-w2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a5f66" /><stop offset="1" stopColor="#053a42" /></linearGradient>
        </defs>
        <path d="M0 96 C260 30 520 150 820 104 C1100 62 1330 8 1600 40 L1600 260 L0 260 Z" fill="url(#ls-w1)" opacity=".9" />
        <path d="M0 150 C300 96 640 198 980 152 C1260 114 1440 92 1600 112 L1600 260 L0 260 Z" fill="url(#ls-w2)" />
        <path d="M0 150 C300 96 640 198 980 152 C1260 114 1440 92 1600 112" fill="none" stroke="#3be0c6" strokeWidth="5" strokeLinecap="round" opacity=".85" />
        <path d="M0 18 C70 70 160 118 260 158 L0 176 Z" fill="#d4182f" opacity=".95" />
        <path d="M0 62 C80 100 190 150 330 190 C250 168 110 150 0 128 Z" fill="#fff" opacity=".95" />
      </svg>
    </div>
  )
}
