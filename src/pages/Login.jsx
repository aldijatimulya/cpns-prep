import { useState } from 'react'
import { BarChart3, CalendarDays, CheckCircle2, MonitorCheck, GraduationCap, Lock, LogIn, Mail, Eye, EyeOff, Target, Trophy, User, ShieldCheck } from 'lucide-react'
import Logo from '../components/ui/Logo'
import LoginScene from '../components/ui/LoginScene'
import { useAuth } from '../contexts/AuthContext'
import { isCloudEnabled } from '../services/supabase'

const features = [
  { icon: Target, c: 'blue', t: 'Latihan Soal Lengkap', d: 'Soal TWK, TIU, TKP dengan pembahasan' },
  { icon: MonitorCheck, c: 'green', t: 'Simulasi CAT', d: '110 soal, timer 100 menit seperti ujian' },
  { icon: BarChart3, c: 'orange', t: 'Analisis Mendalam', d: 'Heatmap topik kuat dan lemahmu' },
  { icon: Trophy, c: 'purple', t: 'Progres Tersimpan', d: 'Masuk dari perangkat mana pun' },
]

function Field({ icon: Icon, label, type = 'text', value, onChange, placeholder, autoComplete, autoFocus, required = true, minLength }) {
  const [show, setShow] = useState(false)
  const isPw = type === 'password'
  return (
    <label className="lf">
      <span>{label}</span>
      <span className="field">
        <Icon size={18} aria-hidden="true" />
        <input
          type={isPw && show ? 'text' : type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          autoComplete={autoComplete} autoFocus={autoFocus} required={required} minLength={minLength} maxLength={isPw ? 72 : 120}
        />
        {isPw && (
          <button type="button" className="eye" aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'} onClick={() => setShow(!show)}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
    </label>
  )
}

export default function Login() {
  const auth = useAuth()
  const [view, setView] = useState(auth.recovery ? 'recovery' : 'login') // login | register | forgot | check | sent | recovery
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const mode = auth.recovery ? 'recovery' : view

  const go = (v) => { setView(v); setErr(''); setPw(''); setPw2('') }

  const run = async (fn) => {
    setErr('')
    setBusy(true)
    try { await fn() } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const submit = (e) => {
    e.preventDefault()
    if (!isCloudEnabled) { setErr('Akun online belum dikonfigurasi. Lihat panduan, atau lanjut tanpa akun.'); return }
    if (mode === 'login') run(() => auth.signIn(email, pw))
    else if (mode === 'register') {
      if (pw.length < 8) { setErr('Password minimal 8 karakter.'); return }
      if (pw !== pw2) { setErr('Konfirmasi password tidak sama.'); return }
      run(async () => { const r = await auth.signUp(name || email.split('@')[0], email, pw); if (r.needsConfirm) setView('check') })
    } else if (mode === 'forgot') run(async () => { await auth.resetPassword(email); setView('sent') })
    else if (mode === 'recovery') {
      if (pw.length < 8) { setErr('Password minimal 8 karakter.'); return }
      if (pw !== pw2) { setErr('Konfirmasi password tidak sama.'); return }
      run(() => auth.updatePassword(pw))
    }
  }

  const titles = {
    login: ['Selamat Datang!', 'Masuk ke akun Anda untuk melanjutkan belajar dan latihan soal CPNS.'],
    register: ['Buat Akun', 'Daftar dengan email agar riwayat latihan Anda tersimpan dan bisa dibuka dari perangkat mana pun.'],
    forgot: ['Lupa Password?', 'Masukkan email akun Anda. Kami kirim tautan untuk membuat password baru.'],
    recovery: ['Password Baru', 'Buat password baru untuk akun Anda.'],
  }

  return (
    <div className="login">
      <LoginScene />
      <header className="login-top">
        <div className="login-brand"><Logo size={44} /><div><strong>CPNS Prep</strong><small>Belajar · Latihan · Sukses</small></div></div>
        <span className="pill-date"><CalendarDays size={18} aria-hidden="true" /> Seleksi CPNS <b>2026</b></span>
      </header>

      <section className="login-hero" aria-label="Tentang CPNS Prep">
        <span className="hero-badge"><Trophy size={16} aria-hidden="true" /> Persiapkan Diri, Raih Masa Depan</span>
        <h1>Belajar mandiri{' '}<br />untuk seleksi{' '}<br /><em>CPNS 2026</em></h1>
        <p>Latihan soal, simulasi CAT, dan analisis kelemahan dalam satu tempat. Persiapkan dirimu meraih karir sebagai <strong>ASN terbaik</strong> di Indonesia!</p>
        <ul className="feat">
          {features.map(({ icon: Icon, c, t, d }) => (
            <li key={t} className={c}><span className="feat-ico"><Icon size={26} aria-hidden="true" /></span><strong>{t}</strong><small>{d}</small></li>
          ))}
        </ul>
      </section>

      <section className="login-card" aria-label="Masuk atau daftar">
        <div className="login-box">
          <span className="login-ico"><GraduationCap size={34} aria-hidden="true" /></span>
          {mode === 'check' || mode === 'sent' ? (
            <div className="done">
              <CheckCircle2 size={44} aria-hidden="true" />
              <h2>Cek email Anda</h2>
              <p>
                {mode === 'check'
                  ? <>Kami mengirim tautan konfirmasi ke <b>{email}</b>. Klik tautan itu, lalu kembali ke sini untuk masuk.</>
                  : <>Jika <b>{email}</b> terdaftar, tautan untuk membuat password baru sudah dikirim. Cek juga folder spam.</>}
              </p>
              <button className="btn wide" onClick={() => go('login')}>Ke halaman masuk</button>
            </div>
          ) : (
            <>
              <h2>{titles[mode][0]}</h2>
              <p className="muted lead">{titles[mode][1]}</p>
              {!isCloudEnabled && (
                <p className="alert warn" role="note">
                  Akun online belum diaktifkan di versi ini (Supabase belum dihubungkan). Ikuti panduan, atau lanjut tanpa akun, data disimpan di browser ini saja.
                </p>
              )}
              <form onSubmit={submit} className="login-form" noValidate={false}>
                {mode === 'register' && <Field icon={User} label="Nama panggilan" value={name} onChange={setName} placeholder="Contoh: Aldi" autoComplete="nickname" required={false} autoFocus />}
                {mode !== 'recovery' && <Field icon={Mail} label="Email" type="email" value={email} onChange={setEmail} placeholder="nama@email.com" autoComplete="email" autoFocus={mode !== 'register'} />}
                {mode !== 'forgot' && (
                  <Field
                    icon={Lock} label={mode === 'recovery' ? 'Password baru' : 'Password'} type="password" value={pw} onChange={setPw}
                    placeholder={mode === 'login' ? 'Masukkan password Anda' : 'Minimal 8 karakter'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    minLength={mode === 'login' ? undefined : 8} autoFocus={mode === 'recovery'}
                  />
                )}
                {(mode === 'register' || mode === 'recovery') && (
                  <Field icon={Lock} label="Ulangi password" type="password" value={pw2} onChange={setPw2} placeholder="Ketik ulang password" autoComplete="new-password" minLength={8} />
                )}
                {mode === 'login' && (
                  <div className="login-row">
                    <span className="muted small-note">Sesi tersimpan otomatis di perangkat ini</span>
                    <button type="button" className="link" onClick={() => go('forgot')}>Lupa Password?</button>
                  </div>
                )}
                {err && <p className="alert bad" role="alert">{err}</p>}
                <button className="btn wide big" type="submit" disabled={busy || !isCloudEnabled}>
                  <LogIn size={18} aria-hidden="true" />
                  {busy ? 'Memproses…' : { login: 'Masuk', register: 'Daftar', forgot: 'Kirim tautan', recovery: 'Simpan password' }[mode]}
                </button>
              </form>
              {mode !== 'recovery' && (
                <>
                  <div className="sep"><span>atau</span></div>
                  <button type="button" className="btn ghost wide" onClick={auth.continueAsGuest}>Lanjut tanpa akun (data di browser ini)</button>
                </>
              )}
              <p className="switch">
                {mode === 'login' && <>Belum punya akun? <button type="button" className="link" onClick={() => go('register')}>Daftar Sekarang →</button></>}
                {mode === 'register' && <>Sudah punya akun? <button type="button" className="link" onClick={() => go('login')}>Masuk →</button></>}
                {mode === 'forgot' && <button type="button" className="link" onClick={() => go('login')}>← Kembali ke masuk</button>}
              </p>
            </>
          )}
        </div>
        <p className="login-note">Alat bantu belajar pribadi. Bukan aplikasi resmi pemerintah.</p>
      </section>

      <footer className="login-foot"><ShieldCheck size={22} aria-hidden="true" /> BERSAMA CPNS PREP, WUJUDKAN MIMPI MENJADI ASN</footer>
    </div>
  )
}
