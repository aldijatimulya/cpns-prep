import { useState } from 'react'
import { BarChart3, ClipboardCheck, Lock, Sparkles, Target, User } from 'lucide-react'
import Logo from '../components/ui/Logo'
import HeroArt from '../components/ui/HeroArt'
import { useStore } from '../contexts/StoreContext'

const features = [
  { icon: Target, t: 'Latihan per topik', d: 'Soal TWK, TIU, dan TKP dengan pembahasan.' },
  { icon: ClipboardCheck, t: 'Simulasi CAT 110 soal', d: 'Timer 100 menit seperti ujian sungguhan.' },
  { icon: BarChart3, t: 'Heatmap kelemahan', d: 'Lihat topik yang perlu diperdalam.' },
  { icon: Sparkles, t: 'Tutor AI (opsional)', d: 'Tanya penjelasan lebih dalam per soal.' },
]

export default function Login() {
  const { setProfile } = useStore()
  const [name, setName] = useState('')
  const submit = (e) => {
    e.preventDefault()
    if (name.trim()) setProfile(name)
  }
  return (
    <div className="login">
      <section className="login-hero" aria-label="Tentang CPNS Prep">
        <div className="login-brand"><Logo size={44} /><strong>CPNS Prep</strong></div>
        <h1>Belajar mandiri untuk seleksi CPNS 2026</h1>
        <p>Latihan soal, simulasi CAT, dan analisis kelemahan dalam satu tempat.</p>
        <ul className="feat">
          {features.map(({ icon: Icon, t, d }) => (
            <li key={t}><span className="feat-ico"><Icon size={18} aria-hidden="true" /></span><div><strong>{t}</strong><small>{d}</small></div></li>
          ))}
        </ul>
        <HeroArt />
      </section>
      <section className="login-card">
        <div className="login-box">
          <Logo size={52} />
          <h2>Selamat datang!</h2>
          <p className="muted">Masukkan nama panggilan untuk melanjutkan belajar.</p>
          <form onSubmit={submit} className="login-form">
            <label>Nama panggilan
              <span className="field"><User size={18} aria-hidden="true" />
                <input autoFocus autoComplete="nickname" maxLength={40} value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Aldi" />
              </span>
            </label>
            <button className="btn wide" type="submit" disabled={!name.trim()}>Masuk</button>
            <button className="btn ghost wide" type="button" onClick={() => setProfile('Tamu')}>Lanjut sebagai tamu</button>
          </form>
          <div className="sep"><span>atau</span></div>
          <button className="btn ghost wide" disabled title="Perlu proyek Supabase"><Lock size={16} aria-hidden="true" /> Masuk dengan akun online (segera)</button>
          <p className="login-note">
            Data belajar tersimpan di browser perangkat ini saja. Akun online untuk sinkronisasi antar perangkat
            belum aktif. Ini bukan aplikasi resmi pemerintah.
          </p>
        </div>
      </section>
    </div>
  )
}
