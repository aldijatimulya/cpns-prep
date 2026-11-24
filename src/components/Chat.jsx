import { useEffect, useRef, useState } from 'react'
import { Bot, Check, Copy, SendHorizontal, Square } from 'lucide-react'
import MiniMarkdown from './MiniMarkdown'

function Copyable({ text }) {
  const [done, setDone] = useState(false)
  return (
    <button type="button" className="copy-btn" aria-label="Salin jawaban" onClick={async () => {
      try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500) } catch { /* ditolak */ }
    }}>{done ? <><Check size={14} /> Disalin</> : <><Copy size={14} /> Salin</>}</button>
  )
}

/** Ruang percakapan: gelembung pesan, indikator mengetik, tombol berhenti, kolom tulis yang membesar otomatis. */
export default function Chat({ msgs, busy, error, onSend, onStop, disabled, presets = [], intro, placeholder, who = 'Anda', compact = false }) {
  const [text, setText] = useState('')
  const endRef = useRef(null)
  const boxRef = useRef(null)
  const taRef = useRef(null)

  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }) }, [msgs, busy])
  useEffect(() => {
    const ta = taRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`
  }, [text])

  const submit = () => {
    const v = text.trim()
    if (!v || busy || disabled) return
    setText('')
    onSend(v)
  }
  const initial = (who || 'A').trim().charAt(0).toUpperCase()

  return (
    <div className={compact ? 'chatbox compact' : 'chatbox'}>
      <div className="chat-scroll" ref={boxRef} role="log" aria-live="polite" aria-label="Percakapan dengan tutor">
        {msgs.length === 0 && (
          <div className="chat-empty">
            <span className="bot-ava big" aria-hidden="true"><Bot size={26} /></span>
            <strong>Halo{who && who !== 'Anda' ? `, ${who}` : ''}! Apa yang ingin dipelajari?</strong>
            <small>Tanya apa saja, atau pilih salah satu di bawah.</small>
          </div>
        )}
        {msgs.length === 0 && intro && <div className="msg assistant"><span className="bot-ava" aria-hidden="true"><Bot size={18} /></span><div className="bubble">{intro}</div></div>}
        {msgs.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            {m.role === 'assistant' ? <span className="bot-ava" aria-hidden="true"><Bot size={18} /></span> : <span className="me-ava" aria-hidden="true">{initial}</span>}
            <div className="bubble">
              {m.role === 'assistant' ? <MiniMarkdown text={m.content} /> : <p className="plain">{m.content}</p>}
              {m.role === 'assistant' && <Copyable text={m.content} />}
            </div>
          </div>
        ))}
        {busy && (
          <div className="msg assistant">
            <span className="bot-ava" aria-hidden="true"><Bot size={18} /></span>
            <div className="bubble typing" aria-label="Tutor sedang menulis"><i /><i /><i /></div>
          </div>
        )}
        <div ref={endRef} aria-hidden="true" />
      </div>
      {error && <p role="alert" className="tutor-err">{error}</p>}
      {presets.length > 0 && msgs.length < 2 && (
        <div className="presets">
          {presets.map((p) => <button key={p} type="button" className="chip-q" disabled={busy || disabled} onClick={() => onSend(p)}>{p}</button>)}
        </div>
      )}
      <form className="composer" onSubmit={(e) => { e.preventDefault(); submit() }}>
        <textarea
          ref={taRef} rows={1} aria-label="Pertanyaan untuk tutor" placeholder={placeholder} value={text} disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit() } }}
        />
        {busy && onStop
          ? <button type="button" className="send stop" aria-label="Hentikan" onClick={onStop}><Square size={16} /></button>
          : <button type="submit" className="send" aria-label="Kirim" disabled={!text.trim() || disabled}><SendHorizontal size={18} /></button>}
      </form>
      <small className="chat-foot">Enter untuk kirim, Shift+Enter untuk baris baru. Jawaban AI bisa keliru; periksa pasal, tanggal, dan angka ke sumber resmi.</small>
    </div>
  )
}
