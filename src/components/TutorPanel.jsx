import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { askTutor, loadTutorConfig, questionContext, hasAI } from '../services/tutor'

const PRESETS = [
  'Jelaskan lebih dalam konsep di balik soal ini.',
  'Mengapa jawaban saya salah atau kurang tepat?',
  'Beri cara cepat untuk soal sejenis.',
  'Buatkan satu soal latihan serupa beserta pembahasannya.',
]

export default function TutorPanel({ q, chosen }) {
  const [open, setOpen] = useState(false)
  const [msgs, setMsgs] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const abortRef = useRef(null)
  const config = loadTutorConfig()

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async (text) => {
    const content = text.trim()
    if (!content || busy) return
    const next = [...msgs, { role: 'user', content }]
    setMsgs(next)
    setInput('')
    setError('')
    setBusy(true)
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const reply = await askTutor({ config: loadTutorConfig(), context: questionContext(q, chosen), messages: next, signal: ctrl.signal })
      setMsgs([...next, { role: 'assistant', content: reply }])
    } catch (e) {
      if (e.name !== 'AbortError') setError(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return <button className="btn small ghost" onClick={() => setOpen(true)}>Tanya Tutor AI</button>
  }
  if (!hasAI(config)) {
    return (
      <div className="tutor" role="region" aria-label="Tutor AI">
        <p>Tutor AI belum aktif. Pilih penyedia atau isi kunci di <Link to="/settings">Pengaturan</Link>.</p>
        <button className="btn small ghost" onClick={() => setOpen(false)}>Tutup</button>
      </div>
    )
  }
  return (
    <div className="tutor" role="region" aria-label="Tutor AI">
      <div className="presets">
        {PRESETS.map((p) => <button key={p} className="btn small ghost" disabled={busy} onClick={() => send(p)}>{p}</button>)}
      </div>
      <ul className="chat" aria-live="polite">
        {msgs.map((m, i) => <li key={i} className={m.role}><b>{m.role === 'user' ? 'Anda' : 'Tutor'}</b><span>{m.content}</span></li>)}
        {busy && <li className="assistant"><b>Tutor</b><span>Sedang menulis…</span></li>}
      </ul>
      {error && <p role="alert" className="tutor-err">{error}</p>}
      <form className="row" onSubmit={(e) => { e.preventDefault(); send(input) }}>
        <input aria-label="Pertanyaan untuk tutor" placeholder="Tanya apa saja tentang soal ini" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn small" type="submit" disabled={busy || !input.trim()}>Kirim</button>
      </form>
      <small className="muted">Jawaban AI bisa keliru. Periksa ke sumber resmi sebelum dipegang.</small>
      <div><button className="btn small ghost" onClick={() => setOpen(false)}>Tutup</button></div>
    </div>
  )
}
