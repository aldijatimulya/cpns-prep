import { useState } from 'react'
import { Cloud, KeyRound, Settings as Cog, UserRound } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import { useAuth } from '../contexts/AuthContext'
import { useStore } from '../contexts/StoreContext'
import { curriculum, examConfig } from '../data'
import { exportState } from '../services/storage'
import { OPENAI_PRESETS, PROVIDERS, defaultConfig, loadTutorConfig, saveTutorConfig } from '../services/tutor'

const syncText = {
  idle: 'Belum disinkronkan',
  syncing: 'Menyimpan ke akun…',
  saved: 'Semua perubahan tersimpan di akun Anda',
  offline: 'Sedang offline. Perubahan tersimpan di perangkat dan dikirim saat online lagi',
  error: 'Gagal menyimpan ke akun. Coba kirim ulang',
}

export default function Settings() {
  const { state, reset, importBackup, setProfile, logout, mode, sync, retrySync, email, profileName } = useStore()
  const auth = useAuth()
  const cloud = mode === 'cloud'
  const [pname, setPname] = useState(profileName)
  const [accMsg, setAccMsg] = useState('')
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwMsg, setPwMsg] = useState({ ok: false, text: '' })
  const [msg, setMsg] = useState('')
  const [tutor, setTutor] = useState(loadTutorConfig)
  const [tutorMsg, setTutorMsg] = useState('')

  const saveName = async () => {
    setAccMsg('')
    try {
      if (cloud) await auth.updateName(pname)
      else setProfile(pname)
      setAccMsg('Nama disimpan.')
    } catch (err) {
      setAccMsg(err.message)
    }
  }
  const savePw = async (e) => {
    e.preventDefault()
    if (pw.length < 8) { setPwMsg({ ok: false, text: 'Password minimal 8 karakter.' }); return }
    if (pw !== pw2) { setPwMsg({ ok: false, text: 'Konfirmasi password tidak sama.' }); return }
    try {
      await auth.updatePassword(pw)
      setPw(''); setPw2('')
      setPwMsg({ ok: true, text: 'Password diperbarui.' })
    } catch (err) {
      setPwMsg({ ok: false, text: err.message })
    }
  }
  const onImport = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const n = importBackup(await f.text())
      setMsg(`Cadangan digabungkan: ${n} sesi baru ditambahkan.`)
    } catch (err) {
      setMsg(err.message)
    }
  }

  const download = () => {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cpns-prep-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageHero
        art="calendar"
        kicker={<><Cog size={16} aria-hidden="true" /> Pengaturan</>}
        title="Pengaturan"
        text={cloud ? 'Akun online: data belajar Anda tersimpan di akun dan bisa dibuka dari perangkat mana pun.' : 'Mode tamu: data tersimpan di browser ini saja.'}
      />
      <section className="card form">
        <h2><UserRound size={18} className="ico-teal" aria-hidden="true" /> Akun</h2>
        {cloud && <p>Email: <b>{email}</b></p>}
        {cloud && (
          <p className={`sync-line ${sync}`} role="status">
            <Cloud size={16} aria-hidden="true" /> {syncText[sync]}
            {(sync === 'error' || sync === 'offline') && <button type="button" className="link-btn" onClick={retrySync}>Kirim ulang</button>}
          </p>
        )}
        <label>Nama panggilan
          <input value={pname} maxLength={40} onChange={(e) => setPname(e.target.value)} />
        </label>
        <div className="row actions">
          <button className="btn" disabled={!pname.trim()} onClick={saveName}>Simpan nama</button>
          <button className="btn ghost" onClick={logout}>{cloud ? 'Keluar' : 'Ke halaman masuk / daftar'}</button>
        </div>
        {accMsg && <p role="status">{accMsg}</p>}
        <p className="muted">
          {cloud
            ? 'Keluar tidak menghapus data di akun. Masuk lagi dengan email yang sama untuk melanjutkan.'
            : 'Buat akun dengan email agar riwayat latihan tersimpan online. Data tamu di browser ini bisa digabungkan ke akun setelah Anda masuk.'}
        </p>
      </section>
      {cloud && (
        <form className="card form" onSubmit={savePw}>
          <h2><KeyRound size={18} className="ico-teal" aria-hidden="true" /> Ganti password</h2>
          <label>Password baru
            <input type="password" autoComplete="new-password" minLength={8} value={pw} onChange={(e) => setPw(e.target.value)} />
          </label>
          <label>Ulangi password baru
            <input type="password" autoComplete="new-password" minLength={8} value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </label>
          <div className="row actions"><button className="btn" type="submit" disabled={!pw}>Perbarui password</button></div>
          {pwMsg.text && <p role="status" className={pwMsg.ok ? '' : 'err-text'}>{pwMsg.text}</p>}
        </form>
      )}
      <section className="card">
        <h2>Data saya</h2>
        <p>{state.attempts.length} sesi · {state.bookmarks.length} soal ditandai · {Object.keys(state.notes).length} catatan</p>
        <div className="row actions">
          <button className="btn" onClick={download}>Unduh cadangan (JSON)</button>
          <label className="btn ghost">
            Impor cadangan
            <input type="file" accept="application/json,.json" onChange={onImport} className="sr-only" />
          </label>
          <button
            className="btn danger"
            onClick={() => { if (window.confirm(cloud ? 'Hapus semua riwayat, catatan, dan tanda, termasuk yang tersimpan di akun online? Tindakan ini tidak bisa dibatalkan.' : 'Hapus semua riwayat, catatan, dan tanda? Tindakan ini tidak bisa dibatalkan.')) reset() }}
          >Hapus semua data</button>
        </div>
        {msg && <p role="status">{msg}</p>}
        <p className="muted">
          Impor menggabungkan data tanpa menimpa yang ada. {cloud ? 'Dengan akun online, data sudah tersimpan di server. Cadangan JSON tetap berguna sebagai salinan pribadi.' : 'Membersihkan data browser akan menghapus riwayat, jadi unduh cadangan secara berkala.'}
        </p>
      </section>
      <section className="card form">
        <h2>Tutor AI dan Agent AI (opsional)</h2>
        <p className="muted">
          Fitur AI bisa lewat server aplikasi (setelah masuk akun, tanpa kunci) atau memakai kunci API milik Anda sendiri. Kunci pribadi disimpan hanya di browser ini, tidak ikut cadangan JSON atau sinkronisasi akun,
          dan dikirim langsung ke penyedia yang Anda pilih. Teks pertanyaan dan ringkasan kemampuan Anda ikut terkirim.
          Pilihan gratis: <b>Google Gemini</b> (buat kunci di Google AI Studio, ada tier gratis dengan batas pemakaian; di tier gratis, penyedia dapat memakai data untuk
          perbaikan layanan, jadi jangan kirim data pribadi). Jangan isi kunci di komputer bersama.
        </p>
        <label>Penyedia
          <select value={tutor.provider} onChange={(e) => setTutor({ ...defaultConfig(e.target.value), apiKey: tutor.apiKey })}>
            {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        {tutor.provider === 'openai' && (
          <>
            <label>Layanan
              <select value="" onChange={(e) => { const p = OPENAI_PRESETS[Number(e.target.value)]; if (p) setTutor({ ...tutor, baseUrl: p.baseUrl, model: p.model }) }}>
                <option value="">Pilih untuk mengisi otomatis…</option>
                {OPENAI_PRESETS.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
              </select>
            </label>
            <label>Alamat API
              <input value={tutor.baseUrl} placeholder="https://api.deepseek.com" onChange={(e) => setTutor({ ...tutor, baseUrl: e.target.value })} />
            </label>
          </>
        )}
        {tutor.provider === 'server' ? (
          <p className="muted">Kunci AI disimpan aman di server Supabase milik pemilik situs, jadi Anda tidak perlu mengisi kunci apa pun. Syaratnya: masuk dengan akun email. Ada batas pemakaian harian per akun. Teks pertanyaan dan ringkasan kemampuan ikut dikirim ke server lalu ke Google Gemini.</p>
        ) : (
          <>
        <label>Kunci API
          <input type="password" autoComplete="off" value={tutor.apiKey} placeholder={PROVIDERS[tutor.provider].keyHint} onChange={(e) => setTutor({ ...tutor, apiKey: e.target.value })} />
        </label>
        <label>Model
          <input value={tutor.model} placeholder={PROVIDERS[tutor.provider].model} onChange={(e) => setTutor({ ...tutor, model: e.target.value })} />
        </label>
        <p className="muted">Nama model sering berganti. Jika muncul galat "model tidak ditemukan", ganti dengan nama model terbaru di dokumentasi penyedia. ChatGPT versi web gratis tidak bisa dipakai di sini; yang bisa dipakai adalah API-nya.</p>
          </>
        )}
        <div className="row actions">
          <button className="btn" onClick={() => { saveTutorConfig(tutor); setTutorMsg(tutor.provider === 'server' || tutor.apiKey ? 'Pengaturan AI disimpan.' : 'Kunci dihapus.') }}>Simpan</button>
          <button className="btn ghost" onClick={() => { setTutor(defaultConfig(tutor.provider)); saveTutorConfig({ apiKey: '' }); setTutorMsg('Kunci dihapus.') }}>Hapus kunci</button>
        </div>
        {tutorMsg && <p role="status">{tutorMsg}</p>}
      </section>
      <section className="card">
        <h2>Versi konfigurasi</h2>
        <p>Kurikulum v{curriculum.version} · {curriculum.status}</p>
        <p>Konfigurasi ujian: <code>{examConfig.id}</code> · {examConfig.status}</p>
        <p>Perlu diverifikasi:</p>
        <ul className="plain">{examConfig.needs_verification.map((x) => <li key={x}>{x}</li>)}</ul>
      </section>
    </>
  )
}
