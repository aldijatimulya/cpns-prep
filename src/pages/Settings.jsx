import { useState } from 'react'
import { useStore } from '../contexts/StoreContext'
import { curriculum, examConfig } from '../data'
import { exportState } from '../services/storage'
import { DEFAULT_MODEL, loadTutorConfig, saveTutorConfig } from '../services/tutor'

export default function Settings() {
  const { state, reset, importBackup, setProfile, logout } = useStore()
  const [pname, setPname] = useState(state.profile.name)
  const [msg, setMsg] = useState('')
  const [tutor, setTutor] = useState(loadTutorConfig)
  const [tutorMsg, setTutorMsg] = useState('')
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
      <header className="page-head">
        <h1>Pengaturan</h1>
        <p>Data tersimpan di browser ini saja.</p>
      </header>
      <section className="card form">
        <h2>Profil</h2>
        <label>Nama panggilan
          <input value={pname} maxLength={40} onChange={(e) => setPname(e.target.value)} />
        </label>
        <div className="row actions">
          <button className="btn" disabled={!pname.trim()} onClick={() => setProfile(pname)}>Simpan nama</button>
          <button className="btn ghost" onClick={logout}>Keluar</button>
        </div>
        <p className="muted">Keluar tidak menghapus data belajar. Data tetap ada di browser ini.</p>
      </section>
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
            onClick={() => { if (window.confirm('Hapus semua riwayat, catatan, dan tanda? Tindakan ini tidak bisa dibatalkan.')) reset() }}
          >Hapus semua data</button>
        </div>
        {msg && <p role="status">{msg}</p>}
        <p className="muted">Impor menggabungkan data tanpa menimpa yang ada, jadi aman untuk memindahkan progres antar perangkat. Membersihkan data browser akan menghapus riwayat. Unduh cadangan secara berkala.</p>
      </section>
      <section className="card form">
        <h2>Tutor AI (opsional)</h2>
        <p className="muted">
          Memakai kunci API Anthropic milik Anda sendiri. Kunci disimpan hanya di browser ini, tidak ikut cadangan JSON,
          dan dikirim langsung ke api.anthropic.com. Teks soal yang Anda tanyakan ikut terkirim, dan pemakaian
          ditagih ke akun API Anda. Pakai kunci khusus dengan batas pengeluaran, dan jangan isi di komputer bersama.
        </p>
        <label>Kunci API
          <input type="password" autoComplete="off" value={tutor.apiKey} placeholder="sk-ant-..." onChange={(e) => setTutor({ ...tutor, apiKey: e.target.value })} />
        </label>
        <label>Model
          <input value={tutor.model} placeholder={DEFAULT_MODEL} onChange={(e) => setTutor({ ...tutor, model: e.target.value })} />
        </label>
        <div className="row actions">
          <button className="btn" onClick={() => { saveTutorConfig(tutor); setTutorMsg(tutor.apiKey ? 'Pengaturan tutor disimpan.' : 'Kunci dihapus.') }}>Simpan</button>
          <button className="btn ghost" onClick={() => { setTutor({ apiKey: '', model: DEFAULT_MODEL }); saveTutorConfig({ apiKey: '' }); setTutorMsg('Kunci dihapus.') }}>Hapus kunci</button>
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
