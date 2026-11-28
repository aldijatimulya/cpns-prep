import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookMarked, Download, Sparkles, Upload } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import RichText from '../components/RichText'
import { useStore } from '../contexts/StoreContext'
import { examConfig, needTypes } from '../data'
import { askAI, hasAI, loadTutorConfig } from '../services/tutor'
import { fmtTime } from '../utils/stats'
import {
  MAX_KISI, SKB_GEN_SYSTEM, SKB_TEMPLATE, composeSkb, moduleKey, parseAiQuestions, parseSkbFile, skbFormat, skbGenPrompt, skbQuota,
} from '../utils/skb'

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const a = document.createElement('a')
  a.href = url; a.download = name
  document.body.appendChild(a); a.click(); a.remove()
  URL.revokeObjectURL(url)
}

export default function Skb() {
  const { state, setSkbTarget, patchSkbTarget, saveSkbModule, addSkbQuestions, removeSkbQuestion, toggleSkbVerified, removeSkbModule, addSkbRun } = useStore()
  const target = state.skbTarget
  const key = target?.key ?? ''
  const mod = state.skbModules?.[key] ?? { kisi: [], questions: [] }
  const [session, setSession] = useState(null)
  const [result, setResult] = useState(null)
  const [manual, setManual] = useState('')

  if (result) return <SkbResult result={result} mod={mod} onAgain={() => { setResult(null); setSession(null) }} />
  if (session) {
    return <SkbSession session={session} mod={mod} onFinish={(run, review) => { addSkbRun(run); setResult({ run, review }) }} />
  }

  return (
    <>
      <PageHero
        art="monitor"
        kicker={<><BookMarked size={16} aria-hidden="true" /> SKB</>}
        title="Simulasi SKB"
        text="Siapkan kisi-kisi dan soal latihan untuk jabatan target, lalu berlatih dengan format SKB resmi (waktu, jumlah soal, penilaian)."
      />
      <div className="banner" role="note">
        <p>
          Materi SKB tidak disediakan aplikasi. Menurut Kepmenpan-RB 674/2026, materi SKB jabatan fungsional disusun instansi pembina JF
          dan untuk jabatan pelaksana oleh instansi teknis. Isi kisi-kisi dari pengumuman resmi instansi tujuan, lalu tambahkan soal
          sendiri atau buat draf dengan AI. Semua soal di sini berstatus draf sampai Anda verifikasi.
        </p>
      </div>

      {!target ? (
        <section className="card">
          <h2>Pilih formasi target</h2>
          <p className="muted">Pilih lewat <Link to="/agent">Agent AI</Link> (tombol "Jadikan formasi target"), atau ketik nama jabatan di bawah.</p>
          <form className="row" onSubmit={(e) => { e.preventDefault(); const j = manual.trim(); if (j) { setSkbTarget({ key: moduleKey(j), vacancyId: null, jabatan: j.slice(0, 160), instansi: '', lokasi: '', kuota: null, jenis: 'Umum', jenis_key: 'umum', dominanHitung: false, netra: false }); setManual('') } }}>
            <input aria-label="Nama jabatan" placeholder="mis. Pranata Komputer Ahli Pertama" value={manual} onChange={(e) => setManual(e.target.value)} />
            <button className="btn" type="submit">Pakai jabatan ini</button>
          </form>
        </section>
      ) : (
        <TargetSections
          target={target} mod={mod} state={state}
          onChangeTarget={() => setSkbTarget(null)} patchTarget={patchSkbTarget}
          saveKisi={(kisi) => saveSkbModule(key, { kisi })}
          addQ={(list) => addSkbQuestions(key, list)} removeQ={(id) => removeSkbQuestion(key, id)} toggleV={(id) => toggleSkbVerified(key, id)}
          clearModule={() => removeSkbModule(key)}
          start={(opts) => {
            const fmt = skbFormat(target)
            const pool = mod.questions.filter((q) => !opts.onlyVerified || q.verified)
            const comp = composeSkb(pool, fmt)
            setSession({ id: `skbrun-${Date.now()}`, key: target.key, jabatan: target.jabatan, ...comp, fmt, startedAt: Date.now() })
          }}
        />
      )}
    </>
  )
}

function TargetSections({ target, mod, state, onChangeTarget, patchTarget, saveKisi, addQ, removeQ, toggleV, clearModule, start }) {
  const fmt = skbFormat(target)
  const quota = skbQuota(target.kuota)
  const [kisiText, setKisiText] = useState(mod.kisi.join('\n'))
  const [msg, setMsg] = useState('')
  const [onlyVerified, setOnlyVerified] = useState(false)
  const [showList, setShowList] = useState(false)
  const [genN, setGenN] = useState(5)
  const [genTopic, setGenTopic] = useState('all')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef(null)
  const needLabel = needTypes[target.jenis_key]?.label ?? 'Kebutuhan umum'
  const kisiList = useMemo(() => kisiText.split('\n').map((x) => x.trim().slice(0, 200)).filter(Boolean).slice(0, MAX_KISI), [kisiText])
  const pool = mod.questions.filter((q) => !onlyVerified || q.verified)
  const runs = (state.skbRuns ?? []).filter((r) => r.key === target.key).slice().reverse()

  const saveKisiNow = () => { saveKisi(kisiList); setMsg(`${kisiList.length} topik kisi-kisi disimpan.`) }

  const onFile = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    try {
      const { items, skipped } = parseSkbFile(await f.text(), mod.kisi.length)
      if (!items.length) throw new Error('Tidak ada soal valid. Setiap soal butuh stem, 4-5 opsi, dan answer yang ada di opsi.')
      addQ(items)
      setMsg(`${items.length} soal ditambahkan${skipped ? `, ${skipped} dilewati (tidak valid)` : ''}.`)
    } catch (er) { setMsg(er.message) }
  }

  const generate = async () => {
    setBusy(true); setErr(''); setMsg('')
    try {
      const kisi = mod.kisi
      if (!kisi.length) throw new Error('Isi dan simpan kisi-kisi dulu.')
      const indices = genTopic === 'all' ? kisi.map((_, i) => i) : [Number(genTopic)]
      const text = await askAI({ config: loadTutorConfig(), system: SKB_GEN_SYSTEM, messages: [{ role: 'user', content: skbGenPrompt({ jabatan: target.jabatan, kisi, indices, n: genN }) }], maxTokens: 4000 })
      const { items, skipped } = parseAiQuestions(text, kisi.length)
      addQ(items)
      setMsg(`${items.length} soal draf dari AI ditambahkan${skipped ? `, ${skipped} dibuang karena tidak valid` : ''}. Periksa kebenarannya sebelum dipakai belajar.`)
    } catch (er) { setErr(er.message) } finally { setBusy(false) }
  }

  return (
    <>
      <section className="card">
        <h2>1. Formasi target</h2>
        <p><b>{target.jabatan}</b>{target.instansi ? ` · ${target.instansi}` : ''}{target.lokasi ? ` · ${target.lokasi}` : ''}</p>
        <ul className="plain">
          <li>Jenis formasi: {needLabel}.</li>
          {target.kuota != null && <li>Kebutuhan: {target.kuota}{quota ? `; peserta SKB paling banyak ${quota} (3 kali kebutuhan, yang memenuhi ambang SKD dan berperingkat terbaik)` : ''}.</li>}
          <li>Format SKB resmi: {fmt.questions} soal, {fmt.minutes} menit, benar bernilai {fmt.correct}, salah atau kosong 0.</li>
        </ul>
        <label className="check">
          <input type="checkbox" checked={!!target.dominanHitung} onChange={(e) => patchTarget({ dominanHitung: e.target.checked })} />
          Materi SKB jabatan ini dominan operasi perhitungan ({examConfig.skb.questions_calculation_dominant} soal; bila tidak, {examConfig.skb.questions_other} soal)
        </label>
        {target.jenis_key === 'disabilitas_papua' && (
          <label className="check">
            <input type="checkbox" checked={!!target.netra} onChange={(e) => patchTarget({ netra: e.target.checked })} />
            Disabilitas sensorik netra ({examConfig.skb.duration_minutes_netra} menit)
          </label>
        )}
        <p className="muted">{examConfig.skb.bonus}</p>
        <button className="btn small ghost" onClick={onChangeTarget}>Ganti formasi target</button>
      </section>

      <section className="card">
        <h2>2. Kisi-kisi SKB</h2>
        <p className="muted">Satu topik per baris, disalin dari pengumuman resmi instansi (maksimal {MAX_KISI} topik).</p>
        <textarea rows={6} value={kisiText} onChange={(e) => setKisiText(e.target.value)} aria-label="Kisi-kisi SKB, satu topik per baris" placeholder={'mis.\nPeraturan perundang-undangan bidang jabatan\nTata kelola data\n...'} />
        <button className="btn" onClick={saveKisiNow} disabled={kisiList.length === 0}>Simpan kisi-kisi ({kisiList.length})</button>
      </section>

      <section className="card">
        <h2>3. Bank soal jabatan ini ({mod.questions.length})</h2>
        <p className="muted">Tambahkan soal dari berkas JSON buatan Anda, atau buat draf dengan AI dari kisi-kisi di atas.</p>
        <div className="row actions">
          <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" aria-label="Unggah soal SKB (JSON)" onChange={onFile} />
          <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} aria-hidden="true" /> Unggah soal (JSON)</button>
          <button className="btn ghost" onClick={() => download('templat-soal-skb.json', SKB_TEMPLATE, 'application/json')}><Download size={16} aria-hidden="true" /> Unduh templat</button>
        </div>
        <h3><Sparkles size={16} className="ico-teal" aria-hidden="true" /> Buat draf soal dengan AI</h3>
        {!hasAI() && <p className="muted">Perlu AI aktif di <Link to="/settings">Pengaturan</Link> (akun atau kunci API sendiri).</p>}
        <div className="agent-form">
          <label>Topik
            <select value={genTopic} onChange={(e) => setGenTopic(e.target.value)}>
              <option value="all">Semua topik</option>
              {mod.kisi.map((k, i) => <option key={`${i}-${k}`} value={i}>{i + 1}. {k.slice(0, 60)}</option>)}
            </select>
          </label>
          <label>Jumlah
            <select value={genN} onChange={(e) => setGenN(Number(e.target.value))}>{[5, 10, 15].map((n) => <option key={n}>{n}</option>)}</select>
          </label>
        </div>
        <button className="btn" disabled={busy || !hasAI() || mod.kisi.length === 0} onClick={generate}>{busy ? 'Membuat soal…' : 'Buat draf soal'}</button>
        <p className="muted">Yang dikirim ke penyedia AI: nama jabatan dan teks kisi-kisi. Soal dari AI bisa keliru; centang "terverifikasi" hanya setelah Anda cocokkan dengan sumber resmi.</p>
        {err && <p role="alert" className="tutor-err">{err}</p>}
        {msg && <p role="status">{msg}</p>}
        {mod.questions.length > 0 && (
          <>
            <button className="link-btn" onClick={() => setShowList(!showList)}>{showList ? 'Sembunyikan' : 'Lihat'} daftar soal</button>
            {showList && (
              <ul className="qlist">
                {mod.questions.map((q, i) => (
                  <li key={q.id} className="card review">
                    <small>{i + 1}. {q.kisi != null ? mod.kisi[q.kisi] ?? 'Tanpa topik' : 'Tanpa topik'} · {q.source === 'ai' ? 'draf AI' : 'buatan sendiri'}</small>
                    <p className="stem"><RichText text={q.stem} /></p>
                    <p className="muted">Kunci: {q.answer}</p>
                    <div className="row actions">
                      <label className="check"><input type="checkbox" checked={!!q.verified} onChange={() => toggleV(q.id)} /> Sudah saya verifikasi</label>
                      <button className="btn small ghost" onClick={() => removeQ(q.id)}>Hapus</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button className="btn small ghost" onClick={() => window.confirm('Hapus seluruh modul (kisi-kisi dan soal) untuk jabatan ini?') && clearModule()}>Hapus modul jabatan ini</button>
          </>
        )}
      </section>

      <section className="card">
        <h2>4. Simulasi</h2>
        <p>
          Tersedia {pool.length} soal. {pool.length >= fmt.questions ? `Set penuh ${fmt.questions} soal, ${fmt.minutes} menit.` : `Set diperkecil menjadi ${pool.length} soal dan waktu diskalakan proporsional (${Math.round((fmt.minutes * pool.length) / fmt.questions)} menit); format resmi butuh ${fmt.questions} soal.`}
        </p>
        <label className="check">
          <input type="checkbox" checked={onlyVerified} onChange={(e) => setOnlyVerified(e.target.checked)} /> Hanya soal yang sudah saya verifikasi
        </label>
        <button className="btn" disabled={pool.length === 0} onClick={() => start({ onlyVerified })}>{pool.length === 0 ? 'Belum ada soal' : `Mulai simulasi (${Math.min(pool.length, fmt.questions)} soal)`}</button>
        {runs.length > 0 && (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Tanggal</th><th>Skor</th><th>Dijawab</th><th>Durasi</th></tr></thead>
              <tbody>{runs.slice(0, 8).map((r) => (
                <tr key={r.id}><td>{new Date(r.date).toLocaleDateString('id-ID')}</td><td>{r.total} / {r.max}</td><td>{r.answered} / {r.n}</td><td>{Math.round(r.duration_sec / 60)} mnt</td></tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <p className="muted foot">Skor SKB tidak punya ambang batas tunggal: peringkat gabungan SKD dan SKB menentukan kelulusan, dengan bobot yang diatur Permenpan-RB 18/2026 (belum dimuat di aplikasi ini).</p>
      </section>
    </>
  )
}

function SkbSession({ session, mod, onFinish }) {
  const { questions: qs, durationSec, fmt } = session
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [flags, setFlags] = useState({})
  const [now, setNow] = useState(Date.now())
  const finished = useRef(false)

  const finish = useCallback(() => {
    if (finished.current) return
    finished.current = true
    const items = qs.map((q) => ({ q, chosen: answers[q.id] ?? null, correct: answers[q.id] === q.answer }))
    const per = new Map()
    for (const it of items) {
      const label = it.q.kisi != null ? mod.kisi[it.q.kisi] ?? 'Tanpa topik' : 'Tanpa topik'
      const e = per.get(label) ?? { label, n: 0, correct: 0 }
      e.n += 1; if (it.correct) e.correct += 1
      per.set(label, e)
    }
    const correct = items.filter((i) => i.correct).length
    const run = {
      id: session.id, date: new Date().toISOString(), key: session.key, jabatan: session.jabatan, n: qs.length,
      answered: items.filter((i) => i.chosen).length, total: correct * fmt.correct, max: qs.length * fmt.correct,
      duration_sec: Math.round((Date.now() - session.startedAt) / 1000), perKisi: [...per.values()],
    }
    onFinish(run, items)
  }, [answers, fmt, mod, onFinish, qs, session])

  const finishRef = useRef(finish)
  useEffect(() => { finishRef.current = finish }, [finish])
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id) }, [])
  const remaining = durationSec - (now - session.startedAt) / 1000
  useEffect(() => { if (remaining <= 0) finishRef.current() }, [remaining])

  const q = qs[index]
  const answered = Object.keys(answers).length
  return (
    <>
      <div className="session-bar card">
        <span>Soal {index + 1} / {qs.length}</span>
        <span>Dijawab {answered}</span>
        <span className={remaining < 300 ? 'timer warn' : 'timer'} role="timer" aria-live="off">{fmtTime(remaining)}</span>
      </div>
      <section className="card">
        <div className="row">
          <small>SKB · {q.kisi != null ? mod.kisi[q.kisi] ?? 'Tanpa topik' : 'Tanpa topik'}</small>
          <button className={flags[q.id] ? 'btn small' : 'btn small ghost'} aria-pressed={!!flags[q.id]} onClick={() => setFlags((f) => ({ ...f, [q.id]: !f[q.id] }))}>{flags[q.id] ? 'Ragu-ragu ✓' : 'Tandai ragu-ragu'}</button>
        </div>
        <p className="stem"><RichText text={q.stem} /></p>
        <div className="options" role="radiogroup" aria-label="Pilihan jawaban">
          {q.options.map((o) => (
            <button key={o.key} role="radio" aria-checked={answers[q.id] === o.key} className={answers[q.id] === o.key ? 'opt chosen' : 'opt'} onClick={() => setAnswers((a) => ({ ...a, [q.id]: o.key }))}>
              <b>{o.key}</b><span><RichText text={o.text} /></span>
            </button>
          ))}
        </div>
        <div className="row nav-row">
          <button className="btn ghost" onClick={() => setIndex(index - 1)} disabled={index === 0}>Sebelumnya</button>
          <button className="btn" onClick={() => setIndex(index + 1)} disabled={index === qs.length - 1}>Berikutnya</button>
        </div>
      </section>
      <section className="card">
        <div className="qgrid" aria-label="Navigasi soal">
          {qs.map((x, i) => (
            <button key={x.id} aria-label={`Soal ${i + 1}${answers[x.id] ? ', dijawab' : ', belum dijawab'}${flags[x.id] ? ', ragu-ragu' : ''}`} className={`${i === index ? 'cur' : ''} ${answers[x.id] ? 'done' : ''} ${flags[x.id] ? 'flag' : ''}`} onClick={() => setIndex(i)}>{i + 1}</button>
          ))}
        </div>
        <button className="btn danger" onClick={() => window.confirm(`Akhiri simulasi sekarang? ${qs.length - answered} soal belum dijawab.`) && finish()}>Akhiri simulasi</button>
      </section>
    </>
  )
}

function SkbResult({ result, mod, onAgain }) {
  const { run, review } = result
  const [filter, setFilter] = useState('wrong')
  const shown = review.filter((i) => (filter === 'all' ? true : !i.correct))
  return (
    <>
      <PageHero art="monitor" kicker={<><BookMarked size={16} aria-hidden="true" /> Simulasi SKB selesai</>} title="Hasil simulasi SKB" text={`Waktu ${fmtTime(run.duration_sec)} · ${run.answered} dari ${run.n} dijawab`} />
      <section className="card">
        <h2>Skor: {run.total} / {run.max}</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Topik kisi-kisi</th><th>Benar</th><th>Soal</th></tr></thead>
            <tbody>{run.perKisi.map((p) => <tr key={p.label}><td>{p.label}</td><td>{p.correct}</td><td>{p.n}</td></tr>)}</tbody>
          </table>
        </div>
        <p className="muted foot">Skor ini hanya alat ukur belajar dari soal draf Anda sendiri; bukan prediksi nilai SKB resmi.</p>
      </section>
      <div className="row actions">
        <button className="btn" onClick={onAgain}>Kembali ke modul</button>
        <label><span className="sr-only">Tampilkan</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="wrong">Salah atau kosong</option><option value="all">Semua</option></select>
        </label>
      </div>
      <ul className="qlist">
        {shown.length === 0 && <li className="card muted">Tidak ada soal pada filter ini.</li>}
        {shown.map((it) => (
          <li key={it.q.id} className={`card review ${it.correct ? 'ok' : it.chosen ? 'bad' : 'skip'}`}>
            <small>{it.q.kisi != null ? mod.kisi[it.q.kisi] ?? 'Tanpa topik' : 'Tanpa topik'}</small>
            <p className="stem"><RichText text={it.q.stem} /></p>
            <p>Jawaban Anda: <b>{it.chosen ?? 'kosong'}</b> · Kunci: <b>{it.q.answer}</b></p>
            {it.q.explanation && <p><RichText text={it.q.explanation} /></p>}
            {!it.q.verified && <small className="muted">Soal ini belum Anda verifikasi.</small>}
          </li>
        ))}
      </ul>
    </>
  )
}
