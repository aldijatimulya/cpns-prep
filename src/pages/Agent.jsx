import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Compass, Download, ExternalLink, Sparkles, Trash2, Upload } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import MiniMarkdown from '../components/MiniMarkdown'
import { useStore } from '../contexts/StoreContext'
import { examConfig } from '../data'
import { askAI, loadTutorConfig, hasAI } from '../services/tutor'
import { AGENT_SYSTEM, agentBrief, recommend, strategy, untriedIndicators, weakIndicators } from '../utils/agent'
import { TEMPLATE_CSV, parseVacancyFile } from '../utils/vacancies'

const DEGREES = ['D3', 'S1', 'S2', 'S3']

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export default function Agent() {
  const { state, setAgent, importVacancies, removeVacancy, clearVacancies } = useStore()
  const agent = state.agent ?? { major: '', degree: 'S1', location: '' }
  const vacancies = state.vacancies ?? []
  const fileRef = useRef(null)
  const [msg, setMsg] = useState('')
  const [ai, setAi] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [showEx, setShowEx] = useState(false)

  const weak = useMemo(() => weakIndicators(state.attempts), [state.attempts])
  const untried = useMemo(() => untriedIndicators(state.attempts), [state.attempts])
  const result = useMemo(() => recommend(vacancies, agent, state.attempts), [vacancies, agent, state.attempts])
  const { rd, eligible, excluded } = result
  const steps = useMemo(() => strategy({ rd, weak, untried, plan: state.plan, top: eligible[0] }), [rd, weak, untried, state.plan, eligible])
  const hasKey = hasAI()

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const { items, skipped } = parseVacancyFile(await f.text(), f.name)
      if (!items.length) throw new Error('Tidak ada baris lowongan yang valid (instansi dan jabatan wajib).')
      const replace = vacancies.length > 0 && window.confirm(`Sudah ada ${vacancies.length} lowongan. OK = ganti semuanya dengan isi file ini. Batal = gabungkan (lowongan yang sama dilewati).`)
      importVacancies(items, replace)
      setMsg(`${items.length} lowongan dibaca${skipped ? `, ${skipped} baris dilewati (tidak lengkap atau ganda)` : ''}.`)
    } catch (er) { setMsg(er.message) }
  }

  const ask = async () => {
    setBusy(true); setErr(''); setAi('')
    try {
      const brief = agentBrief({ agent, rd, weak, untried, plan: state.plan, eligible, excluded })
      setAi(await askAI({ config: loadTutorConfig(), system: AGENT_SYSTEM, messages: [{ role: 'user', content: `Ringkasan data pengguna:\n${brief}\n\nBuat analisis dan strategi.` }], maxTokens: 2000 }))
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  const cls = { linear: 'ok', mungkin: 'warn', terbuka: 'warn', unknown: 'warn' }

  return (
    <>
      <PageHero
        art="monitor"
        kicker={<><Compass size={16} aria-hidden="true" /> Agent AI</>}
        title="Agent AI: Analisis dan Rekomendasi Lowongan"
        text="Menghitung kecocokan jurusan, perkiraan persaingan, dan kesiapan SKD Anda, lalu menyusun strategi. Hasil dihitung dari data Anda di aplikasi dan file lowongan yang Anda unggah."
      />

      <div className="banner" role="note">
        <p>Aplikasi ini tidak terhubung ke portal resmi. Lowongan hanya berasal dari file yang Anda unggah, jadi pastikan datanya disalin dari pengumuman resmi (SSCASN atau situs instansi). Kelinearan jurusan di sini adalah pencocokan teks; keputusan akhir ada pada daftar resmi di pengumuman formasi.</p>
      </div>

      <section className="card form">
        <h2>1. Profil Anda</h2>
        <div className="agent-form">
          <label>Jurusan / program studi
            <input value={agent.major} placeholder="mis. Teknik Informatika" onChange={(e) => setAgent({ major: e.target.value.slice(0, 80) })} />
          </label>
          <label>Jenjang
            <select value={agent.degree} onChange={(e) => setAgent({ degree: e.target.value })}>{DEGREES.map((d) => <option key={d}>{d}</option>)}</select>
          </label>
          <label>Preferensi lokasi (opsional)
            <input value={agent.location} placeholder="mis. Palembang" onChange={(e) => setAgent({ location: e.target.value.slice(0, 60) })} />
          </label>
        </div>
      </section>

      <section className="card">
        <h2>2. Data lowongan ({vacancies.length})</h2>
        <p className="muted">Unggah file CSV atau JSON. Kolom: instansi, jabatan, lokasi, jenjang, jurusan (pisahkan dengan titik koma), kuota, pelamar (opsional), jenis_formasi, tanggal_tutup, tautan, catatan.</p>
        <div className="row actions">
          <input ref={fileRef} type="file" accept=".csv,.json,text/csv,application/json" className="sr-only" aria-label="Unggah file lowongan" onChange={onFile} />
          <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} aria-hidden="true" /> Unggah file lowongan</button>
          <button className="btn ghost" onClick={() => download('templat-lowongan.csv', TEMPLATE_CSV, 'text/csv')}><Download size={16} aria-hidden="true" /> Unduh templat CSV</button>
          {vacancies.length > 0 && <button className="btn ghost" onClick={() => window.confirm('Hapus semua lowongan?') && clearVacancies()}><Trash2 size={16} aria-hidden="true" /> Hapus semua</button>}
        </div>
        {msg && <p role="status">{msg}</p>}
      </section>

      <section className="card">
        <h2>3. Kesiapan SKD Anda</h2>
        {rd.level === 'none' ? (
          <p className="muted">Belum ada jawaban. Kerjakan <Link to="/cat">Simulasi CAT</Link> atau <Link to="/practice">Latihan</Link> dulu agar kemampuan terukur.</p>
        ) : (
          <>
            <p className="muted">Sumber: {rd.source}. Ambang: {examConfig.label}.</p>
            <div className="ready">
              {rd.sections.map((s) => (
                <div key={s.category} className="ready-row">
                  <b>{s.category}</b>
                  <div className="bar" role="img" aria-label={`${s.category}: perkiraan ${s.estimate ?? 'belum ada'} dari ambang ${s.threshold}`}>
                    <i style={{ width: `${s.estimate == null ? 0 : Math.min(100, (s.estimate / s.max) * 100)}%` }} className={s.gap != null && s.gap >= 0 ? 'ok' : 'bad'} />
                    <u style={{ left: `${(s.threshold / s.max) * 100}%` }} />
                  </div>
                  <span>{s.estimate ?? '–'} / ambang {s.threshold}{s.estimate != null && !s.reliable ? ' · data sedikit' : ''}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>4. Rekomendasi lowongan</h2>
        {vacancies.length === 0 ? <p className="muted">Unggah data lowongan untuk melihat rekomendasi.</p>
          : !agent.major.trim() ? <p className="muted">Isi jurusan Anda di langkah 1.</p>
            : eligible.length === 0 ? <p className="muted">Tidak ada lowongan yang cocok dengan jurusan dan jenjang Anda dari {vacancies.length} lowongan yang diunggah.</p>
              : (
                <ol className="vac-list">
                  {eligible.map((e, i) => (
                    <li key={e.v.id} className="vac">
                      <div className="vac-head">
                        <span className="rank">{i + 1}</span>
                        <div>
                          <strong>{e.v.jabatan}</strong>
                          <small>{e.v.instansi}{e.v.lokasi ? ` · ${e.v.lokasi}` : ''}{e.v.jenis ? ` · ${e.v.jenis}` : ''}</small>
                        </div>
                        <span className={`pill ${cls[e.lin.level] ?? ''}`}>{e.tier}</span>
                        <b className="vscore" title="Nilai gabungan internal (jurusan 45%, persaingan 30%, kesiapan 25%)">{e.score}</b>
                      </div>
                      <ul className="plain">{e.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
                      <small className="muted">{[e.v.tutup && `Tutup: ${e.v.tutup}`, e.v.catatan].filter(Boolean).join(' · ')}</small>
                      <div className="row actions">
                        {e.v.tautan && <a className="btn small ghost" href={e.v.tautan} target="_blank" rel="noreferrer noopener"><ExternalLink size={14} aria-hidden="true" /> Pengumuman</a>}
                        <button className="btn small ghost" onClick={() => window.confirm('Hapus lowongan ini dari daftar?') && removeVacancy(e.v.id)}>Hapus</button>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
        {excluded.length > 0 && agent.major.trim() && (
          <>
            <button className="link-btn" onClick={() => setShowEx(!showEx)}>{showEx ? 'Sembunyikan' : 'Lihat'} {excluded.length} lowongan yang tidak cocok</button>
            {showEx && <ul className="plain">{excluded.map((x) => <li key={x.v.id}>{x.v.jabatan} ({x.v.instansi}): {x.reason}</li>)}</ul>}
          </>
        )}
        <small className="muted">Nilai gabungan dan kategori peluang adalah perkiraan internal untuk membandingkan pilihan, bukan peluang kelulusan yang sebenarnya.</small>
      </section>

      <section className="card">
        <h2>5. Strategi untuk Anda</h2>
        <ol className="plain steps">{steps.map((s) => <li key={s}>{s}</li>)}</ol>
        {weak.length > 0 && <Link className="btn small" to={`/tutor?topic=${weak[0].topicId}&ind=${weak[0].indicator}`}>Bahas titik terlemah dengan Tutor AI</Link>}
      </section>

      <section className="card">
        <h2><Sparkles size={18} className="ico-teal" aria-hidden="true" /> 6. Analisis lengkap dari AI</h2>
        {!hasKey && <p className="muted">Masuk dengan akun, atau isi kunci API sendiri, di <Link to="/settings">Pengaturan</Link>. Langkah 1 sampai 5 tetap berjalan tanpa AI.</p>}
        <p className="muted">Yang dikirim ke penyedia AI: jurusan, jenjang, ringkasan skor, titik lemah, dan daftar lowongan teratas. Nama dan email tidak dikirim.</p>
        <button className="btn" disabled={busy || !hasKey || !agent.major.trim()} onClick={ask}>{busy ? 'Menganalisis…' : 'Minta analisis AI'}</button>
        {err && <p role="alert" className="tutor-err">{err}</p>}
        {ai && <div className="ai-out"><MiniMarkdown text={ai} /><small className="muted">Dibuat AI dari data di atas. Bisa keliru; cek pengumuman resmi sebelum memutuskan.</small></div>}
      </section>
    </>
  )
}
