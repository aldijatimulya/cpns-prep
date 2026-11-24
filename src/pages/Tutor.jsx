import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bot, BookOpen, Stethoscope } from 'lucide-react'
import PageHero from '../components/ui/PageHero'
import Chat from '../components/Chat'
import { useStore } from '../contexts/StoreContext'
import { categories, materiFor, topicById } from '../data'
import { askAI, loadTutorConfig, TUTOR_SYSTEM, hasAI } from '../services/tutor'
import { untriedIndicators, weakIndicators } from '../utils/agent'

const PRESETS = [
  'Jelaskan bagian ini dengan bahasa sederhana dan beri contoh.',
  'Apa jebakan yang paling sering muncul di bagian ini?',
  'Buatkan 3 soal latihan beserta pembahasannya.',
  'Beri trik cepat untuk mengingat atau mengerjakannya.',
]

function materiContext(topic, ind) {
  const m = materiFor(topic.id)
  const parts = [`Topik: ${topic.name} (${topic.category}).`]
  if (!m) return `${parts[0]}\n(Materi topik ini belum ditulis di aplikasi.)`
  parts.push(`Ringkasan: ${m.ringkasan}`)
  topic.indicators.forEach((t, i) => {
    if (ind != null && ind !== i) return
    parts.push(`Indikator ${i + 1}: ${t}`)
    parts.push((m.indikator[i]?.poin ?? []).map((p) => `- ${p}`).join('\n'))
  })
  if (m.jebakan?.length) parts.push(`Jebakan umum:\n${m.jebakan.map((j) => `- ${j}`).join('\n')}`)
  return parts.join('\n')
}

export default function Tutor() {
  const { state } = useStore()
  const [params] = useSearchParams()
  const t0 = topicById[params.get('topic')] ? params.get('topic') : 'TWK-INT'
  const i0 = Number.parseInt(params.get('ind') ?? '', 10)
  const [topicId, setTopicId] = useState(t0)
  const [ind, setInd] = useState(Number.isInteger(i0) && i0 >= 0 && i0 < (topicById[t0]?.indicators.length ?? 0) ? i0 : null)
  const [msgs, setMsgs] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abort = useRef(null)
  const config = loadTutorConfig()
  const topic = topicById[topicId]
  const weak = useMemo(() => weakIndicators(state.attempts, { limit: 5 }), [state.attempts])
  const untried = useMemo(() => untriedIndicators(state.attempts, 3), [state.attempts])
  const materi = materiFor(topicId)

  useEffect(() => () => abort.current?.abort(), [])

  const pick = (tid, i = null) => { setTopicId(tid); setInd(i); setMsgs([]); setError('') }

  const statLine = () => {
    const w = weak.filter((x) => x.topicId === topicId)
    return w.length ? `\nData pengguna pada topik ini (indikator dengan akurasi terendah): ${w.map((x) => `"${x.text}" ${Math.round(x.acc * 100)}% dari ${x.n} jawaban`).join('; ')}.` : ''
  }

  const send = async (text) => {
    const content = text.trim()
    if (!content || busy) return
    const next = [...msgs, { role: 'user', content }]
    setMsgs(next); setError(''); setBusy(true)
    const ctrl = new AbortController()
    abort.current = ctrl
    try {
      const system = `${TUTOR_SYSTEM}\n\nKONTEKS MATERI DARI APLIKASI (draft, belum diverifikasi):\n${materiContext(topic, ind)}${statLine()}\n\nJawab terutama berdasarkan konteks ini. Bila pertanyaan di luar konteks, jawab seperlunya dan beri tahu bahwa itu di luar materi aplikasi.`
      const reply = await askAI({ config: loadTutorConfig(), system, messages: next, signal: ctrl.signal })
      setMsgs([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally { setBusy(false) }
  }

  const diagnose = () => send(
    `Identifikasi kelemahan saya berdasarkan data berikut, lalu beri urutan belajar. Titik lemah (akurasi terendah): ${weak.length ? weak.map((x) => `${x.topic.name} - ${x.text}: ${Math.round(x.acc * 100)}% (${x.n} jawaban)`).join('; ') : 'belum ada data cukup'}. Indikator prioritas yang belum dicoba: ${untried.length ? untried.map((u) => `${u.topic.name} - ${u.text}`).join('; ') : 'tidak ada'}.`,
  )

  return (
    <>
      <PageHero
        art="books"
        kicker={<><Bot size={16} aria-hidden="true" /> Tutor AI</>}
        title="Tutor AI"
        text="Tanya jawab seputar materi yang sedang Anda pelajari, dan temukan bagian mana yang perlu diperkuat."
      />

      <div className="tutor-grid">
        <section className="card form">
          <h2>Materi yang dibahas</h2>
          <label>Topik
            <select value={topicId} onChange={(e) => pick(e.target.value)}>
              {categories.map((c) => (
                <optgroup key={c.id} label={c.id}>
                  {c.topics.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </optgroup>
              ))}
            </select>
          </label>
          <label>Indikator kisi-kisi
            <select value={ind ?? ''} onChange={(e) => { setInd(e.target.value === '' ? null : Number(e.target.value)); setMsgs([]) }}>
              <option value="">Semua indikator</option>
              {topic.indicators.map((t, i) => <option key={t} value={i}>{i + 1}. {t}</option>)}
            </select>
          </label>
          <Link className="btn small ghost" to={`/learn/${topicId}${ind != null ? `?i=${ind}` : ''}`}><BookOpen size={14} aria-hidden="true" /> Buka halaman materi</Link>

          <h3><Stethoscope size={16} aria-hidden="true" /> Identifikasi kelemahan Anda</h3>
          {weak.length === 0 ? (
            <p className="muted">Belum cukup data. Kerjakan beberapa latihan (minimal 3 jawaban per indikator) lalu kembali ke sini.</p>
          ) : (
            <ul className="weak">
              {weak.map((w) => (
                <li key={`${w.topicId}-${w.indicator}`}>
                  <button className="link-btn" onClick={() => pick(w.topicId, w.indicator)}>{w.topic.name}: {w.text}</button>
                  <small>akurasi {Math.round(w.acc * 100)}% · {w.n} jawaban</small>
                </li>
              ))}
            </ul>
          )}
          {untried.length > 0 && (
            <>
              <small className="muted">Belum pernah dicoba (topik prioritas):</small>
              <ul className="weak">{untried.map((u) => <li key={`${u.topic.id}-${u.indicator}`}><button className="link-btn" onClick={() => pick(u.topic.id, u.indicator)}>{u.topic.name}: {u.text}</button></li>)}</ul>
            </>
          )}
          <button className="btn small" disabled={busy || !hasAI(config)} onClick={diagnose}>Minta analisis dari Tutor</button>
        </section>

        <section className="card tutor-chat">
          <div className="chat-head"><h2>Tanya Tutor</h2><small className="muted">{topic.name}{ind != null ? ` · indikator ${ind + 1}` : ''}</small></div>
          {!hasAI(config) && (
            <div className="banner" role="note">
              <p>Tutor AI belum aktif. Atur penyedia atau kunci API di <Link to="/settings">Pengaturan</Link>; ada pilihan gratis (Google Gemini). Sementara itu, ringkasan materi tersedia di bawah.</p>
            </div>
          )}
          <Chat
            msgs={msgs} busy={busy} error={error} onSend={send} onStop={() => abort.current?.abort()}
            disabled={!hasAI(config)} presets={PRESETS} who={state.profile?.name || 'Anda'}
            placeholder="Tanya apa saja tentang materi ini…"
            intro={materi ? <><strong>Ringkasan materi</strong><p className="plain">{materi.ringkasan}</p></> : null}
          />
        </section>
      </div>
    </>
  )
}
