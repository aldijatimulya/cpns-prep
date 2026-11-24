import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Chat from './Chat'
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
      <Chat msgs={msgs} busy={busy} error={error} onSend={send} onStop={() => abortRef.current?.abort()} presets={PRESETS} compact placeholder="Tanya apa saja tentang soal ini…" />
      <div><button className="btn small ghost" onClick={() => setOpen(false)}>Tutup</button></div>
    </div>
  )
}
